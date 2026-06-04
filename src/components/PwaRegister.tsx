"use client";

import { useEffect } from "react";

// Enregistre le service worker (au bon chemin selon le basePath).
export default function PwaRegister() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
    navigator.serviceWorker.register(`${base}/sw.js`).catch(() => {
      /* hors-ligne / non supporté : on ignore */
    });
  }, []);
  return null;
}
