// Accès aux opportunités dans Supabase (rattachées à un compte client).
// Table protégée par RLS "connecté uniquement".
import { supabase } from "./supabase";

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

export async function removeOpportunity(id: number): Promise<void> {
  const { error } = await supabase.from("opportunities").delete().eq("id", id);
  if (error) throw error;
}
