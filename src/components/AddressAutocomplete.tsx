"use client";

import { useRef, useState } from "react";
import { STREET_TYPES } from "@/lib/leads";

type Feature = {
  properties: {
    label: string;
    housenumber?: string;
    street?: string;
    name?: string;
    postcode?: string;
    city?: string;
  };
  geometry: { coordinates: [number, number] };
};

export type AddressPick = {
  number: string;
  type: string;
  street: string;
  postal: string;
  city: string;
  lat?: number;
  lng?: number;
};

// Sépare "Avenue du Général Mangin" → { type: "avenue", name: "du Général Mangin" }
// si le type est reconnu dans la liste, sinon garde tout dans le nom.
function splitStreet(street: string): { type: string; name: string } {
  const lower = street.toLowerCase();
  for (const t of STREET_TYPES) {
    if (lower.startsWith(t.toLowerCase() + " ")) {
      return { type: t, name: street.slice(t.length + 1) };
    }
  }
  return { type: "rue", name: street };
}

export default function AddressAutocomplete({
  onPick,
  className,
}: {
  onPick: (a: AddressPick) => void;
  className?: string;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Feature[]>([]);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function onChange(v: string) {
    setQ(v);
    if (timer.current) clearTimeout(timer.current);
    if (v.trim().length < 3) {
      setResults([]);
      setOpen(false);
      return;
    }
    timer.current = setTimeout(async () => {
      try {
        const r = await fetch(
          `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(v)}&limit=5&autocomplete=1`
        );
        const j = await r.json();
        setResults(j.features || []);
        setOpen(true);
      } catch {
        setResults([]);
      }
    }, 250);
  }

  function pick(f: Feature) {
    const p = f.properties;
    const street = p.street || p.name || "";
    const { type, name } = splitStreet(street);
    onPick({
      number: p.housenumber || "",
      type,
      street: name,
      postal: p.postcode || "",
      city: p.city || "",
      lat: f.geometry?.coordinates?.[1],
      lng: f.geometry?.coordinates?.[0],
    });
    setQ(p.label || "");
    setOpen(false);
    setResults([]);
  }

  return (
    <div className={`relative ${className || ""}`}>
      <input
        value={q}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => results.length && setOpen(true)}
        placeholder="🔎 Rechercher une adresse (n° et rue)…"
        className="w-full rounded-lg border border-[#E6EAF0] px-3 py-2 text-sm focus:border-[#14B8C4] focus:outline-none"
        autoComplete="off"
      />
      {open && results.length > 0 && (
        <ul className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-[#E6EAF0] bg-white shadow-lg">
          {results.map((f, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => pick(f)}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-[#F0FBFC]"
              >
                {f.properties.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
