"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  getClient,
  clientDisplayName,
  clientStatusBadge,
  temperatureInfo,
  fullAddress,
  type Client,
} from "@/lib/clients";
import {
  listOpportunitiesByClient,
  setOpportunityEtat,
  etatOf,
  ETATS,
  STAGES,
  type Opportunity,
  type Etat,
} from "@/lib/opportunities";
import {
  listActivitiesByClient,
  createActivity,
  removeActivity,
  activityMeta,
  ACTIVITY_TYPES,
  type Activity,
  type ActivityType,
} from "@/lib/activities";
import {
  listDocumentsByClient,
  uploadDocument,
  getDownloadUrl,
  deleteDocument,
  formatSize,
  type DocRow,
} from "@/lib/documents";
import OpportunityDrawer from "@/components/OpportunityDrawer";
import ClientEditDrawer from "@/components/ClientEditDrawer";
import {
  listInstallationsByClient,
  createInstallation,
  markMaintained,
  removeInstallation,
  nextDue,
  etatEntretien,
  fmtDate,
  ETAT_ENTRETIEN,
  type Installation,
} from "@/lib/installations";
import QuoteDrawer from "@/components/QuoteDrawer";
import {
  listQuotesByClient,
  createQuote,
  removeQuote,
  quoteRef,
  quoteStatutMeta,
  euros as eurosQ,
  type Quote,
} from "@/lib/quotes";

