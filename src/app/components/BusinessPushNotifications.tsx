"use client";

import { useEffect, useState } from "react";
import { VAPID_PUBLIC_KEY } from "@/lib/push-vapid-public";

type SetupState = "checking" | "needs-setup" | "enabled" | "denied" | "unsupported" | "error";

function isIosDevice() {
  return /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function decodeKey(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const raw = atob((value + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (character) => character.charCodeAt(0));
}

function isInstalledOnIos() {
  return isIosDevice() && (window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && (navigator as Navigator & { standalone?: boolean }).standalone === true));
}

function supportsPush() {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

async function saveSubscription(subscription: PushSubscription) {
  const response = await fetch("/api/business-admin/push-subscription", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "Could not save this device.");
  return result as { pushConfigured?: boolean };
}

export default function BusinessPushNotifications() {
  const [state, setState] = useState<SetupState>("checking");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function restoreSubscription() {
      try {
        if (!supportsPush()) {
          setState("unsupported");
          return;
        }
        if (Notification.permission === "denied") {
          setState("denied");
          return;
        }

        const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
          setState("needs-setup");
          return;
        }

        // Browser permissions and PushSubscriptions survive page reloads. Sync the
        // saved subscription back to our server whenever the admin opens the app.
        const result = await saveSubscription(subscription);
        if (cancelled) return;
        setState("enabled");
        if (result.pushConfigured === false) {
          setMessage("This device is saved, but the Cloudflare Worker is missing its push key. Add the push key in Cloudflare to send order alerts.");
        }
      } catch (error) {
        if (cancelled) return;
        console.error("Business notifications setup failed:", error);
        setState("error");
        setMessage(error instanceof Error ? error.message : "Could not restore order alerts on this device.");
      }
    }

    void restoreSubscription();
    return () => { cancelled = true; };
  }, []);

  async function enableNotifications() {
    setBusy(true);
    setMessage("");
    try {
      if (!supportsPush()) {
        setState("unsupported");
        return;
      }
      if (/iPhone|iPad|iPod/.test(navigator.userAgent) && !isInstalledOnIos()) {
        setMessage("On iPhone or iPad, add StreetO to your Home Screen and open it from that icon before setting up background alerts.");
        return;
      }

      const permission = Notification.permission === "granted"
        ? "granted"
        : await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "needs-setup");
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription() ||
        await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: decodeKey(VAPID_PUBLIC_KEY),
        });
      const result = await saveSubscription(subscription);
      setState("enabled");
      setMessage(result.pushConfigured === false
        ? "This device is saved, but the Cloudflare Worker is missing its push key. Add the push key in Cloudflare to send order alerts."
        : "Background order alerts are active on this device.");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Could not enable background alerts.");
    } finally {
      setBusy(false);
    }
  }

  let guidance = "Allow notifications once to save this device for background order alerts.";
  if (state === "checking") guidance = "Checking this device’s saved alert setup…";
  if (state === "enabled") guidance = "This device is saved. New orders can alert you while StreetO is closed, subject to your phone’s notification and battery settings.";
  if (state === "denied") guidance = "Notifications are blocked for this site. Allow them in your browser or phone settings, then reopen StreetO.";
  if (state === "unsupported") {
    const ios = typeof navigator !== "undefined" && isIosDevice();
    guidance = ios
      ? "Install StreetO from Safari using Share → Add to Home Screen, then open it from the new icon. iPhone and iPad only support background web push in an installed app."
      : "This browser does not expose background push. Open StreetO in Chrome, Edge, Firefox, or Safari directly; embedded browsers may not support it.";
  }
  if (state === "error" && !message) guidance = "Could not check this device. Reload the dashboard to try again.";

  return (
    <section className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4 sm:flex sm:items-center sm:justify-between sm:gap-4">
      <div>
        <h2 className="font-black text-blue-950">Order alerts when the screen is off</h2>
        <p className="mt-1 text-sm leading-5 text-blue-800">{guidance}</p>
        {message && <p aria-live="polite" className="mt-2 text-sm font-semibold text-blue-900">{message}</p>}
      </div>
      {(state === "needs-setup" || state === "error") && (
        <button type="button" onClick={() => void enableNotifications()} disabled={busy} className="mt-3 min-h-11 shrink-0 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-extrabold text-white hover:bg-blue-800 disabled:opacity-60 sm:mt-0">
          {busy ? "Setting up…" : state === "error" ? "Retry alert setup" : "Set up order alerts"}
        </button>
      )}
    </section>
  );
}
