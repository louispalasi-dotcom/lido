// Catalogue d'articles (stock). RLS multi-organisation.
import { supabase } from "./supabase";

export type StockItem = {
  id: number;
  created_at: string;
  organization_id: number;
  reference: string;
  nom: string;
  quantite_en_stock: number;
  seuil_alerte: number;
  prix_vente_ht: number | null;
  cout_ht: number | null;
  category: "piece" | "produit";
};

export type PartPrice = {
  id: number;
  reference: string;
  descriptif: string | null;
  prix_ht: number;
};

export type StockEtat = "ok" | "faible" | "rupture";

export function stockEtat(i: StockItem): StockEtat {
  if (i.quantite_en_stock <= 0) return "rupture";
  if (i.quantite_en_stock <= i.seuil_alerte) return "faible";
  return "ok";
}

export const STOCK_ETAT_META: Record<StockEtat, { label: string; classe: string; dot: string }> = {
  ok: { label: "OK", classe: "bg-[#E7F8EE] text-[#15803D]", dot: "bg-[#15803D]" },
  faible: { label: "Faible", classe: "bg-[#FFF3E6] text-[#B45309]", dot: "bg-[#F59E0B]" },
  rupture: { label: "Rupture", classe: "bg-[#FDECEC] text-[#B91C1C]", dot: "bg-[#EF4444]" },
};

export function euros(n: number) {
  return Math.round(n || 0).toLocaleString("fr-FR") + " €";
}

export async function listStockItems(): Promise<StockItem[]> {
  const { data, error } = await supabase
    .from("stock_items")
    .select("*")
    .order("nom", { ascending: true });
  if (error) throw error;
  return (data ?? []) as StockItem[];
}

export async function updateStockItem(
  id: number,
  data: Partial<Pick<StockItem, "prix_vente_ht" | "cout_ht" | "seuil_alerte" | "quantite_en_stock">>
): Promise<void> {
  const { error } = await supabase.from("stock_items").update(data).eq("id", id);
  if (error) throw error;
}

export async function listPartsCatalogue(): Promise<PartPrice[]> {
  const { data, error } = await supabase
    .from("parts_catalogue")
    .select("*")
    .order("reference", { ascending: true });
  if (error) throw error;
  return (data ?? []) as PartPrice[];
}
