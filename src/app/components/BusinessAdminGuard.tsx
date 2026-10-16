"use client";

import { useEffect, useState } from "react";

export default function BusinessAdminGuard({ children }: { children: React.ReactNode }) {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/me", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!active) return;
        if (!response.ok || !data.authenticated) {
          window.location.replace("https://business.qtoo.in/business-login");
          return;
        }
        if (data.user?.role !== "BUSINESS_ADMIN") {
          const destination = data.user?.role === "SUPER_ADMIN"
            ? "https://admin.qtoo.in/admin"
            : data.user?.role === "DELIVERY_STAFF"
              ? "https://qtoo.in/delivery"
              : "https://qtoo.in/";
          window.location.replace(destination);
          return;
        }
        setAllowed(true);
      })
      .catch(() => {
        if (active) window.location.replace("https://business.qtoo.in/business-login");
      });
    return () => { active = false; };
  }, []);

  if (!allowed) {
    return <main className="flex min-h-screen items-center justify-center bg-[#fffaf5] text-sm font-semibold text-gray-600">Checking your business account…</main>;
  }

  return children;
}
