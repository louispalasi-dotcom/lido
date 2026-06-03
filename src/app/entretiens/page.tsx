"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import {
  listInstallations,
  markMaintained,
  removeInstallation,
  nextDue,
  etatEntretien,
  installClientName,
  fmtDate,
  ETAT_ENTRETIEN,
  type InstallationWithClient,
  type EtatEntretien,
} from "@/lib/installations";

function EntretiensView() {
  const router = useRouter();
  const [items, setItems] = useState<InstallationWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtre, setFiltre] = useState<"tous" | EtatEntretien>("tous");

  const charger = useCallback(async () => {
    try {
      setItems(await listInstallations());
      setError(null);
    } catch {
      setError("Impossible de charger les entretiens depuis Supabase.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  async function entretenu(id: number) {
    const today = new Date().toISOString().slice(0, 10);
    await markMaintained(id, today);
    charger();
  }

  async function supprimer(id: number) {
    if (!confirm("Retirer ce produit installé ?")) return;
    setItems((rows) => rows.filter((i) => i.id !== id));
    try {
      await removeInstallation(id);
    } catch {
      charger();
    }
  }

  const counts = { a_jour: 0, a_surveiller: 0, en_retard: 0 } as Record<EtatEntretien, number>;
  items.forEach((i) => (counts[etatEntretien(i)] += 1));
  const total = items.length;

  const liste = [...items]
    .filter((i) => filtre === "tous" || etatEntretien(i) === filtre)
    .sort((a, b) => (nextDue(a) ?? "9999").localeCompare(nextDue(b) ?? "9999"));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Entretiens des installations</h2>
        <p className="text-sm text-[#64748B]">
          La prochaine échéance est calculée automatiquement (date de pose ou dernier entretien +
          fréquence).
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-[#F3C2C2] bg-[#FDECEC] px-4 py-3 text-sm text-[#B91C1C]">
          {error}
        </div>
      )}

      {/* Synthèse cliquable (= filtres) */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Carte
          actif={filtre === "tous"}
          onClick={() => setFiltre("tous")}
          label="Total parc"
          valeur={total}
          couleur="#0A2540"
        />
        {(["a_jour", "a_surveiller", "en_retard"] as EtatEntretien[]).map((e) => (
          <Carte
            key={e}
            actif={filtre === e}
            onClick={() => setFiltre(e)}
            label={ETAT_ENTRETIEN[e].label}
            valeur={counts[e]}
            couleur={ETAT_ENTRETIEN[e].color}
          />
        ))}
      </section>

      <section className="overflow-x-auto rounded-2xl border border-[#E6EAF0] bg-white shadow-sm">
        {loading ? (
          <p className="p-5 text-sm text-[#64748B]">Chargement…</p>
        ) : liste.length === 0 ? (
          <p className="p-5 text-sm text-[#64748B]">Aucune installation pour ce filtre.</p>
        ) : (
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-xs uppercase text-[#94A3B8]">
              <tr>
                <th className="px-5 py-3 font-medium">Produit</th>
                <th className="px-5 py-3 font-medium">Compte</th>
                <th className="px-5 py-3 font-medium">Posé le</th>
                <th className="px-5 py-3 font-medium">Prochain entretien</th>
                <th className="px-5 py-3 font-medium">État</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {liste.map((i) => {
                const et = etatEntretien(i);
                const meta = ETAT_ENTRETIEN[et];
                return (
                  <tr key={i.id} className="border-t border-[#F0F2F6]">
                    <td className="px-5 py-3 font-medium text-[#0A2540]">
                      {i.model}
                      {i.serial && <span className="block text-xs text-[#94A3B8]">N° {i.serial}</span>}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => i.clients?.id && router.push(`/clients?compte=${i.clients.id}`)}
                        className="text-[#0B7A87] hover:underline"
                      >
                        {installClientName(i)}
                      </button>
                    </td>
                    <td className="px-5 py-3 text-[#64748B]">{fmtDate(i.installed_at)}</td>
                    <td className="px-5 py-3 text-[#0A2540]">{fmtDate(nextDue(i))}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${meta.classe}`}>
                        <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => entretenu(i.id)}
                        className="mr-3 text-xs font-medium text-[#0B7A87] hover:underline"
                      >
                        Marquer entretenu
                      </button>
                      <button
                        onClick={() => supprimer(i.id)}
                        className="text-xs text-[#94A3B8] hover:text-red-600"
                      >
                        Retirer
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

function Carte({
  label,
  valeur,
  couleur,
  actif,
  onClick,
}: {
  label: string;
  valeur: number;
  couleur: string;
  actif: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl border bg-white p-4 text-left shadow-sm ${
        actif ? "border-[#14B8C4] ring-1 ring-[#14B8C4]" : "border-[#E6EAF0]"
      }`}
    >
      <div className="text-2xl font-semibold" style={{ color: couleur }}>
        {valeur}
      </div>
      <div className="text-xs text-[#64748B]">{label}</div>
    </button>
  );
}

export default function Page() {
  return (
    <AppShell>
      <EntretiensView />
    </AppShell>
  );
}
