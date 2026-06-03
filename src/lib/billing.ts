// Facturation interne (Aqualiste → Eauriginelle) + commissions.
// Les commissions sont CALCULÉES depuis les opportunités gagnées.
// Les factures internes sont persistées (RLS multi-organisation).
import { supabase } from "./supabase";
import type { Opportunity } from "./opportunities";

export type InternalInvoice = {
  id: number;
  created_at: string;
  organization_id: number;
  aqualiste: string;
  period: string;
  amount: number;
  rate: number;
  status: "a_payer" | "payee";
  notes: string | null;
};

export type Commission = {
  aqualiste: string;
  nbGagnees: number;
  caGagne: number;
  commission: number;
};

export function euros(n: number) {
  return Math.round(n || 0).toLocaleString("fr-FR") + " €";
}

// Libellé de période du mois courant, ex. "juin 2026".
export function currentPeriod(): string {
  return new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

// Commissions par Aqualiste à partir des opportunités gagnées (stage "signe").
export function computeCommissions(opps: Opportunity[], rate: number): Commission[] {
  const map = new Map<string, { nb: number; ca: number }>();
  opps
    .filter((o) => o.stage === "signe")
    .forEach((o) => {
      const a = (o.owner || "Non attribué").trim() || "Non attribué";
      const cur = map.get(a) ?? { nb: 0, ca: 0 };
      cur.nb += 1;
      cur.ca += o.amount;
      map.set(a, cur);
    });
  return Array.from(map.entries())
    .map(([aqualiste, v]) => ({
      aqualiste,
      nbGagnees: v.nb,
      caGagne: v.ca,
      commission: (rate / 100) * v.ca,
    }))
    .sort((a, b) => b.commission - a.commission);
}

export async function listInvoices(): Promise<InternalInvoice[]> {
  const { data, error } = await supabase
    .from("internal_invoices")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as InternalInvoice[];
}

export async function createInvoice(data: {
  aqualiste: string;
  period: string;
  amount: number;
  rate: number;
  notes?: string | null;
}): Promise<InternalInvoice> {
  const { data: row, error } = await supabase
    .from("internal_invoices")
    .insert({ status: "a_payer", ...data })
    .select()
    .single();
  if (error) throw error;
  return row as InternalInvoice;
}

export async function setInvoiceStatus(
  id: number,
  status: "a_payer" | "payee"
): Promise<void> {
  const { error } = await supabase.from("internal_invoices").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function removeInvoice(id: number): Promise<void> {
  const { error } = await supabase.from("internal_invoices").delete().eq("id", id);
  if (error) throw error;
}

export function invoiceRef(i: { id: number }) {
  return "FAC-" + String(i.id).padStart(4, "0");
}
