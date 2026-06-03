"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import {
  listQuotes,
  createQuote,
  quoteRef,
  quoteStatutMeta,
  euros,
  QUOTE_STATUTS,
  type Quote,
  type QuoteWithClient,
  type QuoteStatus,
} from "@/lib/quotes";
import { listClients, clientDisplayName, type Client } from "@/lib/clients";
import QuoteDrawer from "@/components/QuoteDrawer";

function nomCompte(q: QuoteWithClient): string {
  const c = q.clients;
  if (!c) return "Compte";
  return c.company_name || [c.first_name, c.last_name].filter(Boolean).join(" ") || "Compte";
}
function fmt(d: string | null) {
  if (!d) return "—";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? d : dt.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function DevisView() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<QuoteWithClient[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtre, setFiltre] = useState<"tous" | QuoteStatus>("tous");
  const [picker, setPicker] = useState(false);
  const [choixClient, setChoixClient] = useState("");
  const [editing, setEditing] = useState<Quote | null>(null);

  const charger = useCallback(async () => {
    try {
      const [q, c] = await Promise.all([listQuotes(), listClients()]);
      setQuotes(q);
      setClients(c);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  async function creer() {
    if (!choixClient) return;
    const q = await createQuote({ client_id: Number(choixClient) });
    setPicker(false);
    setChoixClient("");
    setEditing(q);
  }

  const liste = filtre === "tous" ? quotes : quotes.filter((q) => q.status === filtre);
  const totalAccepte = quotes
    .filter((q) => q.status === "accepte")
    .reduce((s, q) => s + q.total, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Devis</h2>
          <p className="text-sm text-[#64748B]">Tous les devis de l&apos;organisation.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs text-[#94A3B8]">Total accepté</div>
            <div className="text-xl font-semibold text-[#15803D]">{euros(totalAccepte)}</div>
          </div>
          <button
            onClick={() => setPicker((v) => !v)}
            className="rounded-lg bg-[#0A2540] px-4 py-2 text-sm font-medium text-white hover:bg-[#0c3358]"
          >
            + Nouveau devis
          </button>
        </div>
      </div>

      {picker && (
        <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-[#E6EAF0] bg-white p-4 shadow-sm">
          <label className="text-sm text-[#64748B]">
            Compte client
            <select
              className="mt-1 block w-64 rounded-lg border border-[#E6EAF0] px-3 py-2 text-sm"
              value={choixClient}
              onChange={(e) => setChoixClient(e.target.value)}
            >
              <option value="">— Choisir un compte —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {clientDisplayName(c)}
                </option>
              ))}
            </select>
          </label>
          <button
            onClick={creer}
            disabled={!choixClient}
            className="rounded-lg bg-[#14B8C4] px-4 py-2 text-sm font-medium text-[#04212e] disabled:opacity-50"
          >
            Créer le devis
          </button>
          <button
            onClick={() => setPicker(false)}
            className="rounded-lg border border-[#E6EAF0] px-4 py-2 text-sm text-[#64748B]"
          >
            Annuler
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-2 text-sm">
        {(["tous", ...QUOTE_STATUTS.map((s) => s.val)] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFiltre(f as "tous" | QuoteStatus)}
            className={`rounded-full px-3 py-1 ${
              filtre === f ? "bg-[#0A2540] text-white" : "bg-white border border-[#E6EAF0]"
            }`}
          >
            {f === "tous" ? "Tous" : quoteStatutMeta(f as QuoteStatus).label}
          </button>
        ))}
      </div>

      <section className="overflow-x-auto rounded-2xl border border-[#E6EAF0] bg-white shadow-sm">
        {loading ? (
          <p className="p-5 text-sm text-[#64748B]">Chargement…</p>
        ) : liste.length === 0 ? (
          <p className="p-5 text-sm text-[#64748B]">
            Aucun devis. Crée-en un depuis la fiche d&apos;un compte (onglet Devis &amp; Factures).
          </p>
        ) : (
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs uppercase text-[#94A3B8]">
              <tr>
                <th className="px-5 py-3 font-medium">Réf.</th>
                <th className="px-5 py-3 font-medium">Compte</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Total</th>
                <th className="px-5 py-3 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {liste.map((q) => {
                const meta = quoteStatutMeta(q.status);
                return (
                  <tr
                    key={q.id}
                    onClick={() => q.clients?.id && router.push(`/clients?compte=${q.clients.id}`)}
                    className="cursor-pointer border-t border-[#F0F2F6] hover:bg-[#F8FAFC]"
                  >
                    <td className="px-5 py-3 font-medium text-[#0A2540]">{quoteRef(q)}</td>
                    <td className="px-5 py-3 text-[#0A2540]">{nomCompte(q)}</td>
                    <td className="px-5 py-3 text-[#64748B]">{fmt(q.issue_date)}</td>
                    <td className="px-5 py-3 font-medium text-[#0A2540]">{euros(q.total)}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${meta.classe}`}>
                        {meta.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      <QuoteDrawer quote={editing} onClose={() => setEditing(null)} onSaved={charger} />
    </div>
  );
}

export default function Page() {
  return (
    <AppShell>
      <DevisView />
    </AppShell>
  );
}
