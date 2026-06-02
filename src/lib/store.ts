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
  // Champs détaillés (fiche client) — optionnels pour rester compatible
  // avec d'anciennes données déjà enregistrées dans le navigateur.
  segment?: Segment;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
};

// Produit installé chez un client (osmoseur, adoucisseur, fontaine…).
// Le prochain entretien est calculé automatiquement à partir de la date de
// pose + la fréquence d'entretien (voir nextMaintenance).
export type Installation = {
  id: number;
  client_id: number;
  model: string;
  serial: string | null;
  installed_at: string | null; // date de pose (AAAA-MM-JJ)
  warranty_months: number | null; // durée de garantie en mois
  maintenance_months: number; // fréquence d'entretien en mois (12 par défaut)
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
const K_INSTALL = "lido-installations";

const SEED_CLIENTS: Client[] = [
  { id: 1, name: "Brasserie du Port", city: "Marseille", type: "Restaurant", status: "client", segment: "b2b", phone: "04 91 00 11 22", email: "contact@brasserie-port.fr", address: "12 quai du Port, 13002 Marseille", notes: "4 fontaines à eau en salle." },
  { id: 2, name: "Clinique Saint-Roch", city: "Montpellier", type: "Santé", status: "a_renouveler", segment: "b2b", phone: "04 67 00 33 44", email: "technique@clinique-stroch.fr", address: "8 rue Saint-Roch, 34000 Montpellier", notes: "Contrat d'entretien à renouveler avant l'été." },
  { id: 3, name: "Hôtel Belvédère", city: "Nice", type: "Hôtel", status: "client", segment: "b2b", phone: "04 93 00 55 66", email: "accueil@hotel-belvedere.fr", address: "25 promenade des Anglais, 06000 Nice", notes: null },
  { id: 4, name: "Boulangerie Lemaire", city: "Aix-en-Provence", type: "Commerce", status: "prospect", segment: "b2b", phone: "04 42 00 77 88", email: null, address: "3 cours Mirabeau, 13100 Aix-en-Provence", notes: "Devis adoucisseur en cours." },
  { id: 5, name: "Camping Les Pins", city: "Fréjus", type: "Tourisme", status: "client", segment: "b2b", phone: "04 94 00 99 00", email: "direction@camping-lespins.fr", address: "Route de Bagnols, 83600 Fréjus", notes: null },
];

const SEED_INSTALL: Installation[] = [
  { id: 1, client_id: 1, model: "Osmoseur Aqua Pro 5", serial: "AP5-2024-0142", installed_at: "2025-06-05", warranty_months: 24, maintenance_months: 12 },
  { id: 2, client_id: 1, model: "Fontaine réseau Fresh'In", serial: "FI-2025-0088", installed_at: "2025-09-12", warranty_months: 12, maintenance_months: 6 },
  { id: 3, client_id: 2, model: "Adoucisseur Calc'Stop 30L", serial: "CS30-2023-0410", installed_at: "2023-05-18", warranty_months: 36, maintenance_months: 12 },
  { id: 4, client_id: 3, model: "Osmoseur Aqua Pro 8", serial: "AP8-2025-0033", installed_at: "2025-11-02", warranty_months: 24, maintenance_months: 12 },
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

// Met à jour les coordonnées / infos d'un client (fiche détaillée).
export function updateClient(
  id: number,
  data: Partial<Omit<Client, "id">>
): Client[] {
  const rows = getClients().map((c) => (c.id === id ? { ...c, ...data } : c));
  write(K_CLIENTS, rows);
  return rows;
}

export function getClient(id: number): Client | undefined {
  return getClients().find((c) => c.id === id);
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

// ---- Installations (produits installés chez le client) ----
export function getInstallations(): Installation[] {
  return read<Installation>(K_INSTALL, SEED_INSTALL);
}

export function getClientInstallations(clientId: number): Installation[] {
  return getInstallations().filter((i) => i.client_id === clientId);
}

export function addInstallation(data: Omit<Installation, "id">): Installation[] {
  const rows = getInstallations();
  rows.push({ ...data, id: nextId(rows) });
  write(K_INSTALL, rows);
  return rows;
}

export function removeInstallation(id: number): Installation[] {
  const rows = getInstallations().filter((i) => i.id !== id);
  write(K_INSTALL, rows);
  return rows;
}

// Calcule la date du prochain entretien : date de pose + fréquence (en mois).
// Renvoie null si on ne connaît pas la date de pose.
export function nextMaintenance(inst: Installation): string | null {
  if (!inst.installed_at) return null;
  const d = new Date(inst.installed_at);
  if (isNaN(d.getTime())) return null;
  d.setMonth(d.getMonth() + (inst.maintenance_months || 12));
  return d.toISOString().slice(0, 10);
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

// ---- Leads (contacts non qualifiés) ----
export type LeadStatus =
  | "nouveau"
  | "contacte"
  | "a_relancer"
  | "qualifie"
  | "converti"
  | "perdu";

export type Lead = {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  source: string | null;
  segment: Segment;
  status: LeadStatus;
  notes: string | null;
};

export const LEAD_STATUTS: { val: LeadStatus; label: string; classe: string }[] = [
  { val: "nouveau", label: "Nouveau", classe: "bg-[#EEF2F7] text-[#475569]" },
  { val: "contacte", label: "Contacté", classe: "bg-[#E6EDF7] text-[#1D4ED8]" },
  { val: "a_relancer", label: "À relancer", classe: "bg-[#FFF3E6] text-[#B45309]" },
  { val: "qualifie", label: "Qualifié", classe: "bg-[#E6F7F9] text-[#0B7A87]" },
  { val: "converti", label: "Converti", classe: "bg-[#E7F8EE] text-[#15803D]" },
  { val: "perdu", label: "Perdu", classe: "bg-[#F3F4F6] text-[#9CA3AF]" },
];

const K_LEADS = "lido-leads";

const SEED_LEADS: Lead[] = [
  { id: 1, name: "Restaurant Le Phare", phone: "04 91 00 11 22", email: "contact@lephare.fr", source: "Salon pro", segment: "b2b", status: "nouveau", notes: null },
  { id: 2, name: "Famille Morel", phone: "06 12 34 56 78", email: "morel@email.fr", source: "Site web", segment: "b2c", status: "contacte", notes: "Intéressée par un adoucisseur" },
  { id: 3, name: "Garage Central", phone: "04 92 11 22 33", email: null, source: "Recommandation", segment: "b2b", status: "a_relancer", notes: null },
  { id: 4, name: "M. et Mme Robin", phone: "06 98 76 54 32", email: "robin@email.fr", source: "Pub locale", segment: "b2c", status: "nouveau", notes: null },
];

export function getLeads(): Lead[] {
  return read<Lead>(K_LEADS, SEED_LEADS);
}

export function addLead(data: Omit<Lead, "id">): Lead[] {
  const rows = getLeads();
  rows.unshift({ ...data, id: nextId(rows) });
  write(K_LEADS, rows);
  return rows;
}

export function setLeadStatus(id: number, status: LeadStatus): Lead[] {
  const rows = getLeads().map((l) => (l.id === id ? { ...l, status } : l));
  write(K_LEADS, rows);
  return rows;
}

export function removeLead(id: number): Lead[] {
  const rows = getLeads().filter((l) => l.id !== id);
  write(K_LEADS, rows);
  return rows;
}

// Convertit un lead en opportunité (alimente le pipeline) et marque le lead "converti".
export function convertLeadToOpportunity(id: number): Lead[] {
  const lead = getLeads().find((l) => l.id === id);
  if (lead) {
    addOpportunity({
      title: lead.name,
      segment: lead.segment,
      amount: 0,
      probability: 20,
      expected_date: null,
      stage: "nouveau",
      owner: "—",
    });
  }
  return setLeadStatus(id, "converti");
}
