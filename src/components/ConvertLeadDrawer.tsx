"use client";

import { useEffect, useState } from "react";
import { createClient, type NewClient, type Temperature } from "@/lib/clients";
import { createOpportunity, defaultExpectedDate, STAGES, type Stage } from "@/lib/opportunities";
import { updateLeadStatus, leadDisplayName, type Lead } from "@/lib/leads";
import { TEMPERATURES } from "@/lib/clients";

const inputCls =
  "w-full rounded-lg border border-[#E6EAF0] px-3 py-2 text-sm focus:border-[#14B8C4] focus:outline-none";
const labelCls = "block text-xs font-medium text-[#64748B] mb-1";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">{title}</h3>
      {children}
    </div>
  );
}

// Convertit un lead : crée le compte client (pré-rempli depuis le lead) + une
// opportunité reliée, et passe le lead en "converti". Le compte devient le HUB.
export default function ConvertLeadDrawer({
  lead,
  onClose,
  onConverted,
}: {
  lead: Lead | null;
  onClose: () => void;
  onConverted: (name: string) => void;
}) {
  const open = lead !== null;

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [quoteValue, setQuoteValue] = useState("");
  const [probability, setProbability] = useState("50");
  const [expectedDate, setExpectedDate] = useState("");
  const [stage, setStage] = useState<Stage>("nouveau");
  const [owner, setOwner] = useState("");
  const [temperature, setTemperature] = useState<Temperature>("tiede");
  const [waterContext, setWaterContext] = useState("");
  const [currentSolution, setCurrentSolution] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pré-remplissage à l'ouverture (dès qu'un lead est sélectionné).
  useEffect(() => {
    if (!lead) return;
    setTitle(`${leadDisplayName(lead)} — opportunité`);
    setAmount("");
    setQuoteValue("");
    setProbability("50");
    setExpectedDate(defaultExpectedDate());
    setStage("nouveau");
    setOwner(lead.sales_rep || "");
    setTemperature("tiede");
    setWaterContext("");
    setCurrentSolution("");
    setError(null);
  }, [lead]);

  async function convertir() {
    if (!lead) return;
    setSaving(true);
    setError(null);
    try {
      // 1) Le compte client, pré-rempli depuis le lead (sans ressaisie).
      const clientData: NewClient = {
        segment: lead.segment,
        status: "prospect",
        company_name: lead.company_name,
        siret: lead.siret,
        first_name: lead.first_name,
        last_name: lead.last_name,
        phone: lead.phone,
        email: lead.email,
        addr_number: lead.addr_number,
        addr_street_type: lead.addr_street_type,
        addr_street_name: lead.addr_street_name,
        postal_code: lead.postal_code,
        city: lead.city,
        country: lead.country,
        sales_rep: lead.sales_rep,
        installer: lead.installer,
        temperature,
        estimated_value: Number(amount) || 0,
        quote_value: Number(quoteValue) || 0,
        notes: null,
        source_lead_id: lead.id,
      };
      const client = await createClient(clientData);

      // 2) L'opportunité, reliée au compte.
      await createOpportunity({
        client_id: client.id,
        title: title.trim() || leadDisplayName(lead),
        segment: lead.segment,
        amount: Number(amount) || 0,
        probability: Number(probability) || 0,
        expected_date: expectedDate || null,
        stage,
        owner: owner.trim() || lead.sales_rep || "—",
        water_context: waterContext.trim() || null,
        current_solution: currentSolution.trim() || null,
        quote_value: Number(quoteValue) || 0,
        temperature,
      });

      // 3) Le lead passe en "converti".
      await updateLeadStatus(lead.id, "converti");

      onConverted(leadDisplayName(lead));
      onClose();
    } catch {
      setError("La conversion a échoué. Es-tu bien connecté ?");
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
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-[#E6EAF0] px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-[#0A2540]">Convertir en opportunité</h2>
            {lead && (
              <p className="text-xs text-[#94A3B8]">
                Lead : {leadDisplayName(lead)} · un compte client sera créé
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-[#94A3B8] hover:bg-[#F1F5F9]"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          <Section title="Opportunité">
            <div>
              <label className={labelCls}>Intitulé</label>
              <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Valeur estimée (€)</label>
                <input
                  type="number"
                  className={inputCls}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <label className={labelCls}>Valeur devis (€)</label>
                <input
                  type="number"
                  className={inputCls}
                  value={quoteValue}
                  onChange={(e) => setQuoteValue(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Probabilité (%)</label>
                <input
                  type="number"
                  className={inputCls}
                  value={probability}
                  onChange={(e) => setProbability(e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Date prévisionnelle</label>
                <input
                  type="date"
                  className={inputCls}
                  value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Étape</label>
                <select
                  className={inputCls}
                  value={stage}
                  onChange={(e) => setStage(e.target.value as Stage)}
                >
                  {STAGES.map((s) => (
                    <option key={s.val} value={s.val}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Responsable</label>
                <input
                  className={inputCls}
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  placeholder="Aqualiste"
                />
              </div>
            </div>
          </Section>

          <Section title="Qualification">
            <div>
              <label className={labelCls}>Température</label>
              <div className="grid grid-cols-3 gap-2">
                {TEMPERATURES.map((t) => (
                  <button
                    key={t.val}
                    type="button"
                    onClick={() => setTemperature(t.val)}
                    className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-sm ${
                      temperature === t.val
                        ? "border-[#14B8C4] bg-[#F0FBFC]"
                        : "border-[#E6EAF0] hover:bg-[#F8FAFC]"
                    }`}
                  >
                    <span className={`h-2.5 w-2.5 rounded-full ${t.dot}`} />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelCls}>Solution actuelle</label>
              <input
                className={inputCls}
                value={currentSolution}
                onChange={(e) => setCurrentSolution(e.target.value)}
                placeholder="Ex. robinet, bouteille (Mont Roucous), carafe filtrante…"
              />
            </div>
            <div>
              <label className={labelCls}>Contexte eau</label>
              <textarea
                className={inputCls}
                rows={3}
                value={waterContext}
                onChange={(e) => setWaterContext(e.target.value)}
                placeholder="Dureté, problème constaté, usage…"
              />
            </div>
          </Section>

          {error && (
            <p className="rounded-lg bg-[#FDECEC] px-3 py-2 text-sm text-[#B91C1C]">{error}</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-[#E6EAF0] px-5 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-[#E6EAF0] px-4 py-2 text-sm text-[#64748B] hover:bg-[#F8FAFC]"
          >
            Annuler
          </button>
          <button
            onClick={convertir}
            disabled={saving}
            className="rounded-lg bg-[#14B8C4] px-5 py-2 text-sm font-medium text-[#04212e] hover:bg-[#0fa6b1] disabled:opacity-60"
          >
            {saving ? "Conversion…" : "Convertir + créer le compte"}
          </button>
        </div>
      </aside>
    </>
  );
}
