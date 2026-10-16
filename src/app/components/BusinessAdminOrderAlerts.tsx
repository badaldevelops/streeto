"use client";

import { useEffect, useState } from "react";
import BusinessOrderMonitor from "@/app/components/BusinessOrderMonitor";

export default function BusinessAdminOrderAlerts() {
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let inFlight = false;

    async function refreshStoreStatus() {
      if (inFlight) return;
      inFlight = true;

      try {
        const companyResponse = await fetch("/api/business-admin/company", {
          cache: "no-store",
        });

        if (cancelled) return;
        if (!companyResponse.ok) {
          setAuthorized(false);
          return;
        }

        setAuthorized(true);
      } catch {
        // Keep the last known authorization and store state during transient errors.
      } finally {
        inFlight = false;
      }
    }

    function refreshWhenVisible() {
      if (document.visibilityState === "visible") {
        void refreshStoreStatus();
      }
    }

    void refreshStoreStatus();
    const interval = window.setInterval(() => void refreshStoreStatus(), 30_000);
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, []);

  if (!authorized) return null;

  return <BusinessOrderMonitor />;
}
