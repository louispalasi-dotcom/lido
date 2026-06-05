"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import AppShell from "@/components/AppShell";
import {
  listClients,
  clientDisplayName,
  fullAddress,
  entretienStatut,
  ENTRETIEN_COULEUR,
  type Client,
} from "@/lib/clients";
import { listAllMaintenances } from "@/lib/maintenances";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LMap = any;

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

// Centroïdes approximatifs des arrondissements de Paris (+ proche couronne).
const CENTROIDS: Record<string, [number, number]> = {
  "75001": [48.8607, 2.3358], "75002": [48.8682, 2.3417], "75003": [48.863, 2.3622],
  "75004": [48.8548, 2.3576], "75005": [48.8448, 2.3471], "75006": [48.8493, 2.3329],
  "75007": [48.8566, 2.3127], "75008": [48.8726, 2.312], "75009": [48.8769, 2.338],
  "75010": [48.876, 2.359], "75011": [48.859, 2.3792], "75012": [48.8399, 2.3876],
  "75013": [48.8322, 2.3558], "75014": [48.8331, 2.3264], "75015": [48.8417, 2.2995],
  "75016": [48.8635, 2.2773], "75017": [48.887, 2.3076], "75018": [48.8926, 2.3444],
  "75019": [48.887, 2.3828], "75020": [48.864, 2.3984],
};
function fallback(cp: string | null): [number, number] | null {
  if (!cp) return null;
  if (CENTROIDS[cp]) return CENTROIDS[cp];
  if (cp.startsWith("92")) return [48.82, 2.24];
  if (cp.startsWith("93")) return [48.91, 2.43];
  if (cp.startsWith("94")) return [48.79, 2.45];
  if (cp.startsWith("75")) return [48.8566, 2.3522];
  return null;
}
// Léger décalage déterministe pour éviter la superposition des marqueurs.
function jitter(id: number, salt: number) {
  return ((((id * 9301 + salt * 49297) % 233280) / 233280) - 0.5) * 0.013;
}
function posOf(c: Client): [number, number] | null {
  // Coordonnées GPS réelles si disponibles (géocodage), sinon approximation.
  if (c.lat != null && c.lng != null) return [c.lat, c.lng];
  const base = fallback(c.postal_code);
  if (!base) return null;
  return [base[0] + jitter(c.id, 3), base[1] + jitter(c.id, 11)];
}

function CarteView() {
  const [clients, setClients] = useState<Client[]>([]);
  const [lastMaint, setLastMaint] = useState<Record<number, string>>({});
  const [filtre, setFiltre] = useState<"tous" | "b2b" | "b2c">("tous");
  const mapDiv = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LMap>(null);
  const layerRef = useRef<LMap>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const LRef = useRef<any>(null);

  const charger = useCallback(async () => {
    const [cls, maint] = await Promise.all([listClients(), listAllMaintenances()]);
    setClients(cls);
    // Dernier entretien par client (le plus récent).
    const map: Record<number, string> = {};
    maint.forEach((m) => {
      if (!map[m.client_id] || m.occurred_at > map[m.client_id]) map[m.client_id] = m.occurred_at;
    });
    setLastMaint(map);
  }, []);
  useEffect(() => {
    charger();
  }, [charger]);

  // Init de la carte (une fois, côté navigateur).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !mapDiv.current || mapRef.current) return;
      LRef.current = L;
      const map = L.map(mapDiv.current).setView([48.8566, 2.3522], 12);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);
      layerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // (Re)dessine les marqueurs quand les clients ou le filtre changent.
  useEffect(() => {
    const L = LRef.current;
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!L || !map || !layer) return;
    layer.clearLayers();
    const pts: [number, number][] = [];
    clients
      .filter((c) => filtre === "tous" || c.segment === filtre)
      .forEach((c) => {
        const p = posOf(c);
        if (!p) return;
        pts.push(p);
        const statut = entretienStatut(lastMaint[c.id] ?? null);
        const color = ENTRETIEN_COULEUR[statut];
        const labelStatut =
          statut === "vert"
            ? "Entretien à jour"
            : statut === "orange"
            ? "Entretien à prévoir (8–12 mois)"
            : statut === "rouge"
            ? "Entretien à faire"
            : "Entretien non suivi";
        const m = L.circleMarker(p, {
          radius: 8,
          color: "#fff",
          weight: 1.5,
          fillColor: color,
          fillOpacity: 0.95,
        });
        const addr = fullAddress(c);
        m.bindPopup(
          `<strong>${clientDisplayName(c)}</strong> <span style="color:#94A3B8">(${c.segment.toUpperCase()})</span><br>` +
            `${addr || ""}<br>` +
            `<span style="color:${color};font-weight:600">● ${labelStatut}</span><br>` +
            `<a href="${BASE}/clients/?compte=${c.id}" style="color:#0B7A87">Ouvrir la fiche →</a>`
        );
        m.addTo(layer);
      });
    if (pts.length) {
      try {
        map.fitBounds(pts, { padding: [30, 30], maxZoom: 15 });
      } catch {
        /* ignore */
      }
    }
  }, [clients, filtre, lastMaint]);

  const nb = clients.filter((c) => filtre === "tous" || c.segment === filtre).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Carte commerciale</h2>
          <p className="text-sm text-[#64748B]">{nb} client(s) · clique un point pour ouvrir la fiche.</p>
        </div>
        <div className="flex gap-2 text-sm">
          {(["tous", "b2b", "b2c"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFiltre(f)}
              className={`rounded-full px-3 py-1 ${
                filtre === f ? "bg-[#0A2540] text-white" : "bg-white border border-[#E6EAF0]"
              }`}
            >
              {f === "tous" ? "Tous" : f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-[#64748B]">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full" style={{ background: "#15803D" }} /> Entretien à jour
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full" style={{ background: "#F59E0B" }} /> À prévoir (8–12 mois)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full" style={{ background: "#EF4444" }} /> À faire
        </span>
        <span className="text-[#94A3B8]">Couleur = état d&apos;entretien · adresse géocodée.</span>
      </div>

      <div
        ref={mapDiv}
        className="h-[70vh] w-full overflow-hidden rounded-2xl border border-[#E6EAF0] shadow-sm"
      />
    </div>
  );
}

export default function Page() {
  return (
    <AppShell>
      <CarteView />
    </AppShell>
  );
}
