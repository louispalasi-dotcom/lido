import { supabase } from "./supabase";

// Clé VAPID publique (la privée reste uniquement dans l'Edge Function).
export const VAPID_PUBLIC =
  "BGU14N3kVR99bK4AxBvc5IpTBX2_PB8_BuimfwDwO8oVD0a5ZQifZlKsikQzDrJDc5a_XVghk10OP6TYrRmpa4o";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function isIOS(): boolean {
  return typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const nav = navigator as unknown as { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}

export function notifPermission(): NotificationPermission | "unsupported" {
  if (typeof Notification === "undefined") return "unsupported";
  return Notification.permission;
}

export async function enablePush(): Promise<"ok" | "denied" | "unsupported"> {
  if (!pushSupported()) return "unsupported";
  const perm = await Notification.requestPermission();
  if (perm !== "granted") return "denied";
  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC) as unknown as BufferSource,
    });
  }
  const j = sub.toJSON();
  if (j.endpoint && j.keys) {
    await supabase
      .from("push_subscriptions")
      .upsert(
        { endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth },
        { onConflict: "endpoint" }
      );
  }
  return "ok";
}

// Déclenche une notification push côté serveur (fire-and-forget, n'échoue jamais l'UI).
export async function notify(title: string, body: string, url?: string): Promise<void> {
  try {
    await supabase.functions.invoke("send-push", { body: { title, body, url } });
  } catch {
    /* ignore */
  }
}
