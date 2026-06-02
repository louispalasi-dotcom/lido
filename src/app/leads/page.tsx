"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import {
  getLeads,
  addLead,
  setLeadStatus,
  removeLead,
  convertLeadToOpportunity,
  LEAD_STATUTS,
  type Lead,
  type LeadStatus,
  type Segment,
} from "@/lib/store";

function badge(s: LeadStatus) {
  return LEAD_STATUTS.find((x) => x.val === s) ?? LEAD_STATUTS[0];
}

function LeadsView() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [source, setSource] = useState("");
  const [segment, setSegment] = useState<Segment>("b2b");

  useEffect(() => {
    setLeads(getLeads());
    setLoading(false);
  }, []);

  function ajouter(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLeads(
      addLead({
        name: name.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
        source: source.trim() || null,
        segment,
        status: "nouveau",
        notes: null,
      })
    );
    setName("");
    setPhone("");
    setEmail("");
    setSource("");
    setSegment("b2b");
  }

  function changerStatut(id: number, s: LeadStatus) {
    setLeads(setLeadStatus(id, s));
  }

  function convertir(id: number, nom: string) {
    setLeads(convertLeadToOpportunity(id));
    setInfo(`« ${nom} » a été converti en opportunité → visible dans le Pipeline.`);
  }

  function supprimer(id: number) {
    if (!confirm("Supprimer ce lead ?")) return;
    setLeads(removeLead(id));
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Leads (prospects à qualifier)</h2>

      <form
        onSubmit={ajouter}
        className="grid grid-cols-1 gap-3 rounded-2xl border border-[#E6EAF0] bg-white p-5 shadow-sm md:grid-cols-6"
      >
        <input
          className="rounded-lg border border-[#E6EAF0] px-3 py-2 text-sm md:col-span-2"
          placeholder="Nom du lead *"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="rounded-lg border border-[#E6EAF0] px-3 py-2 text-sm"
          placeholder="Téléphone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <input
          className="rounded-lg border border-[#E6EAF0] px-3 py-2 text-sm"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="rounded-lg border border-[#E6EAF0] px-3 py-2 text-sm"
          placeholder="Source"
          value={source}
          onChange={(e) => setSource(e.target.value)}
        />
        <div className="flex gap-2">
          <select
            className="flex-1 rounded-lg border border-[#E6EAF0] px-2 py-2 text-sm"
            value={segment}
            onChange={(e) => setSegment(e.target.value as Segment)}
          >
            <option value="b2b">B2B</option>
            <option value="b2c">B2C</option>
          </select>
          <button
            type="submit"
            className="rounded-lg bg-[#14B8C4] px-4 py-2 text-sm font-medium text-[#04212e]"
          >
            +
          </button>
        </div>
      </form>

      {info && (
        <div className="rounded-xl border border-[#BBE7CB] bg-[#E7F8EE] px-4 py-3 text-sm text-[#15803D]">
          ✅ {info}
        </div>
      )}

      <section className="overflow-x-auto rounded-2xl border border-[#E6EAF0] bg-white shadow-sm">
        {loading ? (
          <p className="p-5 text-sm text-[#64748B]">Chargement…</p>
        ) : leads.length === 0 ? (
          <p className="p-5 text-sm text-[#64748B]">Aucun lead. Ajoute le premier ci-dessus 👆</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-[#94A3B8]">
              <tr>
                <th className="px-5 py-3 font-medium">Lead</th>
                <th className="px-5 py-3 font-medium">Contact</th>
                <th className="px-5 py-3 font-medium">Segment</th>
                <th className="px-5 py-3 font-medium">Source</th>
                <th className="px-5 py-3 font-medium">Statut</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id} className="border-t border-[#F0F2F6] align-top">
                  <td className="px-5 py-3 font-medium">{l.name}</td>
                  <td className="px-5 py-3 text-[#64748B]">
                    <div className="flex flex-col gap-1">
                      {l.phone && (
                        <a href={`tel:${l.phone}`} className="text-[#0B7A87] hover:underline">
                          📞 {l.phone}
                        </a>
                      )}
                      {l.email && (
                        <a href={`mailto:${l.email}`} className="text-[#0B7A87] hover:underline">
                          ✉️ {l.email}
                        </a>
                      )}
                      {!l.phone && !l.email && <span>—</span>}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                        l.segment === "b2b"
                          ? "bg-[#E6EDF7] text-[#1D4ED8]"
                          : "bg-[#E6F7F9] text-[#0B7A87]"
                      }`}
                    >
                      {l.segment}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-[#64748B]">{l.source ?? "—"}</td>
                  <td className="px-5 py-3">
                    <select
                      value={l.status}
                      onChange={(e) => changerStatut(l.id, e.target.value as LeadStatus)}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${badge(l.status).classe}`}
                    >
                      {LEAD_STATUTS.map((s) => (
                        <option key={s.val} value={s.val}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {l.status !== "converti" ? (
                        <button
                          onClick={() => convertir(l.id, l.name)}
                          className="rounded-lg bg-[#0A2540] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#0c3358]"
                        >
                          Convertir en opportunité
                        </button>
                      ) : (
                        <span className="text-xs text-[#15803D]">déjà converti</span>
                      )}
                      <button
                        onClick={() => supprimer(l.id)}
                        className="text-xs text-[#94A3B8] hover:text-red-600"
                      >
                        Suppr.
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

export default function Page() {
  return (
    <AppShell>
      <LeadsView />
    </AppShell>
  );
}
