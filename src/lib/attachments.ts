// Pièces jointes génériques (lead, opportunité, …) — bucket privé cloisonné par
// organisation (1er dossier = organization_id).
import { supabase } from "./supabase";

const BUCKET = "client-documents";

export type OwnerType = "lead" | "opportunity" | "client" | "maintenance";

export type Attachment = {
  id: number;
  created_at: string;
  organization_id: number;
  owner_type: OwnerType;
  owner_id: number;
  name: string;
  storage_path: string;
  mime: string | null;
  size_bytes: number | null;
};

export function isImage(mime: string | null) {
  return !!mime && mime.startsWith("image/");
}

export function formatSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return bytes + " o";
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + " Ko";
  return (bytes / (1024 * 1024)).toFixed(1) + " Mo";
}

export async function listAttachments(ownerType: OwnerType, ownerId: number): Promise<Attachment[]> {
  const { data, error } = await supabase
    .from("attachments")
    .select("*")
    .eq("owner_type", ownerType)
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Attachment[];
}

export async function uploadAttachment(
  organizationId: number,
  ownerType: OwnerType,
  ownerId: number,
  file: File
): Promise<Attachment> {
  const safe = file.name.replace(/[^\w.\-]+/g, "_");
  const path = `${organizationId}/${ownerType}/${ownerId}/${Date.now()}-${safe}`;
  const up = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
  if (up.error) throw up.error;
  const { data: row, error } = await supabase
    .from("attachments")
    .insert({
      owner_type: ownerType,
      owner_id: ownerId,
      name: file.name,
      storage_path: path,
      mime: file.type || null,
      size_bytes: file.size,
    })
    .select()
    .single();
  if (error) throw error;
  return row as Attachment;
}

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

export async function removeAttachment(att: Attachment): Promise<void> {
  await supabase.storage.from(BUCKET).remove([att.storage_path]);
  const { error } = await supabase.from("attachments").delete().eq("id", att.id);
  if (error) throw error;
}
