// Barème des commissions Aqualistes : montant fixe par acte (vente/install/entretien).
// Données importées depuis le PDF "Tarifs - Commissions". RLS multi-organisation.
import { supabase } from "./supabase";

export type ActCategory = "vente" | "installation" | "entretien";

export type CommissionAct = {
  id: number;
  code_oa: string;
  category: ActCategory;
  label: string;
  commission_ht: number;
};

export const ACT_CATEGORIES: { val: ActCategory; label: string }[] = [
  { val: "vente", label: "Ventes" },
  { val: "installation", label: "Installations" },
  { val: "entretien", label: "Entretiens" },
];

export async function listCommissionActs(): Promise<CommissionAct[]> {
  const { data, error } = await supabase
    .from("commission_acts")
    .select("*")
    .order("category", { ascending: true })
    .order("commission_ht", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CommissionAct[];
}
