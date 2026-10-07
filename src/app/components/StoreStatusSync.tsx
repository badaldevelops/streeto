"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function StoreStatusSync({
  initialStatuses,
}: {
  initialStatuses: Record<string, boolean>;
}) {
  const router = useRouter();
  const statusesRef = useRef(initialStatuses);
  const initialSnapshot = JSON.stringify(initialStatuses);

  useEffect(() => {
    statusesRef.current = JSON.parse(initialSnapshot) as Record<string, boolean>;

    async function refreshIfChanged() {
      try {
        const response = await fetch("/api/store-status", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as {
          statuses: Record<string, boolean>;
        };
        const nextStatuses = data.statuses || {};
        const currentStatuses = statusesRef.current;
        const changed = Object.keys(nextStatuses).length !== Object.keys(currentStatuses).length ||
          Object.entries(nextStatuses).some(([id, isOpen]) => currentStatuses[id] !== isOpen);

        if (changed) {
          statusesRef.current = nextStatuses;
          router.refresh();
        }
      } catch (error) {
        console.error("Store status refresh error:", error);
      }
    }

    const timer = window.setInterval(refreshIfChanged, 10_000);
    return () => window.clearInterval(timer);
  }, [initialSnapshot, router]);

  return null;
}
