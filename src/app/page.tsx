"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { supabase, type Client, type Intervention } from "@/lib/supabase";

function Kpi({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-2xl border border-[#E6EAF0] bg-white p-5 shadow-sm">
      <div className="text-sm text-[#64748B]">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      {hint && <div className="mt-1 text-xs font-medium text-[#0B7A87]">{hint}</div>}
    </div>
  );
}

function Dashboard() {
  const [clients, setClients] = useState<Client[]>([]);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const c = await supabase.from("clients").select("*").order("created_at", { ascending: false });
      const i = await supabase
        .from("interventions")
        .select("*, clients(name)")
        .order("scheduled_at", { ascending: true });
      if (c.error || i.error) {
        setErreur((c.error || i.error)!.message);
      } else {
        setClients(c.data as Client[]);
        setInterventions(i.data as Intervention[]);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <p className="text-[#64748B]">Chargement…</p>;
  if (erreur)
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Impossible de lire la base : {erreur}
        <div className="mt-1 text-red-500">
          (As-tu bien exécuté le script SQL de création des tables ?)
        </div>
      </div>
    );

  const nbClients = clients.filter((c) => c.status === "client").length;
  const nbProspects = clients.filter((c) => c.status === "prospect").length;
  const nbRenouveler = clients.filter((c) => c.status === "a_renouveler").length;
  const aPlanifier = interventions.filter((i) => i.status === "planifiee").length;
  const faites = interventions.filter((i) => i.status === "faite").length;

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <Kpi label="Clients actifs" value={nbClients} />
        <Kpi label="Prospects" value={nbProspects} />
        <Kpi label="À renouveler" value={nbRenouveler} hint="à suivre" />
        <Kpi label="Interventions à planifier" value={aPlanifier} />
        <Kpi label="Interventions réalisées" value={faites} />
        <Kpi label="Total fiches clients" value={clients.length} />
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-[#E6EAF0] bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Derniers clients</h2>
            <Link href="/clients" className="text-sm font-medium text-[#0B7A87] hover:underline">
              Gérer →
            </Link>
          </div>
          {clients.length === 0 ? (
            <p className="text-sm text-[#64748B]">Aucun client pour l&apos;instant.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {clients.slice(0, 6).map((c) => (
                <li key={c.id} className="flex justify-between border-b border-[#F0F2F6] pb-2">
                  <span className="font-medium">{c.name}</span>
                  <span className="text-[#64748B]">{c.city ?? "—"}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-[#E6EAF0] bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Prochaines interventions</h2>
            <Link href="/interventions" className="text-sm font-medium text-[#0B7A87] hover:underline">
              Gérer →
            </Link>
          </div>
          {interventions.filter((i) => i.status === "planifiee").length === 0 ? (
            <p className="text-sm text-[#64748B]">Aucune intervention planifiée.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {interventions
                .filter((i) => i.status === "planifiee")
                .slice(0, 6)
                .map((i) => (
                  <li key={i.id} className="flex justify-between border-b border-[#F0F2F6] pb-2">
                    <span className="font-medium">{i.type}</span>
                    <span className="text-[#64748B]">{i.clients?.name ?? "—"}</span>
                  </li>
                ))}
            </ul>
          )}
        </section>
      </div>
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
