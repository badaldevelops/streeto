"use client";

import { useEffect, useRef, useState } from "react";
import {
  customerOrderTrackedEvent,
  enableOrderSounds,
  playOrderStatusSound,
  readTrackedCustomerOrders,
  saveTrackedCustomerOrders,
  type TrackedCustomerOrder,
} from "@/lib/order-notifications";

type CustomerOrderStatus = {
  id: string;
  orderNumber: string;
  type: string;
  status: string;
};

type ReadyOrderNotice = Pick<CustomerOrderStatus, "id" | "orderNumber" | "type">;

const dismissedReadyOrdersKey = "streeto:ready-orders-dismissed";

function readDismissedReadyOrderIds() {
  try {
    const saved = window.localStorage.getItem(dismissedReadyOrdersKey);
    const parsed: unknown = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

export default function CustomerOrderSoundMonitor() {
  const trackedOrders = useRef<TrackedCustomerOrder[]>([]);
  const requestInFlight = useRef(false);
  const [isTracking, setIsTracking] = useState(false);
  const [readyNotification, setReadyNotification] = useState<ReadyOrderNotice | null>(null);

  useEffect(() => {
    function enableOnCustomerInteraction() {
      void enableOrderSounds().then((ready) => {
        if (ready) {
          window.removeEventListener(
            "pointerdown",
            enableOnCustomerInteraction
          );
          window.removeEventListener(
            "keydown",
            enableOnCustomerInteraction
          );
        }
      });
    }

    window.addEventListener("pointerdown", enableOnCustomerInteraction);
    window.addEventListener("keydown", enableOnCustomerInteraction);

    return () => {
      window.removeEventListener(
        "pointerdown",
        enableOnCustomerInteraction
      );
      window.removeEventListener("keydown", enableOnCustomerInteraction);
    };
  }, []);

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
        const orderDetails = new Map<string, CustomerOrderStatus>(
          (data.orders as CustomerOrderStatus[]).map((order) => [order.id, order])
        );
        const dismissedReadyOrderIds = new Set(readDismissedReadyOrderIds());
        const readyOrder = checkedOrders
          .map((tracked) => orderDetails.get(tracked.id))
          .find(
            (order) =>
              order?.status === "READY" &&
              !dismissedReadyOrderIds.has(order.id)
          );

        if (readyOrder) {
          setReadyNotification((current) => current ?? {
            id: readyOrder.id,
            orderNumber: readyOrder.orderNumber,
            type: readyOrder.type,
          });
        }

        const now = Date.now();
        const maxAge = 7 * 24 * 60 * 60 * 1000;
        const updatedTrackedOrders = trackedOrders.current.flatMap((tracked) => {
          if (!checkedOrderIds.has(tracked.id)) {
            return now - tracked.trackedAt < maxAge ? [tracked] : [];
          }

          const status = statuses.get(tracked.id);

          if (!status) {
            return now - tracked.trackedAt < maxAge ? [tracked] : [];
          }

          let lastStatus = tracked.lastStatus;

          if (!lastStatus) {
            lastStatus = status;
          } else if (lastStatus !== status) {
            playOrderStatusSound();
            lastStatus = status;
          }

          if (
            (status === "CANCELLED" || status === "COMPLETED") &&
            lastStatus === status
          ) {
            return [];
          }

          return now - tracked.trackedAt < maxAge
            ? [{ ...tracked, lastStatus }]
            : [];
        });

        if (stopped) {
          return;
        }

        if (
          JSON.stringify(updatedTrackedOrders) !==
          JSON.stringify(trackedOrders.current)
        ) {
          trackedOrders.current = updatedTrackedOrders;
          saveTrackedCustomerOrders(updatedTrackedOrders);
          setIsTracking(updatedTrackedOrders.length > 0);
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

  function dismissReadyNotification() {
    if (!readyNotification) {
      return;
    }

    const dismissed = new Set(readDismissedReadyOrderIds());
    dismissed.add(readyNotification.id);
    try {
      window.localStorage.setItem(
        dismissedReadyOrdersKey,
        JSON.stringify(Array.from(dismissed).slice(-100))
      );
    } catch {
      // The customer can still dismiss the popup if storage is unavailable.
    }
    setReadyNotification(null);
  }

  return readyNotification ? (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <section
        aria-labelledby="customer-order-ready-title"
        aria-modal="true"
        className="w-full max-w-md overflow-hidden rounded-[28px] bg-white shadow-2xl"
        role="dialog"
      >
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-6 text-white">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-3xl" aria-hidden="true">
            ✓
          </div>
          <p className="mt-4 text-xs font-black uppercase tracking-[0.16em] text-emerald-100">
            Order #{readyNotification.orderNumber}
          </p>
          <h2 id="customer-order-ready-title" className="mt-1 text-3xl font-black">
            Your order is ready!
          </h2>
        </div>
        <div className="p-6">
          <p className="text-base font-semibold leading-7 text-gray-700">
            {readyNotification.type === "SELF_RECEIVE"
              ? "Please collect your order from the outlet. Show your order number when you arrive."
              : "Your order is ready and will be handed over for delivery shortly."}
          </p>
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-extrabold text-gray-700 transition hover:bg-gray-50"
              onClick={dismissReadyNotification}
              type="button"
            >
              Got it
            </button>
            <a
              className="rounded-xl bg-orange-500 px-5 py-3 text-center text-sm font-extrabold text-white transition hover:bg-orange-600"
              href="/my-orders"
              onClick={dismissReadyNotification}
            >
              View order details
            </a>
          </div>
        </div>
      </section>
    </div>
  ) : null;
}
