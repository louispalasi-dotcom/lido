"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import {
  getClients,
  getInterventions,
  addIntervention,
  setInterventionDone,
  removeIntervention,
  clientName,
  type Client,
  type Intervention,
} from "@/lib/store";

const TYPES = ["Installation", "Maintenance", "Dépannage", "Changement de filtre", "Contrôle qualité eau"];

function InterventionsView() {
  const [items, setItems] = useState<Intervention[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const [clientId, setClientId] = useState<string>("");
  const [type, setType] = useState(TYPES[0]);
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    setItems(getInterventions());
    setClients(getClients());
    setLoading(false);
  }, []);

  function ajouter(e: React.FormEvent) {
    e.preventDefault();
    setItems(
      addIntervention({
        client_id: clientId ? Number(clientId) : null,
        type,
        scheduled_at: date || null,
        notes: notes.trim() || null,
        status: "planifiee",
      })
    );
    setClientId("");
    setType(TYPES[0]);
    setDate("");
    setNotes("");
  }

  function marquerFaite(id: number) {
    setItems(setInterventionDone(id));
  }

  function supprimer(id: number) {
    if (!confirm("Supprimer cette intervention ?")) return;
    setItems(removeIntervention(id));
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Interventions techniques</h2>

      <form
        onSubmit={ajouter}
        className="grid grid-cols-1 gap-3 rounded-2xl border border-[#E6EAF0] bg-white p-5 shadow-sm md:grid-cols-5"
      >
        <select
          className="rounded-lg border border-[#E6EAF0] px-3 py-2 text-sm"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
        >
          <option value="">Client (optionnel)</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          className="rounded-lg border border-[#E6EAF0] px-3 py-2 text-sm"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input
          type="date"
          className="rounded-lg border border-[#E6EAF0] px-3 py-2 text-sm"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <input
          className="rounded-lg border border-[#E6EAF0] px-3 py-2 text-sm"
          placeholder="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <button
          type="submit"
          className="rounded-lg bg-[#14B8C4] px-4 py-2 text-sm font-medium text-[#04212e]"
        >
          Planifier
        </button>
      </form>

      <section className="overflow-hidden rounded-2xl border border-[#E6EAF0] bg-white shadow-sm">
        {loading ? (
          <p className="p-5 text-sm text-[#64748B]">Chargement…</p>
        ) : items.length === 0 ? (
          <p className="p-5 text-sm text-[#64748B]">
            Aucune intervention. Planifie la première ci-dessus 👆
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-[#94A3B8]">
              <tr>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Client</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Statut</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id} className="border-t border-[#F0F2F6]">
                  <td className="px-5 py-3 font-medium">{i.type}</td>
                  <td className="px-5 py-3 text-[#64748B]">{clientName(clients, i.client_id)}</td>
                  <td className="px-5 py-3 text-[#64748B]">{i.scheduled_at ?? "—"}</td>
                  <td className="px-5 py-3">
                    {i.status === "faite" ? (
                      <span className="rounded-full bg-[#E6F7F9] px-2.5 py-1 text-xs font-medium text-[#0B7A87]">
                        Faite
                      </span>
                    ) : (
                      <span className="rounded-full bg-[#EEF2F7] px-2.5 py-1 text-xs font-medium text-[#475569]">
                        Planifiée
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {i.status !== "faite" && (
                      <button
                        onClick={() => marquerFaite(i.id)}
                        className="mr-3 text-xs font-medium text-[#0B7A87] hover:underline"
                      >
                        Marquer faite
                      </button>
                    )}
                    <button
                      onClick={() => supprimer(i.id)}
                      className="text-xs text-[#94A3B8] hover:text-red-600"
                    >
                      Supprimer
                    </button>
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
      <InterventionsView />
    </AppShell>
  );
}
