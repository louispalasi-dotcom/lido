// Historique annuel (pour les comparatifs N-1). Org-scopé (RLS).
import { supabase } from "./supabase";

export type YearlyMetric = {
  id: number;
  year: number;
  ca: number;
  entretiens: number;
  clients: number;
  conversion: number;
};

export async function listYearlyMetrics(): Promise<YearlyMetric[]> {
  const { data, error } = await supabase.from("yearly_metrics").select("*");
  if (error) throw error;
  return (data ?? []) as YearlyMetric[];
}
