"use client";

import { useEffect, useState } from "react";
import {
  updateQuote,
  computeTotal,
  lineTotal,
  quoteRef,
  euros,
  QUOTE_STATUTS,
  type Quote,
  type QuoteLine,
  type QuoteStatus,
} from "@/lib/quotes";

const inputCls =
  "w-full rounded-lg border border-[#E6EAF0] px-3 py-2 text-sm focus:border-[#14B8C4] focus:outline-none";

export default function QuoteDrawer({
  quote,
  onClose,
  onSaved,
}: {
  quote: Quote | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const open = quote !== null;

  const [status, setStatus] = useState<QuoteStatus>("brouillon");
  const [title, setTitle] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<QuoteLine[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!quote) return;
    setStatus(quote.status);
    setTitle(quote.title ?? "");
    setIssueDate(quote.issue_date ?? "");
    setValidUntil(quote.valid_until ?? "");
    setNotes(quote.notes ?? "");
    setLines(quote.lines?.length ? quote.lines : [{ label: "", qty: 1, unit_price: 0 }]);
  }, [quote]);

  function setLine(idx: number, patch: Partial<QuoteLine>) {
    setLines((rows) => rows.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }
  function ajouterLigne() {
    setLines((rows) => [...rows, { label: "", qty: 1, unit_price: 0 }]);
  }
  function retirerLigne(idx: number) {
    setLines((rows) => rows.filter((_, i) => i !== idx));
  }

  const total = computeTotal(lines);

  async function enregistrer() {
    if (!quote) return;
    setSaving(true);
    try {
      const propres = lines.filter((l) => l.label.trim() || l.unit_price || l.qty !== 1);
      await updateQuote(quote.id, {
        status,
        title: title.trim() || null,
        notes: notes.trim() || null,
        issue_date: issueDate || null,
        valid_until: validUntil || null,
        lines: propres.map((l) => ({
          label: l.label.trim(),
          qty: Number(l.qty) || 0,
          unit_price: Number(l.unit_price) || 0,
        })),
        total: computeTotal(propres),
      });
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
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
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col bg-white shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-[#E6EAF0] px-5 py-4">
          <h2 className="text-base font-semibold text-[#0A2540]">
            Devis {quote ? quoteRef(quote) : ""}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-[#94A3B8] hover:bg-[#F1F5F9]"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          <input
            className={inputCls}
            placeholder="Intitulé du devis (ex. Osmoseur + pose)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-[#64748B]">
              Statut
              <select
                className={inputCls}
                value={status}
                onChange={(e) => setStatus(e.target.value as QuoteStatus)}
              >
                {QUOTE_STATUTS.map((s) => (
                  <option key={s.val} value={s.val}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-[#64748B]">
              Valable jusqu&apos;au
              <input
                type="date"
                className={inputCls}
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
              />
            </label>
          </div>

          {/* Lignes */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">
                Lignes
              </span>
              <button onClick={ajouterLigne} className="text-xs font-medium text-[#0B7A87] hover:underline">
                + Ajouter une ligne
              </button>
            </div>
            <div className="space-y-2">
              {lines.map((l, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    className="flex-1 rounded-lg border border-[#E6EAF0] px-2 py-1.5 text-sm"
                    placeholder="Désignation"
                    value={l.label}
                    onChange={(e) => setLine(i, { label: e.target.value })}
                  />
                  <input
                    type="number"
                    className="w-14 rounded-lg border border-[#E6EAF0] px-2 py-1.5 text-right text-sm"
                    value={l.qty}
                    onChange={(e) => setLine(i, { qty: Number(e.target.value) })}
                    title="Quantité"
                  />
                  <input
                    type="number"
                    className="w-20 rounded-lg border border-[#E6EAF0] px-2 py-1.5 text-right text-sm"
                    value={l.unit_price}
                    onChange={(e) => setLine(i, { unit_price: Number(e.target.value) })}
                    title="Prix unitaire (€)"
                  />
                  <span className="w-20 text-right text-sm font-medium text-[#0A2540]">
                    {euros(lineTotal(l))}
                  </span>
                  <button
                    onClick={() => retirerLigne(i)}
                    className="text-[#94A3B8] hover:text-red-600"
                    aria-label="Retirer la ligne"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-[#E6EAF0] pt-3">
              <span className="text-sm text-[#64748B]">Total</span>
              <span className="text-lg font-semibold text-[#0A2540]">{euros(total)}</span>
            </div>
          </div>

          <textarea
            className={inputCls}
            rows={2}
            placeholder="Notes (conditions, délais…)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-[#E6EAF0] px-5 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-[#E6EAF0] px-4 py-2 text-sm text-[#64748B] hover:bg-[#F8FAFC]"
          >
            Annuler
          </button>
          <button
            onClick={enregistrer}
            disabled={saving}
            className="rounded-lg bg-[#14B8C4] px-5 py-2 text-sm font-medium text-[#04212e] disabled:opacity-60"
          >
            {saving ? "Enregistrement…" : "Enregistrer le devis"}
          </button>
        </div>
      </aside>
    </>
  );
}
