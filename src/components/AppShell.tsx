"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";

export type Role = "dirigeant" | "commercial" | "technicien";

const RoleContext = createContext<Role>("dirigeant");
export const useRole = () => useContext(RoleContext);

const ROLE_LABEL: Record<Role, string> = {
  dirigeant: "👔 Dirigeant",
  commercial: "💼 Commercial",
  technicien: "🔧 Technicien",
};

// Modules : href si réel, sinon "à venir". roles = qui les voit en priorité.
const MODULES: {
  nom: string;
  href?: string;
  roles: Role[];
}[] = [
  { nom: "Tableau de bord", href: "/", roles: ["dirigeant", "commercial", "technicien"] },
  { nom: "Clients", href: "/clients", roles: ["dirigeant", "commercial"] },
  { nom: "Interventions", href: "/interventions", roles: ["dirigeant", "technicien"] },
  { nom: "Carte commerciale", roles: ["dirigeant", "commercial"] },
  { nom: "Pipeline", href: "/pipeline", roles: ["dirigeant", "commercial"] },
  { nom: "Devis", roles: ["dirigeant", "commercial"] },
  { nom: "Contrats", roles: ["dirigeant", "commercial"] },
  { nom: "Planning", roles: ["dirigeant", "technicien"] },
  { nom: "Facturation", roles: ["dirigeant"] },
  { nom: "Assistant IA", roles: ["dirigeant", "commercial", "technicien"] },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [role, setRole] = useState<Role>("dirigeant");

  // Récupère le rôle choisi (mémorisé dans le navigateur).
  useEffect(() => {
    const saved = localStorage.getItem("lido-role") as Role | null;
    if (saved) setRole(saved);
  }, []);

  function changeRole(r: Role) {
    setRole(r);
    localStorage.setItem("lido-role", r);
  }

  const visibles = MODULES.filter((m) => m.roles.includes(role));

  return (
    <RoleContext.Provider value={role}>
      <div className="flex min-h-screen w-full bg-[#F6F8FB] text-[#0A2540]">
        {/* Barre latérale */}
        <aside className="hidden md:flex w-60 flex-col bg-[#0A2540] text-white">
          <div className="flex items-center gap-2 px-6 py-5 text-xl font-semibold">
            <span className="text-[#14B8C4]">💧</span> Lido
          </div>
          <nav className="mt-2 flex flex-col gap-1 px-3">
            {visibles.map((m) => {
              const actif = m.href === pathname;
              if (!m.href) {
                return (
                  <span
                    key={m.nom}
                    className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-500"
                  >
                    {m.nom}
                    <span className="text-[10px] uppercase">à venir</span>
                  </span>
                );
              }
              return (
                <Link
                  key={m.nom}
                  href={m.href}
                  className={`rounded-lg px-3 py-2 text-sm ${
                    actif
                      ? "bg-[#14B8C4] font-medium text-[#04212e]"
                      : "text-slate-300 hover:bg-white/5"
                  }`}
                >
                  {m.nom}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto px-6 py-4 text-xs text-slate-400">
            Filtration & traitement de l&apos;eau
          </div>
        </aside>

        {/* Contenu */}
        <main className="flex-1">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E6EAF0] bg-white px-6 py-4">
            <div>
              <h1 className="text-xl font-semibold">Lido</h1>
              <p className="text-sm text-[#64748B]">
                Filtration & traitement de l&apos;eau · CRM
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <span className="text-[#64748B]">Vue :</span>
              <select
                value={role}
                onChange={(e) => changeRole(e.target.value as Role)}
                className="rounded-lg border border-[#E6EAF0] bg-white px-3 py-1.5 font-medium"
              >
                {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABEL[r]}
                  </option>
                ))}
              </select>
            </label>
          </header>

          <div className="space-y-6 p-6">
            <div className="rounded-xl border border-[#CDE9ED] bg-[#F0FBFC] px-4 py-3 text-sm text-[#0B7A87]">
              <strong>Démonstration</strong> — tu peux ajouter, modifier et
              supprimer des données : elles sont enregistrées <strong>dans ton
              navigateur</strong>. La version production branchera la base
              Supabase (avec connexion par compte) à cette même interface.
            </div>
            {children}
          </div>
        </main>
      </div>
    </RoleContext.Provider>
  );
}
