"use client";

import { useEffect, useState } from "react";
import { enableOrderSounds, playNewOrderSound } from "@/lib/order-notifications";

export default function OrderSoundControl({ active }: { active: boolean }) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!active) {
      setEnabled(false);
      return;
    }

    async function activate() {
      const ready = await enableOrderSounds();
      if (!cancelled) setEnabled(ready);
    }
    const onAudioReady = () => { void activate(); };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void activate();
    };
    window.addEventListener("streeto:business-audio-ready", onAudioReady);
    window.addEventListener("focus", onAudioReady);
    document.addEventListener("visibilitychange", onVisibilityChange);
    // Attempt playback setup as soon as the incoming-order popup mounts.
    void activate();
    return () => {
      cancelled = true;
      window.removeEventListener("streeto:business-audio-ready", onAudioReady);
      window.removeEventListener("focus", onAudioReady);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [active]);

  useEffect(() => {
    if (!active || !enabled) return;
    playNewOrderSound();
    const interval = window.setInterval(playNewOrderSound, 2400);
    return () => window.clearInterval(interval);
  }, [active, enabled]);

  if (!active || !enabled) return null;
  return <p className="text-center text-xs font-semibold text-gray-500">Order alert sound will ring while this confirmed-order popup is open.</p>;
}
