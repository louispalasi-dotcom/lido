"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  listMaintenanceDocs,
  uploadMaintenanceDoc,
  removeMaintenanceDoc,
  signedUrls,
  getSignedUrl,
  isImage,
  formatSize,
  type MaintDoc,
} from "@/lib/maintenanceDocs";

export default function MaintenanceAttachments({
  maintenanceId,
  organizationId,
}: {
  maintenanceId: number;
  organizationId: number;
}) {
  const [docs, setDocs] = useState<MaintDoc[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [survol, setSurvol] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);

  const charger = useCallback(async () => {
    const list = await listMaintenanceDocs(maintenanceId);
    setDocs(list);
    const imgs = list.filter((d) => isImage(d.mime)).map((d) => d.storage_path);
    setUrls(imgs.length ? await signedUrls(imgs) : {});
  }, [maintenanceId]);

  useEffect(() => {
    charger();
  }, [charger]);

  async function envoyer(files: FileList | File[]) {
    const arr = Array.from(files);
    if (arr.length === 0) return;
    setBusy(true);
    try {
      for (const f of arr) await uploadMaintenanceDoc(organizationId, maintenanceId, f);
      await charger();
    } finally {
      setBusy(false);
    }
  }

  async function telecharger(d: MaintDoc) {
    const url = await getSignedUrl(d.storage_path);
    window.open(url, "_blank");
  }

  async function supprimer(d: MaintDoc) {
    if (!confirm("Supprimer cette pièce jointe ?")) return;
    await removeMaintenanceDoc(d);
    charger();
  }

  const images = docs.filter((d) => isImage(d.mime));
  const autres = docs.filter((d) => !isImage(d.mime));

  return (
    <div className="space-y-3">
      <input
        ref={fileRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && envoyer(e.target.files)}
      />
      <input
        ref={camRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => e.target.files && envoyer(e.target.files)}
      />

      {/* Zone d'ajout / glisser-déposer */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setSurvol(true);
        }}
        onDragLeave={() => setSurvol(false)}
        onDrop={(e) => {
          e.preventDefault();
          setSurvol(false);
          envoyer(e.dataTransfer.files);
        }}
        className={`rounded-xl border border-dashed px-3 py-3 text-center text-xs ${
          survol ? "border-[#14B8C4] bg-[#F0FBFC]" : "border-[#CDE9ED] bg-[#FBFDFE]"
        }`}
      >
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => camRef.current?.click()}
            className="rounded-lg border border-[#E6EAF0] bg-white px-3 py-1.5 font-medium text-[#0B7A87] hover:bg-[#F8FAFC]"
          >
            📷 Prendre une photo
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="rounded-lg border border-[#E6EAF0] bg-white px-3 py-1.5 font-medium text-[#0B7A87] hover:bg-[#F8FAFC]"
          >
            📎 Choisir un fichier
          </button>
          <span className="text-[#94A3B8]">{busy ? "Envoi…" : "ou glisse-dépose ici"}</span>
        </div>
      </div>

      {/* Miniatures photos */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((d) => (
            <button
              key={d.id}
              onClick={() => urls[d.storage_path] && setLightbox(urls[d.storage_path])}
              className="group relative h-16 w-16 overflow-hidden rounded-lg border border-[#E6EAF0]"
              title={d.name}
            >
              {urls[d.storage_path] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={urls[d.storage_path]} alt={d.name} className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-[10px] text-[#94A3B8]">
                  …
                </span>
              )}
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  supprimer(d);
                }}
                className="absolute right-0 top-0 hidden bg-black/50 px-1 text-[10px] text-white group-hover:block"
              >
                ✕
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Documents (non-images) */}
      {autres.length > 0 && (
        <ul className="divide-y divide-[#F0F2F6] overflow-hidden rounded-lg border border-[#E6EAF0]">
          {autres.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-2 px-3 py-2 text-xs">
              <span className="min-w-0 truncate text-[#0A2540]">📄 {d.name}</span>
              <span className="flex shrink-0 items-center gap-3">
                <span className="text-[#94A3B8]">{formatSize(d.size_bytes)}</span>
                <button onClick={() => telecharger(d)} className="font-medium text-[#0B7A87] hover:underline">
                  Télécharger
                </button>
                <button onClick={() => supprimer(d)} className="text-[#94A3B8] hover:text-red-600">
                  Suppr.
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      {docs.length === 0 && !busy && (
        <p className="text-xs text-[#94A3B8]">Aucune pièce jointe.</p>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="" className="max-h-full max-w-full rounded-lg" />
        </div>
      )}
    </div>
  );
}
