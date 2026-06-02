"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import {
  getClients,
  addClient,
  setClientStatus,
  removeClient,
  updateClient,
  getClientInstallations,
  addInstallation,
  removeInstallation,
  nextMaintenance,
  getInterventions,
  type Client,
  type Statut,
  type Segment,
  type Installation,
  type Intervention,
} from "@/lib/store";

const STATUTS: { val: Statut; label: string; classe: string }[] = [
  { val: "prospect", label: "Prospect", classe: "bg-[#EEF2F7] text-[#475569]" },
  { val: "client", label: "Client", classe: "bg-[#E6F7F9] text-[#0B7A87]" },
  { val: "a_renouveler", label: "À renouveler", classe: "bg-[#FFF3E6] text-[#B45309]" },
];

function badge(s: Statut) {
  return STATUTS.find((x) => x.val === s) ?? STATUTS[0];
}

function segBadge(seg?: Segment) {
  return seg === "b2c"
    ? { label: "B2C", classe: "bg-[#F3E8FF] text-[#7E22CE]" }
    : { label: "B2B", classe: "bg-[#E6EDF7] text-[#1D4ED8]" };
}

// Affiche une date "2026-06-05" en "5 juin 2026". Renvoie "—" si vide.
function fmtDate(d: string | null): string {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function ClientsView() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtre, setFiltre] = useState<"tous" | Statut>("tous");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [type, setType] = useState("");
  const [segment, setSegment] = useState<Segment>("b2b");
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
        segment,
        status,
        phone: null,
        email: null,
        address: null,
        notes: null,
      })
    );
    setName("");
    setCity("");
    setType("");
    setSegment("b2b");
    setStatus("prospect");
  }

  function changerStatut(id: number, s: Statut) {
    setClients(setClientStatus(id, s));
  }

  function supprimer(id: number) {
    if (!confirm("Supprimer ce client ?")) return;
    setClients(removeClient(id));
    if (selectedId === id) setSelectedId(null);
  }

  const liste = filtre === "tous" ? clients : clients.filter((c) => c.status === filtre);
  const selected = clients.find((c) => c.id === selectedId) ?? null;

  if (selected) {
    return (
      <ClientDetail
        client={selected}
        onBack={() => setSelectedId(null)}
        onChange={() => setClients(getClients())}
        onDelete={() => supprimer(selected.id)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Clients &amp; prospects</h2>

      <form
        onSubmit={ajouter}
        className="grid grid-cols-1 gap-3 rounded-2xl border border-[#E6EAF0] bg-white p-5 shadow-sm md:grid-cols-6"
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
        <select
          className="rounded-lg border border-[#E6EAF0] px-2 py-2 text-sm"
          value={segment}
          onChange={(e) => setSegment(e.target.value as Segment)}
        >
          <option value="b2b">B2B (entreprise)</option>
          <option value="b2c">B2C (particulier)</option>
        </select>
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
                <th className="px-5 py-3 font-medium">Segment</th>
                <th className="px-5 py-3 font-medium">Statut</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {liste.map((c) => {
                const sb = segBadge(c.segment);
                return (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className="cursor-pointer border-t border-[#F0F2F6] hover:bg-[#F8FAFC]"
                  >
                    <td className="px-5 py-3 font-medium text-[#0A2540]">{c.name}</td>
                    <td className="px-5 py-3 text-[#64748B]">{c.city ?? "—"}</td>
                    <td className="px-5 py-3 text-[#64748B]">{c.type ?? "—"}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${sb.classe}`}>
                        {sb.label}
                      </span>
                    </td>
                    <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
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
                    <td className="px-5 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => supprimer(c.id)}
                        className="text-xs text-[#94A3B8] hover:text-red-600"
                      >
                        Supprimer
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

// ---------- Fiche client détaillée ----------

type TimelineEvent = {
  date: string | null;
  title: string;
  detail: string;
  dot: string; // couleur de la pastille
};

function ClientDetail({
  client,
  onBack,
  onChange,
  onDelete,
}: {
  client: Client;
  onBack: () => void;
  onChange: () => void;
  onDelete: () => void;
}) {
  const [installs, setInstalls] = useState<Installation[]>([]);
  const [interventions, setInterventions] = useState<Intervention[]>([]);

  // Édition des coordonnées
  const [edit, setEdit] = useState(false);
  const [phone, setPhone] = useState(client.phone ?? "");
  const [email, setEmail] = useState(client.email ?? "");
  const [address, setAddress] = useState(client.address ?? "");
  const [notes, setNotes] = useState(client.notes ?? "");

  // Ajout d'un produit installé
  const [model, setModel] = useState("");
  const [serial, setSerial] = useState("");
  const [installedAt, setInstalledAt] = useState("");
  const [warranty, setWarranty] = useState("24");
  const [freq, setFreq] = useState("12");

  useEffect(() => {
    setInstalls(getClientInstallations(client.id));
    setInterventions(getInterventions().filter((i) => i.client_id === client.id));
  }, [client.id]);

  function sauverCoordonnees() {
    updateClient(client.id, {
      phone: phone.trim() || null,
      email: email.trim() || null,
      address: address.trim() || null,
      notes: notes.trim() || null,
    });
    setEdit(false);
    onChange();
  }

  function ajouterProduit(e: React.FormEvent) {
    e.preventDefault();
    if (!model.trim()) return;
    addInstallation({
      client_id: client.id,
      model: model.trim(),
      serial: serial.trim() || null,
      installed_at: installedAt || null,
      warranty_months: warranty ? Number(warranty) : null,
      maintenance_months: freq ? Number(freq) : 12,
    });
    setInstalls(getClientInstallations(client.id));
    setModel("");
    setSerial("");
    setInstalledAt("");
    setWarranty("24");
    setFreq("12");
  }

  function supprimerProduit(id: number) {
    if (!confirm("Retirer ce produit installé ?")) return;
    removeInstallation(id);
    setInstalls(getClientInstallations(client.id));
  }

  // Construit la timeline : poses de produits + interventions, triées par date.
  const today = todayISO();
  const events: TimelineEvent[] = [
    ...installs.map((i) => ({
      date: i.installed_at,
      title: `Installation — ${i.model}`,
      detail: i.serial ? `N° de série ${i.serial}` : "Produit posé",
      dot: "bg-[#14B8C4]",
    })),
    ...interventions.map((i) => ({
      date: i.scheduled_at,
      title: i.type,
      detail: i.notes ?? (i.status === "faite" ? "Intervention réalisée" : "Intervention planifiée"),
      dot: i.status === "faite" ? "bg-[#15803D]" : "bg-[#B45309]",
    })),
  ].sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return a.date < b.date ? 1 : -1; // plus récent en haut
  });

  const sb = segBadge(client.segment);

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-sm text-[#0B7A87] hover:underline">
        ← Retour à la liste
      </button>

      {/* En-tête */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E6EAF0] bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0A2540] text-lg font-semibold text-white">
            {client.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#0A2540]">{client.name}</h2>
            <p className="text-sm text-[#64748B]">
              {client.type ?? "—"}
              {client.city ? ` · ${client.city}` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${sb.classe}`}>{sb.label}</span>
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${badge(client.status).classe}`}>
            {badge(client.status).label}
          </span>
          <button onClick={onDelete} className="text-xs text-[#94A3B8] hover:text-red-600">
            Supprimer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Coordonnées */}
        <section className="rounded-2xl border border-[#E6EAF0] bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-[#0A2540]">Coordonnées</h3>
            {!edit && (
              <button onClick={() => setEdit(true)} className="text-xs text-[#0B7A87] hover:underline">
                Modifier
              </button>
            )}
          </div>

          {edit ? (
            <div className="space-y-3">
              <input
                className="w-full rounded-lg border border-[#E6EAF0] px-3 py-2 text-sm"
                placeholder="Téléphone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <input
                className="w-full rounded-lg border border-[#E6EAF0] px-3 py-2 text-sm"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                className="w-full rounded-lg border border-[#E6EAF0] px-3 py-2 text-sm"
                placeholder="Adresse"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
              <textarea
                className="w-full rounded-lg border border-[#E6EAF0] px-3 py-2 text-sm"
                placeholder="Notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  onClick={sauverCoordonnees}
                  className="rounded-lg bg-[#14B8C4] px-4 py-2 text-sm font-medium text-[#04212e]"
                >
                  Enregistrer
                </button>
                <button
                  onClick={() => setEdit(false)}
                  className="rounded-lg border border-[#E6EAF0] px-4 py-2 text-sm"
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <dl className="space-y-2 text-sm">
              <Row label="Téléphone" value={client.phone} />
              <Row label="Email" value={client.email} />
              <Row label="Adresse" value={client.address} />
              <Row label="Notes" value={client.notes} />
            </dl>
          )}
        </section>

        {/* Produits installés */}
        <section className="rounded-2xl border border-[#E6EAF0] bg-white p-5 shadow-sm">
          <h3 className="mb-4 font-semibold text-[#0A2540]">
            Produits installés <span className="text-[#94A3B8]">({installs.length})</span>
          </h3>

          {installs.length === 0 ? (
            <p className="mb-4 text-sm text-[#64748B]">Aucun produit installé pour le moment.</p>
          ) : (
            <ul className="mb-4 space-y-3">
              {installs.map((i) => {
                const nm = nextMaintenance(i);
                const enRetard = nm !== null && nm < today;
                return (
                  <li key={i.id} className="rounded-xl border border-[#F0F2F6] p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-[#0A2540]">{i.model}</p>
                        <p className="text-xs text-[#94A3B8]">
                          {i.serial ? `N° ${i.serial} · ` : ""}Posé le {fmtDate(i.installed_at)}
                          {i.warranty_months ? ` · garantie ${i.warranty_months} mois` : ""}
                        </p>
                      </div>
                      <button
                        onClick={() => supprimerProduit(i.id)}
                        className="text-xs text-[#94A3B8] hover:text-red-600"
                      >
                        Retirer
                      </button>
                    </div>
                    <p className="mt-2 text-xs">
                      <span className="text-[#64748B]">Prochain entretien : </span>
                      <span
                        className={`rounded-full px-2 py-0.5 font-medium ${
                          enRetard
                            ? "bg-[#FDECEC] text-[#B91C1C]"
                            : "bg-[#E6F7F9] text-[#0B7A87]"
                        }`}
                      >
                        {fmtDate(nm)}
                        {enRetard ? " · en retard" : ""}
                      </span>
                    </p>
                  </li>
                );
              })}
            </ul>
          )}

          <form onSubmit={ajouterProduit} className="space-y-2 border-t border-[#F0F2F6] pt-4">
            <p className="text-xs font-medium uppercase text-[#94A3B8]">Ajouter un produit</p>
            <input
              className="w-full rounded-lg border border-[#E6EAF0] px-3 py-2 text-sm"
              placeholder="Modèle * (ex. Osmoseur Aqua Pro 5)"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                className="rounded-lg border border-[#E6EAF0] px-3 py-2 text-sm"
                placeholder="N° de série"
                value={serial}
                onChange={(e) => setSerial(e.target.value)}
              />
              <input
                type="date"
                className="rounded-lg border border-[#E6EAF0] px-3 py-2 text-sm"
                value={installedAt}
                onChange={(e) => setInstalledAt(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2 text-xs text-[#64748B]">
                Garantie
                <input
                  type="number"
                  className="w-full rounded-lg border border-[#E6EAF0] px-2 py-2 text-sm"
                  value={warranty}
                  onChange={(e) => setWarranty(e.target.value)}
                />
                mois
              </label>
              <label className="flex items-center gap-2 text-xs text-[#64748B]">
                Entretien tous les
                <input
                  type="number"
                  className="w-full rounded-lg border border-[#E6EAF0] px-2 py-2 text-sm"
                  value={freq}
                  onChange={(e) => setFreq(e.target.value)}
                />
                mois
              </label>
            </div>
            <button
              type="submit"
              className="rounded-lg bg-[#14B8C4] px-4 py-2 text-sm font-medium text-[#04212e]"
            >
              Ajouter le produit
            </button>
          </form>
        </section>
      </div>

      {/* Historique / timeline */}
      <section className="rounded-2xl border border-[#E6EAF0] bg-white p-5 shadow-sm">
        <h3 className="mb-4 font-semibold text-[#0A2540]">Historique</h3>
        {events.length === 0 ? (
          <p className="text-sm text-[#64748B]">
            Rien pour l&apos;instant. Les poses de produits et les interventions apparaîtront ici.
          </p>
        ) : (
          <ol className="relative space-y-5 border-l border-[#E6EAF0] pl-5">
            {events.map((ev, idx) => (
              <li key={idx} className="relative">
                <span
                  className={`absolute -left-[26px] top-1 h-3 w-3 rounded-full ring-4 ring-white ${ev.dot}`}
                />
                <p className="text-sm font-medium text-[#0A2540]">{ev.title}</p>
                <p className="text-xs text-[#94A3B8]">{fmtDate(ev.date)}</p>
                <p className="mt-0.5 text-sm text-[#64748B]">{ev.detail}</p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-[#94A3B8]">{label}</dt>
      <dd className="text-right text-[#0A2540]">{value || "—"}</dd>
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
