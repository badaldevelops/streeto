"use client";

import { useEffect, useState } from "react";

type CashfreeCheckoutResult = {
  error?: { message?: string };
  redirect?: boolean;
  paymentDetails?: { paymentMessage?: string };
};

type CashfreeCheckoutClient = {
  checkout(options: { paymentSessionId: string; redirectTarget: "_self" }): Promise<CashfreeCheckoutResult>;
};

declare global {
  interface Window {
    Cashfree?: (options: { mode: "sandbox" | "production" }) => CashfreeCheckoutClient;
  }
}

function loadCashfreeSdk() {
  if (window.Cashfree) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-cashfree-sdk="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Cashfree checkout could not load.")), { once: true });
      if (window.Cashfree) resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    script.async = true;
    script.dataset.cashfreeSdk = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Cashfree checkout could not load."));
    document.head.appendChild(script);
  });
}

export default function CashfreePayButton({
  paymentSessionId,
  mode,
  compact = false,
  autoStart = false,
}: {
  paymentSessionId: string;
  mode: "sandbox" | "production";
  compact?: boolean;
  autoStart?: boolean;
}) {
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState("");

  async function openCheckout() {
    if (opening) return;
    setOpening(true);
    setError("");
    try {
      await loadCashfreeSdk();
      if (!window.Cashfree) throw new Error("Cashfree checkout is unavailable. Please try again.");
      const cashfree = window.Cashfree({ mode });
      const result = await cashfree.checkout({ paymentSessionId, redirectTarget: "_self" });
      if (result?.error) setError(result.error.message || "Payment could not be started. Please try again.");
      else if (!result?.redirect && !result?.paymentDetails) setError("Payment options did not open. Please try again.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to open secure checkout.");
    } finally {
      setOpening(false);
    }
  }

  useEffect(() => {
    if (autoStart) void openCheckout();
    // Auto-start once for each new payment session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, paymentSessionId, mode]);

  return (
    <div className={compact ? "mt-2" : "mt-5"}>
      {mode === "sandbox" && <p className="mb-2 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-800">Cashfree test mode: this checkout will not transfer real money.</p>}
      {(!autoStart || error) && <button type="button" onClick={() => void openCheckout()} disabled={opening} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-green-700 px-5 py-3 font-extrabold text-white shadow-sm transition hover:bg-green-800 disabled:cursor-wait disabled:opacity-60">
        {opening ? "Opening payment options…" : autoStart ? "Retry payment" : "Pay securely with Cashfree"}
        {!opening && <span aria-hidden="true">→</span>}
      </button>}
      {error && <p role="alert" className="mt-2 text-sm font-semibold text-red-700">{error}</p>}
    </div>
  );
}
