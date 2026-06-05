// Accès aux comptes clients dans Supabase — le HUB central de la fiche 360.
// Table protégée par RLS "connecté uniquement".
import { supabase } from "./supabase";

export type Segment = "b2b" | "b2c";
export type ClientStatus = "prospect" | "client" | "a_renouveler";
export type Temperature = "chaud" | "tiede" | "froid";

export type Client = {
  id: number;
  created_at: string;
  organization_id: number;
  segment: Segment;
  status: ClientStatus;
  company_name: string | null;
  siret: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  addr_number: string | null;
  addr_street_type: string | null;
  addr_street_name: string | null;
  postal_code: string | null;
  city: string | null;
  country: string | null;
  sales_rep: string | null;
  installer: string | null;
  temperature: Temperature | null;
  estimated_value: number;
  quote_value: number;
  notes: string | null;
  source_lead_id: number | null;
  lat: number | null;
  lng: number | null;
  photo_path: string | null;
};

export type NewClient = Omit<
  Client,
  | "id"
  | "created_at"
  | "organization_id"
  | "estimated_value"
  | "quote_value"
  | "status"
  | "lat"
  | "lng"
  | "photo_path"
> & {
  status?: ClientStatus;
  estimated_value?: number;
  quote_value?: number;
};

// Champs modifiables d'un compte (inclut coordonnées GPS et photo).
export type ClientUpdate = Partial<Omit<Client, "id" | "created_at" | "organization_id">>;

export const CLIENT_STATUTS: { val: ClientStatus; label: string; classe: string }[] = [
  { val: "prospect", label: "Prospect", classe: "bg-[#EEF2F7] text-[#475569]" },
  { val: "client", label: "Client", classe: "bg-[#E6F7F9] text-[#0B7A87]" },
  { val: "a_renouveler", label: "À renouveler", classe: "bg-[#FFF3E6] text-[#B45309]" },
];

export const TEMPERATURES: { val: Temperature; label: string; dot: string; classe: string }[] = [
  { val: "chaud", label: "Chaud", dot: "bg-[#EF4444]", classe: "bg-[#FDECEC] text-[#B91C1C]" },
  { val: "tiede", label: "Tiède", dot: "bg-[#F59E0B]", classe: "bg-[#FFF3E6] text-[#B45309]" },
  { val: "froid", label: "Froid", dot: "bg-[#3B82F6]", classe: "bg-[#E6EDF7] text-[#1D4ED8]" },
];

export function clientDisplayName(c: {
  segment: Segment;
  company_name: string | null;
  first_name: string | null;
  last_name: string | null;
}): string {
  if (c.segment === "b2b") return c.company_name || "Société sans nom";
  const full = [c.first_name, c.last_name].filter(Boolean).join(" ").trim();
  return full || "Particulier sans nom";
}

export function clientStatusBadge(s: ClientStatus) {
  return CLIENT_STATUTS.find((x) => x.val === s) ?? CLIENT_STATUTS[0];
}

export function temperatureInfo(t: Temperature | null) {
  return TEMPERATURES.find((x) => x.val === t) ?? null;
}

export function fullAddress(c: Client): string {
  const line = [c.addr_number, c.addr_street_type, c.addr_street_name]
    .filter(Boolean)
    .join(" ");
  const city = [c.postal_code, c.city].filter(Boolean).join(" ");
  return [line, city, c.country].filter(Boolean).join(", ");
}

export async function listClients(): Promise<Client[]> {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Client[];
}

export async function getClient(id: number): Promise<Client | null> {
  const { data, error } = await supabase.from("clients").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as Client) ?? null;
}

export async function createClient(data: NewClient): Promise<Client> {
  const { data: row, error } = await supabase
    .from("clients")
    .insert({ status: "prospect", estimated_value: 0, quote_value: 0, ...data })
    .select()
    .single();
  if (error) throw error;
  return row as Client;
}

export async function updateClient(id: number, data: ClientUpdate): Promise<void> {
  const { error } = await supabase.from("clients").update(data).eq("id", id);
  if (error) throw error;
}

// Statut d'entretien d'un client selon la date du dernier entretien :
// vert = récent (< 8 mois), orange = 8 à 12 mois, rouge = > 12 mois ou jamais.
export type EntretienStatut = "vert" | "orange" | "rouge" | "inconnu";

export function entretienStatut(lastDate: string | null): EntretienStatut {
  if (!lastDate) return "rouge";
  const d = new Date(lastDate);
  if (isNaN(d.getTime())) return "inconnu";
  const months = (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
  if (months < 8) return "vert";
  if (months <= 12) return "orange";
  return "rouge";
}

export const ENTRETIEN_COULEUR: Record<EntretienStatut, string> = {
  vert: "#15803D",
  orange: "#F59E0B",
  rouge: "#EF4444",
  inconnu: "#94A3B8",
};

export async function removeClient(id: number): Promise<void> {
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) throw error;
}

// Photo du compte (stockée dans le bucket privé, cloisonnée par organisation).
export async function uploadClientPhoto(
  organizationId: number,
  clientId: number,
  file: File
): Promise<void> {
  const safe = file.name.replace(/[^\w.\-]+/g, "_");
  const path = `${organizationId}/client-photo/${clientId}/${Date.now()}-${safe}`;
  const up = await supabase.storage.from("client-documents").upload(path, file, { upsert: true });
  if (up.error) throw up.error;
  await updateClient(clientId, { photo_path: path });
}

export async function clientPhotoUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from("client-documents").createSignedUrl(path, 3600);
  if (error) throw error;
  return data.signedUrl;
}
