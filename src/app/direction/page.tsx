"use client";

import { useCallback, useEffect, useState } from "react";
import AppShell, { useRole } from "@/components/AppShell";
import { listOpportunities, type Opportunity } from "@/lib/opportunities";
import { listLeads, type Lead } from "@/lib/leads";
import { listClients, type Client } from "@/lib/clients";
import { listInstallations, etatEntretien, type InstallationWithClient } from "@/lib/installations";
import { listAllMaintenances, type MaintenanceWithClient } from "@/lib/maintenances";
import { listYearlyMetrics, type YearlyMetric } from "@/lib/metrics";

function euros(n: number) {
  return Math.round(n || 0).toLocaleString("fr-FR") + " €";
}
function pct(n: number | null) {
  return n == null ? "—" : Math.round(n) + " %";
}
function yearOf(d: string | null) {
  if (!d) return null;
  const y = new Date(d).getFullYear();
  return isNaN(y) ? null : y;
}
const norm = (s: string | null) => (s || "").trim();

function DirectionView() {
  const role = useRole();
  const [opps, setOpps] = useState<Opportunity[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [installs, setInstalls] = useState<InstallationWithClient[]>([]);
  const [maint, setMaint] = useState<MaintenanceWithClient[]>([]);
  const [yearly, setYearly] = useState<YearlyMetric[]>([]);
  const [loading, setLoading] = useState(true);

  const charger = useCallback(async () => {
    try {
      const [o, l, c, i, m, y] = await Promise.all([
        listOpportunities(),
        listLeads(),
        listClients(),
        listInstallations(),
        listAllMaintenances(),
        listYearlyMetrics(),
      ]);
      setOpps(o);
      setLeads(l);
      setClients(c);
      setInstalls(i);
      setMaint(m);
      setYearly(y);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  if (role !== "dirigeant") {
    return (
      <div className="rounded-2xl border border-[#E6EAF0] bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-semibold text-[#0A2540]">Tableau de bord réservé au dirigeant</p>
        <p className="mt-1 text-sm text-[#64748B]">
          Passe en <strong>vue Dirigeant</strong> (sélecteur « Vue » en haut à droite) pour y accéder.
        </p>
      </div>
    );
  }

  if (loading) return <p className="text-sm text-[#64748B]">Chargement…</p>;

  // --- Global ---
  const won = opps.filter((o) => o.stage === "signe");
  const caTotal = won.reduce((s, o) => s + o.amount, 0);
  const oppsEnCours = opps.filter((o) => o.stage !== "signe" && o.stage !== "perdu").length;
  const entretiensRealises = maint.length;
  let aVenir = 0;
  let enRetard = 0;
  installs.forEach((i) => {
    const e = etatEntretien(i);
    if (e === "en_retard") enRetard++;
    else if (e === "a_surveiller") aVenir++;
  });

  // --- Par Aqualiste ---
  const keys = new Set<string>();
  opps.forEach((o) => norm(o.owner) && norm(o.owner) !== "—" && keys.add(norm(o.owner)));
  clients.forEach((c) => norm(c.sales_rep) && keys.add(norm(c.sales_rep)));
  leads.forEach((l) => norm(l.sales_rep) && keys.add(norm(l.sales_rep)));

  const rows = [...keys]
    .map((a) => {
      const oppsA = opps.filter((o) => norm(o.owner) === a);
      const ca = oppsA.filter((o) => o.stage === "signe").reduce((s, o) => s + o.amount, 0);
      const clientsA = clients.filter((c) => norm(c.sales_rep) === a).length;
      const leadsA = leads.filter((l) => norm(l.sales_rep) === a);
      const conv = leadsA.length
        ? (leadsA.filter((l) => l.status === "converti").length / leadsA.length) * 100
        : null;
      const entretiensA = maint.filter((m) => norm(m.clients?.sales_rep ?? null) === a).length;
      return { a, ca, entretiens: entretiensA, clients: clientsA, leads: leadsA.length, opps: oppsA.length, conv };
    })
    .sort((x, y) => y.ca - x.ca || y.clients - x.clients);

  // --- Comparatif N-1 ---
  const Y = new Date().getFullYear();
  const Yp = Y - 1;
  const caYear = (y: number) => won.filter((o) => yearOf(o.created_at) === y).reduce((s, o) => s + o.amount, 0);
  const entrYear = (y: number) => maint.filter((m) => yearOf(m.occurred_at) === y).length;
  const cliYear = (y: number) => clients.filter((c) => yearOf(c.created_at) === y).length;
  const leadsYear = (y: number) => leads.filter((l) => yearOf(l.created_at) === y);
  const convYear = (y: number) => {
    const ly = leadsYear(y);
    return ly.length ? (ly.filter((l) => l.status === "converti").length / ly.length) * 100 : 0;
  };
  const cur = { ca: caYear(Y), entr: entrYear(Y), cli: cliYear(Y), conv: convYear(Y) };
  // N-1 : on prend l'historique importé s'il existe, sinon le calcul sur les données vivantes.
  const stored = yearly.find((y) => y.year === Yp);
  const prev = stored
    ? { ca: stored.ca, entr: stored.entretiens, cli: stored.clients, conv: stored.conversion }
    : { ca: caYear(Yp), entr: entrYear(Yp), cli: cliYear(Yp), conv: convYear(Yp) };
  const hasN1 = !!stored || prev.ca + prev.entr + prev.cli + leadsYear(Yp).length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Direction — performance de l&apos;entreprise</h2>
        <p className="text-sm text-[#64748B]">Vue d&apos;ensemble (réservée au dirigeant).</p>
      </div>

      {/* KPIs globaux */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <Kpi label="CA total (gagné)" value={euros(caTotal)} color="#15803D" />
        <Kpi label="Opportunités en cours" value={String(oppsEnCours)} />
        <Kpi label="Clients suivis" value={String(clients.length)} />
        <Kpi label="Entretiens réalisés" value={String(entretiensRealises)} />
        <Kpi label="Entretiens à surveiller" value={String(aVenir)} color="#B45309" />
        <Kpi label="Entretiens en retard" value={String(enRetard)} color="#B91C1C" />
      </section>

      {/* Comparatif N-1 */}
      <section>
        <h3 className="mb-3 font-semibold text-[#0A2540]">
          Comparatif {Y} vs {Yp}
        </h3>
        {!hasN1 && (
          <div className="mb-3 rounded-xl border border-[#E6EAF0] bg-[#FBFCFE] px-4 py-2 text-sm text-[#94A3B8]">
            Pas de données {Yp} (N-1) pour comparer. La comparaison s&apos;activera dès qu&apos;un
            historique sera présent.
          </div>
        )}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Compare label="CA gagné" cur={euros(cur.ca)} curN={cur.ca} prevN={prev.ca} hasN1={hasN1} money />
          <Compare label="Entretiens" cur={String(cur.entr)} curN={cur.entr} prevN={prev.entr} hasN1={hasN1} />
          <Compare label="Nouveaux clients" cur={String(cur.cli)} curN={cur.cli} prevN={prev.cli} hasN1={hasN1} />
          <Compare label="Conversion leads" cur={pct(cur.conv)} curN={cur.conv} prevN={prev.conv} hasN1={hasN1} />
        </div>
      </section>

      {/* Graphique CA par Aqualiste */}
      {rows.some((r) => r.ca > 0) && (
        <section className="rounded-2xl border border-[#E6EAF0] bg-white p-5 shadow-sm">
          <h3 className="mb-4 font-semibold text-[#0A2540]">CA généré par Aqualiste</h3>
          <div className="space-y-2">
            {(() => {
              const top = rows.filter((r) => r.ca > 0).slice(0, 8);
              const max = Math.max(...top.map((r) => r.ca), 1);
              return top.map((r) => (
                <div key={r.a} className="flex items-center gap-3 text-sm">
                  <span className="w-28 shrink-0 truncate text-[#64748B]">{r.a}</span>
                  <div className="h-5 flex-1 overflow-hidden rounded-full bg-[#F1F5F9]">
                    <div
                      className="h-full rounded-full bg-[#14B8C4]"
                      style={{ width: `${(r.ca / max) * 100}%` }}
                    />
                  </div>
                  <span className="w-24 shrink-0 text-right font-medium text-[#0A2540]">
                    {euros(r.ca)}
                  </span>
                </div>
              ));
            })()}
          </div>
        </section>
      )}

      {/* Tableau Aqualistes */}
      <section className="overflow-x-auto rounded-2xl border border-[#E6EAF0] bg-white shadow-sm">
        <h3 className="border-b border-[#F0F2F6] px-5 py-3 font-semibold text-[#0A2540]">
          Performance par Aqualiste
        </h3>
        {rows.length === 0 ? (
          <p className="p-5 text-sm text-[#64748B]">Aucun Aqualiste identifié.</p>
        ) : (
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-xs uppercase text-[#94A3B8]">
              <tr>
                <th className="px-5 py-3 font-medium">Aqualiste</th>
                <th className="px-5 py-3 font-medium">CA généré</th>
                <th className="px-5 py-3 font-medium">Entretiens</th>
                <th className="px-5 py-3 font-medium">Clients</th>
                <th className="px-5 py-3 font-medium">Leads</th>
                <th className="px-5 py-3 font-medium">Opportunités</th>
                <th className="px-5 py-3 font-medium">Conversion</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.a} className="border-t border-[#F0F2F6]">
                  <td className="px-5 py-3 font-medium text-[#0A2540]">{r.a}</td>
                  <td className="px-5 py-3 font-semibold text-[#15803D]">{euros(r.ca)}</td>
                  <td className="px-5 py-3 text-[#0A2540]">{r.entretiens}</td>
                  <td className="px-5 py-3 text-[#0A2540]">{r.clients}</td>
                  <td className="px-5 py-3 text-[#64748B]">{r.leads}</td>
                  <td className="px-5 py-3 text-[#64748B]">{r.opps}</td>
                  <td className="px-5 py-3 text-[#0A2540]">{pct(r.conv)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="px-5 py-3 text-xs text-[#94A3B8]">
          Les Aqualistes sont identifiés par leur nom/code dans les données (référent, responsable).
          Une table « utilisateurs » unifiée les regroupera proprement plus tard.
        </p>
      </section>
    </div>
  );
}

function Kpi({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-2xl border border-[#E6EAF0] bg-white p-5 shadow-sm">
      <div className="text-sm text-[#64748B]">{label}</div>
      <div className="mt-2 text-2xl font-semibold" style={{ color: color || "#0A2540" }}>
        {value}
      </div>
    </div>
  );
}

function Compare({
  label,
  cur,
  curN,
  prevN,
  hasN1,
  money,
}: {
  label: string;
  cur: string;
  curN: number;
  prevN: number;
  hasN1: boolean;
  money?: boolean;
}) {
  const evo = hasN1 && prevN > 0 ? ((curN - prevN) / prevN) * 100 : null;
  const up = evo != null && evo >= 0;
  return (
    <div className="rounded-2xl border border-[#E6EAF0] bg-white p-5 shadow-sm">
      <div className="text-sm text-[#64748B]">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-[#0A2540]">{cur}</div>
      {evo == null ? (
        <div className="mt-1 text-xs text-[#94A3B8]">
          {hasN1 ? "pas de base N-1" : "—"}
        </div>
      ) : (
        <div className={`mt-1 text-xs font-medium ${up ? "text-[#15803D]" : "text-[#B91C1C]"}`}>
          {up ? "▲" : "▼"} {Math.abs(Math.round(evo))} % vs N-1
          <span className="ml-1 text-[#94A3B8]">({money ? euros(prevN) : prevN} en N-1)</span>
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <AppShell>
      <DirectionView />
    </AppShell>
  );
}
