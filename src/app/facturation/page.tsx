"use client";

import { useCallback, useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { listOpportunities, type Opportunity } from "@/lib/opportunities";
import {
  listInvoices,
  createInvoice,
  setInvoiceStatus,
  removeInvoice,
  computeCommissions,
  currentPeriod,
  invoiceRef,
  euros,
  type InternalInvoice,
} from "@/lib/billing";

function FacturationView() {
  const [opps, setOpps] = useState<Opportunity[]>([]);
  const [invoices, setInvoices] = useState<InternalInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [rate, setRate] = useState(10);
  const [info, setInfo] = useState<string | null>(null);

  const charger = useCallback(async () => {
    try {
      const [o, inv] = await Promise.all([listOpportunities(), listInvoices()]);
      setOpps(o);
      setInvoices(inv);
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
    const c = isNaN(v) ? 0 : Math.max(0, Math.min(100, v));
    setRate(c);
    localStorage.setItem("lido-commission-rate", String(c));
  }

  const commissions = computeCommissions(opps, rate);
  const totalCommission = commissions.reduce((s, c) => s + c.commission, 0);
  const period = currentPeriod();

  async function genererFactures() {
    setInfo(null);
    let crees = 0;
    for (const c of commissions) {
      const existe = invoices.some(
        (i) => i.aqualiste === c.aqualiste && i.period === period
      );
      if (!existe && c.commission > 0) {
        await createInvoice({
          aqualiste: c.aqualiste,
          period,
          amount: c.commission,
          rate,
          notes: `Commission ${rate}% sur ${euros(c.caGagne)} gagnés (${c.nbGagnees} affaire(s))`,
        });
        crees += 1;
      }
    }
    await charger();
    setInfo(
      crees > 0
        ? `${crees} facture(s) générée(s) pour ${period}.`
        : `Aucune nouvelle facture : ${period} est déjà à jour.`
    );
  }

  async function basculer(i: InternalInvoice) {
    const next = i.status === "payee" ? "a_payer" : "payee";
    setInvoices((rows) => rows.map((x) => (x.id === i.id ? { ...x, status: next } : x)));
    await setInvoiceStatus(i.id, next);
  }

  async function supprimer(id: number) {
    if (!confirm("Supprimer cette facture interne ?")) return;
    setInvoices((rows) => rows.filter((i) => i.id !== id));
    await removeInvoice(id);
  }

  const aPayer = invoices.filter((i) => i.status === "a_payer").reduce((s, i) => s + i.amount, 0);
  const payees = invoices.filter((i) => i.status === "payee").reduce((s, i) => s + i.amount, 0);

  if (loading) return <p className="text-sm text-[#64748B]">Chargement…</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Facturation interne &amp; commissions</h2>
          <p className="text-sm text-[#64748B]">
            Commissions calculées sur les opportunités gagnées · factures Aqualiste → Eauriginelle.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm text-[#64748B]">
          Taux de commission
          <input
            type="number"
            value={rate}
            onChange={(e) => changeRate(Number(e.target.value))}
            className="w-16 rounded-md border border-[#E6EAF0] px-2 py-1 text-right text-sm text-[#0A2540]"
          />
          %
        </label>
      </div>

      {/* Commissions */}
      <section className="rounded-2xl border border-[#E6EAF0] bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-semibold text-[#0A2540]">Commissions par Aqualiste</h3>
          <button
            onClick={genererFactures}
            className="rounded-lg bg-[#0A2540] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#0c3358]"
          >
            Générer les factures · {period}
          </button>
        </div>

        {info && (
          <div className="mb-3 rounded-xl border border-[#BBE7CB] bg-[#E7F8EE] px-4 py-2 text-sm text-[#15803D]">
            ✅ {info}
          </div>
        )}

        {commissions.length === 0 ? (
          <p className="text-sm text-[#64748B]">
            Aucune opportunité gagnée pour l&apos;instant — marque des affaires « Gagné » dans le
            Pipeline.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="text-xs uppercase text-[#94A3B8]">
                <tr>
                  <th className="py-2 font-medium">Aqualiste</th>
                  <th className="py-2 font-medium">Affaires gagnées</th>
                  <th className="py-2 font-medium">CA gagné</th>
                  <th className="py-2 font-medium">Commission ({rate}%)</th>
                </tr>
              </thead>
              <tbody>
                {commissions.map((c) => (
                  <tr key={c.aqualiste} className="border-t border-[#F0F2F6]">
                    <td className="py-2.5 font-medium text-[#0A2540]">{c.aqualiste}</td>
                    <td className="py-2.5 text-[#64748B]">{c.nbGagnees}</td>
                    <td className="py-2.5 text-[#0A2540]">{euros(c.caGagne)}</td>
                    <td className="py-2.5 font-semibold text-[#15803D]">{euros(c.commission)}</td>
                  </tr>
                ))}
                <tr className="border-t border-[#E6EAF0]">
                  <td className="py-2.5 font-semibold" colSpan={3}>
                    Total commissions
                  </td>
                  <td className="py-2.5 font-semibold text-[#15803D]">{euros(totalCommission)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Factures internes */}
      <section className="rounded-2xl border border-[#E6EAF0] bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-semibold text-[#0A2540]">Factures internes</h3>
          <div className="flex gap-4 text-sm">
            <span className="text-[#B45309]">À payer : <strong>{euros(aPayer)}</strong></span>
            <span className="text-[#15803D]">Payées : <strong>{euros(payees)}</strong></span>
          </div>
        </div>

        {invoices.length === 0 ? (
          <p className="text-sm text-[#64748B]">
            Aucune facture. Clique « Générer les factures » pour créer celles du mois.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-xs uppercase text-[#94A3B8]">
                <tr>
                  <th className="px-1 py-2 font-medium">Réf.</th>
                  <th className="px-1 py-2 font-medium">Aqualiste</th>
                  <th className="px-1 py-2 font-medium">Période</th>
                  <th className="px-1 py-2 font-medium">Montant</th>
                  <th className="px-1 py-2 font-medium">Statut</th>
                  <th className="px-1 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((i) => (
                  <tr key={i.id} className="border-t border-[#F0F2F6]">
                    <td className="px-1 py-2.5 font-medium text-[#0A2540]">{invoiceRef(i)}</td>
                    <td className="px-1 py-2.5 text-[#0A2540]">{i.aqualiste}</td>
                    <td className="px-1 py-2.5 capitalize text-[#64748B]">{i.period}</td>
                    <td className="px-1 py-2.5 font-semibold text-[#0A2540]">{euros(i.amount)}</td>
                    <td className="px-1 py-2.5">
                      <button
                        onClick={() => basculer(i)}
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          i.status === "payee"
                            ? "bg-[#E7F8EE] text-[#15803D]"
                            : "bg-[#FFF3E6] text-[#B45309]"
                        }`}
                      >
                        {i.status === "payee" ? "Payée" : "À payer"}
                      </button>
                    </td>
                    <td className="px-1 py-2.5 text-right">
                      <button
                        onClick={() => supprimer(i.id)}
                        className="text-xs text-[#94A3B8] hover:text-red-600"
                      >
                        Suppr.
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-xs text-[#94A3B8]">
          Clique sur le statut pour basculer « à payer » / « payée ».
        </p>
      </section>
    </div>
  );
}

export default function Page() {
  return (
    <AppShell>
      <FacturationView />
    </AppShell>
  );
}
