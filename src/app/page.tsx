// Tableau de bord Lido — PREMIER ÉCRAN (maquette de démonstration).
// Les données ci-dessous sont FICTIVES : c'est une vitrine du produit, pas
// encore le CRM connecté à la base. Les modules réels seront branchés ensuite.

const KPIS = [
  { label: "CA du mois", value: "48 250 €", trend: "+12 %", up: true },
  { label: "Contrats actifs", value: "127", trend: "+4", up: true },
  { label: "À renouveler (90 j)", value: "9", trend: "à suivre", up: false },
  { label: "Interventions aujourd'hui", value: "6", trend: "2 urgentes", up: false },
  { label: "Devis en attente", value: "14", trend: "23 400 €", up: true },
  { label: "Clients actifs", value: "312", trend: "+8", up: true },
];

const CA_6_MOIS = [
  { mois: "Jan", val: 60 },
  { mois: "Fév", val: 72 },
  { mois: "Mar", val: 55 },
  { mois: "Avr", val: 84 },
  { mois: "Mai", val: 78 },
  { mois: "Juin", val: 96 },
];

const PIPELINE = [
  { etape: "Nouveau", count: 18, montant: "31 k€" },
  { etape: "Contacté", count: 11, montant: "24 k€" },
  { etape: "RDV", count: 7, montant: "19 k€" },
  { etape: "Devis", count: 5, montant: "23 k€" },
  { etape: "Négociation", count: 3, montant: "15 k€" },
];

const CLIENTS = [
  { nom: "Brasserie du Port", ville: "Marseille", statut: "Client", contrat: "Entretien annuel" },
  { nom: "Clinique Saint-Roch", ville: "Montpellier", statut: "À renouveler", contrat: "Osmose inverse" },
  { nom: "Hôtel Belvédère", ville: "Nice", statut: "Client", contrat: "Fontaines (x6)" },
  { nom: "Boulangerie Lemaire", ville: "Aix-en-Provence", statut: "Prospect", contrat: "—" },
  { nom: "Camping Les Pins", ville: "Fréjus", statut: "Client", contrat: "Adoucisseur" },
];

const MODULES = [
  { nom: "Tableau de bord", actif: true },
  { nom: "Clients" },
  { nom: "Carte commerciale" },
  { nom: "Pipeline" },
  { nom: "Devis" },
  { nom: "Contrats" },
  { nom: "Planning" },
  { nom: "Interventions" },
  { nom: "Facturation" },
  { nom: "Assistant IA" },
];

