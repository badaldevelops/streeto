"use client";

import { useEffect, useState } from "react";
import { VAPID_PUBLIC_KEY } from "@/lib/push-vapid-public";

function decodeKey(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const raw = atob((value + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (character) => character.charCodeAt(0));
}

export default function BusinessPushNotifications() {
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    void navigator.serviceWorker.register("/sw.js").then(async (registration) => {
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) return;
      const response = await fetch("/api/business-admin/push-subscription", { cache: "no-store" });
      if (response.ok) setEnabled(Boolean((await response.json()).enabled));
    }).catch((error) => console.error("Business notifications setup failed:", error));
  }, []);

  async function toggleNotifications() {
    setBusy(true);
    setMessage("");
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        throw new Error("This browser does not support background notifications.");
      }
      const registration = await navigator.serviceWorker.register("/sw.js");
      const current = await registration.pushManager.getSubscription();
      if (enabled && current) {
        const response = await fetch("/api/business-admin/push-subscription", {
          method: "DELETE", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: current.endpoint }),
        });
        if (!response.ok) throw new Error("Could not disable notifications.");
        await current.unsubscribe();
        setEnabled(false);
        setMessage("Background order alerts are off.");
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") throw new Error("Allow notifications in your browser settings to receive order alerts.");
      const subscription = current || await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: decodeKey(VAPID_PUBLIC_KEY),
      });
      const response = await fetch("/api/business-admin/push-subscription", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription),
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Could not save this device.");
      }
      setEnabled(true);
      setMessage("Background order alerts are enabled on this device.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not enable notifications.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4 sm:flex sm:items-center sm:justify-between sm:gap-4">
      <div>
        <h2 className="font-black text-blue-950">Order alerts when the screen is off</h2>
        <p className="mt-1 text-sm leading-5 text-blue-800">Allow notifications for this device. Your phone uses its notification sound and vibration settings.</p>
        {message && <p aria-live="polite" className="mt-2 text-sm font-semibold text-blue-900">{message}</p>}
      </div>
      <button type="button" onClick={() => void toggleNotifications()} disabled={busy} className="mt-3 min-h-11 shrink-0 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-extrabold text-white hover:bg-blue-800 disabled:opacity-60 sm:mt-0">
        {busy ? "Please wait…" : enabled ? "Turn off device alerts" : "Enable device alerts"}
      </button>
    </section>
  );
}