function euros(n: number) {
  return (n || 0).toLocaleString("fr-FR") + " €";
}
function fmtDateTime(d: string) {
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
function stageLabel(s: string) {
  return STAGES.find((x) => x.val === s)?.label ?? s;
}

type Tab = "activites" | "opportunites" | "pieces" | "devis" | "installations";

const TABS: { val: Tab; label: string }[] = [
  { val: "activites", label: "Activités" },
  { val: "opportunites", label: "Opportunités" },
  { val: "pieces", label: "Pièces jointes" },
  { val: "devis", label: "Devis & Factures" },
  { val: "installations", label: "Installations" },
];

export default function AccountDetail({
  clientId,
  onBack,
}: {
  clientId: number;
  onBack?: () => void;
}) {
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("activites");

  const [opps, setOpps] = useState<Opportunity[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [installs, setInstalls] = useState<Installation[]>([]);
  const [oppDrawer, setOppDrawer] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const charger = useCallback(async () => {
    try {
      const c = await getClient(clientId);
      if (!c) {
        setError("Compte introuvable.");
        return;
      }
      setClient(c);
      const [o, a, d, ins] = await Promise.all([
        listOpportunitiesByClient(clientId),
        listActivitiesByClient(clientId),
        listDocumentsByClient(clientId),
        listInstallationsByClient(clientId),
      ]);
      setOpps(o);
      setActivities(a);
      setDocs(d);
      setInstalls(ins);
      setError(null);
    } catch {
      setError("Erreur de chargement depuis Supabase.");
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    charger();
  }, [charger]);

  if (loading) return <p className="text-sm text-[#64748B]">Chargement de la fiche…</p>;
  if (error || !client)
    return (
      <div className="space-y-4">
        {onBack ? (
          <button onClick={onBack} className="text-sm text-[#0B7A87] hover:underline">
            ← Retour
          </button>
        ) : (
          <Link href="/clients" className="text-sm text-[#0B7A87] hover:underline">
            ← Retour
          </Link>
        )}
        <p className="text-sm text-[#B91C1C]">{error ?? "Compte introuvable."}</p>
      </div>
    );

  const seg =
    client.segment === "b2b"
      ? { label: "B2B", classe: "bg-[#E6EDF7] text-[#1D4ED8]" }
      : { label: "B2C", classe: "bg-[#E6F7F9] text-[#0B7A87]" };
  const sb = clientStatusBadge(client.status);
  const temp = temperatureInfo(client.temperature);
  const addr = fullAddress(client);

  return (
    <div className="space-y-5">
      {onBack ? (
        <button onClick={onBack} className="inline-block text-sm text-[#0B7A87] hover:underline">
          ← Retour aux clients
        </button>
      ) : (
        <Link href="/clients" className="inline-block text-sm text-[#0B7A87] hover:underline">
          ← Retour aux clients
        </Link>
      )}

      {/* En-tête */}
      <header className="rounded-2xl border border-[#E6EAF0] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0A2540] text-lg font-semibold text-white">
              {clientDisplayName(client).charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#0A2540]">{clientDisplayName(client)}</h2>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${seg.classe}`}>
                  {seg.label}
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${sb.classe}`}>
                  {sb.label}
                </span>
                {temp && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-[#64748B]">
                    <span className={`h-2.5 w-2.5 rounded-full ${temp.dot}`} />
                    {temp.label}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="text-right">
              <div className="text-xs text-[#94A3B8]">Valeur estimée</div>
              <div className="text-lg font-semibold text-[#0A2540]">{euros(client.estimated_value)}</div>
              <div className="text-xs text-[#94A3B8]">Devis : {euros(client.quote_value)}</div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEditOpen(true)}
                className="rounded-lg border border-[#E6EAF0] px-3 py-1.5 text-xs font-medium text-[#64748B] hover:bg-[#F8FAFC]"
              >
                Modifier
              </button>
              <button
                onClick={() => setOppDrawer(true)}
                className="rounded-lg bg-[#0A2540] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#0c3358]"
              >
                + Nouvelle opportunité
              </button>
            </div>
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <Info label="Téléphone" value={client.phone} />
          <Info label="Email" value={client.email} />
          <Info label="Adresse" value={addr || null} />
          <Info label="Référent commercial" value={client.sales_rep} />
          <Info label="Aqualiste installateur" value={client.installer} />
        </dl>
      </header>

      {/* Onglets */}
      <div className="flex gap-1 overflow-x-auto border-b border-[#E6EAF0]">
        {TABS.map((t) => (
          <button
            key={t.val}
            onClick={() => setTab(t.val)}
            className={`whitespace-nowrap px-4 py-2.5 text-sm font-medium ${
              tab === t.val
                ? "border-b-2 border-[#14B8C4] text-[#0A2540]"
                : "text-[#94A3B8] hover:text-[#64748B]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "activites" && (
        <ActivitesTab clientId={client.id} activities={activities} onChange={charger} />
      )}
      {tab === "opportunites" && <OpportunitesTab opps={opps} onChange={charger} />}
      {tab === "pieces" && (
        <PiecesTab
          organizationId={client.organization_id}
          clientId={client.id}
          docs={docs}
          onChange={charger}
        />
      )}
      {tab === "devis" && <DevisTab clientId={client.id} />}
      {tab === "installations" && (
        <InstallationsTab clientId={client.id} installs={installs} onChange={charger} />
      )}

      <OpportunityDrawer
        account={oppDrawer ? client : null}
        onClose={() => setOppDrawer(false)}
        onCreated={() => {
          setTab("opportunites");
          charger();
        }}
      />

      <ClientEditDrawer
        client={editOpen ? client : null}
        onClose={() => setEditOpen(false)}
        onSaved={charger}
      />
    </div>
  );
}

function Info({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between gap-4 border-b border-[#F4F6F9] py-1 sm:border-0 sm:py-0">
      <dt className="text-[#94A3B8]">{label}</dt>
      <dd className="text-right text-[#0A2540]">{value || "—"}</dd>
    </div>
  );
}

// ---------- Onglet Activités ----------
function ActivitesTab({
  clientId,
  activities,
  onChange,
}: {
  clientId: number;
  activities: Activity[];
  onChange: () => void;
}) {
  const [type, setType] = useState<ActivityType>("appel");
  const [content, setContent] = useState("");
  const [when, setWhen] = useState("");
  const [saving, setSaving] = useState(false);

  async function enregistrer() {
    if (!content.trim() && type !== "rdv") return;
    setSaving(true);
    try {
      await createActivity({
        client_id: clientId,
        type,
        content: content.trim() || null,
        occurred_at: when ? new Date(when).toISOString() : undefined,
      });
      setContent("");
      setWhen("");
      onChange();
    } finally {
      setSaving(false);
    }
  }

  async function supprimer(id: number) {
    await removeActivity(id);
    onChange();
  }

  return (
    <div className="space-y-5">
      {/* Composer */}
      <div className="space-y-3 rounded-2xl border border-[#E6EAF0] bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {ACTIVITY_TYPES.map((t) => (
            <button
              key={t.val}
              onClick={() => setType(t.val)}
              className={`rounded-lg border px-3 py-1.5 text-sm ${
                type === t.val
                  ? "border-[#14B8C4] bg-[#F0FBFC] text-[#0A2540]"
                  : "border-[#E6EAF0] text-[#64748B] hover:bg-[#F8FAFC]"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
        <textarea
          className="w-full rounded-lg border border-[#E6EAF0] px-3 py-2 text-sm"
          rows={2}
          placeholder={type === "note" ? "Votre note…" : "Compte-rendu, prochaine action…"}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="datetime-local"
            className="rounded-lg border border-[#E6EAF0] px-3 py-2 text-sm"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
          />
          <button
            onClick={enregistrer}
            disabled={saving}
            className="rounded-lg bg-[#14B8C4] px-4 py-2 text-sm font-medium text-[#04212e] disabled:opacity-60"
          >
            Enregistrer
          </button>
        </div>
      </div>

      {/* Timeline */}
      {activities.length === 0 ? (
        <p className="text-sm text-[#64748B]">Aucune activité pour le moment.</p>
      ) : (
        <ol className="relative space-y-4 border-l border-[#E6EAF0] pl-5">
          {activities.map((a) => {
            const m = activityMeta(a.type);
            return (
              <li key={a.id} className="relative">
                <span className="absolute -left-[26px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px]">
                  {m.icon}
                </span>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-[#0A2540]">{m.label}</p>
                    <p className="text-xs text-[#94A3B8]">{fmtDateTime(a.occurred_at)}</p>
                    {a.content && <p className="mt-1 text-sm text-[#64748B]">{a.content}</p>}
                  </div>
                  <button
                    onClick={() => supprimer(a.id)}
                    className="text-xs text-[#94A3B8] hover:text-red-600"
                  >
                    Suppr.
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

// ---------- Onglet Opportunités ----------
function OpportunitesTab({ opps, onChange }: { opps: Opportunity[]; onChange: () => void }) {
  async function changerEtat(o: Opportunity, etat: Etat) {
    await setOpportunityEtat(o, etat);
    onChange();
  }

  if (opps.length === 0)
    return <p className="text-sm text-[#64748B]">Aucune opportunité liée à ce compte.</p>;
  return (
    <div className="space-y-3">
      {opps.map((o) => (
        <div
          key={o.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E6EAF0] bg-white p-4 shadow-sm"
        >
          <div className="min-w-0">
            <p className="text-sm font-medium text-[#0A2540]">{o.title}</p>
            <p className="text-xs text-[#94A3B8]">
              {stageLabel(o.stage)} · {o.probability}% · échéance {o.expected_date ?? "—"}
            </p>
            {o.current_solution && (
              <p className="text-xs text-[#64748B]">Solution actuelle : {o.current_solution}</p>
            )}
            {o.water_context && (
              <p className="text-xs text-[#64748B]">Contexte eau : {o.water_context}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm font-semibold text-[#0A2540]">{euros(o.amount)}</div>
            <select
              value={etatOf(o.stage)}
              onChange={(e) => changerEtat(o, e.target.value as Etat)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                ETATS.find((x) => x.val === etatOf(o.stage))?.classe ?? ""
              }`}
            >
              {ETATS.map((s) => (
                <option key={s.val} value={s.val}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------- Onglet Pièces jointes ----------
function PiecesTab({
  organizationId,
  clientId,
  docs,
  onChange,
}: {
  organizationId: number;
  clientId: number;
  docs: DocRow[];
  onChange: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      await uploadDocument(organizationId, clientId, file);
      onChange();
    } catch {
      setError("Échec de l'envoi du fichier.");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  async function telecharger(doc: DocRow) {
    try {
      const url = await getDownloadUrl(doc.storage_path);
      window.open(url, "_blank");
    } catch {
      setError("Impossible d'ouvrir le fichier.");
    }
  }

  async function supprimer(doc: DocRow) {
    if (!confirm("Supprimer ce fichier ?")) return;
    await deleteDocument(doc);
    onChange();
  }

  return (
    <div className="space-y-4">
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-[#CDE9ED] bg-[#F0FBFC] px-4 py-2.5 text-sm text-[#0B7A87] hover:bg-[#E6F7F9]">
        {busy ? "Envoi en cours…" : "📎 Ajouter un fichier (photo, analyse d'eau, contrat…)"}
        <input type="file" className="hidden" onChange={onFile} disabled={busy} />
      </label>

      {error && <p className="text-sm text-[#B91C1C]">{error}</p>}

      {docs.length === 0 ? (
        <p className="text-sm text-[#64748B]">Aucune pièce jointe pour le moment.</p>
      ) : (
        <ul className="divide-y divide-[#F0F2F6] overflow-hidden rounded-2xl border border-[#E6EAF0] bg-white shadow-sm">
          {docs.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[#0A2540]">{d.name}</p>
                <p className="text-xs text-[#94A3B8]">{formatSize(d.size_bytes)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3 text-xs">
                <button
                  onClick={() => telecharger(d)}
                  className="font-medium text-[#0B7A87] hover:underline"
                >
                  Télécharger
                </button>
                <button onClick={() => supprimer(d)} className="text-[#94A3B8] hover:text-red-600">
                  Suppr.
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------- Onglet Installations ----------
function InstallationsTab({
  clientId,
  installs,
  onChange,
}: {
  clientId: number;
  installs: Installation[];
  onChange: () => void;
}) {
  const [model, setModel] = useState("");
  const [serial, setSerial] = useState("");
  const [installedAt, setInstalledAt] = useState("");
  const [warranty, setWarranty] = useState("24");
  const [freq, setFreq] = useState("12");
  const [saving, setSaving] = useState(false);

  async function ajouter(e: React.FormEvent) {
    e.preventDefault();
    if (!model.trim()) return;
    setSaving(true);
    try {
      await createInstallation({
        client_id: clientId,
        model: model.trim(),
        serial: serial.trim() || null,
        installed_at: installedAt || null,
        warranty_months: warranty ? Number(warranty) : null,
        maintenance_months: freq ? Number(freq) : 12,
      });
      setModel("");
      setSerial("");
      setInstalledAt("");
      setWarranty("24");
      setFreq("12");
      onChange();
    } finally {
      setSaving(false);
    }
  }

  async function entretenu(id: number) {
    await markMaintained(id, new Date().toISOString().slice(0, 10));
    onChange();
  }

  async function retirer(id: number) {
    if (!confirm("Retirer ce produit installé ?")) return;
    await removeInstallation(id);
    onChange();
  }

  return (
    <div className="space-y-5">
      {installs.length === 0 ? (
        <p className="text-sm text-[#64748B]">Aucun produit installé pour ce compte.</p>
      ) : (
        <ul className="space-y-3">
          {installs.map((i) => {
            const et = etatEntretien(i);
            const meta = ETAT_ENTRETIEN[et];
            return (
              <li key={i.id} className="rounded-xl border border-[#F0F2F6] p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-[#0A2540]">{i.model}</p>
                    <p className="text-xs text-[#94A3B8]">
                      {i.serial ? `N° ${i.serial} · ` : ""}Posé le {fmtDate(i.installed_at)}
                      {i.warranty_months ? ` · garantie ${i.warranty_months} mois` : ""}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${meta.classe}`}>
                    <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                    {meta.label}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-[#64748B]">
                    Prochain entretien : <strong className="text-[#0A2540]">{fmtDate(nextDue(i))}</strong>
                    {i.last_maintenance_at && ` · dernier le ${fmtDate(i.last_maintenance_at)}`}
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => entretenu(i.id)}
                      className="text-xs font-medium text-[#0B7A87] hover:underline"
                    >
                      Marquer entretenu
                    </button>
                    <button
                      onClick={() => retirer(i.id)}
                      className="text-xs text-[#94A3B8] hover:text-red-600"
                    >
                      Retirer
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <form onSubmit={ajouter} className="space-y-2 rounded-2xl border border-[#E6EAF0] bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">
          Ajouter un produit installé
        </p>
        <input
          className="w-full rounded-lg border border-[#E6EAF0] px-3 py-2 text-sm"
          placeholder="Modèle * (ex. Osmoseur Aqua Pro 5)"
          value={model}
          onChange={(e) => setModel(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            className="rounded-lg border border-[#E6EAF0] px-3 py-2 text-sm"
            placeholder="N° de série"
            value={serial}
            onChange={(e) => setSerial(e.target.value)}
          />
          <input
            type="date"
            className="rounded-lg border border-[#E6EAF0] px-3 py-2 text-sm"
            value={installedAt}
            onChange={(e) => setInstalledAt(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex items-center gap-2 text-xs text-[#64748B]">
            Garantie
            <input
              type="number"
              className="w-full rounded-lg border border-[#E6EAF0] px-2 py-2 text-sm"
              value={warranty}
              onChange={(e) => setWarranty(e.target.value)}
            />
            mois
          </label>
          <label className="flex items-center gap-2 text-xs text-[#64748B]">
            Entretien tous les
            <input
              type="number"
              className="w-full rounded-lg border border-[#E6EAF0] px-2 py-2 text-sm"
              value={freq}
              onChange={(e) => setFreq(e.target.value)}
            />
            mois
          </label>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-[#14B8C4] px-4 py-2 text-sm font-medium text-[#04212e] disabled:opacity-60"
        >
          Ajouter le produit
        </button>
      </form>
    </div>
  );
}

// ---------- Onglet Devis & Factures ----------
function DevisTab({ clientId }: { clientId: number }) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Quote | null>(null);

  const charger = useCallback(async () => {
    try {
      setQuotes(await listQuotesByClient(clientId));
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    charger();
  }, [charger]);

  async function nouveau() {
    const q = await createQuote({ client_id: clientId });
    setQuotes((r) => [q, ...r]);
    setEditing(q);
  }

  async function supprimer(id: number) {
    if (!confirm("Supprimer ce devis ?")) return;
    setQuotes((r) => r.filter((q) => q.id !== id));
    await removeQuote(id);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-[#0A2540]">Devis</h3>
        <button
          onClick={nouveau}
          className="rounded-lg bg-[#0A2540] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#0c3358]"
        >
          + Nouveau devis
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-[#64748B]">Chargement…</p>
      ) : quotes.length === 0 ? (
        <p className="text-sm text-[#64748B]">Aucun devis pour ce compte.</p>
      ) : (
        <ul className="divide-y divide-[#F0F2F6] overflow-hidden rounded-2xl border border-[#E6EAF0] bg-white shadow-sm">
          {quotes.map((q) => {
            const meta = quoteStatutMeta(q.status);
            return (
              <li key={q.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <button onClick={() => setEditing(q)} className="min-w-0 text-left">
                  <span className="block text-sm font-medium text-[#0A2540]">
                    {quoteRef(q)} {q.title ? `· ${q.title}` : ""}
                  </span>
                  <span className="text-xs text-[#94A3B8]">{fmtDate(q.issue_date)}</span>
                </button>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-sm font-semibold text-[#0A2540]">{eurosQ(q.total)}</span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${meta.classe}`}>
                    {meta.label}
                  </span>
                  <button
                    onClick={() => supprimer(q.id)}
                    className="text-xs text-[#94A3B8] hover:text-red-600"
                  >
                    Suppr.
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="rounded-xl border border-dashed border-[#E6EAF0] bg-[#FBFCFE] px-4 py-3 text-sm text-[#94A3B8]">
        <strong className="text-[#64748B]">Factures</strong> — à venir (générées automatiquement
        depuis les devis acceptés et les entretiens).
      </div>

      <QuoteDrawer quote={editing} onClose={() => setEditing(null)} onSaved={charger} />
    </div>
  );
}
