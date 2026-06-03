"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { listRdv, type RdvWithClient } from "@/lib/activities";

type Vue = "jour" | "semaine" | "mois";

// --- petits utilitaires de dates (sans librairie) ---
function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function addMonths(d: Date, n: number) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
}
function mondayOf(d: Date) {
  const day = (d.getDay() + 6) % 7; // lundi = 0
  return addDays(startOfDay(d), -day);
}
function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
function heure(d: Date) {
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}
function nomCompte(r: RdvWithClient) {
  const c = r.clients;
  if (!c) return "Compte";
  if (c.company_name) return c.company_name;
  return [c.first_name, c.last_name].filter(Boolean).join(" ") || "Compte";
}

export default function CalendarView() {
  const router = useRouter();
  const [vue, setVue] = useState<Vue>("semaine");
  const [cursor, setCursor] = useState<Date>(() => new Date());
  const [rdvs, setRdvs] = useState<RdvWithClient[]>([]);
  const [loading, setLoading] = useState(true);

  const charger = useCallback(async () => {
    try {
      setRdvs(await listRdv());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  function ouvrirCompte(r: RdvWithClient) {
    if (r.clients?.id) router.push(`/clients?compte=${r.clients.id}`);
  }

  function rdvDuJour(jour: Date): RdvWithClient[] {
    return rdvs
      .filter((r) => sameDay(new Date(r.occurred_at), jour))
      .sort((a, b) => a.occurred_at.localeCompare(b.occurred_at));
  }

  function deplacer(sens: -1 | 1) {
    if (vue === "jour") setCursor((c) => addDays(c, sens));
    else if (vue === "semaine") setCursor((c) => addDays(c, sens * 7));
    else setCursor((c) => addMonths(c, sens));
  }

  const titrePeriode =
    vue === "mois"
      ? cursor.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
      : vue === "jour"
      ? cursor.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })
      : (() => {
          const lun = mondayOf(cursor);
          const dim = addDays(lun, 6);
          return `${lun.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} – ${dim.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}`;
        })();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Calendrier</h2>
        <div className="flex rounded-lg border border-[#E6EAF0] bg-white p-0.5 text-sm">
          {(["jour", "semaine", "mois"] as Vue[]).map((v) => (
            <button
              key={v}
              onClick={() => setVue(v)}
              className={`rounded-md px-3 py-1.5 capitalize ${
                vue === v ? "bg-[#0A2540] text-white" : "text-[#64748B]"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => deplacer(-1)}
            className="rounded-lg border border-[#E6EAF0] bg-white px-2.5 py-1.5 text-sm hover:bg-[#F8FAFC]"
          >
            ‹
          </button>
          <button
            onClick={() => setCursor(new Date())}
            className="rounded-lg border border-[#E6EAF0] bg-white px-3 py-1.5 text-sm hover:bg-[#F8FAFC]"
          >
            Aujourd&apos;hui
          </button>
          <button
            onClick={() => deplacer(1)}
            className="rounded-lg border border-[#E6EAF0] bg-white px-2.5 py-1.5 text-sm hover:bg-[#F8FAFC]"
          >
            ›
          </button>
        </div>
        <span className="text-sm font-medium capitalize text-[#0A2540]">{titrePeriode}</span>
      </div>

      {loading ? (
        <p className="text-sm text-[#64748B]">Chargement…</p>
      ) : vue === "semaine" ? (
        <VueSemaine cursor={cursor} rdvDuJour={rdvDuJour} onOpen={ouvrirCompte} />
      ) : vue === "jour" ? (
        <VueJour rdvs={rdvDuJour(cursor)} onOpen={ouvrirCompte} />
      ) : (
        <VueMois cursor={cursor} rdvDuJour={rdvDuJour} onOpen={ouvrirCompte} />
      )}

      <p className="text-xs text-[#94A3B8]">
        Les rendez-vous proviennent des activités « RDV » enregistrées sur les comptes. Clique un RDV
        pour ouvrir le compte.
      </p>
    </div>
  );
}

function Carte({ r, onOpen }: { r: RdvWithClient; onOpen: (r: RdvWithClient) => void }) {
  return (
    <button
      onClick={() => onOpen(r)}
      className="w-full rounded-lg border border-[#CDE9ED] bg-[#F0FBFC] px-2 py-1.5 text-left text-xs hover:bg-[#E6F7F9]"
    >
      <div className="font-medium text-[#0B7A87]">{heure(new Date(r.occurred_at))}</div>
      <div className="truncate font-medium text-[#0A2540]">{nomCompte(r)}</div>
      {r.content && <div className="truncate text-[#64748B]">{r.content}</div>}
    </button>
  );
}

function VueSemaine({
  cursor,
  rdvDuJour,
  onOpen,
}: {
  cursor: Date;
  rdvDuJour: (j: Date) => RdvWithClient[];
  onOpen: (r: RdvWithClient) => void;
}) {
  const lun = mondayOf(cursor);
  const jours = Array.from({ length: 7 }, (_, i) => addDays(lun, i));
  const today = new Date();
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {jours.map((j) => {
        const list = rdvDuJour(j);
        const estAujourdhui = sameDay(j, today);
        return (
          <div
            key={j.toISOString()}
            className="flex w-44 flex-shrink-0 flex-col rounded-2xl border border-[#E6EAF0] bg-white p-2 shadow-sm"
          >
            <div
              className={`mb-2 rounded-lg px-2 py-1 text-center text-sm font-medium ${
                estAujourdhui ? "bg-[#14B8C4] text-[#04212e]" : "text-[#0A2540]"
              }`}
            >
              <div className="capitalize">{j.toLocaleDateString("fr-FR", { weekday: "short" })}</div>
              <div className="text-xs text-current opacity-80">
                {j.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              {list.length === 0 ? (
                <p className="py-2 text-center text-[11px] text-[#CBD5E1]">—</p>
              ) : (
                list.map((r) => <Carte key={r.id} r={r} onOpen={onOpen} />)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function VueJour({
  rdvs,
  onOpen,
}: {
  rdvs: RdvWithClient[];
  onOpen: (r: RdvWithClient) => void;
}) {
  return (
    <div className="space-y-2 rounded-2xl border border-[#E6EAF0] bg-white p-4 shadow-sm">
      {rdvs.length === 0 ? (
        <p className="py-6 text-center text-sm text-[#94A3B8]">Aucun rendez-vous ce jour-là.</p>
      ) : (
        rdvs.map((r) => (
          <button
            key={r.id}
            onClick={() => onOpen(r)}
            className="flex w-full items-center gap-3 rounded-xl border border-[#F0F2F6] px-3 py-2.5 text-left hover:bg-[#F8FAFC]"
          >
            <span className="w-14 shrink-0 text-sm font-semibold text-[#0B7A87]">
              {heure(new Date(r.occurred_at))}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-[#0A2540]">📅 {nomCompte(r)}</span>
              {r.content && <span className="block truncate text-xs text-[#64748B]">{r.content}</span>}
            </span>
          </button>
        ))
      )}
    </div>
  );
}

function VueMois({
  cursor,
  rdvDuJour,
  onOpen,
}: {
  cursor: Date;
  rdvDuJour: (j: Date) => RdvWithClient[];
  onOpen: (r: RdvWithClient) => void;
}) {
  const premier = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const debut = mondayOf(premier);
  const semaines = Array.from({ length: 6 }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => addDays(debut, w * 7 + d))
  );
  const today = new Date();
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-[#94A3B8]">
          {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
            <div key={d} className="py-1">
              {d}
            </div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {semaines.flat().map((j) => {
            const list = rdvDuJour(j);
            const horsMois = j.getMonth() !== cursor.getMonth();
            const estAujourdhui = sameDay(j, today);
            return (
              <div
                key={j.toISOString()}
                className={`min-h-[84px] rounded-lg border p-1 ${
                  horsMois ? "border-[#F0F2F6] bg-[#FBFCFE]" : "border-[#E6EAF0] bg-white"
                }`}
              >
                <div
                  className={`mb-1 text-right text-xs ${
                    estAujourdhui
                      ? "font-bold text-[#0B7A87]"
                      : horsMois
                      ? "text-[#CBD5E1]"
                      : "text-[#64748B]"
                  }`}
                >
                  {j.getDate()}
                </div>
                <div className="flex flex-col gap-1">
                  {list.slice(0, 3).map((r) => (
                    <button
                      key={r.id}
                      onClick={() => onOpen(r)}
                      className="truncate rounded bg-[#E6F7F9] px-1 py-0.5 text-left text-[10px] font-medium text-[#0B7A87] hover:bg-[#d4f0f3]"
                    >
                      {heure(new Date(r.occurred_at))} {nomCompte(r)}
                    </button>
                  ))}
                  {list.length > 3 && (
                    <span className="text-[10px] text-[#94A3B8]">+{list.length - 3}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
