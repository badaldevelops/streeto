"use client";

import { useEffect, useRef, useState } from "react";
import OrderSoundControl from "@/app/components/OrderSoundControl";

type AlertOrder = {
  id: string;
  orderNumber: string;
  type: string;
  total: number;
  createdAt: string;
  customerName: string | null;
  customerPhone: string | null;
  deliveryAddress: string | null;
  customizationNote?: string | null;
  outlet: { name: string };
  items: {
    id: string;
    quantity: number;
    totalPrice: number;
    product: { name: string };
  }[];
};

export default function OrderAcceptanceAlert({
  order,
  busy,
  error,
  soundActive,
  onAccept,
  onReject,
}: {
  order: AlertOrder;
  busy: boolean;
  error: string;
  soundActive: boolean;
  onAccept: () => Promise<boolean>;
  onReject: () => Promise<boolean>;
}) {
  const [progress, setProgress] = useState(0);
  const [showCustomizationNote, setShowCustomizationNote] = useState(false);
  const actionStarted = useRef(false);
  const customerName = order.customerName || "Guest customer";

  useEffect(() => {
    setProgress(0);
    setShowCustomizationNote(false);
    actionStarted.current = false;
  }, [order.id]);

  async function acceptOrder() {
    if (actionStarted.current || busy) {
      return;
    }

    if (order.customizationNote?.trim() && !showCustomizationNote) {
      setProgress(0);
      setShowCustomizationNote(true);
      return;
    }

    actionStarted.current = true;
    const accepted = await onAccept();

    if (!accepted) {
      setProgress(0);
      actionStarted.current = false;
    }
  }

  function changeProgress(value: number) {
    const next = Math.min(100, Math.max(0, value));
    setProgress(next);

    if (next === 100) {
      void acceptOrder();
    }
  }

  async function rejectOrder() {
    if (busy || actionStarted.current) {
      return;
    }

    if (!window.confirm(`Reject order #${order.orderNumber}?`)) {
      return;
    }

    actionStarted.current = true;
    const rejected = await onReject();

    if (!rejected) {
      actionStarted.current = false;
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/75 p-3 backdrop-blur-sm sm:p-6">
      <section
        aria-labelledby={showCustomizationNote ? "customization-note-title" : "new-order-title"}
        aria-modal="true"
        className="my-auto w-full max-w-xl overflow-hidden rounded-[28px] bg-white shadow-2xl"
        role="dialog"
      >
        {!showCustomizationNote && <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 px-6 py-6 text-white sm:px-8">
          <div className="absolute -right-8 -top-12 h-40 w-40 rounded-full bg-white/10" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-black uppercase tracking-wider">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-yellow-300" />
                New order · Waiting for confirmation
              </div>
              <h2
                className="mt-3 text-3xl font-black tracking-tight sm:text-4xl"
                id="new-order-title"
              >
                Order #{order.orderNumber}
              </h2>
              <p className="mt-1 text-sm font-semibold text-emerald-50">
                {order.outlet.name} · {order.type.replaceAll("_", " ")}
              </p>
            </div>
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-3xl">
              🛍️
            </div>
          </div>
        </div>}

        {showCustomizationNote ? (
          <div className="px-5 py-7 sm:px-8">
            <div className="rounded-2xl border-2 border-orange-200 bg-orange-50 p-5 sm:p-6">
              <p id="customization-note-title" className="text-xs font-black uppercase tracking-wider text-orange-800">Customer’s food request · Order #{order.orderNumber}</p>
              <p className="mt-3 whitespace-pre-wrap break-words text-lg font-bold leading-7 text-gray-950">{order.customizationNote}</p>
            </div>
            <p className="mt-4 text-sm font-semibold text-gray-600">Slide below to confirm you’ve seen this request and accept the order.</p>
            {error && <p aria-live="assertive" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
          </div>
        ) : <div className="max-h-[58vh] space-y-5 overflow-y-auto px-5 py-5 sm:px-8">
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-orange-50 p-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Customer
              </p>
              <p className="mt-1 font-extrabold text-gray-950">{customerName}</p>
              {order.customerPhone && (
                <p className="mt-0.5 text-sm font-medium text-gray-600">
                  {order.customerPhone}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Order total
              </p>
              <p className="mt-1 text-2xl font-black text-gray-950">
                ₹{order.total.toFixed(2)}
              </p>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-wider text-gray-500">
              Items in this order
            </p>
            <div className="divide-y divide-gray-100 rounded-2xl border border-gray-100 px-4">
              {order.items.map((item) => (
                <div
                  className="flex items-center justify-between gap-4 py-3"
                  key={item.id}
                >
                  <p className="font-bold text-gray-800">
                    <span className="mr-2 inline-flex min-w-7 justify-center rounded-lg bg-gray-100 px-2 py-1 text-xs font-black text-gray-600">
                      {item.quantity}×
                    </span>
                    {item.product.name}
                  </p>
                  <p className="shrink-0 font-extrabold text-gray-900">
                    ₹{item.totalPrice.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {order.deliveryAddress && (
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-xs font-black uppercase tracking-wider text-blue-700">
                Delivery address
              </p>
              <p className="mt-1 text-sm font-semibold leading-5 text-blue-950">
                {order.deliveryAddress}
              </p>
            </div>
          )}

          {error && (
            <p
              aria-live="assertive"
              className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700"
            >
              {error}
            </p>
          )}
        </div>}

        <div className="border-t border-gray-100 bg-gray-50 px-5 py-5 sm:px-8">
          <p className="mb-2 text-center text-xs font-bold text-gray-500">
            {showCustomizationNote ? "Slide to confirm request and accept" : "Slide to accept this order"}
          </p>
          <div className={`relative h-16 overflow-hidden rounded-full ring-1 ${showCustomizationNote ? "bg-orange-50 ring-orange-100" : "bg-emerald-50 ring-emerald-100"}`}>
            <div
              aria-hidden="true"
              className={`absolute inset-y-1 left-1 rounded-full transition-[width] duration-100 ${showCustomizationNote ? "bg-gradient-to-r from-orange-500 to-red-600" : "bg-gradient-to-r from-emerald-500 to-green-600"}`}
              style={{ width: `${progress}%` }}
            />
            <span className={`pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-14 text-center text-sm font-black ${showCustomizationNote ? "text-orange-950" : "text-emerald-950"}`}>
              {busy ? "Accepting order…" : showCustomizationNote ? "Slide to confirm & accept" : "Slide to accept"}
            </span>
            <input
              aria-label={showCustomizationNote ? "Slide to confirm food request and accept order" : "Slide to accept order"}
              aria-valuetext={progress === 100 ? "Accepting order" : `${progress}%`}
              className="order-accept-slider absolute inset-0 z-20 h-full w-full disabled:cursor-wait"
              disabled={busy}
              max={100}
              min={0}
              onChange={(event) => changeProgress(event.currentTarget.valueAsNumber)}
              type="range"
              value={progress}
            />
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-xs font-medium text-gray-500">
              Accepting confirms the order with the customer.
            </p>
            <button
              className="shrink-0 rounded-xl px-3 py-2 text-sm font-extrabold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
              disabled={busy}
              onClick={() => void rejectOrder()}
              type="button"
            >
              Reject order
            </button>
          </div>
          <div className="mt-3">
            <OrderSoundControl active={soundActive} />
          </div>
        </div>
      </section>
    </div>
  );
}
