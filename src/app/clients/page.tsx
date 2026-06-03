"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import AccountDetail from "@/components/AccountDetail";
import {
  listClients,
  updateClient,
  removeClient,
  clientDisplayName,
  clientStatusBadge,
  temperatureInfo,
  CLIENT_STATUTS,
  type Client,
  type ClientStatus,
} from "@/lib/clients";
import { listOpportunities } from "@/lib/opportunities";

function euros(n: number) {
  return (n || 0).toLocaleString("fr-FR") + " €";
}

function segBadge(seg: "b2b" | "b2c") {
  return seg === "b2b"
    ? { label: "B2B", classe: "bg-[#E6EDF7] text-[#1D4ED8]" }
    : { label: "B2C", classe: "bg-[#E6F7F9] text-[#0B7A87]" };
}

function ClientsList() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [wonIds, setWonIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtre, setFiltre] = useState<"tous" | ClientStatus>("tous");

  const charger = useCallback(async () => {
    try {
      const [cls, opps] = await Promise.all([listClients(), listOpportunities()]);
      setClients(cls);
      // Un compte est "client" dès qu'il a au moins une opportunité gagnée (Signé).
      setWonIds(
        new Set(opps.filter((o) => o.stage === "signe" && o.client_id).map((o) => o.client_id as number))
      );
      setError(null);
    } catch {
      setError("Impossible de charger les comptes clients depuis Supabase.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  function ouvrir(id: number) {
    router.push(`/clients?compte=${id}`);
  }

  async function changerStatut(id: number, s: ClientStatus) {
    setClients((rows) => rows.map((c) => (c.id === id ? { ...c, status: s } : c)));
    try {
      await updateClient(id, { status: s });
    } catch {
      setError("La modification du statut a échoué.");
      charger();
    }
  }

  async function supprimer(id: number) {
    if (!confirm("Supprimer ce compte client ?")) return;
    setClients((rows) => rows.filter((c) => c.id !== id));
    try {
      await removeClient(id);
    } catch {
      setError("La suppression a échoué.");
      charger();
    }
  }

  const gagnes = clients.filter((c) => wonIds.has(c.id));
  const liste = filtre === "tous" ? gagnes : gagnes.filter((c) => c.status === filtre);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Clients</h2>

      <p className="rounded-xl border border-[#CDE9ED] bg-[#F0FBFC] px-4 py-3 text-sm text-[#0B7A87]">
        Ici, les comptes ayant au moins une <strong>affaire gagnée</strong>. Les prospects en cours
        sont accessibles depuis le <strong>Pipeline</strong> (clique une opportunité). Clique une
        ligne pour ouvrir la <strong>fiche 360</strong>.
      </p>

      {error && (
        <div className="rounded-xl border border-[#F3C2C2] bg-[#FDECEC] px-4 py-3 text-sm text-[#B91C1C]">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2 text-sm">
        {(["tous", "prospect", "client", "a_renouveler"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFiltre(f)}
            className={`rounded-full px-3 py-1 ${
              filtre === f ? "bg-[#0A2540] text-white" : "bg-white border border-[#E6EAF0]"
            }`}
          >
            {f === "tous" ? "Tous" : clientStatusBadge(f as ClientStatus).label}
          </button>
        ))}
      </div>

      <section className="overflow-x-auto rounded-2xl border border-[#E6EAF0] bg-white shadow-sm">
        {loading ? (
          <p className="p-5 text-sm text-[#64748B]">Chargement…</p>
        ) : liste.length === 0 ? (
          <p className="p-5 text-sm text-[#64748B]">
            Aucun client gagné pour l&apos;instant. Marque une opportunité comme «&nbsp;gagné&nbsp;»
            dans le Pipeline pour activer son compte ici 👆
          </p>
        ) : (
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs uppercase text-[#94A3B8]">
              <tr>
                <th className="px-5 py-3 font-medium">Compte</th>
                <th className="px-5 py-3 font-medium">Segment</th>
                <th className="px-5 py-3 font-medium">Température</th>
                <th className="px-5 py-3 font-medium">Valeur estimée</th>
                <th className="px-5 py-3 font-medium">Référent</th>
                <th className="px-5 py-3 font-medium">Statut</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {liste.map((c) => {
                const sb = segBadge(c.segment);
                const temp = temperatureInfo(c.temperature);
                return (
                  <tr
                    key={c.id}
                    onClick={() => ouvrir(c.id)}
                    className="cursor-pointer border-t border-[#F0F2F6] hover:bg-[#F8FAFC]"
                  >
                    <td className="px-5 py-3 font-medium text-[#0A2540]">
                      {clientDisplayName(c)}
                      {c.city && <span className="block text-xs text-[#94A3B8]">{c.city}</span>}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${sb.classe}`}>
                        {sb.label}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {temp ? (
                        <span className="inline-flex items-center gap-1.5 text-[#64748B]">
                          <span className={`h-2.5 w-2.5 rounded-full ${temp.dot}`} />
                          {temp.label}
                        </span>
                      ) : (
                        <span className="text-[#94A3B8]">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-[#0A2540]">{euros(c.estimated_value)}</td>
                    <td className="px-5 py-3 text-[#64748B]">{c.sales_rep ?? "—"}</td>
                    <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={c.status}
                        onChange={(e) => changerStatut(c.id, e.target.value as ClientStatus)}
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${clientStatusBadge(c.status).classe}`}
                      >
                        {CLIENT_STATUTS.map((s) => (
                          <option key={s.val} value={s.val}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => supprimer(c.id)}
                        className="text-xs text-[#94A3B8] hover:text-red-600"
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

// Aiguillage : ?compte=ID → fiche 360, sinon la liste.
function ClientsRouter() {
  const params = useSearchParams();
  const compte = params.get("compte");
  if (compte) return <AccountDetail clientId={Number(compte)} />;
  return <ClientsList />;
}

export default function Page() {
  return (
    <AppShell>
      <Suspense fallback={<p className="text-sm text-[#64748B]">Chargement…</p>}>
        <ClientsRouter />
      </Suspense>
    </AppShell>
  );
}
