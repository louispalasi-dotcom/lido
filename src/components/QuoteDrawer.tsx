"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  updateQuote,
  computeQuoteTotals,
  lineTotal,
  quoteRef,
  euros,
  QUOTE_STATUTS,
  type Quote,
  type QuoteLine,
  type QuoteStatus,
} from "@/lib/quotes";
import { setOpportunityStage } from "@/lib/opportunities";
import { listStockItems, type StockItem } from "@/lib/stock";

const inputCls =
  "w-full rounded-lg border border-[#E6EAF0] px-3 py-2 text-sm focus:border-[#14B8C4] focus:outline-none";

type Ligne = { stock_item_id: string; label: string; qty: number; unit_price: string };

export default function QuoteDrawer({
  quote,
  onClose,
  onSaved,
}: {
  quote: Quote | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const router = useRouter();
  const open = quote !== null;

  const [status, setStatus] = useState<QuoteStatus>("brouillon");
  const [title, setTitle] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");
  const [tva, setTva] = useState("20");
  const [remise, setRemise] = useState("0");
  const [lignes, setLignes] = useState<Ligne[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!quote) return;
    setStatus(quote.status);
    setTitle(quote.title ?? "");
    setValidUntil(quote.valid_until ?? "");
    setNotes(quote.notes ?? "");
    setTva(String(quote.tva_rate ?? 20));
    setRemise(String(quote.remise_pct ?? 0));
    setLignes(
      quote.lines?.length
        ? quote.lines.map((l) => ({
            stock_item_id: l.stock_item_id ? String(l.stock_item_id) : "",
            label: l.label,
            qty: l.qty,
            unit_price: String(l.unit_price ?? 0),
          }))
        : [{ stock_item_id: "", label: "", qty: 1, unit_price: "" }]
    );
    listStockItems().then(setStock);
  }, [quote]);

  function setLigne(i: number, patch: Partial<Ligne>) {
    setLignes((rows) => rows.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }
  function choisirArticle(i: number, value: string) {
    if (!value) {
      setLigne(i, { stock_item_id: "" });
      return;
    }
    const item = stock.find((s) => String(s.id) === value);
    setLigne(i, {
      stock_item_id: value,
      label: item?.nom ?? "",
      unit_price: item?.prix_vente_ht != null ? String(item.prix_vente_ht) : "",
    });
  }
  function ajouterLigne() {
    setLignes((r) => [...r, { stock_item_id: "", label: "", qty: 1, unit_price: "" }]);
  }
  function retirerLigne(i: number) {
    setLignes((r) => r.filter((_, idx) => idx !== i));
  }

  const lignesCalc: QuoteLine[] = lignes
    .filter((l) => l.label.trim() || l.unit_price)
    .map((l) => ({
      label: l.label.trim(),
      qty: Number(l.qty) || 0,
      unit_price: Number(l.unit_price) || 0,
      stock_item_id: l.stock_item_id ? Number(l.stock_item_id) : null,
    }));
  const totals = computeQuoteTotals(lignesCalc, Number(tva) || 0, Number(remise) || 0);

  async function persist(): Promise<boolean> {
    if (!quote) return false;
    setSaving(true);
    try {
      await updateQuote(quote.id, {
        status,
        title: title.trim() || null,
        notes: notes.trim() || null,
        valid_until: validUntil || null,
        lines: lignesCalc,
        tva_rate: Number(tva) || 0,
        remise_pct: Number(remise) || 0,
        total: totals.ttc,
      });
      // Devis envoyé → l'opportunité passe à l'étape "Devis envoyé".
      if (status === "envoye" && quote.opportunity_id) {
        await setOpportunityStage(quote.opportunity_id, "devis");
      }
      return true;
    } finally {
      setSaving(false);
    }
  }

  async function enregistrer() {
    if (await persist()) {
      onSaved();
      onClose();
    }
  }

  async function apercu() {
    if (!quote) return;
    await persist();
    router.push(`/devis/apercu?devis=${quote.id}`);
  }

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-[#0A2540]/40 transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-xl flex-col bg-white shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-[#E6EAF0] px-5 py-4">
          <h2 className="text-base font-semibold text-[#0A2540]">
            Devis {quote ? quoteRef(quote) : ""}
            {quote?.opportunity_id ? (
              <span className="ml-2 text-xs font-normal text-[#94A3B8]">· lié à une opportunité</span>
            ) : null}
          </h2>
          <button onClick={onClose} className="rounded-lg px-2 py-1 text-[#94A3B8] hover:bg-[#F1F5F9]" aria-label="Fermer">
            ✕
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          <input className={inputCls} placeholder="Intitulé du devis" value={title} onChange={(e) => setTitle(e.target.value)} />

          <div className="grid grid-cols-3 gap-3">
            <label className="text-xs text-[#64748B]">
              Statut
              <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value as QuoteStatus)}>
                {QUOTE_STATUTS.map((s) => (
                  <option key={s.val} value={s.val}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-[#64748B]">
              TVA (%)
              <input type="number" className={inputCls} value={tva} onChange={(e) => setTva(e.target.value)} />
            </label>
            <label className="text-xs text-[#64748B]">
              Remise (%)
              <input type="number" className={inputCls} value={remise} onChange={(e) => setRemise(e.target.value)} />
            </label>
          </div>

          {/* Lignes */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">Lignes</span>
              <button onClick={ajouterLigne} className="text-xs font-medium text-[#0B7A87] hover:underline">
                + Ajouter une ligne
              </button>
            </div>
            <div className="space-y-2">
              {lignes.map((l, i) => (
                <div key={i} className="rounded-xl border border-[#F0F2F6] p-2">
                  <div className="flex items-center gap-2">
                    <select
                      className="min-w-0 flex-1 rounded-lg border border-[#E6EAF0] px-2 py-1.5 text-sm"
                      value={l.stock_item_id}
                      onChange={(e) => choisirArticle(i, e.target.value)}
                    >
                      <option value="">— Ligne libre —</option>
                      {stock.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.nom}
                          {s.prix_vente_ht != null ? ` (${s.prix_vente_ht} €)` : " (prix ?)"}
                        </option>
                      ))}
                    </select>
                    <button onClick={() => retirerLigne(i)} className="text-[#94A3B8] hover:text-red-600" aria-label="Retirer">
                      ✕
                    </button>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      className="min-w-0 flex-1 rounded-lg border border-[#E6EAF0] px-2 py-1.5 text-sm"
                      placeholder="Désignation"
                      value={l.label}
                      onChange={(e) => setLigne(i, { label: e.target.value })}
                    />
                    <input
                      type="number"
                      className="w-12 rounded-lg border border-[#E6EAF0] px-1.5 py-1.5 text-right text-sm"
                      value={l.qty}
                      onChange={(e) => setLigne(i, { qty: Number(e.target.value) })}
                      title="Quantité"
                    />
                    <input
                      type="number"
                      className="w-20 rounded-lg border border-[#E6EAF0] px-2 py-1.5 text-right text-sm"
                      placeholder="prix"
                      value={l.unit_price}
                      onChange={(e) => setLigne(i, { unit_price: e.target.value })}
                      title="Prix unitaire HT"
                    />
                    <span className="w-20 text-right text-sm font-medium text-[#0A2540]">
                      {euros(lineTotal({ label: "", qty: Number(l.qty) || 0, unit_price: Number(l.unit_price) || 0 }))}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totaux */}
          <div className="space-y-1 rounded-xl border border-[#E6EAF0] bg-[#F8FAFC] p-3 text-sm">
            <Row label="Sous-total HT" value={euros(totals.subtotal)} />
            {totals.remise > 0 && <Row label={`Remise (${remise}%)`} value={"– " + euros(totals.remise)} />}
            <Row label="Total HT" value={euros(totals.ht)} />
            <Row label={`TVA (${tva}%)`} value={euros(totals.tva)} />
            <div className="flex justify-between border-t border-[#E6EAF0] pt-1 font-semibold text-[#0A2540]">
              <span>Total TTC</span>
              <span>{euros(totals.ttc)}</span>
            </div>
          </div>

          <textarea className={inputCls} rows={2} placeholder="Notes (conditions, délais…)" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[#E6EAF0] px-5 py-4">
          <button onClick={apercu} disabled={saving} className="rounded-lg border border-[#E6EAF0] px-4 py-2 text-sm font-medium text-[#0B7A87] hover:bg-[#F8FAFC]">
            Aperçu / PDF
          </button>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="rounded-lg border border-[#E6EAF0] px-4 py-2 text-sm text-[#64748B] hover:bg-[#F8FAFC]">
              Annuler
            </button>
            <button onClick={enregistrer} disabled={saving} className="rounded-lg bg-[#14B8C4] px-5 py-2 text-sm font-medium text-[#04212e] disabled:opacity-60">
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-[#64748B]">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
