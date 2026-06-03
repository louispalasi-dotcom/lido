"use client";

import { useCallback, useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import LeadDrawer from "@/components/LeadDrawer";
import {
  listLeads,
  updateLeadStatus,
  deleteLead,
  leadDisplayName,
  originLabel,
  leadBadge,
  LEAD_STATUTS,
  type Lead,
  type LeadStatus,
} from "@/lib/leads";
import { createOpportunity } from "@/lib/opportunities";

function LeadsView() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const charger = useCallback(async () => {
    try {
      setLeads(await listLeads());
      setError(null);
    } catch {
      setError("Impossible de charger les leads depuis Supabase.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  async function changerStatut(id: number, s: LeadStatus) {
    setLeads((rows) => rows.map((l) => (l.id === id ? { ...l, status: s } : l)));
    try {
      await updateLeadStatus(id, s);
    } catch {
      setError("La modification du statut a échoué.");
      charger();
    }
  }

  async function convertir(lead: Lead) {
    // Le lead passe en "converti" dans Supabase ; l'opportunité est créée dans
    // le pipeline (encore en démo locale pour l'instant).
    await changerStatut(lead.id, "converti");
    await createOpportunity({
      title: leadDisplayName(lead),
      segment: lead.segment,
      amount: 0,
      probability: 20,
      expected_date: null,
      stage: "nouveau",
      owner: lead.sales_rep || "—",
    });
    setInfo(`« ${leadDisplayName(lead)} » a été converti en opportunité → visible dans le Pipeline.`);
  }

  async function supprimer(id: number) {
    if (!confirm("Supprimer ce lead ?")) return;
    setLeads((rows) => rows.filter((l) => l.id !== id));
    try {
      await deleteLead(id);
    } catch {
      setError("La suppression a échoué.");
      charger();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Leads (prospects à qualifier)</h2>
        <button
          onClick={() => setDrawerOpen(true)}
          className="rounded-lg bg-[#0A2540] px-4 py-2 text-sm font-medium text-white hover:bg-[#0c3358]"
        >
          + Nouveau lead
        </button>
      </div>

      {info && (
        <div className="rounded-xl border border-[#BBE7CB] bg-[#E7F8EE] px-4 py-3 text-sm text-[#15803D]">
          ✅ {info}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-[#F3C2C2] bg-[#FDECEC] px-4 py-3 text-sm text-[#B91C1C]">
          {error}
        </div>
      )}

      <section className="overflow-x-auto rounded-2xl border border-[#E6EAF0] bg-white shadow-sm">
        {loading ? (
          <p className="p-5 text-sm text-[#64748B]">Chargement…</p>
        ) : leads.length === 0 ? (
          <p className="p-5 text-sm text-[#64748B]">
            Aucun lead. Clique sur « + Nouveau lead » pour en créer un 👆
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-[#94A3B8]">
              <tr>
                <th className="px-5 py-3 font-medium">Lead</th>
                <th className="px-5 py-3 font-medium">Contact</th>
                <th className="px-5 py-3 font-medium">Segment</th>
                <th className="px-5 py-3 font-medium">Origine</th>
                <th className="px-5 py-3 font-medium">Statut</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id} className="border-t border-[#F0F2F6] align-top">
                  <td className="px-5 py-3 font-medium">
                    {leadDisplayName(l)}
                    {l.city && <span className="block text-xs text-[#94A3B8]">{l.city}</span>}
                  </td>
                  <td className="px-5 py-3 text-[#64748B]">
                    <div className="flex flex-col gap-1">
                      {l.phone && (
                        <a href={`tel:${l.phone}`} className="text-[#0B7A87] hover:underline">
                          📞 {l.phone}
                        </a>
                      )}
                      {l.email && (
                        <a href={`mailto:${l.email}`} className="text-[#0B7A87] hover:underline">
                          ✉️ {l.email}
                        </a>
                      )}
                      {!l.phone && !l.email && <span>—</span>}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                        l.segment === "b2b"
                          ? "bg-[#E6EDF7] text-[#1D4ED8]"
                          : "bg-[#E6F7F9] text-[#0B7A87]"
                      }`}
                    >
                      {l.segment}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-[#64748B]">{originLabel(l.origin)}</td>
                  <td className="px-5 py-3">
                    <select
                      value={l.status}
                      onChange={(e) => changerStatut(l.id, e.target.value as LeadStatus)}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${leadBadge(l.status).classe}`}
                    >
                      {LEAD_STATUTS.map((s) => (
                        <option key={s.val} value={s.val}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {l.status !== "converti" ? (
                        <button
                          onClick={() => convertir(l)}
                          className="rounded-lg bg-[#0A2540] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#0c3358]"
                        >
                          Convertir en opportunité
                        </button>
                      ) : (
                        <span className="text-xs text-[#15803D]">déjà converti</span>
                      )}
                      <button
                        onClick={() => supprimer(l.id)}
                        className="text-xs text-[#94A3B8] hover:text-red-600"
                      >
                        Suppr.
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <LeadDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSaved={() => {
          setInfo("Nouveau lead enregistré dans Supabase ✅");
          charger();
        }}
      />
    </div>
  );
}

export default function Page() {
  return (
    <AppShell>
      <LeadsView />
    </AppShell>
  );
}
