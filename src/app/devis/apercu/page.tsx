"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getQuote,
  computeQuoteTotals,
  lineTotal,
  quoteRef,
  euros,
  quoteStatutMeta,
  type Quote,
} from "@/lib/quotes";
import { getClient, clientDisplayName, fullAddress, type Client } from "@/lib/clients";

function fmt(d: string | null) {
  if (!d) return "—";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? d : dt.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function Apercu() {
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get("devis");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!id) return setLoading(false);
      try {
        const q = await getQuote(Number(id));
        setQuote(q);
        if (q) setClient(await getClient(q.client_id));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <p className="p-8 text-sm text-[#64748B]">Chargement…</p>;
  if (!quote) return <p className="p-8 text-sm text-[#B91C1C]">Devis introuvable.</p>;

  const t = computeQuoteTotals(quote.lines, quote.tva_rate, quote.remise_pct);

  return (
    <div className="mx-auto max-w-3xl p-6">
      <style>{`@media print { .no-print { display: none !important; } body { background: white; } }`}</style>

      <div className="no-print mb-4 flex items-center justify-between">
        <button onClick={() => router.back()} className="text-sm text-[#0B7A87] hover:underline">
          ← Retour
        </button>
        <button
          onClick={() => window.print()}
          className="rounded-lg bg-[#0A2540] px-4 py-2 text-sm font-medium text-white hover:bg-[#0c3358]"
        >
          Imprimer / Enregistrer en PDF
        </button>
      </div>

      <div className="rounded-2xl border border-[#E6EAF0] bg-white p-8 shadow-sm">
        {/* En-tête */}
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xl font-semibold text-[#0A2540]">💧 Eauriginelle</div>
            <p className="text-xs text-[#94A3B8]">Filtration &amp; traitement de l&apos;eau</p>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold text-[#0A2540]">DEVIS</div>
            <div className="text-sm text-[#64748B]">{quoteRef(quote)}</div>
            <div className="text-xs text-[#94A3B8]">Date : {fmt(quote.issue_date)}</div>
            {quote.valid_until && (
              <div className="text-xs text-[#94A3B8]">Valable jusqu&apos;au {fmt(quote.valid_until)}</div>
            )}
            <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${quoteStatutMeta(quote.status).classe}`}>
              {quoteStatutMeta(quote.status).label}
            </span>
          </div>
        </div>

        {/* Client */}
        {client && (
          <div className="mt-6 rounded-xl bg-[#F8FAFC] p-4 text-sm">
            <div className="text-xs uppercase text-[#94A3B8]">Client</div>
            <div className="font-medium text-[#0A2540]">{clientDisplayName(client)}</div>
            {fullAddress(client) && <div className="text-[#64748B]">{fullAddress(client)}</div>}
            <div className="text-[#64748B]">
              {[client.phone, client.email].filter(Boolean).join(" · ")}
            </div>
          </div>
        )}

        {quote.title && <p className="mt-6 font-medium text-[#0A2540]">{quote.title}</p>}

        {/* Lignes */}
        <table className="mt-4 w-full text-left text-sm">
          <thead className="border-b border-[#E6EAF0] text-xs uppercase text-[#94A3B8]">
            <tr>
              <th className="py-2">Désignation</th>
              <th className="py-2 text-right">Qté</th>
              <th className="py-2 text-right">PU HT</th>
              <th className="py-2 text-right">Total HT</th>
            </tr>
          </thead>
          <tbody>
            {quote.lines.map((l, i) => (
              <tr key={i} className="border-b border-[#F0F2F6]">
                <td className="py-2 text-[#0A2540]">{l.label}</td>
                <td className="py-2 text-right text-[#64748B]">{l.qty}</td>
                <td className="py-2 text-right text-[#64748B]">{euros(l.unit_price)}</td>
                <td className="py-2 text-right font-medium text-[#0A2540]">{euros(lineTotal(l))}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totaux */}
        <div className="mt-4 ml-auto w-full max-w-xs space-y-1 text-sm">
          <div className="flex justify-between text-[#64748B]">
            <span>Sous-total HT</span>
            <span>{euros(t.subtotal)}</span>
          </div>
          {t.remise > 0 && (
            <div className="flex justify-between text-[#64748B]">
              <span>Remise ({quote.remise_pct}%)</span>
              <span>– {euros(t.remise)}</span>
            </div>
          )}
          <div className="flex justify-between text-[#64748B]">
            <span>Total HT</span>
            <span>{euros(t.ht)}</span>
          </div>
          <div className="flex justify-between text-[#64748B]">
            <span>TVA ({quote.tva_rate}%)</span>
            <span>{euros(t.tva)}</span>
          </div>
          <div className="flex justify-between border-t border-[#E6EAF0] pt-1 text-base font-semibold text-[#0A2540]">
            <span>Total TTC</span>
            <span>{euros(t.ttc)}</span>
          </div>
        </div>

        {quote.notes && (
          <p className="mt-6 border-t border-[#F0F2F6] pt-3 text-xs text-[#64748B]">{quote.notes}</p>
        )}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<p className="p-8 text-sm text-[#64748B]">Chargement…</p>}>
      <Apercu />
    </Suspense>
  );
}
