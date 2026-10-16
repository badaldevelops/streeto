"use client";

import { useEffect, useState } from "react";

type InstallPromptChoice = { outcome: "accepted" | "dismissed"; platform: string };
type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<InstallPromptChoice>;
};

function isIos() {
  return /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export default function InstallQtooButton() {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(true);
  const [instructionsOpen, setInstructionsOpen] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator && (navigator as Navigator & { standalone?: boolean }).standalone === true);
    setIsInstalled(standalone);

    function captureInstallPrompt(event: Event) {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
    }

    function markInstalled() {
      setIsInstalled(true);
      setInstructionsOpen(false);
      setPromptEvent(null);
    }

    window.addEventListener("beforeinstallprompt", captureInstallPrompt);
    window.addEventListener("appinstalled", markInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", captureInstallPrompt);
      window.removeEventListener("appinstalled", markInstalled);
    };
  }, []);

  if (isInstalled) return null;

  async function install() {
    if (!promptEvent) {
      setInstructionsOpen(true);
      return;
    }
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice.outcome === "accepted") setIsInstalled(true);
    setPromptEvent(null);
  }

  return (
    <>
      <button
        type="button"
        onClick={install}
        className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-extrabold text-white backdrop-blur transition hover:bg-white/20 sm:rounded-2xl sm:px-6 sm:py-3.5"
      >
        Install Qtoo
      </button>

      {instructionsOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-3 sm:items-center" onClick={() => setInstructionsOpen(false)}>
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="install-qtoo-title"
            className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="install-qtoo-title" className="text-xl font-black text-gray-950">Add Qtoo to your Home Screen</h2>
                <p className="mt-1 text-sm text-gray-500">Open Qtoo like an app for quicker access.</p>
              </div>
              <button type="button" aria-label="Close install instructions" onClick={() => setInstructionsOpen(false)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-lg font-bold text-gray-600">×</button>
            </div>
            {isIos() ? (
              <ol className="mt-5 grid gap-3 text-sm font-semibold text-gray-700">
                <li className="rounded-2xl bg-orange-50 p-3">1. Open qtoo.in in Safari.</li>
                <li className="rounded-2xl bg-orange-50 p-3">2. Tap Share <span aria-label="Share">↑</span> at the bottom.</li>
                <li className="rounded-2xl bg-orange-50 p-3">3. Choose “Add to Home Screen”, then tap “Add”.</li>
              </ol>
            ) : (
              <ol className="mt-5 grid gap-3 text-sm font-semibold text-gray-700">
                <li className="rounded-2xl bg-orange-50 p-3">1. Open qtoo.in in Chrome.</li>
                <li className="rounded-2xl bg-orange-50 p-3">2. Tap the ⋮ menu at the top.</li>
                <li className="rounded-2xl bg-orange-50 p-3">3. Choose “Install app” or “Add to Home screen”.</li>
              </ol>
            )}
            <button type="button" onClick={() => setInstructionsOpen(false)} className="mt-5 min-h-11 w-full rounded-xl bg-gray-950 px-4 text-sm font-extrabold text-white">Got it</button>
          </section>
        </div>
      )}
    </>
  );
}
