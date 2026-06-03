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
};

export async function listStockItems(): Promise<StockItem[]> {
  const { data, error } = await supabase
    .from("stock_items")
    .select("*")
    .order("nom", { ascending: true });
  if (error) throw error;
  return (data ?? []) as StockItem[];
}
