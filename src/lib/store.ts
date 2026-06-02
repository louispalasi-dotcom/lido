// Magasin de données local (démo) — tout est stocké dans le navigateur
// (localStorage). Aucune base externe nécessaire : l'app fonctionne seule.
// La version "production" branchera Supabase à la place (voir CLAUDE.md).

export type Statut = "prospect" | "client" | "a_renouveler";

export type Client = {
  id: number;
  name: string;
  city: string | null;
  type: string | null;
  status: Statut;
};

export type Intervention = {
  id: number;
  client_id: number | null;
  type: string;
  scheduled_at: string | null;
  status: "planifiee" | "faite";
  notes: string | null;
};

const K_CLIENTS = "lido-clients";
const K_INTERV = "lido-interventions";

const SEED_CLIENTS: Client[] = [
  { id: 1, name: "Brasserie du Port", city: "Marseille", type: "Restaurant", status: "client" },
  { id: 2, name: "Clinique Saint-Roch", city: "Montpellier", type: "Santé", status: "a_renouveler" },
  { id: 3, name: "Hôtel Belvédère", city: "Nice", type: "Hôtel", status: "client" },
  { id: 4, name: "Boulangerie Lemaire", city: "Aix-en-Provence", type: "Commerce", status: "prospect" },
  { id: 5, name: "Camping Les Pins", city: "Fréjus", type: "Tourisme", status: "client" },
];

const SEED_INTERV: Intervention[] = [
  { id: 1, client_id: 1, type: "Maintenance", scheduled_at: "2026-06-10", status: "planifiee", notes: null },
  { id: 2, client_id: 3, type: "Changement de filtre", scheduled_at: "2026-06-12", status: "planifiee", notes: null },
  { id: 3, client_id: 2, type: "Installation", scheduled_at: "2026-05-20", status: "faite", notes: "Osmoseur posé" },
];

function read<T>(key: string, seed: T[]): T[] {
  if (typeof window === "undefined") return seed;
  const raw = localStorage.getItem(key);
  if (!raw) {
    localStorage.setItem(key, JSON.stringify(seed));
    return seed;
  }
  try {
    return JSON.parse(raw) as T[];
  } catch {
    return seed;
  }
}

function write<T>(key: string, val: T[]) {
  if (typeof window !== "undefined") localStorage.setItem(key, JSON.stringify(val));
}

function nextId(rows: { id: number }[]) {
  return rows.reduce((m, r) => Math.max(m, r.id), 0) + 1;
}

// ---- Clients ----
export function getClients(): Client[] {
  return read<Client>(K_CLIENTS, SEED_CLIENTS);
}

export function addClient(data: Omit<Client, "id">): Client[] {
  const rows = getClients();
  rows.unshift({ ...data, id: nextId(rows) });
  write(K_CLIENTS, rows);
  return rows;
}

export function setClientStatus(id: number, status: Statut): Client[] {
  const rows = getClients().map((c) => (c.id === id ? { ...c, status } : c));
  write(K_CLIENTS, rows);
  return rows;
}

export function removeClient(id: number): Client[] {
  const rows = getClients().filter((c) => c.id !== id);
  write(K_CLIENTS, rows);
  return rows;
}

// ---- Interventions ----
export function getInterventions(): Intervention[] {
  return read<Intervention>(K_INTERV, SEED_INTERV);
}

export function addIntervention(data: Omit<Intervention, "id">): Intervention[] {
  const rows = getInterventions();
  rows.push({ ...data, id: nextId(rows) });
  write(K_INTERV, rows);
  return rows;
}

export function setInterventionDone(id: number): Intervention[] {
  const rows = getInterventions().map((i) =>
    i.id === id ? { ...i, status: "faite" as const } : i
  );
  write(K_INTERV, rows);
  return rows;
}

export function removeIntervention(id: number): Intervention[] {
  const rows = getInterventions().filter((i) => i.id !== id);
  write(K_INTERV, rows);
  return rows;
}

// Nom du client associé à une intervention (pour l'affichage).
export function clientName(clients: Client[], id: number | null): string {
  if (id === null) return "—";
  return clients.find((c) => c.id === id)?.name ?? "—";
}
