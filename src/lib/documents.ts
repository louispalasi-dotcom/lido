// Pièces jointes d'un compte : fichiers dans Supabase Storage (bucket privé
// "client-documents"), métadonnées dans la table documents.
// Chemin = {organization_id}/{client_id}/{horodatage-nom} — le 1er dossier doit
// être l'organisation (la règle de sécurité du Storage l'exige).
import { supabase } from "./supabase";

export type DocRow = {
  id: number;
  created_at: string;
  client_id: number;
  name: string;
  storage_path: string;
  mime: string | null;
  size_bytes: number | null;
};

const BUCKET = "client-documents";

export async function listDocumentsByClient(clientId: number): Promise<DocRow[]> {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as DocRow[];
}

export async function uploadDocument(
  organizationId: number,
  clientId: number,
  file: File
): Promise<DocRow> {
  const safeName = file.name.replace(/[^\w.\-]+/g, "_");
  const path = `${organizationId}/${clientId}/${Date.now()}-${safeName}`;

  const up = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (up.error) throw up.error;

  const { data: row, error } = await supabase
    .from("documents")
    .insert({
      client_id: clientId,
      name: file.name,
      storage_path: path,
      mime: file.type || null,
      size_bytes: file.size,
    })
    .select()
    .single();
  if (error) throw error;
  return row as DocRow;
}

// Lien temporaire (signé) pour télécharger/voir un fichier privé.
export async function getDownloadUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 120);
  if (error) throw error;
  return data.signedUrl;
}

export async function deleteDocument(doc: DocRow): Promise<void> {
  await supabase.storage.from(BUCKET).remove([doc.storage_path]);
  const { error } = await supabase.from("documents").delete().eq("id", doc.id);
  if (error) throw error;
}

export function formatSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return bytes + " o";
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + " Ko";
  return (bytes / (1024 * 1024)).toFixed(1) + " Mo";
}
