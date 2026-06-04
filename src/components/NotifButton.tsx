"use client";

import { useEffect, useState } from "react";
import {
  enablePush,
  notifPermission,
  pushSupported,
  isIOS,
  isStandalone,
} from "@/lib/push";

export default function NotifButton() {
  const [perm, setPerm] = useState<string>("default");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setPerm(notifPermission());
    setReady(true);
  }, []);

  if (!ready) return null;

  const cls =
    "rounded-lg border border-[#E6EAF0] px-2.5 py-1.5 text-sm hover:bg-[#F8FAFC]";

  // iPhone non installé : la dictée push n'est possible qu'en app installée.
  if (isIOS() && !isStandalone()) {
    return (
      <button
        onClick={() =>
          alert(
            "Pour recevoir les notifications sur iPhone :\n\n1) Bouton Partager (carré avec flèche)\n2) « Sur l'écran d'accueil »\n3) Ouvre Lido depuis cette nouvelle icône\n4) Reviens ici et active les notifications"
          )
        }
        className={cls}
        title="Notifications (iPhone)"
      >
        🔔
      </button>
    );
  }

  if (!pushSupported()) return null;

  if (perm === "granted") {
    return (
      <span className={`${cls} text-[#15803D]`} title="Notifications activées">
        🔔
      </span>
    );
  }

  async function activer() {
    const r = await enablePush();
    setPerm(notifPermission());
    if (r === "denied") {
      alert("Notifications refusées. Tu peux les réautoriser dans les réglages du navigateur.");
    } else if (r === "ok") {
      alert("Notifications activées ✅");
    }
  }

  return (
    <button onClick={activer} className={cls} title="Activer les notifications">
      🔔
    </button>
  );
}
