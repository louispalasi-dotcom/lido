"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import Login from "@/components/Login";
import NotifButton from "@/components/NotifButton";

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
  { nom: "Direction", href: "/direction", roles: ["dirigeant"] },
  { nom: "Leads", href: "/leads", roles: ["dirigeant", "commercial"] },
  { nom: "Clients", href: "/clients", roles: ["dirigeant", "commercial"] },
  { nom: "Interventions", href: "/interventions", roles: ["dirigeant", "technicien"] },
  { nom: "Entretiens", href: "/entretiens", roles: ["dirigeant", "technicien"] },
  { nom: "Stock", href: "/stock", roles: ["dirigeant", "commercial", "technicien"] },
  { nom: "Carte commerciale", roles: ["dirigeant", "commercial"] },
  { nom: "Pipeline", href: "/pipeline", roles: ["dirigeant", "commercial"] },
  { nom: "Calendrier", href: "/calendrier", roles: ["dirigeant", "commercial", "technicien"] },
  { nom: "Devis", href: "/devis", roles: ["dirigeant", "commercial"] },
  { nom: "Contrats", roles: ["dirigeant", "commercial"] },
  { nom: "Planning", roles: ["dirigeant", "technicien"] },
  { nom: "Facturation", href: "/facturation", roles: ["dirigeant"] },
  { nom: "Assistant IA", roles: ["dirigeant", "commercial", "technicien"] },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [role, setRole] = useState<Role>("dirigeant");
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);

  // Récupère le rôle choisi (mémorisé dans le navigateur).
  useEffect(() => {
    const saved = localStorage.getItem("lido-role") as Role | null;
    if (saved) setRole(saved);
  }, []);

  // Suit l'état de connexion (Supabase Auth).
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Tant qu'on ne sait pas si l'utilisateur est connecté, on patiente.
  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F6F8FB] text-sm text-[#64748B]">
        Chargement…
      </div>
    );
  }

  // Pas connecté → écran de connexion (l'app n'est pas accessible).
  if (!session) return <Login />;

  function changeRole(r: Role) {
    setRole(r);
    localStorage.setItem("lido-role", r);
  }

  const visibles = MODULES.filter((m) => m.roles.includes(role));

  // Liste de navigation, réutilisée pour le menu fixe (desktop) et le menu
  // déroulant (mobile). onNavigate sert à refermer le menu mobile au clic.
  function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
    return (
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
              onClick={onNavigate}
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
    );
  }

  return (
    <RoleContext.Provider value={role}>
      <div className="flex min-h-screen w-full bg-[#F6F8FB] text-[#0A2540]">
        {/* Barre latérale fixe (desktop) */}
        <aside className="hidden w-60 flex-col bg-[#0A2540] text-white md:flex">
          <div className="flex items-center gap-2 px-6 py-5 text-xl font-semibold">
            <span className="text-[#14B8C4]">💧</span> Lido
          </div>
          <NavLinks />
          <div className="mt-auto px-6 py-4 text-xs text-slate-400">
            Filtration &amp; traitement de l&apos;eau
          </div>
        </aside>

        {/* Menu mobile (burger) */}
        {mobileNav && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setMobileNav(false)}
            />
            <aside className="absolute left-0 top-0 flex h-full w-64 flex-col bg-[#0A2540] text-white shadow-xl">
              <div className="flex items-center justify-between px-5 py-5 text-xl font-semibold">
                <span>
                  <span className="text-[#14B8C4]">💧</span> Lido
                </span>
                <button
                  onClick={() => setMobileNav(false)}
                  className="rounded-lg px-2 py-1 text-slate-300 hover:bg-white/10"
                  aria-label="Fermer le menu"
                >
                  ✕
                </button>
              </div>
              <NavLinks onNavigate={() => setMobileNav(false)} />
            </aside>
          </div>
        )}

        {/* Contenu */}
        <main className="min-w-0 flex-1">
          <header className="border-b border-[#E6EAF0] bg-white">
            <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMobileNav(true)}
                  className="rounded-lg border border-[#E6EAF0] px-2.5 py-1.5 text-lg leading-none md:hidden"
                  aria-label="Ouvrir le menu"
                >
                  ☰
                </button>
                <div>
                  <h1 className="text-lg font-semibold sm:text-xl">Lido</h1>
                  <p className="hidden text-sm text-[#64748B] sm:block">
                    Filtration &amp; traitement de l&apos;eau · CRM
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <span className="hidden text-[#64748B] sm:inline">Vue :</span>
                  <select
                    value={role}
                    onChange={(e) => changeRole(e.target.value as Role)}
                    className="rounded-lg border border-[#E6EAF0] bg-white px-2 py-1.5 text-sm font-medium"
                  >
                    {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABEL[r]}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="flex items-center gap-2 border-l border-[#E6EAF0] pl-2 text-sm sm:pl-3">
                  <NotifButton />
                  <span className="hidden text-[#94A3B8] lg:inline">{session.user.email}</span>
                  <button
                    onClick={() => supabase.auth.signOut()}
                    className="rounded-lg border border-[#E6EAF0] px-3 py-1.5 text-[#64748B] hover:bg-[#F8FAFC]"
                  >
                    Déconnexion
                  </button>
                </div>
              </div>
            </div>
          </header>

          <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-5 sm:px-6 sm:py-6">
            {children}
          </div>
        </main>
      </div>
    </RoleContext.Provider>
  );
}
