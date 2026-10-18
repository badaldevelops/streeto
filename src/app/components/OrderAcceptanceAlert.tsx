"use client";

import { useRef } from "react";
import OrderSoundControl from "@/app/components/OrderSoundControl";
import { readOrderItemOptions } from "@/lib/product-variants";

type AlertOrder = {
  id: string;
  orderNumber: string;
  type: string;
  total: number;
  createdAt: string;
  queueNumber: number | null;
  customizationNote?: string | null;
  outlet: { name: string };
  items: {
    id: string;
    quantity: number;
    totalPrice: number;
    addOns: unknown;
    product: { name: string };
  }[];
};

export default function OrderAcceptanceAlert({
  order,
  soundActive,
  onDismiss,
}: {
  order: AlertOrder;
  soundActive: boolean;
  onDismiss: () => void;
}) {
  const swipeStartX = useRef<number | null>(null);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/75 p-3 backdrop-blur-sm sm:p-6">
      <section
        aria-labelledby="confirmed-order-title"
        aria-modal="true"
        className="my-auto w-full max-w-xl overflow-hidden rounded-[28px] bg-white shadow-2xl"
        role="dialog"
        onPointerDown={(event) => {
          if (!(event.target instanceof HTMLInputElement)) swipeStartX.current = event.clientX;
        }}
        onPointerUp={(event) => {
          const start = swipeStartX.current;
          swipeStartX.current = null;
          if (start !== null && event.clientX - start > 110) onDismiss();
        }}
      >
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 px-6 py-6 text-white sm:px-8">
          <div className="absolute -right-8 -top-12 h-40 w-40 rounded-full bg-white/10" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-black uppercase tracking-wider">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-yellow-300" />
                Payment received · Order confirmed
              </div>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl" id="confirmed-order-title">
                Order #{order.orderNumber}
              </h2>
              <p className="mt-1 text-sm font-semibold text-emerald-50">
                {order.outlet.name} · {order.type.replaceAll("_", " ")}
              </p>
            </div>
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-3xl">🛍️</div>
          </div>
          <button type="button" onClick={onDismiss} aria-label="Close order alert" className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-2xl font-bold text-white hover:bg-white/25">×</button>
        </div>

        <div className="max-h-[58vh] space-y-5 overflow-y-auto px-5 py-5 sm:px-8">
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-orange-50 p-4">
            <div>
              <p className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black uppercase tracking-wider ${order.type === "DINE_IN" ? "bg-red-100 text-red-700" : "bg-white text-gray-600"}`}>
                {order.type === "DINE_IN" ? "Dine In" : order.type === "DELIVERY" ? "Delivery" : "Self Receive"}
              </p>
              <p className="mt-1 font-extrabold text-gray-950">Order #{order.orderNumber}</p>
              {order.queueNumber !== null && <p className="mt-0.5 text-sm font-medium text-gray-600">Queue #{order.queueNumber}</p>}
            </div>
            <div className="text-right">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Order total</p>
              <p className="mt-1 text-2xl font-black text-gray-950">₹{order.total.toFixed(2)}</p>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-wider text-gray-500">Items in this order</p>
            <div className="divide-y divide-gray-100 rounded-2xl border border-gray-100 px-4">
              {order.items.map((item) => (
                <div className="flex items-center justify-between gap-4 py-3" key={item.id}>
                  <p className="font-bold text-gray-800">
                    <span className="mr-2 inline-flex min-w-7 justify-center rounded-lg bg-gray-100 px-2 py-1 text-xs font-black text-gray-600">{item.quantity}×</span>
                    {item.product.name}
                  </p>
                  {readOrderItemOptions(item.addOns).variant && <p className="ml-9 mt-1 text-xs font-semibold text-gray-600">Size: {readOrderItemOptions(item.addOns).variant!.name}</p>}
                  {readOrderItemOptions(item.addOns).addOns.length > 0 && <p className="ml-9 mt-1 text-xs font-semibold text-emerald-700">Extras: {readOrderItemOptions(item.addOns).addOns.map((addOn) => `${addOn.name} (+₹${addOn.price.toFixed(2)})`).join(", ")}</p>}
                  <p className="shrink-0 font-extrabold text-gray-900">₹{item.totalPrice.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          {order.customizationNote?.trim() && (
            <div className="rounded-2xl border-2 border-orange-200 bg-orange-50 p-4">
              <p className="text-xs font-black uppercase tracking-wider text-orange-800">Customer food instructions</p>
              <p className="mt-2 whitespace-pre-wrap break-words font-bold leading-6 text-gray-950">{order.customizationNote}</p>
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 bg-gray-50 px-5 py-4 sm:px-8">
          <p className="text-center text-sm font-extrabold text-emerald-800">Payment verified. This order is already confirmed.</p>
          <p className="mt-1 text-center text-xs font-medium text-gray-500">Acknowledge this alert to stop the sound. The order is also in Orders.</p>
          <div className="mt-2"><OrderSoundControl active={soundActive} /></div>
          <button type="button" onClick={onDismiss} className="mt-4 min-h-12 w-full rounded-xl bg-emerald-700 px-4 py-3 font-extrabold text-white hover:bg-emerald-800">
            Got it · Stop alert
          </button>
        </div>
      </section>
    </div>
  );
}
