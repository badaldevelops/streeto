"use client";

import { useEffect, useState } from "react";
import {
  enableOrderSounds,
  playNewOrderSound,
} from "@/lib/order-notifications";

const adminSoundPreferenceKey = "streeto:admin-order-sound-enabled";

export default function OrderSoundControl({
  active = false,
  label = "order",
}: {
  active?: boolean;
  label?: string;
}) {
  const [enabled, setEnabled] = useState(false);
  const [unsupported, setUnsupported] = useState(false);
  useEffect(() => {
    try {
      if (
        window.sessionStorage.getItem(adminSoundPreferenceKey) === "true"
      ) {
        void enableOrderSounds().then((ready) => {
          setEnabled(ready);
          if (!ready) {
            try {
              window.sessionStorage.removeItem(adminSoundPreferenceKey);
            } catch {
              // The sound toggle will start disabled for this page.
            }
          }
        });
      }
    } catch {
      // Keep sound controls usable if session storage is unavailable.
    }
  }, []);

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
      try {
        window.sessionStorage.removeItem(adminSoundPreferenceKey);
      } catch {
        // The sound can still be disabled for the current page.
      }
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
    if (ready) {
      try {
        window.sessionStorage.setItem(adminSoundPreferenceKey, "true");
      } catch {
        // The preference only persists for this page when storage is blocked.
      }
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={toggleSound}
        aria-pressed={enabled}
        className={`rounded-xl px-4 py-3 text-sm font-extrabold shadow-sm transition ${
          enabled
            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
            : "bg-white/15 text-white backdrop-blur hover:bg-white/25"
        }`}
      >
        {enabled ? `🔊 ${label} sound on` : `🔕 Enable ${label} sound`}
      </button>
      {unsupported && (
        <span className="text-xs font-semibold text-white">
          Sound is unavailable in this browser.
        </span>
      )}
    </div>
  );
}
