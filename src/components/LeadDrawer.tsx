"use client";

import { useState } from "react";
import {
  createLead,
  ORIGINS,
  STREET_TYPES,
  type Segment,
  type Origin,
} from "@/lib/leads";

const inputCls =
  "w-full rounded-lg border border-[#E6EAF0] px-3 py-2 text-sm focus:border-[#14B8C4] focus:outline-none";
const labelCls = "block text-xs font-medium text-[#64748B] mb-1";

// Titre de section dans le panneau.
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">{title}</h3>
      {children}
    </div>
  );
}

// Panneau latéral pour saisir un nouveau lead. Toujours monté pour permettre
// l'animation de glissement ; masqué (sans interaction) quand `open` est faux.
export default function LeadDrawer({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [segment, setSegment] = useState<Segment>("b2b");
  const [companyName, setCompanyName] = useState("");
  const [siret, setSiret] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [addrNumber, setAddrNumber] = useState("");
  const [streetType, setStreetType] = useState("rue");
  const [streetName, setStreetName] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("France");
  const [salesRep, setSalesRep] = useState("");
  const [installer, setInstaller] = useState("");
  const [origin, setOrigin] = useState<Origin | "">("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setSegment("b2b");
    setCompanyName("");
    setSiret("");
    setFirstName("");
    setLastName("");
    setPhone("");
    setEmail("");
    setAddrNumber("");
    setStreetType("rue");
    setStreetName("");
    setPostalCode("");
    setCity("");
    setCountry("France");
    setSalesRep("");
    setInstaller("");
    setOrigin("");
    setError(null);
  }

  function fermer() {
    onClose();
  }

  async function enregistrer() {
    // Validation minimale : un nom de société (pro) ou un nom (particulier).
    if (segment === "b2b" && !companyName.trim()) {
      setError("Indique le nom de la société.");
      return;
    }
    if (segment === "b2c" && !lastName.trim() && !firstName.trim()) {
      setError("Indique au moins le nom du particulier.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createLead({
        segment,
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        company_name: segment === "b2b" ? companyName.trim() || null : null,
        siret: segment === "b2b" ? siret.trim() || null : null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        addr_number: addrNumber.trim() || null,
        addr_street_type: streetType || null,
        addr_street_name: streetName.trim() || null,
        postal_code: postalCode.trim() || null,
        city: city.trim() || null,
        country: country.trim() || null,
        sales_rep: salesRep.trim() || null,
        installer: installer.trim() || null,
        origin: origin || null,
      });
      reset();
      onSaved();
      onClose();
    } catch {
      setError("Échec de l'enregistrement. Es-tu bien connecté ?");
    } finally {
      setSaving(false);
    }
  }

  const isPro = segment === "b2b";

  return (
    <>
      {/* Fond assombri */}
      <div
        onClick={fermer}
        className={`fixed inset-0 z-40 bg-[#0A2540]/40 transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Panneau */}
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* En-tête */}
        <div className="flex items-center justify-between border-b border-[#E6EAF0] px-5 py-4">
          <h2 className="text-base font-semibold text-[#0A2540]">Nouveau lead</h2>
          <button
            onClick={fermer}
            className="rounded-lg px-2 py-1 text-[#94A3B8] hover:bg-[#F1F5F9]"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        {/* Corps déroulant */}
        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          {/* Type */}
          <Section title="Type de lead">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSegment("b2c")}
                className={`rounded-lg border px-3 py-2.5 text-sm font-medium ${
                  !isPro
                    ? "border-[#14B8C4] bg-[#E6F7F9] text-[#0B7A87]"
                    : "border-[#E6EAF0] text-[#64748B] hover:bg-[#F8FAFC]"
                }`}
              >
                🏠 Particulier (B2C)
              </button>
              <button
                type="button"
                onClick={() => setSegment("b2b")}
                className={`rounded-lg border px-3 py-2.5 text-sm font-medium ${
                  isPro
                    ? "border-[#1D4ED8] bg-[#E6EDF7] text-[#1D4ED8]"
                    : "border-[#E6EAF0] text-[#64748B] hover:bg-[#F8FAFC]"
                }`}
              >
                🏢 Professionnel (B2B)
              </button>
            </div>
          </Section>

          {/* Société (uniquement pour les pros) */}
          {isPro && (
            <Section title="Société">
              <div>
                <label className={labelCls}>Nom de la société *</label>
                <input
                  className={inputCls}
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Ex. Hôtel Belvédère"
                />
              </div>
              <div>
                <label className={labelCls}>SIRET</label>
                <input
                  className={inputCls}
                  value={siret}
                  onChange={(e) => setSiret(e.target.value)}
                  placeholder="14 chiffres"
                />
              </div>
            </Section>
          )}

          {/* Identité */}
          <Section title={isPro ? "Contact" : "Identité"}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Prénom</label>
                <input
                  className={inputCls}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Nom{!isPro ? " *" : ""}</label>
                <input
                  className={inputCls}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>
          </Section>

          {/* Coordonnées */}
          <Section title="Coordonnées">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Téléphone</label>
                <input
                  className={inputCls}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input
                  type="email"
                  className={inputCls}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
          </Section>

          {/* Adresse */}
          <Section title="Adresse">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>N°</label>
                <input
                  className={inputCls}
                  value={addrNumber}
                  onChange={(e) => setAddrNumber(e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Type de voie</label>
                <select
                  className={inputCls}
                  value={streetType}
                  onChange={(e) => setStreetType(e.target.value)}
                >
                  {STREET_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Nom de la voie</label>
                <input
                  className={inputCls}
                  value={streetName}
                  onChange={(e) => setStreetName(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Code postal</label>
                <input
                  className={inputCls}
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Ville</label>
                <input
                  className={inputCls}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Pays</label>
                <input
                  className={inputCls}
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                />
              </div>
            </div>
          </Section>

          {/* Attribution */}
          <Section title="Attribution">
            <div>
              <label className={labelCls}>Référent commercial (vente)</label>
              <input
                className={inputCls}
                value={salesRep}
                onChange={(e) => setSalesRep(e.target.value)}
                placeholder="Nom de l'Aqualiste commercial"
              />
            </div>
            <div>
              <label className={labelCls}>Aqualiste installateur (installation)</label>
              <input
                className={inputCls}
                value={installer}
                onChange={(e) => setInstaller(e.target.value)}
                placeholder="Nom de l'Aqualiste technicien"
              />
            </div>
            <p className="text-[11px] text-[#94A3B8]">
              Listes déroulantes d&apos;Aqualistes à venir (table utilisateurs).
            </p>
          </Section>

          {/* Origine */}
          <Section title="Origine du lead">
            <select
              className={inputCls}
              value={origin}
              onChange={(e) => setOrigin(e.target.value as Origin | "")}
            >
              <option value="">— Choisir —</option>
              {ORIGINS.map((o) => (
                <option key={o.val} value={o.val}>
                  {o.label}
                </option>
              ))}
            </select>
          </Section>

          {error && (
            <p className="rounded-lg bg-[#FDECEC] px-3 py-2 text-sm text-[#B91C1C]">{error}</p>
          )}
        </div>

        {/* Pied fixe */}
        <div className="flex items-center justify-end gap-3 border-t border-[#E6EAF0] px-5 py-4">
          <button
            onClick={fermer}
            className="rounded-lg border border-[#E6EAF0] px-4 py-2 text-sm text-[#64748B] hover:bg-[#F8FAFC]"
          >
            Annuler
          </button>
          <button
            onClick={enregistrer}
            disabled={saving}
            className="rounded-lg bg-[#14B8C4] px-5 py-2 text-sm font-medium text-[#04212e] hover:bg-[#0fa6b1] disabled:opacity-60"
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </aside>
    </>
  );
}
