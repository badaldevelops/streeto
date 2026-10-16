"use client";

import { useEffect } from "react";
import { enableOrderSounds } from "@/lib/order-notifications";

export default function BusinessAudioUnlock() {
  useEffect(() => {
    let unlocked = false;
    const unlock = () => {
      if (unlocked) return;
      void enableOrderSounds().then((ready) => {
        if (!ready) return;
        unlocked = true;
        window.dispatchEvent(new Event("streeto:business-audio-ready"));
        window.removeEventListener("pointerdown", unlock);
        window.removeEventListener("keydown", unlock);
      });
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  return null;
}
