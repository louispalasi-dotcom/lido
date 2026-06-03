"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { listOpportunities, type Opportunity } from "@/lib/opportunities";
import { listLeads, type Lead } from "@/lib/leads";
import { listRdv, type RdvWithClient } from "@/lib/activities";

function euros(n: number) {
  return Math.round(n || 0).toLocaleString("fr-FR") + " €";
}
function pct(n: number) {
  return Math.round(n) + " %";
}

// Données de DÉMONSTRATION pour l'entretien des fontaines (le vrai module
// Entretiens/Installations n'existe pas encore — voir le badge "Démo").
const ENTRETIEN_DEMO = { aLheure: 15, aSurveiller: 6, enRetard: 3 };

function Dashboard() {
  const router = useRouter();
  const [opps, setOpps] = useState<Opportunity[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [rdvs, setRdvs] = useState<RdvWithClient[]>([]);
  const [loading, setLoading] = useState(true);

  // Taux de commission paramétrable (mémorisé dans le navigateur).
  const [rate, setRate] = useState(10);

  const charger = useCallback(async () => {
    try {
      const [o, l, r] = await Promise.all([listOpportunities(), listLeads(), listRdv()]);
      setOpps(o);
      setLeads(l);
      setRdvs(r);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("lido-commission-rate");
    if (saved) setRate(Number(saved));
    charger();
  }, [charger]);

  function changeRate(v: number) {
    const clamped = isNaN(v) ? 0 : Math.max(0, Math.min(100, v));
    setRate(clamped);
    localStorage.setItem("lido-commission-rate", String(clamped));
  }

  if (loading) return <p className="text-sm text-[#64748B]">Chargement…</p>;

  // --- Calculs (données réelles de l'organisation) ---
  const ouvertes = opps.filter((o) => o.stage !== "signe" && o.stage !== "perdu");
  const gagnees = opps.filter((o) => o.stage === "signe");

  const caOuvert = ouvertes.reduce((s, o) => s + o.amount, 0);
  const caPondere = ouvertes.reduce((s, o) => s + (o.amount * o.probability) / 100, 0);
  const caGagne = gagnees.reduce((s, o) => s + o.amount, 0);

  const commissionGagnee = (rate / 100) * caGagne;
  const commissionPotentielle = (rate / 100) * caOuvert;

  const tauxConversion = leads.length
    ? (leads.filter((l) => l.status === "converti").length / leads.length) * 100
    : 0;
  const tauxVictoire = opps.length ? (gagnees.length / opps.length) * 100 : 0;

  // Entretien (démo)
  const e = ENTRETIEN_DEMO;
  const totalEntretien = e.aLheure + e.aSurveiller + e.enRetard;
  const sante = totalEntretien ? (e.aLheure / totalEntretien) * 100 : 0;
  const santeCouleur = sante >= 80 ? "#15803D" : sante >= 50 ? "#B45309" : "#B91C1C";

  // Prochains RDV (réels, à venir)
  const maintenant = new Date().toISOString();
  const prochains = rdvs.filter((r) => r.occurred_at >= maintenant).slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Tableau de bord</h2>
        <p className="text-sm text-[#64748B]">Vue temps réel de ton activité.</p>
      </div>

      {/* KPI financiers */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* 1) CA à aller chercher */}
        <div className="rounded-2xl border border-[#E6EAF0] bg-white p-5 shadow-sm">
          <div className="text-sm text-[#64748B]">CA à aller chercher</div>
          <div className="mt-2 text-3xl font-semibold text-[#0A2540]">{euros(caOuvert)}</div>
          <div className="mt-2 flex items-center gap-2 text-xs">
            <span className="rounded-full bg-[#E6F7F9] px-2 py-0.5 font-medium text-[#0B7A87]">
              Prévision réaliste {euros(caPondere)}
            </span>
          </div>
          <div className="mt-1 text-xs text-[#94A3B8]">{ouvertes.length} opportunité(s) en cours</div>
        </div>

        {/* 2) Commission */}
        <div className="rounded-2xl border border-[#E6EAF0] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm text-[#64748B]">Commission</div>
            <label className="flex items-center gap-1 text-xs text-[#94A3B8]">
              taux
              <input
                type="number"
                value={rate}
                onChange={(ev) => changeRate(Number(ev.target.value))}
                className="w-14 rounded-md border border-[#E6EAF0] px-1.5 py-0.5 text-right text-xs text-[#0A2540]"
              />
              %
            </label>
          </div>
          <div className="mt-2 text-3xl font-semibold text-[#15803D]">{euros(commissionGagnee)}</div>
          <div className="text-xs text-[#94A3B8]">déjà gagnée</div>
          <div className="mt-2 border-t border-[#F0F2F6] pt-2 text-sm">
            <span className="font-medium text-[#0A2540]">{euros(commissionPotentielle)}</span>{" "}
            <span className="text-xs text-[#94A3B8]">potentielle (en cours)</span>
          </div>
        </div>

        {/* 3) Conversion */}
        <div className="rounded-2xl border border-[#E6EAF0] bg-white p-5 shadow-sm">
          <div className="text-sm text-[#64748B]">Conversion des leads</div>
          <div className="mt-2 text-3xl font-semibold text-[#0A2540]">{pct(tauxConversion)}</div>
          <div className="text-xs text-[#94A3B8]">
            {leads.filter((l) => l.status === "converti").length}/{leads.length} leads convertis
          </div>
          <div className="mt-2 border-t border-[#F0F2F6] pt-2 text-sm">
            <span className="font-medium text-[#0A2540]">{pct(tauxVictoire)}</span>{" "}
            <span className="text-xs text-[#94A3B8]">
              taux de victoire ({gagnees.length}/{opps.length})
            </span>
          </div>
        </div>
      </section>

      {/* 4) Entretien des fontaines (démo) */}
      <section className="rounded-2xl border border-[#E6EAF0] bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-[#0A2540]">État de l&apos;entretien des fontaines</h3>
          <span className="rounded-full bg-[#FEF3C7] px-2.5 py-0.5 text-xs font-medium text-[#92400E]">
            Données démo
          </span>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-3xl font-semibold" style={{ color: santeCouleur }}>
              {pct(sante)}
            </div>
            <div className="text-xs text-[#94A3B8]">de parc à l&apos;heure ({totalEntretien} fontaines)</div>
          </div>
          <div className="flex gap-4 text-sm">
            <Pastille couleur="#15803D" label="À l'heure" valeur={e.aLheure} />
            <Pastille couleur="#B45309" label="À surveiller" valeur={e.aSurveiller} />
            <Pastille couleur="#B91C1C" label="En retard" valeur={e.enRetard} />
          </div>
        </div>

        {/* Barre empilée */}
        <div className="mt-4 flex h-3 overflow-hidden rounded-full">
          <div style={{ width: `${(e.aLheure / totalEntretien) * 100}%`, background: "#15803D" }} />
          <div style={{ width: `${(e.aSurveiller / totalEntretien) * 100}%`, background: "#F59E0B" }} />
          <div style={{ width: `${(e.enRetard / totalEntretien) * 100}%`, background: "#EF4444" }} />
        </div>
        <p className="mt-3 text-xs text-[#94A3B8]">
          Widget de démonstration — il sera branché sur le vrai module Entretiens / Installations
          (échéances calculées depuis les poses) quand on le construira.
        </p>
      </section>

      {/* Prochains RDV (réels) */}
      <section className="rounded-2xl border border-[#E6EAF0] bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-[#0A2540]">Prochains rendez-vous</h3>
          <Link href="/calendrier" className="text-sm font-medium text-[#0B7A87] hover:underline">
            Calendrier →
          </Link>
        </div>
        {prochains.length === 0 ? (
          <p className="text-sm text-[#64748B]">Aucun rendez-vous à venir.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {prochains.map((r) => {
              const c = r.clients;
              const nom = c
                ? c.company_name || [c.first_name, c.last_name].filter(Boolean).join(" ") || "Compte"
                : "Compte";
              return (
                <li key={r.id}>
                  <button
                    onClick={() => c?.id && router.push(`/clients?compte=${c.id}`)}
                    className="flex w-full items-center justify-between gap-3 border-b border-[#F0F2F6] pb-2 text-left hover:text-[#0B7A87]"
                  >
                    <span className="font-medium text-[#0A2540]">📅 {nom}</span>
                    <span className="text-xs text-[#64748B]">
                      {new Date(r.occurred_at).toLocaleString("fr-FR", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function Pastille({ couleur, label, valeur }: { couleur: string; label: string; valeur: number }) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1.5 font-semibold text-[#0A2540]">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: couleur }} />
        {valeur}
      </div>
      <div className="text-xs text-[#94A3B8]">{label}</div>
    </div>
  );
}

export default function Page() {
  return (
    <AppShell>
      <Dashboard />
    </AppShell>
  );
}
