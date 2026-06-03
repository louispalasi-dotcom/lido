"use client";

import { useEffect, useRef, useState } from "react";

// Typage minimal de la Web Speech API (non incluse dans les types TS standard).
interface SRAlternative {
  transcript: string;
}
interface SRResult {
  isFinal: boolean;
  0: SRAlternative;
}
interface SRResultList {
  length: number;
  [index: number]: SRResult;
}
interface SREvent {
  resultIndex: number;
  results: SRResultList;
}
interface SpeechRec {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: SREvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}
type SRConstructor = new () => SpeechRec;

function getCtor(): SRConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SRConstructor;
    webkitSpeechRecognition?: SRConstructor;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

// Bouton de dictée vocale. Le texte reconnu est transmis via onText (à ajouter
// au champ). Ne s'affiche pas si le navigateur ne supporte pas la dictée.
export default function MicButton({
  onText,
  lang = "fr-FR",
}: {
  onText: (text: string) => void;
  lang?: string;
}) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recRef = useRef<SpeechRec | null>(null);

  useEffect(() => {
    setSupported(!!getCtor());
    return () => {
      try {
        recRef.current?.stop();
      } catch {
        /* ignore */
      }
    };
  }, []);

  function toggle() {
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const Ctor = getCtor();
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (e: SREvent) => {
      let txt = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) txt += r[0].transcript;
      }
      if (txt.trim()) onText(txt.trim());
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  }

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      title={listening ? "Arrêter la dictée" : "Dictée vocale"}
      aria-label={listening ? "Arrêter la dictée" : "Dictée vocale"}
      className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm shadow-sm transition ${
        listening
          ? "animate-pulse border-red-300 bg-red-500 text-white"
          : "border-[#E6EAF0] bg-white text-[#0B7A87] hover:bg-[#F0FBFC]"
      }`}
    >
      {listening ? "■" : "🎤"}
    </button>
  );
}
