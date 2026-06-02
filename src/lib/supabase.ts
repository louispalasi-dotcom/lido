import { createClient } from "@supabase/supabase-js";

// Client Supabase pour le navigateur. La clé publishable est publique :
// la sécurité réelle se fait via les règles RLS dans Supabase.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_KEY!;

export const supabase = createClient(url, key);

// ---- Types des données ----
export type Statut = "prospect" | "client" | "a_renouveler";

export type Client = {
  id: number;
  name: string;
  city: string | null;
  type: string | null;
  status: Statut;
  created_at: string;
};

export type Intervention = {
  id: number;
  client_id: number | null;
  type: string;
  scheduled_at: string | null;
  status: "planifiee" | "faite";
  notes: string | null;
  created_at: string;
  clients?: { name: string } | null;
};
