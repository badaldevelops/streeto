"use client";

import { useEffect, useRef, useState } from "react";
import {
  customerOrderTrackedEvent,
  playOrderConfirmedSound,
  readTrackedCustomerOrders,
  saveTrackedCustomerOrders,
  type TrackedCustomerOrder,
} from "@/lib/order-notifications";

type CustomerOrderStatus = {
  id: string;
  status: string;
};

export default function CustomerOrderSoundMonitor() {
  const trackedOrders = useRef<TrackedCustomerOrder[]>([]);
  const requestInFlight = useRef(false);
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    function syncTrackedOrders() {
      trackedOrders.current = readTrackedCustomerOrders();
      setIsTracking(trackedOrders.current.length > 0);
    }

    function syncFromStorage(event: StorageEvent) {
      if (event.key === "streeto:orders-awaiting-confirmation") {
        syncTrackedOrders();
      }
    }

    syncTrackedOrders();
    window.addEventListener(customerOrderTrackedEvent, syncTrackedOrders);
    window.addEventListener("storage", syncFromStorage);

    return () => {
      window.removeEventListener(
        customerOrderTrackedEvent,
        syncTrackedOrders
      );
      window.removeEventListener("storage", syncFromStorage);
    };
  }, []);

  useEffect(() => {
    if (!isTracking) {
      return;
    }

    let stopped = false;

    async function checkTrackedOrders() {
      if (requestInFlight.current || trackedOrders.current.length === 0) {
        return;
      }

      requestInFlight.current = true;

      try {
        const checkedOrders = trackedOrders.current.slice(0, 25);
        const checkedOrderIds = new Set(
          checkedOrders.map((order) => order.id)
        );
        const orderIds = checkedOrders
          .map((order) => order.id)
          .join(",");
        const response = await fetch(
          `/api/my-orders?orderIds=${encodeURIComponent(orderIds)}`,
          { cache: "no-store" }
        );

        if (!response.ok) {
          return;
        }

        const data = await response.json();
        const statuses = new Map<string, string>(
          (data.orders as CustomerOrderStatus[]).map((order) => [
            order.id,
            order.status,
          ])
        );
        const now = Date.now();
        const maxAge = 7 * 24 * 60 * 60 * 1000;
        const remaining = trackedOrders.current.filter((tracked) => {
          if (!checkedOrderIds.has(tracked.id)) {
            return now - tracked.trackedAt < maxAge;
          }

          const status = statuses.get(tracked.id);

          if (status && status !== "PLACED") {
            if (
              status !== "CANCELLED" &&
              !playOrderConfirmedSound()
            ) {
              return true;
            }
            return false;
          }

          return now - tracked.trackedAt < maxAge;
        });

        if (stopped) {
          return;
        }

        if (remaining.length !== trackedOrders.current.length) {
          trackedOrders.current = remaining;
          saveTrackedCustomerOrders(remaining);
          setIsTracking(remaining.length > 0);
        }
      } catch (error) {
        console.error("Customer order sound check failed:", error);
      } finally {
        requestInFlight.current = false;
      }
    }

    void checkTrackedOrders();
    const interval = window.setInterval(() => {
      void checkTrackedOrders();
    }, 5000);

    return () => {
      stopped = true;
      window.clearInterval(interval);
    };
  }, [isTracking]);

  return null;
}
