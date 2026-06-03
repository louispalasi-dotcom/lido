"use client";

import { useEffect, useState } from "react";
import {
  updateClient,
  CLIENT_STATUTS,
  TEMPERATURES,
  type Client,
  type ClientStatus,
  type Temperature,
} from "@/lib/clients";
import { STREET_TYPES } from "@/lib/leads";

const inputCls =
  "w-full rounded-lg border border-[#E6EAF0] px-3 py-2 text-sm focus:border-[#14B8C4] focus:outline-none";
const labelCls = "block text-xs font-medium text-[#64748B] mb-1";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">{title}</h3>
      {children}
    </div>
  );
}

// Modifier les informations / la qualification d'un compte client.
export default function ClientEditDrawer({
  client,
  onClose,
  onSaved,
}: {
  client: Client | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const open = client !== null;
  const isPro = client?.segment === "b2b";

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
  const [status, setStatus] = useState<ClientStatus>("prospect");
  const [temperature, setTemperature] = useState<Temperature | null>(null);
  const [estimated, setEstimated] = useState("0");
  const [quote, setQuote] = useState("0");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!client) return;
    setCompanyName(client.company_name ?? "");
    setSiret(client.siret ?? "");
    setFirstName(client.first_name ?? "");
    setLastName(client.last_name ?? "");
    setPhone(client.phone ?? "");
    setEmail(client.email ?? "");
    setAddrNumber(client.addr_number ?? "");
    setStreetType(client.addr_street_type || "rue");
    setStreetName(client.addr_street_name ?? "");
    setPostalCode(client.postal_code ?? "");
    setCity(client.city ?? "");
    setCountry(client.country ?? "France");
    setSalesRep(client.sales_rep ?? "");
    setInstaller(client.installer ?? "");
    setStatus(client.status);
    setTemperature(client.temperature);
    setEstimated(String(client.estimated_value ?? 0));
    setQuote(String(client.quote_value ?? 0));
    setNotes(client.notes ?? "");
  }, [client]);

  async function enregistrer() {
    if (!client) return;
    setSaving(true);
    try {
      await updateClient(client.id, {
        company_name: isPro ? companyName.trim() || null : null,
        siret: isPro ? siret.trim() || null : null,
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
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
        status,
        temperature,
        estimated_value: Number(estimated) || 0,
        quote_value: Number(quote) || 0,
        notes: notes.trim() || null,
      });
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-[#0A2540]/40 transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-[#E6EAF0] px-5 py-4">
          <h2 className="text-base font-semibold text-[#0A2540]">Modifier le compte</h2>
          <button
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-[#94A3B8] hover:bg-[#F1F5F9]"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          {isPro && (
            <Section title="Société">
              <div>
                <label className={labelCls}>Nom de la société</label>
                <input className={inputCls} value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>SIRET</label>
                <input className={inputCls} value={siret} onChange={(e) => setSiret(e.target.value)} />
              </div>
            </Section>
          )}

          <Section title={isPro ? "Contact" : "Identité"}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Prénom</label>
                <input className={inputCls} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Nom</label>
                <input className={inputCls} value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
            </div>
          </Section>

          <Section title="Coordonnées">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Téléphone</label>
                <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>N°</label>
                <input className={inputCls} value={addrNumber} onChange={(e) => setAddrNumber(e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Type de voie</label>
                <select className={inputCls} value={streetType} onChange={(e) => setStreetType(e.target.value)}>
                  {STREET_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Voie</label>
                <input className={inputCls} value={streetName} onChange={(e) => setStreetName(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Code postal</label>
                <input className={inputCls} value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Ville</label>
                <input className={inputCls} value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Pays</label>
                <input className={inputCls} value={country} onChange={(e) => setCountry(e.target.value)} />
              </div>
            </div>
          </Section>

          <Section title="Attribution">
            <div>
              <label className={labelCls}>Référent commercial</label>
              <input className={inputCls} value={salesRep} onChange={(e) => setSalesRep(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Aqualiste installateur</label>
              <input className={inputCls} value={installer} onChange={(e) => setInstaller(e.target.value)} />
            </div>
          </Section>

          <Section title="Qualification">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Statut</label>
                <select
                  className={inputCls}
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ClientStatus)}
                >
                  {CLIENT_STATUTS.map((s) => (
                    <option key={s.val} value={s.val}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Température</label>
                <div className="grid grid-cols-3 gap-1">
                  {TEMPERATURES.map((t) => (
                    <button
                      key={t.val}
                      type="button"
                      onClick={() => setTemperature(t.val)}
                      className={`flex items-center justify-center gap-1 rounded-lg border px-1 py-2 text-xs ${
                        temperature === t.val
                          ? "border-[#14B8C4] bg-[#F0FBFC]"
                          : "border-[#E6EAF0] hover:bg-[#F8FAFC]"
                      }`}
                    >
                      <span className={`h-2 w-2 rounded-full ${t.dot}`} />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Valeur estimée (€)</label>
                <input type="number" className={inputCls} value={estimated} onChange={(e) => setEstimated(e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Valeur devis (€)</label>
                <input type="number" className={inputCls} value={quote} onChange={(e) => setQuote(e.target.value)} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Notes</label>
              <textarea className={inputCls} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </Section>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-[#E6EAF0] px-5 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-[#E6EAF0] px-4 py-2 text-sm text-[#64748B] hover:bg-[#F8FAFC]"
          >
            Annuler
          </button>
          <button
            onClick={enregistrer}
            disabled={saving}
            className="rounded-lg bg-[#14B8C4] px-5 py-2 text-sm font-medium text-[#04212e] disabled:opacity-60"
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </aside>
    </>
  );
}
