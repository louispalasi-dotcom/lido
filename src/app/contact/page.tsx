"use client";

import { useCallback, useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import {
  listContactMessages,
  createContactMessage,
  type ContactMessage,
} from "@/lib/contact";

const inputCls =
  "w-full rounded-lg border border-[#E6EAF0] px-3 py-2 text-sm focus:border-[#14B8C4] focus:outline-none";

function ContactView() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sent, setSent] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const charger = useCallback(async () => {
    try {
      setMessages(await listContactMessages());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;
    setSaving(true);
    try {
      await createContactMessage({
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        subject: subject.trim() || null,
        message: message.trim(),
      });
      setName("");
      setEmail("");
      setPhone("");
      setSubject("");
      setMessage("");
      setSent(true);
      charger();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Formulaire */}
      <section className="rounded-2xl border border-[#E6EAF0] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Contact</h2>
        <p className="mb-4 text-sm text-[#64748B]">Une question, une demande ? Écris-nous.</p>

        {sent && (
          <div className="mb-3 rounded-xl border border-[#BBE7CB] bg-[#E7F8EE] px-4 py-2 text-sm text-[#15803D]">
            ✅ Message envoyé, merci !
          </div>
        )}

        <form onSubmit={envoyer} className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input className={inputCls} placeholder="Nom *" value={name} onChange={(e) => setName(e.target.value)} />
            <input className={inputCls} placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input className={inputCls} placeholder="Téléphone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <input className={inputCls} placeholder="Sujet" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <textarea className={inputCls} rows={4} placeholder="Votre message *" value={message} onChange={(e) => setMessage(e.target.value)} />
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[#14B8C4] px-5 py-2 text-sm font-medium text-[#04212e] disabled:opacity-60"
          >
            {saving ? "Envoi…" : "Envoyer"}
          </button>
        </form>
      </section>

      {/* Messages reçus */}
      <section className="rounded-2xl border border-[#E6EAF0] bg-white p-5 shadow-sm">
        <h3 className="mb-4 font-semibold text-[#0A2540]">Messages reçus</h3>
        {loading ? (
          <p className="text-sm text-[#64748B]">Chargement…</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-[#64748B]">Aucun message pour l&apos;instant.</p>
        ) : (
          <ul className="space-y-3">
            {messages.map((m) => (
              <li key={m.id} className="rounded-xl border border-[#F0F2F6] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[#0A2540]">
                    {m.name}
                    {m.subject ? ` · ${m.subject}` : ""}
                  </span>
                  <span className="text-xs text-[#94A3B8]">
                    {new Date(m.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                  </span>
                </div>
                <p className="mt-1 text-sm text-[#64748B]">{m.message}</p>
                <p className="mt-1 text-xs text-[#94A3B8]">
                  {[m.email, m.phone].filter(Boolean).join(" · ")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default function Page() {
  return (
    <AppShell>
      <ContactView />
    </AppShell>
  );
}
