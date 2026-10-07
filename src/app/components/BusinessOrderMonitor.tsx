"use client";

import { useEffect, useRef, useState } from "react";
import OrderAcceptanceAlert from "@/app/components/OrderAcceptanceAlert";

type IncomingOrder = {
  id: string;
  orderNumber: string;
  type: string;
  total: number;
  createdAt: string;
  customerName: string | null;
  customerPhone: string | null;
  deliveryAddress: string | null;
  outlet: { name: string };
  items: { id: string; quantity: number; totalPrice: number; product: { name: string } }[];
};

export default function BusinessOrderMonitor() {
  const [pendingOrder, setPendingOrder] = useState<IncomingOrder | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const resolved = useRef(new Set<string>());

  useEffect(() => {
    let stopped = false;
    let inFlight = false;
    const load = async () => {
      if (inFlight || document.visibilityState !== "visible") return;
      inFlight = true;
      try {
        const response = await fetch("/api/business-admin/orders", { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json();
        if (stopped) return;
        const next = (data.orders || []).find((order: IncomingOrder & { status: string }) =>
          order.status === "PLACED" && !resolved.current.has(order.id)
        );
        if (next) setPendingOrder(next);
        else setPendingOrder(null);
      } catch (loadError) {
        console.error("Dashboard order monitor failed:", loadError);
      } finally {
        inFlight = false;
      }
    };
    void load();
    const timer = window.setInterval(() => void load(), 4000);
    return () => { stopped = true; window.clearInterval(timer); };
  }, []);

  async function update(status: "ACCEPTED" | "CANCELLED") {
    if (!pendingOrder || busy) return false;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/business-admin/orders/status", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: pendingOrder.id, status }),
      });
      const data = await response.json();
      if (!response.ok) { setError(data.error || "Could not update the order."); return false; }
      resolved.current.add(pendingOrder.id);
      setPendingOrder(null);
      return true;
    } catch {
      setError("Could not update the order. Please try again.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  if (!pendingOrder) return null;
  return <OrderAcceptanceAlert
    order={pendingOrder}
    busy={busy}
    error={error}
    onAccept={() => update("ACCEPTED")}
    onReject={() => update("CANCELLED")}
  />;
}
