"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

// Écran de connexion. Une fois connecté, AppShell détecte la session et affiche
// l'application. La base leads n'accepte que les utilisateurs connectés.
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (error) setError("Email ou mot de passe incorrect.");
    // En cas de succès, onAuthStateChange (dans AppShell) bascule sur l'app.
  }

  function remplirDemo() {
    setEmail("demo@lido.fr");
    setPassword("LidoDemo2026!");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F6F8FB] px-4">
      <div className="w-full max-w-sm rounded-2xl border border-[#E6EAF0] bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-2 text-2xl font-semibold text-[#0A2540]">
          <span className="text-[#14B8C4]">💧</span> Lido
        </div>
        <h1 className="mb-1 text-lg font-semibold text-[#0A2540]">Connexion</h1>
        <p className="mb-6 text-sm text-[#64748B]">
          Accède à ton espace CRM filtration &amp; traitement de l&apos;eau.
        </p>

        <form onSubmit={submit} className="space-y-3">
          <input
            type="email"
            autoComplete="email"
            className="w-full rounded-lg border border-[#E6EAF0] px-3 py-2 text-sm"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            autoComplete="current-password"
            className="w-full rounded-lg border border-[#E6EAF0] px-3 py-2 text-sm"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && (
            <p className="rounded-lg bg-[#FDECEC] px-3 py-2 text-sm text-[#B91C1C]">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#0A2540] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0c3358] disabled:opacity-60"
          >
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>

        <button
          onClick={remplirDemo}
          className="mt-4 w-full rounded-lg border border-dashed border-[#CDE9ED] bg-[#F0FBFC] px-3 py-2 text-xs text-[#0B7A87] hover:bg-[#E6F7F9]"
        >
          Remplir le compte démo (demo@lido.fr)
        </button>
      </div>
    </div>
  );
}
