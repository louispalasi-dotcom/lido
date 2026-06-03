"use client";

import { useCallback, useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import {
  listStockItems,
  listPartsCatalogue,
  updateStockItem,
  stockEtat,
  STOCK_ETAT_META,
  euros,
  type StockItem,
  type PartPrice,
  type StockEtat,
} from "@/lib/stock";

function StockView() {
  const [items, setItems] = useState<StockItem[]>([]);
  const [parts, setParts] = useState<PartPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState<"piece" | "produit">("piece");
  const [filtre, setFiltre] = useState<"tous" | StockEtat>("tous");

  const charger = useCallback(async () => {
    try {
      const [s, p] = await Promise.all([listStockItems(), listPartsCatalogue()]);
      setItems(s);
      setParts(p);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  function majLocal(id: number, field: "prix_vente_ht" | "cout_ht", value: string) {
    const num = value === "" ? null : Number(value);
    setItems((rows) => rows.map((i) => (i.id === id ? { ...i, [field]: num } : i)));
  }
  async function sauver(id: number, field: "prix_vente_ht" | "cout_ht", value: string) {
    const num = value === "" ? null : Number(value);
    await updateStockItem(id, { [field]: num });
  }

  const pieces = items.filter((i) => i.category === "piece");
  const produits = items.filter((i) => i.category === "produit");

  const counts = { ok: 0, faible: 0, rupture: 0 } as Record<StockEtat, number>;
  pieces.forEach((i) => (counts[stockEtat(i)] += 1));
  const unites = pieces.reduce((s, i) => s + i.quantite_en_stock, 0);
  const valeur = pieces.reduce((s, i) => s + i.quantite_en_stock * (i.prix_vente_ht ?? 0), 0);

  const liste = pieces.filter((i) => filtre === "tous" || stockEtat(i) === filtre);

  const champPrix = (i: StockItem, field: "prix_vente_ht" | "cout_ht") => (
    <input
      type="number"
      className="w-20 rounded-lg border border-[#E6EAF0] px-2 py-1 text-right text-sm"
      placeholder="—"
      value={i[field] ?? ""}
      onChange={(e) => majLocal(i.id, field, e.target.value)}
      onBlur={(e) => sauver(i.id, field, e.target.value)}
    />
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Stock</h2>
        <p className="text-sm text-[#64748B]">
          Pièces (suivi des quantités) et produits (catalogue tarifaire utilisé dans les devis).
        </p>
      </div>

      {/* Bascule Pièces / Produits */}
      <div className="flex rounded-lg border border-[#E6EAF0] bg-white p-0.5 text-sm w-fit">
        <button
          onClick={() => setCat("piece")}
          className={`rounded-md px-4 py-1.5 ${cat === "piece" ? "bg-[#0A2540] text-white" : "text-[#64748B]"}`}
        >
          Pièces ({pieces.length})
        </button>
        <button
          onClick={() => setCat("produit")}
          className={`rounded-md px-4 py-1.5 ${cat === "produit" ? "bg-[#0A2540] text-white" : "text-[#64748B]"}`}
        >
          Produits ({produits.length})
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-[#64748B]">Chargement…</p>
      ) : cat === "piece" ? (
        <>
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Carte label="Références" valeur={String(pieces.length)} couleur="#0A2540" />
            <Carte label="Unités en stock" valeur={String(unites)} couleur="#0A2540" />
            <Carte label="En alerte" valeur={String(counts.faible + counts.rupture)} couleur="#B45309" />
            <Carte label="Valeur (partielle)" valeur={euros(valeur)} couleur="#15803D" />
          </section>

          <div className="flex flex-wrap gap-2 text-sm">
            {(["tous", "rupture", "faible", "ok"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFiltre(f)}
                className={`rounded-full px-3 py-1 ${
                  filtre === f ? "bg-[#0A2540] text-white" : "bg-white border border-[#E6EAF0]"
                }`}
              >
                {f === "tous" ? "Tous" : STOCK_ETAT_META[f as StockEtat].label}
              </button>
            ))}
          </div>

          <section className="overflow-x-auto rounded-2xl border border-[#E6EAF0] bg-white shadow-sm">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="text-xs uppercase text-[#94A3B8]">
                <tr>
                  <th className="px-5 py-3 font-medium">Réf.</th>
                  <th className="px-5 py-3 font-medium">Article</th>
                  <th className="px-5 py-3 font-medium">En stock</th>
                  <th className="px-5 py-3 font-medium">Seuil</th>
                  <th className="px-5 py-3 font-medium">Prix HT</th>
                  <th className="px-5 py-3 font-medium">Coût HT</th>
                  <th className="px-5 py-3 font-medium">État</th>
                </tr>
              </thead>
              <tbody>
                {liste.map((i) => {
                  const meta = STOCK_ETAT_META[stockEtat(i)];
                  return (
                    <tr key={i.id} className="border-t border-[#F0F2F6]">
                      <td className="px-5 py-3 text-[#64748B]">{i.reference}</td>
                      <td className="px-5 py-3 font-medium text-[#0A2540]">{i.nom}</td>
                      <td className="px-5 py-3 font-semibold text-[#0A2540]">{i.quantite_en_stock}</td>
                      <td className="px-5 py-3 text-[#94A3B8]">{i.seuil_alerte}</td>
                      <td className="px-5 py-3">{champPrix(i, "prix_vente_ht")}</td>
                      <td className="px-5 py-3">{champPrix(i, "cout_ht")}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${meta.classe}`}>
                          <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                          {meta.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>

          {parts.length > 0 && (
            <details className="rounded-2xl border border-[#E6EAF0] bg-white p-4 shadow-sm">
              <summary className="cursor-pointer text-sm font-semibold text-[#0A2540]">
                Tarifs pièces fournisseur ({parts.length} réf.)
              </summary>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead className="text-xs uppercase text-[#94A3B8]">
                    <tr>
                      <th className="px-2 py-2 font-medium">Réf.</th>
                      <th className="px-2 py-2 font-medium">Descriptif</th>
                      <th className="px-2 py-2 font-medium">Prix HT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parts.map((p) => (
                      <tr key={p.id} className="border-t border-[#F0F2F6]">
                        <td className="px-2 py-1.5 text-[#64748B]">{p.reference}</td>
                        <td className="px-2 py-1.5 text-[#0A2540]">{p.descriptif}</td>
                        <td className="px-2 py-1.5 text-[#64748B]">{euros(p.prix_ht)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          )}
        </>
      ) : (
        <section className="overflow-x-auto rounded-2xl border border-[#E6EAF0] bg-white shadow-sm">
          <p className="border-b border-[#F0F2F6] px-5 py-3 text-xs text-[#94A3B8]">
            Catalogue tarifaire — ces produits sont sélectionnables dans les devis (le prix se remplit
            automatiquement).
          </p>
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="text-xs uppercase text-[#94A3B8]">
              <tr>
                <th className="px-5 py-3 font-medium">Réf.</th>
                <th className="px-5 py-3 font-medium">Produit</th>
                <th className="px-5 py-3 font-medium">Prix HT</th>
                <th className="px-5 py-3 font-medium">Coût HT</th>
              </tr>
            </thead>
            <tbody>
              {produits.map((i) => (
                <tr key={i.id} className="border-t border-[#F0F2F6]">
                  <td className="px-5 py-3 text-[#64748B]">{i.reference}</td>
                  <td className="px-5 py-3 font-medium text-[#0A2540]">{i.nom}</td>
                  <td className="px-5 py-3">{champPrix(i, "prix_vente_ht")}</td>
                  <td className="px-5 py-3">{champPrix(i, "cout_ht")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}

function Carte({ label, valeur, couleur }: { label: string; valeur: string; couleur: string }) {
  return (
    <div className="rounded-2xl border border-[#E6EAF0] bg-white p-4 shadow-sm">
      <div className="text-2xl font-semibold" style={{ color: couleur }}>
        {valeur}
      </div>
      <div className="text-xs text-[#64748B]">{label}</div>
    </div>
  );
}

export default function Page() {
  return (
    <AppShell>
      <StockView />
    </AppShell>
  );
}
