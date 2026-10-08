"use client";

import { useEffect, useState } from "react";
import { enableOrderSounds, playNewOrderSound } from "@/lib/order-notifications";

const adminSoundPreferenceKey = "streeto:admin-order-sound-enabled";

export default function OrderSoundControl({ active }: { active: boolean }) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!active) {
      setEnabled(false);
      return;
    }

    async function activateFromSavedGesture() {
      let saved = false;
      try {
        saved = window.sessionStorage.getItem(adminSoundPreferenceKey) === "true";
      } catch {
        // Sound remains unavailable if the browser blocks session storage.
      }
      if (!saved) return;
      const ready = await enableOrderSounds();
      if (!cancelled) setEnabled(ready);
    }
    const onAudioReady = () => { void activateFromSavedGesture(); };
    window.addEventListener("streeto:business-audio-ready", onAudioReady);
    void activateFromSavedGesture();
    return () => {
      cancelled = true;
      window.removeEventListener("streeto:business-audio-ready", onAudioReady);
    };
  }, [active]);

  useEffect(() => {
    if (!active || !enabled) return;
    playNewOrderSound();
    const interval = window.setInterval(playNewOrderSound, 2400);
    return () => window.clearInterval(interval);
  }, [active, enabled]);

  if (!active || !enabled) return null;
  return <p className="text-center text-xs font-semibold text-gray-500">Phone style alert rings until you accept or reject.</p>;
}
