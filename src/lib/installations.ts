// Produits installés chez les clients + calcul automatique du prochain entretien.
// Table protégée par RLS multi-organisation (organization_id auto-rempli).
import { supabase } from "./supabase";

export type Installation = {
  id: number;
  created_at: string;
  organization_id: number;
  client_id: number;
  model: string;
  serial: string | null;
  installed_at: string | null;
  warranty_months: number | null;
  maintenance_months: number;
  last_maintenance_at: string | null;
};

export type InstallationWithClient = Installation & {
  clients: {
    id: number;
    company_name: string | null;
    first_name: string | null;
    last_name: string | null;
    segment: "b2b" | "b2c";
  } | null;
};

export type NewInstallation = {
  client_id: number;
  model: string;
  serial?: string | null;
  installed_at?: string | null;
  warranty_months?: number | null;
  maintenance_months?: number;
};

export type EtatEntretien = "a_jour" | "a_surveiller" | "en_retard";

export const ETAT_ENTRETIEN: Record<
  EtatEntretien,
  { label: string; dot: string; classe: string; color: string }
> = {
  a_jour: { label: "À jour", dot: "bg-[#15803D]", classe: "bg-[#E7F8EE] text-[#15803D]", color: "#15803D" },
  a_surveiller: { label: "À surveiller", dot: "bg-[#F59E0B]", classe: "bg-[#FFF3E6] text-[#B45309]", color: "#F59E0B" },
  en_retard: { label: "En retard", dot: "bg-[#EF4444]", classe: "bg-[#FDECEC] text-[#B91C1C]", color: "#EF4444" },
};

type DueInput = {
  installed_at: string | null;
  last_maintenance_at: string | null;
  maintenance_months: number;
};

// Prochaine échéance = (dernier entretien, sinon date de pose) + fréquence (mois).
export function nextDue(inst: DueInput): string | null {
  const base = inst.last_maintenance_at ?? inst.installed_at;
  if (!base) return null;
  const d = new Date(base);
  if (isNaN(d.getTime())) return null;
  d.setMonth(d.getMonth() + (inst.maintenance_months || 12));
  return d.toISOString().slice(0, 10);
}

export function joursAvantEcheance(inst: DueInput): number | null {
  const due = nextDue(inst);
  if (!due) return null;
  return Math.floor((new Date(due).getTime() - Date.now()) / 86400000);
}

export function etatEntretien(inst: DueInput): EtatEntretien {
  const days = joursAvantEcheance(inst);
  if (days === null) return "a_jour";
  if (days < 0) return "en_retard";
  if (days <= 30) return "a_surveiller";
  return "a_jour";
}

export async function listInstallations(): Promise<InstallationWithClient[]> {
  const { data, error } = await supabase
    .from("installations")
    .select("*, clients(id, company_name, first_name, last_name, segment)")
    .order("installed_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as InstallationWithClient[];
}

export async function listInstallationsByClient(clientId: number): Promise<Installation[]> {
  const { data, error } = await supabase
    .from("installations")
    .select("*")
    .eq("client_id", clientId)
    .order("installed_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Installation[];
}

export async function createInstallation(data: NewInstallation): Promise<Installation> {
  const { data: row, error } = await supabase
    .from("installations")
    .insert({ maintenance_months: 12, ...data })
    .select()
    .single();
  if (error) throw error;
  return row as Installation;
}

export async function markMaintained(id: number, dateISO: string): Promise<void> {
  const { error } = await supabase
    .from("installations")
    .update({ last_maintenance_at: dateISO })
    .eq("id", id);
  if (error) throw error;
}

export async function removeInstallation(id: number): Promise<void> {
  const { error } = await supabase.from("installations").delete().eq("id", id);
  if (error) throw error;
}

export function fmtDate(d: string | null): string {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export function installClientName(i: InstallationWithClient): string {
  const c = i.clients;
  if (!c) return "Compte";
  return c.company_name || [c.first_name, c.last_name].filter(Boolean).join(" ") || "Compte";
}
