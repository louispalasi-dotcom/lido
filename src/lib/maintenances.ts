// Entretiens réalisés sur un compte (avec éléments changés). RLS multi-organisation.
// L'enregistrement passe par la fonction SQL record_maintenance qui décrémente
// le stock et crée les mouvements de façon atomique.
import { supabase } from "./supabase";

export type Billing = "sav" | "supplement";

export type MaintenanceLine = {
  stock_item_id: number | null;
  reference: string;
  nom: string;
  qty: number;
  billing: Billing;
  amount: number | null; // montant facturable (à venir tant que pas de base de prix)
};

export type MaintenanceKind = "annuel_sav" | "autre";

export type Maintenance = {
  id: number;
  created_at: string;
  organization_id: number;
  client_id: number;
  occurred_at: string;
  kind: MaintenanceKind;
  notes: string | null;
  standard_amount: number;
  lines: MaintenanceLine[];
};

// Total facturé : tarif standard + pièces en supplément (quantité × prix unitaire).
export function maintenanceTotal(m: { standard_amount: number; lines: MaintenanceLine[] }): number {
  const supp = (m.lines || [])
    .filter((l) => l.billing === "supplement")
    .reduce((s, l) => s + (l.amount ?? 0) * (l.qty || 0), 0);
  return (m.standard_amount || 0) + supp;
}

export const MAINTENANCE_KINDS: { val: MaintenanceKind; label: string }[] = [
  { val: "annuel_sav", label: "Entretien annuel (sous SAV)" },
  { val: "autre", label: "Autre entretien" },
];

export function kindLabel(k: MaintenanceKind) {
  return MAINTENANCE_KINDS.find((x) => x.val === k)?.label ?? k;
}

export async function listMaintenancesByClient(clientId: number): Promise<Maintenance[]> {
  const { data, error } = await supabase
    .from("maintenances")
    .select("*")
    .eq("client_id", clientId)
    .order("occurred_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Maintenance[];
}

export async function recordMaintenance(params: {
  client_id: number;
  occurred_at: string;
  kind: MaintenanceKind;
  notes: string | null;
  standard_amount: number;
  lines: MaintenanceLine[];
}): Promise<number> {
  const { data, error } = await supabase.rpc("record_maintenance", {
    p_client_id: params.client_id,
    p_occurred_at: params.occurred_at,
    p_kind: params.kind,
    p_notes: params.notes,
    p_standard_amount: params.standard_amount,
    p_lines: params.lines,
  });
  if (error) throw error;
  return data as number;
}
