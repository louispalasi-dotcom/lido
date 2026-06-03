// Accès aux activités d'un compte (appels, RDV, emails, notes).
// Table protégée par RLS multi-organisation (organization_id auto-rempli).
import { supabase } from "./supabase";

export type ActivityType = "appel" | "rdv" | "email" | "note";

export type Activity = {
  id: number;
  created_at: string;
  client_id: number;
  type: ActivityType;
  content: string | null;
  occurred_at: string;
  done: boolean;
};

export type NewActivity = {
  client_id: number;
  type: ActivityType;
  content?: string | null;
  occurred_at?: string;
  done?: boolean;
};

export const ACTIVITY_TYPES: { val: ActivityType; label: string; icon: string }[] = [
  { val: "appel", label: "Appel", icon: "📞" },
  { val: "rdv", label: "Rendez-vous", icon: "📅" },
  { val: "email", label: "Email", icon: "✉️" },
  { val: "note", label: "Note", icon: "📝" },
];

export function activityMeta(t: ActivityType) {
  return ACTIVITY_TYPES.find((x) => x.val === t) ?? ACTIVITY_TYPES[3];
}

export async function listActivitiesByClient(clientId: number): Promise<Activity[]> {
  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .eq("client_id", clientId)
    .order("occurred_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Activity[];
}

export async function createActivity(data: NewActivity): Promise<Activity> {
  const { data: row, error } = await supabase
    .from("activities")
    .insert({ done: true, ...data })
    .select()
    .single();
  if (error) throw error;
  return row as Activity;
}

export async function removeActivity(id: number): Promise<void> {
  const { error } = await supabase.from("activities").delete().eq("id", id);
  if (error) throw error;
}
