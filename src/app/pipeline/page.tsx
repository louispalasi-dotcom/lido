"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import {
  listOpportunities,
  createOpportunity,
  setOpportunityStage,
  setOpportunityEtat,
  removeOpportunity,
  etatOf,
  stageForEtat,
  ETATS,
  STAGES,
  type Opportunity,
  type Segment,
  type Stage,
  type Etat,
} from "@/lib/opportunities";

function euros(n: number) {
  return n.toLocaleString("fr-FR") + " €";
}

function segBadge(s: Segment) {
  return s === "b2b"
    ? "bg-[#E6EDF7] text-[#1D4ED8]"
    : "bg-[#E6F7F9] text-[#0B7A87]";
}

function PipelineView() {
  const router = useRouter();
  const [opps, setOpps] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [survol, setSurvol] = useState<Stage | null>(null);

  const [title, setTitle] = useState("");
  const [segment, setSegment] = useState<Segment>("b2b");
  const [amount, setAmount] = useState("");
  const [probability, setProbability] = useState("50");
  const [date, setDate] = useState("");
  const [owner, setOwner] = useState("");

  const charger = useCallback(async () => {
    try {
      setOpps(await listOpportunities());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  async function ajouter(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const created = await createOpportunity({
      title: title.trim(),
      segment,
      amount: Number(amount) || 0,
      probability: Number(probability) || 0,
      expected_date: date || null,
      stage: "nouveau",
      owner: owner.trim() || "—",
    });
    setOpps((rows) => [created, ...rows]);
    setTitle("");
    setAmount("");
    setProbability("50");
    setDate("");
    setOwner("");
  }

  async function deplacer(id: number, stage: Stage) {
    setOpps((rows) => rows.map((o) => (o.id === id ? { ...o, stage } : o)));
    try {
      await setOpportunityStage(id, stage);
    } catch {
      charger();
    }
  }

  async function changerEtat(o: Opportunity, etat: Etat) {
    const stage = stageForEtat(etat, o.stage);
    setOpps((rows) => rows.map((x) => (x.id === o.id ? { ...x, stage } : x)));
    try {
      await setOpportunityEtat(o, etat);
    } catch {
      charger();
    }
  }

  async function supprimer(id: number) {
    if (!confirm("Supprimer cette opportunité ?")) return;
    setOpps((rows) => rows.filter((o) => o.id !== id));
    try {
      await removeOpportunity(id);
    } catch {
      charger();
    }
  }

  // Indicateurs
  const ouvertes = opps.filter((o) => o.stage !== "signe" && o.stage !== "perdu");
  const totalOuvert = ouvertes.reduce((s, o) => s + o.amount, 0);
  const prevision = ouvertes.reduce((s, o) => s + (o.amount * o.probability) / 100, 0);
  const caSigne = opps.filter((o) => o.stage === "signe").reduce((s, o) => s + o.amount, 0);

  if (loading) return <p className="text-[#64748B]">Chargement…</p>;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Pipeline commercial</h2>

      {/* Indicateurs de prévision */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#E6EAF0] bg-white p-5 shadow-sm">
          <div className="text-sm text-[#64748B]">Pipeline ouvert (potentiel)</div>
          <div className="mt-2 text-2xl font-semibold">{euros(totalOuvert)}</div>
        </div>
        <div className="rounded-2xl border border-[#E6EAF0] bg-white p-5 shadow-sm">
          <div className="text-sm text-[#64748B]">Prévision pondérée (prévu)</div>
          <div className="mt-2 text-2xl font-semibold text-[#0B7A87]">
            {euros(Math.round(prevision))}
          </div>
        </div>
        <div className="rounded-2xl border border-[#E6EAF0] bg-white p-5 shadow-sm">
          <div className="text-sm text-[#64748B]">CA signé (gagné)</div>
          <div className="mt-2 text-2xl font-semibold">{euros(caSigne)}</div>
        </div>
      </section>

      {/* Formulaire d'ajout */}
      <form
        onSubmit={ajouter}
        className="grid grid-cols-1 gap-3 rounded-2xl border border-[#E6EAF0] bg-white p-5 shadow-sm md:grid-cols-6"
      >
        <input
          className="rounded-lg border border-[#E6EAF0] px-3 py-2 text-sm md:col-span-2"
          placeholder="Nom de l'opportunité *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <select
          className="rounded-lg border border-[#E6EAF0] px-2 py-2 text-sm"
          value={segment}
          onChange={(e) => setSegment(e.target.value as Segment)}
        >
          <option value="b2b">B2B</option>
          <option value="b2c">B2C</option>
        </select>
        <input
          type="number"
          className="rounded-lg border border-[#E6EAF0] px-3 py-2 text-sm"
          placeholder="Montant €"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <input
          type="number"
          className="rounded-lg border border-[#E6EAF0] px-3 py-2 text-sm"
          placeholder="Proba %"
          value={probability}
          onChange={(e) => setProbability(e.target.value)}
        />
        <div className="flex gap-2">
          <input
            className="w-full rounded-lg border border-[#E6EAF0] px-3 py-2 text-sm"
            placeholder="Aqualiste"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
          />
          <button
            type="submit"
            className="rounded-lg bg-[#14B8C4] px-4 py-2 text-sm font-medium text-[#04212e]"
          >
            +
          </button>
        </div>
      </form>

      <p className="text-xs text-[#94A3B8]">
        Astuce : fais <strong>glisser une carte</strong> d&apos;une colonne à l&apos;autre pour
        changer son étape (ou utilise le petit menu sur la carte).
      </p>

      {/* Kanban */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map((col) => {
          const cartes = opps.filter((o) => o.stage === col.val);
          const total = cartes.reduce((s, o) => s + o.amount, 0);
          return (
            <div
              key={col.val}
              onDragOver={(e) => {
                e.preventDefault();
                setSurvol(col.val);
              }}
              onDragLeave={() => setSurvol((s) => (s === col.val ? null : s))}
              onDrop={(e) => {
                const id = Number(e.dataTransfer.getData("text/plain"));
                if (id) deplacer(id, col.val);
                setSurvol(null);
              }}
              className={`flex w-60 flex-shrink-0 flex-col rounded-2xl border bg-[#F1F5F9] p-3 ${
                survol === col.val ? "border-[#14B8C4]" : "border-[#E6EAF0]"
              }`}
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <span className="text-sm font-semibold">{col.label}</span>
                <span className="text-xs text-[#64748B]">
                  {cartes.length} · {euros(total)}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {cartes.map((o) => (
                  <div
                    key={o.id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("text/plain", String(o.id))}
                    onClick={() => {
                      if (o.client_id) router.push(`/clients?compte=${o.client_id}`);
                    }}
                    title={o.client_id ? "Ouvrir le compte" : "Aucun compte lié"}
                    className="cursor-pointer rounded-xl border border-[#E6EAF0] bg-white p-3 shadow-sm hover:border-[#14B8C4]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium leading-tight">{o.title}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${segBadge(
                          o.segment
                        )}`}
                      >
                        {o.segment}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-[#64748B]">
                      <span className="font-semibold text-[#0A2540]">{euros(o.amount)}</span>
                      <span>{o.probability}%</span>
                    </div>
                    <div className="mt-1 text-xs text-[#94A3B8]">
                      {o.owner} · {o.expected_date ?? "—"}
                    </div>
                    <div
                      className="mt-2 flex items-center justify-between"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <label className="flex items-center gap-1 text-[11px] text-[#94A3B8]">
                        État
                        <select
                          value={etatOf(o.stage)}
                          onChange={(e) => changerEtat(o, e.target.value as Etat)}
                          className="rounded-md border border-[#E6EAF0] px-1 py-0.5 text-[11px] text-[#0A2540]"
                        >
                          {ETATS.map((s) => (
                            <option key={s.val} value={s.val}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button
                        onClick={() => supprimer(o.id)}
                        className="text-[11px] text-[#94A3B8] hover:text-red-600"
                      >
                        Suppr.
                      </button>
                    </div>
                  </div>
                ))}
                {cartes.length === 0 && (
                  <p className="px-1 py-4 text-center text-xs text-[#94A3B8]">—</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <AppShell>
      <PipelineView />
    </AppShell>
  );
}
