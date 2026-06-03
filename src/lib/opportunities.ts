// Accès aux opportunités dans Supabase (rattachées à un compte client).
// Table protégée par RLS "connecté uniquement".
import { supabase } from "./supabase";
import { updateClient } from "./clients";

export type Segment = "b2b" | "b2c";
export type Temperature = "chaud" | "tiede" | "froid";

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
  created_at: string;
  client_id: number | null;
  title: string;
  segment: Segment;
  amount: number;
  probability: number;
  expected_date: string | null;
  stage: Stage;
  owner: string | null;
  water_context: string | null;
  quote_value: number;
  temperature: Temperature | null;
  current_solution: string | null;
};

export type NewOpportunity = {
  client_id?: number | null;
  title: string;
  segment: Segment;
  amount?: number;
  probability?: number;
  expected_date?: string | null;
  stage?: Stage;
  owner?: string | null;
  water_context?: string | null;
  quote_value?: number;
  temperature?: Temperature | null;
  current_solution?: string | null;
};

// Date prévisionnelle par défaut : aujourd'hui + 2 mois (échéance de l'opportunité).
export function defaultExpectedDate(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 2);
  return d.toISOString().slice(0, 10);
}

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

export async function listOpportunities(): Promise<Opportunity[]> {
  const { data, error } = await supabase
    .from("opportunities")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Opportunity[];
}

export async function listOpportunitiesByClient(clientId: number): Promise<Opportunity[]> {
  const { data, error } = await supabase
    .from("opportunities")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Opportunity[];
}

export async function createOpportunity(data: NewOpportunity): Promise<Opportunity> {
  const { data: row, error } = await supabase
    .from("opportunities")
    .insert({
      stage: "nouveau",
      amount: 0,
      probability: 20,
      quote_value: 0,
      ...data,
    })
    .select()
    .single();
  if (error) throw error;
  return row as Opportunity;
}

export async function setOpportunityStage(id: number, stage: Stage): Promise<void> {
  const { error } = await supabase.from("opportunities").update({ stage }).eq("id", id);
  if (error) throw error;
}

// ---- État de haut niveau, réconcilié avec les étapes du pipeline ----
// gagné = étape "Signé" · perdu = étape "Perdu" · en cours = toute autre étape.
export type Etat = "en_cours" | "gagne" | "perdu";

export const ETATS: { val: Etat; label: string; classe: string }[] = [
  { val: "en_cours", label: "En cours", classe: "bg-[#EEF2F7] text-[#475569]" },
  { val: "gagne", label: "Gagné", classe: "bg-[#E7F8EE] text-[#15803D]" },
  { val: "perdu", label: "Perdu", classe: "bg-[#F3F4F6] text-[#9CA3AF]" },
];

export function etatOf(stage: Stage): Etat {
  if (stage === "signe") return "gagne";
  if (stage === "perdu") return "perdu";
  return "en_cours";
}

// Étape cible quand on change l'état. "En cours" depuis un état terminal
// (signé/perdu) ramène l'opportunité en Négociation.
export function stageForEtat(etat: Etat, currentStage: Stage): Stage {
  if (etat === "gagne") return "signe";
  if (etat === "perdu") return "perdu";
  if (currentStage === "signe" || currentStage === "perdu") return "negociation";
  return currentStage;
}

// Change l'état d'une opportunité ; quand elle passe "gagné", le compte lié est
// activé (statut "client") et apparaît alors dans l'onglet Clients.
export async function setOpportunityEtat(opp: Opportunity, etat: Etat): Promise<void> {
  await setOpportunityStage(opp.id, stageForEtat(etat, opp.stage));
  if (etat === "gagne" && opp.client_id) {
    await updateClient(opp.client_id, { status: "client" });
  }
}

export async function removeOpportunity(id: number): Promise<void> {
  const { error } = await supabase.from("opportunities").delete().eq("id", id);
  if (error) throw error;
}
