// Messages reçus via le formulaire de contact. Org-scopé (RLS).
import { supabase } from "./supabase";

export type ContactMessage = {
  id: number;
  created_at: string;
  name: string;
  email: string | null;
  phone: string | null;
  subject: string | null;
  message: string;
};

export async function listContactMessages(): Promise<ContactMessage[]> {
  const { data, error } = await supabase
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ContactMessage[];
}

export async function createContactMessage(data: {
  name: string;
  email?: string | null;
  phone?: string | null;
  subject?: string | null;
  message: string;
}): Promise<void> {
  const { error } = await supabase.from("contact_messages").insert(data);
  if (error) throw error;
}
