// Accès aux leads dans Supabase (vraie base de données en ligne).
// Toutes ces fonctions exigent d'être CONNECTÉ : la table leads est protégée
// par RLS (politiques réservées au rôle "authenticated"). Voir la migration
// create_leads_table.
import { supabase } from "./supabase";

export type Segment = "b2b" | "b2c";

export type LeadStatus =
  | "nouveau"
  | "contacte"
  | "a_relancer"
  | "qualifie"
  | "converti"
  | "perdu";

export type Origin =
  | "salon"
  | "connaissance"
  | "prospection_physique"
  | "prospection_digitale"
  | "lead_internet";

export type Lead = {
  id: number;
  created_at: string;
  organization_id: number;
  segment: Segment;
  status: LeadStatus;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  siret: string | null;
  phone: string | null;
  email: string | null;
  addr_number: string | null;
  addr_street_type: string | null;
  addr_street_name: string | null;
  postal_code: string | null;
  city: string | null;
  country: string | null;
  sales_rep: string | null;
  installer: string | null;
  origin: Origin | null;
};

// Données envoyées à la création (id, created_at et status sont gérés par la base).
export type NewLead = Omit<Lead, "id" | "created_at" | "organization_id" | "status"> & {
  status?: LeadStatus;
};

export const LEAD_STATUTS: { val: LeadStatus; label: string; classe: string }[] = [
  { val: "nouveau", label: "Nouveau", classe: "bg-[#EEF2F7] text-[#475569]" },
  { val: "contacte", label: "Contacté", classe: "bg-[#E6EDF7] text-[#1D4ED8]" },
  { val: "a_relancer", label: "À relancer", classe: "bg-[#FFF3E6] text-[#B45309]" },
  { val: "qualifie", label: "Qualifié", classe: "bg-[#E6F7F9] text-[#0B7A87]" },
  { val: "converti", label: "Converti", classe: "bg-[#E7F8EE] text-[#15803D]" },
  { val: "perdu", label: "Perdu", classe: "bg-[#F3F4F6] text-[#9CA3AF]" },
];

export const ORIGINS: { val: Origin; label: string }[] = [
  { val: "salon", label: "Salon" },
  { val: "connaissance", label: "Connaissance" },
  { val: "prospection_physique", label: "Prospection physique" },
  { val: "prospection_digitale", label: "Prospection digitale" },
  { val: "lead_internet", label: "Lead internet" },
];

export const STREET_TYPES = [
  "rue",
  "avenue",
  "boulevard",
  "impasse",
  "chemin",
  "route",
  "place",
  "allée",
  "cours",
  "quai",
];

// Nom affiché : la société pour un pro, sinon prénom + nom pour un particulier.
export function leadDisplayName(l: Lead): string {
  if (l.segment === "b2b") return l.company_name || "Société sans nom";
  const full = [l.first_name, l.last_name].filter(Boolean).join(" ").trim();
  return full || "Particulier sans nom";
}

export function originLabel(o: Origin | null): string {
  return ORIGINS.find((x) => x.val === o)?.label ?? "—";
}

export function leadBadge(s: LeadStatus) {
  return LEAD_STATUTS.find((x) => x.val === s) ?? LEAD_STATUTS[0];
}

// ---- Requêtes ----
export async function listLeads(): Promise<Lead[]> {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Lead[];
}

export async function createLead(data: NewLead): Promise<Lead> {
  const { data: row, error } = await supabase
    .from("leads")
    .insert({ ...data, status: data.status ?? "nouveau" })
    .select()
    .single();
  if (error) throw error;
  return row as Lead;
}

export async function updateLeadStatus(id: number, status: LeadStatus): Promise<void> {
  const { error } = await supabase.from("leads").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function deleteLead(id: number): Promise<void> {
  const { error } = await supabase.from("leads").delete().eq("id", id);
  if (error) throw error;
}
