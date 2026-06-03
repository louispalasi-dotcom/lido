// Devis rattachés à un compte (et éventuellement une opportunité).
// Lignes stockées en JSON pour rester simple. RLS multi-organisation.
import { supabase } from "./supabase";

export type QuoteStatus = "brouillon" | "envoye" | "accepte" | "refuse";

export type QuoteLine = {
  label: string;
  qty: number;
  unit_price: number;
  stock_item_id?: number | null;
};

export type Quote = {
  id: number;
  created_at: string;
  organization_id: number;
  client_id: number;
  opportunity_id: number | null;
  status: QuoteStatus;
  title: string | null;
  notes: string | null;
  issue_date: string | null;
  valid_until: string | null;
  lines: QuoteLine[];
  total: number;
  tva_rate: number;
  remise_pct: number;
};

export type QuoteWithClient = Quote & {
  clients: {
    id: number;
    company_name: string | null;
    first_name: string | null;
    last_name: string | null;
  } | null;
};

export const QUOTE_STATUTS: { val: QuoteStatus; label: string; classe: string }[] = [
  { val: "brouillon", label: "Brouillon", classe: "bg-[#EEF2F7] text-[#475569]" },
  { val: "envoye", label: "Envoyé", classe: "bg-[#E6EDF7] text-[#1D4ED8]" },
  { val: "accepte", label: "Accepté", classe: "bg-[#E7F8EE] text-[#15803D]" },
  { val: "refuse", label: "Refusé", classe: "bg-[#FDECEC] text-[#B91C1C]" },
];

export function quoteStatutMeta(s: QuoteStatus) {
  return QUOTE_STATUTS.find((x) => x.val === s) ?? QUOTE_STATUTS[0];
}

export function quoteRef(q: { id: number }) {
  return "DEV-" + String(q.id).padStart(4, "0");
}

export function lineTotal(l: QuoteLine) {
  return (Number(l.qty) || 0) * (Number(l.unit_price) || 0);
}

export function computeTotal(lines: QuoteLine[]) {
  return lines.reduce((s, l) => s + lineTotal(l), 0);
}

// Sous-total HT → remise → TVA → TTC.
export function computeQuoteTotals(lines: QuoteLine[], tvaRate: number, remisePct: number) {
  const subtotal = computeTotal(lines);
  const remise = subtotal * ((remisePct || 0) / 100);
  const ht = subtotal - remise;
  const tva = ht * ((tvaRate || 0) / 100);
  const ttc = ht + tva;
  return { subtotal, remise, ht, tva, ttc };
}

export function euros(n: number) {
  return Math.round(n || 0).toLocaleString("fr-FR") + " €";
}

export async function listQuotesByClient(clientId: number): Promise<Quote[]> {
  const { data, error } = await supabase
    .from("quotes")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Quote[];
}

export async function listQuotes(): Promise<QuoteWithClient[]> {
  const { data, error } = await supabase
    .from("quotes")
    .select("*, clients(id, company_name, first_name, last_name)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as QuoteWithClient[];
}

export async function createQuote(data: {
  client_id: number;
  opportunity_id?: number | null;
  title?: string | null;
}): Promise<Quote> {
  const { data: row, error } = await supabase
    .from("quotes")
    .insert({ status: "brouillon", lines: [], total: 0, ...data })
    .select()
    .single();
  if (error) throw error;
  return row as Quote;
}

export async function getQuote(id: number): Promise<Quote | null> {
  const { data, error } = await supabase.from("quotes").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as Quote) ?? null;
}

export async function updateQuote(
  id: number,
  data: Partial<
    Pick<
      Quote,
      | "status"
      | "title"
      | "notes"
      | "issue_date"
      | "valid_until"
      | "lines"
      | "total"
      | "tva_rate"
      | "remise_pct"
    >
  >
): Promise<void> {
  const { error } = await supabase.from("quotes").update(data).eq("id", id);
  if (error) throw error;
}

export async function removeQuote(id: number): Promise<void> {
  const { error } = await supabase.from("quotes").delete().eq("id", id);
  if (error) throw error;
}
