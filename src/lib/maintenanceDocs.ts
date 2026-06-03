// Pièces jointes d'un entretien : fichiers dans le bucket privé "client-documents"
// (cloisonné par organisation via le 1er dossier = organization_id).
import { supabase } from "./supabase";

export type MaintDoc = {
  id: number;
  created_at: string;
  organization_id: number;
  maintenance_id: number;
  name: string;
  storage_path: string;
  mime: string | null;
  size_bytes: number | null;
};

const BUCKET = "client-documents";

export function isImage(mime: string | null) {
  return !!mime && mime.startsWith("image/");
}

export function formatSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return bytes + " o";
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + " Ko";
  return (bytes / (1024 * 1024)).toFixed(1) + " Mo";
}

export async function listMaintenanceDocs(maintenanceId: number): Promise<MaintDoc[]> {
  const { data, error } = await supabase
    .from("maintenance_documents")
    .select("*")
    .eq("maintenance_id", maintenanceId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as MaintDoc[];
}

export async function uploadMaintenanceDoc(
  organizationId: number,
  maintenanceId: number,
  file: File
): Promise<MaintDoc> {
  const safe = file.name.replace(/[^\w.\-]+/g, "_");
  const path = `${organizationId}/maintenances/${maintenanceId}/${Date.now()}-${safe}`;
  const up = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
  if (up.error) throw up.error;
  const { data: row, error } = await supabase
    .from("maintenance_documents")
    .insert({
      maintenance_id: maintenanceId,
      name: file.name,
      storage_path: path,
      mime: file.type || null,
      size_bytes: file.size,
    })
    .select()
    .single();
  if (error) throw error;
  return row as MaintDoc;
}

// URLs signées (temporaires) pour afficher/télécharger des fichiers privés.
export async function signedUrls(paths: string[]): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(paths, 3600);
  if (error) throw error;
  const map: Record<string, string> = {};
  (data ?? []).forEach((d) => {
    if (d.path && d.signedUrl) map[d.path] = d.signedUrl;
  });
  return map;
}

export async function getSignedUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
  if (error) throw error;
  return data.signedUrl;
}

export async function removeMaintenanceDoc(doc: MaintDoc): Promise<void> {
  await supabase.storage.from(BUCKET).remove([doc.storage_path]);
  const { error } = await supabase.from("maintenance_documents").delete().eq("id", doc.id);
  if (error) throw error;
}
