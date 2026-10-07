"use client";

import { useEffect, useState } from "react";
import {
  enableOrderSounds,
  playNewOrderSound,
} from "@/lib/order-notifications";

export default function OrderSoundControl({
  active = false,
  label = "order",
  variant = "header",
}: {
  active?: boolean;
  label?: string;
  variant?: "header" | "light";
}) {
  const [enabled, setEnabled] = useState(false);
  const [unsupported, setUnsupported] = useState(false);
  const buttonStyle =
    variant === "light"
      ? enabled
        ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
        : "bg-orange-50 text-orange-700 hover:bg-orange-100"
      : enabled
        ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
        : "bg-white/15 text-white backdrop-blur hover:bg-white/25";
  const helpTextStyle =
    variant === "light" ? "text-gray-600" : "text-white";

  useEffect(() => {
    if (!enabled || !active) {
      return;
    }

    playNewOrderSound();
    const interval = window.setInterval(playNewOrderSound, 1600);

    return () => window.clearInterval(interval);
  }, [active, enabled]);

  async function toggleSound() {
    if (enabled) {
      setEnabled(false);
      return;
    }

    let ready = false;
    try {
      ready = await enableOrderSounds();
    } catch {
      ready = false;
    }
    setUnsupported(!ready);
    setEnabled(ready);
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={toggleSound}
        aria-pressed={enabled}
        className={`rounded-xl px-4 py-3 text-sm font-extrabold shadow-sm transition ${buttonStyle}`}
      >
        {enabled ? `🔊 ${label} sound on` : `🔕 Enable ${label} sound`}
      </button>
      {unsupported && (
        <span className={`text-xs font-semibold ${helpTextStyle}`}>
          Sound is unavailable in this browser.
        </span>
      )}
    </div>
  );
}
