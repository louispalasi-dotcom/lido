"use client";

import { useEffect, useRef, useState } from "react";
import { clientDisplayName, type Client } from "@/lib/clients";
import { uploadMaintenanceDoc, isImage } from "@/lib/maintenanceDocs";
import { type StockItem } from "@/lib/stock";
import {
  recordMaintenance,
  MAINTENANCE_KINDS,
  type Billing,
  type MaintenanceKind,
  type MaintenanceLine,
} from "@/lib/maintenances";

const inputCls =
  "w-full rounded-lg border border-[#E6EAF0] px-3 py-2 text-sm focus:border-[#14B8C4] focus:outline-none";
const labelCls = "block text-xs font-medium text-[#64748B] mb-1";

type Ligne = { stock_item_id: string; qty: number; billing: Billing; amount: string };

function nowLocal() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
function euros(n: number) {
  return Math.round(n || 0).toLocaleString("fr-FR") + " €";
}

export default function EntretienDrawer({
  client,
  stockItems,
  onClose,
  onSaved,
}: {
  client: Client | null;
  stockItems: StockItem[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const open = client !== null;

  const [occurredAt, setOccurredAt] = useState(nowLocal());
  const [kind, setKind] = useState<MaintenanceKind>("annuel_sav");
  const [standard, setStandard] = useState("");
  const [notes, setNotes] = useState("");
  const [lignes, setLignes] = useState<Ligne[]>([]);
  const [pending, setPending] = useState<{ file: File; url: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!client) return;
    setOccurredAt(nowLocal());
    setKind("annuel_sav");
    setStandard(localStorage.getItem("lido-entretien-standard") ?? "");
    setNotes("");
    setLignes([]);
    setPending([]);
    setError(null);
  }, [client]);

  function ajouterFichiers(files: FileList | File[]) {
    const arr = Array.from(files).map((file) => ({
      file,
      url: isImage(file.type) ? URL.createObjectURL(file) : "",
    }));
    setPending((p) => [...p, ...arr]);
  }
  function retirerFichier(i: number) {
    setPending((p) => {
      if (p[i]?.url) URL.revokeObjectURL(p[i].url);
      return p.filter((_, idx) => idx !== i);
    });
  }

  function changeStandard(v: string) {
    setStandard(v);
    localStorage.setItem("lido-entretien-standard", v);
  }

  const totalSupplement = lignes
    .filter((l) => l.billing === "supplement")
    .reduce((s, l) => s + (Number(l.amount) || 0) * (Number(l.qty) || 0), 0);
  const totalFacture = (Number(standard) || 0) + totalSupplement;

  function ajouterLigne() {
    setLignes((r) => [...r, { stock_item_id: "", qty: 1, billing: "sav", amount: "" }]);
  }
  function setLigne(i: number, patch: Partial<Ligne>) {
    setLignes((r) => r.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }
  function retirerLigne(i: number) {
    setLignes((r) => r.filter((_, idx) => idx !== i));
  }

  async function valider() {
    if (!client) return;
    setSaving(true);
    setError(null);
    try {
      const lines: MaintenanceLine[] = lignes
        .filter((l) => l.stock_item_id)
        .map((l) => {
          const item = stockItems.find((s) => String(s.id) === l.stock_item_id);
          return {
            stock_item_id: item ? item.id : null,
            reference: item?.reference ?? "",
            nom: item?.nom ?? "",
            qty: Number(l.qty) || 0,
            billing: l.billing,
            amount: l.amount === "" ? null : Number(l.amount),
          };
        });
      const mid = await recordMaintenance({
        client_id: client.id,
        occurred_at: new Date(occurredAt).toISOString(),
        kind,
        notes: notes.trim() || null,
        standard_amount: Number(standard) || 0,
        lines,
      });
      // Envoi des pièces jointes une fois l'entretien créé (best effort).
      for (const p of pending) {
        try {
          await uploadMaintenanceDoc(client.organization_id, mid, p.file);
        } catch {
          /* on n'échoue pas tout l'entretien pour un fichier */
        }
        if (p.url) URL.revokeObjectURL(p.url);
      }
      onSaved();
      onClose();
    } catch {
      setError("L'enregistrement de l'entretien a échoué.");
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
          <div>
            <h2 className="text-base font-semibold text-[#0A2540]">Enregistrer un entretien</h2>
            {client && <p className="text-xs text-[#94A3B8]">{clientDisplayName(client)}</p>}
          </div>
          <button onClick={onClose} className="rounded-lg px-2 py-1 text-[#94A3B8] hover:bg-[#F1F5F9]" aria-label="Fermer">
            ✕
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Date &amp; heure</label>
              <input
                type="datetime-local"
                className={inputCls}
                value={occurredAt}
                onChange={(e) => setOccurredAt(e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>Type</label>
              <select className={inputCls} value={kind} onChange={(e) => setKind(e.target.value as MaintenanceKind)}>
                {MAINTENANCE_KINDS.map((k) => (
                  <option key={k.val} value={k.val}>
                    {k.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>Tarif standard d&apos;entretien (€)</label>
            <input
              type="number"
              className={inputCls}
              value={standard}
              onChange={(e) => changeStandard(e.target.value)}
              placeholder="ex. 150"
            />
            <p className="mt-1 text-[11px] text-[#94A3B8]">
              {kind === "annuel_sav"
                ? "Client sous SAV : facturé au tarif standard + pièces en supplément."
                : "Saisis le tarif si applicable."}{" "}
              Mémorisé pour les prochains entretiens.
            </p>
          </div>

          {/* Éléments changés */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">
                Éléments changés
              </span>
              <button onClick={ajouterLigne} className="text-xs font-medium text-[#0B7A87] hover:underline">
                + Ajouter une ligne
              </button>
            </div>

            {lignes.length === 0 ? (
              <p className="text-sm text-[#94A3B8]">Aucun élément changé (entretien simple).</p>
            ) : (
              <div className="space-y-2">
                {lignes.map((l, i) => (
                  <div key={i} className="rounded-xl border border-[#F0F2F6] p-2">
                    <div className="flex items-center gap-2">
                      <select
                        className="min-w-0 flex-1 rounded-lg border border-[#E6EAF0] px-2 py-1.5 text-sm"
                        value={l.stock_item_id}
                        onChange={(e) => {
                          const item = stockItems.find((s) => String(s.id) === e.target.value);
                          setLigne(i, {
                            stock_item_id: e.target.value,
                            amount: item?.prix_vente_ht != null ? String(item.prix_vente_ht) : l.amount,
                          });
                        }}
                      >
                        <option value="">— Choisir un article —</option>
                        {stockItems.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.nom} ({s.quantite_en_stock} en stock)
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min={1}
                        className="w-14 rounded-lg border border-[#E6EAF0] px-2 py-1.5 text-right text-sm"
                        value={l.qty}
                        onChange={(e) => setLigne(i, { qty: Number(e.target.value) })}
                        title="Quantité"
                      />
                      <button onClick={() => retirerLigne(i)} className="text-[#94A3B8] hover:text-red-600" aria-label="Retirer">
                        ✕
                      </button>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex rounded-lg border border-[#E6EAF0] p-0.5 text-xs">
                        <button
                          onClick={() => setLigne(i, { billing: "sav" })}
                          className={`rounded-md px-2 py-1 ${l.billing === "sav" ? "bg-[#E7F8EE] font-medium text-[#15803D]" : "text-[#64748B]"}`}
                        >
                          Inclus SAV
                        </button>
                        <button
                          onClick={() => setLigne(i, { billing: "supplement" })}
                          className={`rounded-md px-2 py-1 ${l.billing === "supplement" ? "bg-[#FFF3E6] font-medium text-[#B45309]" : "text-[#64748B]"}`}
                        >
                          Supplément
                        </button>
                      </div>
                      <input
                        type="number"
                        className="w-24 rounded-lg border border-[#E6EAF0] px-2 py-1.5 text-right text-sm"
                        placeholder="à venir"
                        value={l.amount}
                        onChange={(e) => setLigne(i, { amount: e.target.value })}
                        disabled={l.billing !== "supplement"}
                        title="Montant (€)"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-2 text-xs text-[#94A3B8]">
              Chaque élément changé décrémentera le stock à la validation.
            </p>
          </div>

          {/* Facture calculée */}
          <div className="rounded-xl border border-[#E6EAF0] bg-[#F8FAFC] p-3 text-sm">
            <div className="flex justify-between text-[#64748B]">
              <span>Tarif standard</span>
              <span>{euros(Number(standard) || 0)}</span>
            </div>
            <div className="flex justify-between text-[#64748B]">
              <span>Pièces en supplément</span>
              <span>{euros(totalSupplement)}</span>
            </div>
            <div className="mt-1 flex justify-between border-t border-[#E6EAF0] pt-1 font-semibold text-[#0A2540]">
              <span>Total facture</span>
              <span>{euros(totalFacture)}</span>
            </div>
          </div>

          <textarea
            className={inputCls}
            rows={2}
            placeholder="Notes (état machine, observations…)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          {/* Pièces jointes (envoyées à la validation) */}
          <div>
            <label className={labelCls}>Pièces jointes</label>
            <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => e.target.files && ajouterFichiers(e.target.files)} />
            <input ref={camRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files && ajouterFichiers(e.target.files)} />
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                ajouterFichiers(e.dataTransfer.files);
              }}
              className="rounded-xl border border-dashed border-[#CDE9ED] bg-[#FBFDFE] px-3 py-3 text-center text-xs"
            >
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button type="button" onClick={() => camRef.current?.click()} className="rounded-lg border border-[#E6EAF0] bg-white px-3 py-1.5 font-medium text-[#0B7A87] hover:bg-[#F8FAFC]">
                  📷 Photo
                </button>
                <button type="button" onClick={() => fileRef.current?.click()} className="rounded-lg border border-[#E6EAF0] bg-white px-3 py-1.5 font-medium text-[#0B7A87] hover:bg-[#F8FAFC]">
                  📎 Fichier
                </button>
                <span className="text-[#94A3B8]">ou glisse-dépose</span>
              </div>
            </div>
            {pending.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {pending.map((p, i) => (
                  <div key={i} className="relative h-14 w-14 overflow-hidden rounded-lg border border-[#E6EAF0]">
                    {p.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center px-1 text-center text-[9px] text-[#64748B]">
                        {p.file.name.split(".").pop()?.toUpperCase()}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => retirerFichier(i)}
                      className="absolute right-0 top-0 bg-black/50 px-1 text-[10px] text-white"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <p className="rounded-lg bg-[#FDECEC] px-3 py-2 text-sm text-[#B91C1C]">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-[#E6EAF0] px-5 py-4">
          <button onClick={onClose} className="rounded-lg border border-[#E6EAF0] px-4 py-2 text-sm text-[#64748B] hover:bg-[#F8FAFC]">
            Annuler
          </button>
          <button
            onClick={valider}
            disabled={saving}
            className="rounded-lg bg-[#14B8C4] px-5 py-2 text-sm font-medium text-[#04212e] disabled:opacity-60"
          >
            {saving ? "Enregistrement…" : "Valider l'entretien"}
          </button>
        </div>
      </aside>
    </>
  );
}
