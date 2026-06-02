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

// ---- Opportunités (pipeline commercial) ----
export type Segment = "b2b" | "b2c";
export type Stage =
  | "nouveau"
  | "qualification"
  | "rdv"
  | "audit"
  | "devis"
  | "negociation"
  | "signe"
  | "perdu";

export type Opportunity = {
  id: number;
  title: string; // nom de l'affaire / du client
  segment: Segment;
  amount: number; // montant estimé en €
  probability: number; // probabilité de signature en %
  expected_date: string | null;
  stage: Stage;
  owner: string; // Aqualiste responsable
};

export const STAGES: { val: Stage; label: string }[] = [
  { val: "nouveau", label: "Nouveau" },
  { val: "qualification", label: "Qualification" },
  { val: "rdv", label: "Rendez-vous" },
  { val: "audit", label: "Audit" },
  { val: "devis", label: "Devis envoyé" },
  { val: "negociation", label: "Négociation" },
  { val: "signe", label: "Signé" },
  { val: "perdu", label: "Perdu" },
];

const K_OPP = "lido-opportunities";

const SEED_OPP: Opportunity[] = [
  { id: 1, title: "Hôtel Belvédère — osmose cuisine", segment: "b2b", amount: 8200, probability: 60, expected_date: "2026-07-15", stage: "rdv", owner: "Camille" },
  { id: 2, title: "M. Durand — adoucisseur maison", segment: "b2c", amount: 2400, probability: 80, expected_date: "2026-06-20", stage: "devis", owner: "Yanis" },
  { id: 3, title: "Clinique Saint-Roch — contrat entretien", segment: "b2b", amount: 14500, probability: 40, expected_date: "2026-08-01", stage: "qualification", owner: "Camille" },
  { id: 4, title: "Brasserie du Port — fontaines x4", segment: "b2b", amount: 5600, probability: 90, expected_date: "2026-06-30", stage: "negociation", owner: "Yanis" },
  { id: 5, title: "Mme Petit — filtration evier", segment: "b2c", amount: 900, probability: 100, expected_date: "2026-05-28", stage: "signe", owner: "Camille" },
  { id: 6, title: "Camping Les Pins — réseau eau", segment: "b2b", amount: 11200, probability: 20, expected_date: "2026-09-10", stage: "nouveau", owner: "Yanis" },
];

export function getOpportunities(): Opportunity[] {
  return read<Opportunity>(K_OPP, SEED_OPP);
}

export function addOpportunity(data: Omit<Opportunity, "id">): Opportunity[] {
  const rows = getOpportunities();
  rows.unshift({ ...data, id: nextId(rows) });
  write(K_OPP, rows);
  return rows;
}

export function setOpportunityStage(id: number, stage: Stage): Opportunity[] {
  const rows = getOpportunities().map((o) => (o.id === id ? { ...o, stage } : o));
  write(K_OPP, rows);
  return rows;
}

export function removeOpportunity(id: number): Opportunity[] {
  const rows = getOpportunities().filter((o) => o.id !== id);
  write(K_OPP, rows);
  return rows;
}
