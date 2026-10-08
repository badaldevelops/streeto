"use client";

import { useEffect, useState } from "react";
import { enableOrderSounds } from "@/lib/order-notifications";
import { VAPID_PUBLIC_KEY } from "@/lib/push-vapid-public";

type SetupState = "checking" | "waiting" | "ready" | "blocked" | "unsupported" | "paused" | "error";
const soundPreferenceKey = "streeto:admin-order-sound-enabled";
let setupInProgress: Promise<string | null> | null = null;

function isIosDevice() {
  return /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isInstalledOnIos() {
  return isIosDevice() && (window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && (navigator as Navigator & { standalone?: boolean }).standalone === true));
}

function supportsPush() {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

function decodeKey(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const raw = atob((value + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (character) => character.charCodeAt(0));
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

// Call directly from a user interaction. Browsers require this gesture to show
// their permission prompt; the app itself has no permission or sound toggle.
export function prepareBusinessAlertsFromGesture() {
  if (setupInProgress) return setupInProgress;
  if (!supportsPush()) {
    return Promise.resolve("This browser does not support background order alerts.");
  }
  if (isIosDevice() && !isInstalledOnIos()) {
    return Promise.resolve("On iPhone or iPad, install StreetO from Safari using Share → Add to Home Screen, then open it from that icon.");
  }

  const permissionRequest = Notification.permission === "granted"
    ? Promise.resolve<NotificationPermission>("granted")
    : Notification.requestPermission();
  const audioReady = enableOrderSounds();

  setupInProgress = (async () => {
    const permission = await permissionRequest;
    if (permission !== "granted") {
      window.dispatchEvent(new Event("streeto:business-alerts-updated"));
      return permission === "denied"
        ? "Notifications are blocked in this browser or phone settings. Allow them there to receive new order alerts."
        : "Allow notifications in the browser prompt to receive order alerts.";
    }

    const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription() ||
      await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: decodeKey(VAPID_PUBLIC_KEY),
      });
    const result = await saveSubscription(subscription);
    window.dispatchEvent(new Event("streeto:business-alerts-updated"));
    if (await audioReady) {
      try { window.sessionStorage.setItem(soundPreferenceKey, "true"); } catch { /* Session only. */ }
      window.dispatchEvent(new Event("streeto:business-audio-ready"));
    }
    return result.pushConfigured === false
      ? "The device is saved, but the Cloudflare Worker is missing its push key."
      : null;
  })().catch((error) => {
    console.error("Business alert setup failed:", error);
    return error instanceof Error ? error.message : "Could not set up order alerts.";
  }).finally(() => { setupInProgress = null; });

  return setupInProgress;
}

export default function BusinessPushNotifications({ isOpen }: { isOpen: boolean }) {
  const [state, setState] = useState<SetupState>("checking");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    let gestureUsed = false;
    async function restoreSubscription() {
      setMessage("");
      if (!isOpen) {
        setState("paused");
        return;
      }

      try {
        if (!supportsPush()) {
          setState("unsupported");
          return;
        }
        if (Notification.permission === "denied") {
          setState("blocked");
          return;
        }

        const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          const result = await saveSubscription(subscription);
          if (cancelled) return;
          setState("ready");
          if (result.pushConfigured === false) {
            setMessage("Cloudflare is missing the push key needed to send alerts.");
          }
          return;
        }

        setState("waiting");
        if (Notification.permission === "default") {
          setMessage("Tap anywhere on this dashboard once to allow order alerts. Your browser will ask only once.");
        } else {
          setMessage("Tap anywhere on this dashboard once to finish setting up order alerts.");
        }
      } catch (error) {
        if (cancelled) return;
        setState("error");
        setMessage(error instanceof Error ? error.message : "Could not check this device’s alert setup.");
      }
    }

    function onFirstGesture() {
      if (gestureUsed || !isOpen) return;
      gestureUsed = true;
      void prepareBusinessAlertsFromGesture().then((notice) => {
        if (cancelled) return;
        if (notice) setMessage(notice);
        if (supportsPush() && Notification.permission === "denied") setState("blocked");
        else if (supportsPush() && Notification.permission === "granted") void restoreSubscription();
      });
    }

    function onAlertsUpdated() {
      void restoreSubscription();
    }

    window.addEventListener("streeto:business-alerts-updated", onAlertsUpdated);
    void restoreSubscription();
    if (isOpen) {
      window.addEventListener("pointerdown", onFirstGesture, { once: true });
      window.addEventListener("keydown", onFirstGesture, { once: true });
    }
    return () => {
      cancelled = true;
      window.removeEventListener("streeto:business-alerts-updated", onAlertsUpdated);
      window.removeEventListener("pointerdown", onFirstGesture);
      window.removeEventListener("keydown", onFirstGesture);
    };
  }, [isOpen]);

  let guidance = "";
  if (state === "checking") guidance = "Checking this device’s alert setup…";
  if (state === "paused") guidance = "Order alerts are paused while your store is closed.";
  if (state === "waiting") guidance = "Order alerts will activate on this device when setup is complete.";
  if (state === "ready") guidance = "Order alerts are active while your store is open. Set StreetO notifications to Alert and raise notification volume in your phone settings for a louder alert.";
  if (state === "blocked") guidance = "Notifications are blocked for this site. Allow them in browser or phone settings, then reopen this dashboard.";
  if (state === "unsupported") {
    const ios = typeof navigator !== "undefined" && isIosDevice();
    guidance = ios
      ? "Install StreetO from Safari using Share → Add to Home Screen, then open it from that icon. iPhone and iPad need an installed app for background alerts."
      : "Open StreetO directly in Chrome, Edge, Firefox, or Safari. Embedded browsers may not support background alerts.";
  }
  if (state === "error") guidance = "Order alert setup could not be checked.";

  return (
    <section className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">
      <h2 className="font-black text-blue-950">New order alerts</h2>
      <p aria-live="polite" className="mt-1 text-sm leading-5 text-blue-800">{message || guidance}</p>
    </section>
  );
}