function statutStyle(statut: string) {
  switch (statut) {
    case "Client":
      return "bg-[#E6F7F9] text-[#0B7A87]";
    case "Prospect":
      return "bg-[#EEF2F7] text-[#475569]";
    case "À renouveler":
      return "bg-[#FFF3E6] text-[#B45309]";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

export default function Page() {
  return (
    <div className="flex min-h-screen w-full bg-[#F6F8FB] text-[#0A2540]">
      {/* Barre latérale */}
      <aside className="hidden md:flex w-60 flex-col bg-[#0A2540] text-white">
        <div className="flex items-center gap-2 px-6 py-5 text-xl font-semibold">
          <span className="text-[#14B8C4]">💧</span> Lido
        </div>
        <nav className="mt-2 flex flex-col gap-1 px-3">
          {MODULES.map((m) => (
            <span
              key={m.nom}
              className={`rounded-lg px-3 py-2 text-sm ${
                m.actif
                  ? "bg-[#14B8C4] font-medium text-[#04212e]"
                  : "text-slate-300 hover:bg-white/5"
              }`}
            >
              {m.nom}
            </span>
          ))}
        </nav>
        <div className="mt-auto px-6 py-4 text-xs text-slate-400">
          Filtration & traitement de l&apos;eau
        </div>
      </aside>

      {/* Contenu principal */}
      <main className="flex-1">
        {/* En-tête */}
        <header className="flex items-center justify-between border-b border-[#E6EAF0] bg-white px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold">Tableau de bord</h1>
            <p className="text-sm text-[#64748B]">Vue d&apos;ensemble de l&apos;activité</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-[#E6F7F9] px-3 py-1 text-xs font-medium text-[#0B7A87]">
              Démonstration
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0A2540] text-sm font-medium text-white">
              LP
            </div>
          </div>
        </header>

        <div className="space-y-6 p-6">
          {/* Bandeau honnêteté */}
          <div className="rounded-xl border border-[#CDE9ED] bg-[#F0FBFC] px-4 py-3 text-sm text-[#0B7A87]">
            <strong>Maquette de démonstration</strong> — premier écran du produit
            Lido. Les chiffres et clients affichés sont <strong>fictifs</strong> ;
            la connexion à la base de données et les modules réels seront branchés
            aux étapes suivantes.
          </div>

          {/* KPI */}
          <section className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            {KPIS.map((k) => (
              <div
                key={k.label}
                className="rounded-2xl border border-[#E6EAF0] bg-white p-5 shadow-sm"
              >
                <div className="text-sm text-[#64748B]">{k.label}</div>
                <div className="mt-2 text-2xl font-semibold">{k.value}</div>
                <div
                  className={`mt-1 text-xs font-medium ${
                    k.up ? "text-[#0B7A87]" : "text-[#94A3B8]"
                  }`}
                >
                  {k.trend}
                </div>
              </div>
            ))}
          </section>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Graphique CA */}
            <section className="rounded-2xl border border-[#E6EAF0] bg-white p-5 shadow-sm">
              <h2 className="mb-4 font-semibold">Chiffre d&apos;affaires — 6 derniers mois</h2>
              <div className="flex h-44 items-end gap-3">
                {CA_6_MOIS.map((m) => (
                  <div key={m.mois} className="flex flex-1 flex-col items-center gap-2">
                    <div
                      className="w-full rounded-t-md bg-[#14B8C4]"
                      style={{ height: `${m.val}%` }}
                    />
                    <span className="text-xs text-[#64748B]">{m.mois}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Pipeline */}
            <section className="rounded-2xl border border-[#E6EAF0] bg-white p-5 shadow-sm">
              <h2 className="mb-4 font-semibold">Pipeline commercial</h2>
              <div className="grid grid-cols-5 gap-2">
                {PIPELINE.map((p) => (
                  <div
                    key={p.etape}
                    className="flex flex-col items-center rounded-lg bg-[#F6F8FB] p-2 text-center"
                  >
                    <span className="text-lg font-semibold">{p.count}</span>
                    <span className="mt-1 text-[10px] leading-tight text-[#64748B]">
                      {p.etape}
                    </span>
                    <span className="mt-1 text-[10px] font-medium text-[#0B7A87]">
                      {p.montant}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Clients récents */}
          <section className="rounded-2xl border border-[#E6EAF0] bg-white shadow-sm">
            <h2 className="border-b border-[#E6EAF0] px-5 py-4 font-semibold">
              Clients récents
            </h2>
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-[#94A3B8]">
                <tr>
                  <th className="px-5 py-3 font-medium">Client</th>
                  <th className="px-5 py-3 font-medium">Ville</th>
                  <th className="px-5 py-3 font-medium">Statut</th>
                  <th className="px-5 py-3 font-medium">Équipement / contrat</th>
                </tr>
              </thead>
              <tbody>
                {CLIENTS.map((c) => (
                  <tr key={c.nom} className="border-t border-[#F0F2F6]">
                    <td className="px-5 py-3 font-medium">{c.nom}</td>
                    <td className="px-5 py-3 text-[#64748B]">{c.ville}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${statutStyle(
                          c.statut
                        )}`}
                      >
                        {c.statut}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[#64748B]">{c.contrat}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <footer className="pb-6 text-center text-xs text-[#94A3B8]">
            Lido · maquette de démonstration · données fictives
          </footer>
        </div>
      </main>
    </div>
  );
}
