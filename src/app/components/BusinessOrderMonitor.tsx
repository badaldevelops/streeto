"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import OrderAcceptanceAlert from "@/app/components/OrderAcceptanceAlert";

const seenOrdersKey = "streeto:business-alerts-seen-orders";

type IncomingOrder = {
  id: string;
  orderNumber: string;
  type: string;
  total: number;
  createdAt: string;
  queueNumber: number | null;
  customizationNote: string | null;
  outlet: { name: string };
  items: { id: string; quantity: number; totalPrice: number; addOns: unknown; product: { name: string } }[];
};

export default function BusinessOrderMonitor() {
  const router = useRouter();
  const [pendingOrder, setPendingOrder] = useState<IncomingOrder | null>(null);
  const seenOrderIds = useRef(new Set<string>());
  const hasInitialized = useRef(false);

  useEffect(() => {
    let stopped = false;
    let inFlight = false;
    try {
      const saved = JSON.parse(window.localStorage.getItem(seenOrdersKey) || "[]");
      if (Array.isArray(saved)) {
        seenOrderIds.current = new Set(saved.filter((id): id is string => typeof id === "string"));
      }
    } catch {
      seenOrderIds.current = new Set();
    }

    const load = async () => {
      if (inFlight || document.visibilityState !== "visible") return;
      inFlight = true;
      try {
        const response = await fetch("/api/business-admin/orders?pending=1", { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json();
        if (stopped) return;
        const pendingOrders = (data.orders || []).filter((order: IncomingOrder & { status: string }) =>
          ["ACCEPTED", "PREPARING", "READY"].includes(order.status) &&
          !seenOrderIds.current.has(order.id)
        );
        // The first successful fetch is a baseline: orders that were already
        // accepted before this business session must not replay as new alerts.
        if (!hasInitialized.current) {
          hasInitialized.current = true;
          for (const order of pendingOrders) seenOrderIds.current.add(order.id);
          try {
            window.localStorage.setItem(seenOrdersKey, JSON.stringify(Array.from(seenOrderIds.current).slice(-200)));
          } catch {
            // The in-memory baseline still prevents duplicate alerts in this session.
          }
          return;
        }
        const next = pendingOrders[0];
        setPendingOrder((current) => {
          return current || next || null;
        });
      } catch (loadError) {
        console.error("Dashboard order monitor failed:", loadError);
      } finally {
        inFlight = false;
      }
    };
    const refreshForPaidOrder = (event: MessageEvent) => {
      if (event.data?.type === "QTOO_NEW_ORDER_PAID") void load();
    };
    void load();
    const timer = window.setInterval(() => void load(), 4000);
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", refreshWhenVisible);
    window.addEventListener("focus", refreshWhenVisible);
    navigator.serviceWorker?.addEventListener("message", refreshForPaidOrder);
    return () => {
      stopped = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      window.removeEventListener("focus", refreshWhenVisible);
      navigator.serviceWorker?.removeEventListener("message", refreshForPaidOrder);
    };
  }, []);

  const dismiss = useCallback(() => {
    if (!pendingOrder) return;
    seenOrderIds.current.add(pendingOrder.id);
    try {
      window.localStorage.setItem(seenOrdersKey, JSON.stringify(Array.from(seenOrderIds.current).slice(-200)));
    } catch {
      // The current page can still dismiss alerts when storage is unavailable.
    }
    setPendingOrder(null);
    router.push("/business-admin/orders");
  }, [pendingOrder, router]);

  if (!pendingOrder) return null;
  return <OrderAcceptanceAlert
    order={pendingOrder}
    soundActive
    onDismiss={dismiss}
  />;
}
