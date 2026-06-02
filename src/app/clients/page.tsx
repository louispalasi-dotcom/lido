"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import {
  getClients,
  addClient,
  setClientStatus,
  removeClient,
  type Client,
  type Statut,
} from "@/lib/store";

const STATUTS: { val: Statut; label: string; classe: string }[] = [
  { val: "prospect", label: "Prospect", classe: "bg-[#EEF2F7] text-[#475569]" },
  { val: "client", label: "Client", classe: "bg-[#E6F7F9] text-[#0B7A87]" },
  { val: "a_renouveler", label: "À renouveler", classe: "bg-[#FFF3E6] text-[#B45309]" },
];

function badge(s: Statut) {
  return STATUTS.find((x) => x.val === s) ?? STATUTS[0];
}

function ClientsView() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtre, setFiltre] = useState<"tous" | Statut>("tous");

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState<Statut>("prospect");

  useEffect(() => {
    setClients(getClients());
    setLoading(false);
  }, []);

  function ajouter(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setClients(
      addClient({
        name: name.trim(),
        city: city.trim() || null,
        type: type.trim() || null,
        status,
      })
    );
    setName("");
    setCity("");
    setType("");
    setStatus("prospect");
  }

  function changerStatut(id: number, s: Statut) {
    setClients(setClientStatus(id, s));
  }

  function supprimer(id: number) {
    if (!confirm("Supprimer ce client ?")) return;
    setClients(removeClient(id));
  }

  const liste = filtre === "tous" ? clients : clients.filter((c) => c.status === filtre);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Clients & prospects</h2>

      <form
        onSubmit={ajouter}
        className="grid grid-cols-1 gap-3 rounded-2xl border border-[#E6EAF0] bg-white p-5 shadow-sm md:grid-cols-5"
      >
        <input
          className="rounded-lg border border-[#E6EAF0] px-3 py-2 text-sm md:col-span-2"
          placeholder="Nom du client *"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="rounded-lg border border-[#E6EAF0] px-3 py-2 text-sm"
          placeholder="Ville"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <input
          className="rounded-lg border border-[#E6EAF0] px-3 py-2 text-sm"
          placeholder="Type (ex. hôtel)"
          value={type}
          onChange={(e) => setType(e.target.value)}
        />
        <div className="flex gap-2">
          <select
            className="flex-1 rounded-lg border border-[#E6EAF0] px-2 py-2 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value as Statut)}
          >
            {STATUTS.map((s) => (
              <option key={s.val} value={s.val}>
                {s.label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-lg bg-[#14B8C4] px-4 py-2 text-sm font-medium text-[#04212e]"
          >
            Ajouter
          </button>
        </div>
      </form>

      <div className="flex flex-wrap gap-2 text-sm">
        {(["tous", "prospect", "client", "a_renouveler"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFiltre(f)}
            className={`rounded-full px-3 py-1 ${
              filtre === f ? "bg-[#0A2540] text-white" : "bg-white border border-[#E6EAF0]"
            }`}
          >
            {f === "tous" ? "Tous" : badge(f as Statut).label}
          </button>
        ))}
      </div>

      <section className="overflow-hidden rounded-2xl border border-[#E6EAF0] bg-white shadow-sm">
        {loading ? (
          <p className="p-5 text-sm text-[#64748B]">Chargement…</p>
        ) : liste.length === 0 ? (
          <p className="p-5 text-sm text-[#64748B]">Aucune fiche. Ajoute ton premier client ci-dessus 👆</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-[#94A3B8]">
              <tr>
                <th className="px-5 py-3 font-medium">Client</th>
                <th className="px-5 py-3 font-medium">Ville</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Statut</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {liste.map((c) => (
                <tr key={c.id} className="border-t border-[#F0F2F6]">
                  <td className="px-5 py-3 font-medium">{c.name}</td>
                  <td className="px-5 py-3 text-[#64748B]">{c.city ?? "—"}</td>
                  <td className="px-5 py-3 text-[#64748B]">{c.type ?? "—"}</td>
                  <td className="px-5 py-3">
                    <select
                      value={c.status}
                      onChange={(e) => changerStatut(c.id, e.target.value as Statut)}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${badge(c.status).classe}`}
                    >
                      {STATUTS.map((s) => (
                        <option key={s.val} value={s.val}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => supprimer(c.id)}
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
      <ClientsView />
    </AppShell>
  );
}
