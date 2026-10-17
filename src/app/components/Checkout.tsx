"use client";

import { useEffect, useState } from "react";
import {
  enableOrderSounds,
  trackCustomerOrderForConfirmation,
} from "@/lib/order-notifications";
import CashfreePayButton from "./CashfreePayButton";

import { useCart } from "./CartProvider";

type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
};

type PendingCashfreePayment = {
  paymentSessionId: string;
  cashfreeMode: "sandbox" | "production";
  orderNumber: string;
  amount: number;
};

export default function Checkout({ pickupOnly = true }: { pickupOnly?: boolean }) {
  const {
    items,
    cartLoaded,
    cartTotal,
    cartCount,
    cartCompanyName,
    cartOutletName,
  } = useCart();
  
  

  const [orderType, setOrderType] = useState<"SELF_RECEIVE" | "DINE_IN">("SELF_RECEIVE");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [customizationNote, setCustomizationNote] = useState("");
  const [outletLocation, setOutletLocation] = useState<{
    gstin?: string | null;
    taxProducts?: { id: string; sgstRate: number; cgstRate: number }[];
  } | null>(null);

  useEffect(() => {
    async function loadOutletLocation() {
      const outletProductIds = items.map((item) => item.productId);

      if (!outletProductIds.length) {
        return;
      }

      try {
        const params = new URLSearchParams();
        outletProductIds.forEach((id) => params.append("outletProductId", id));
        const response = await fetch(`/api/customers/outlet-location?${params.toString()}`);

        const data = await response.json();

        if (!response.ok) {
          setOutletLocation(null);
          return;
        }

        setOutletLocation(data.outlet);
      } catch (error) {
        console.error(
          "Unable to load outlet location:",
          error
        );

        setOutletLocation(null);
      }
    }

    loadOutletLocation();
  }, [items]);

  const checkoutSgst = outletLocation?.gstin
    ? items.reduce((sum, item) => {
        const rates = outletLocation.taxProducts?.find((entry) => entry.id === item.productId);
        return sum + Math.round(item.price * item.quantity * (rates?.sgstRate ?? 0)) / 100;
      }, 0)
    : 0;
  const checkoutCgst = outletLocation?.gstin
    ? items.reduce((sum, item) => {
        const rates = outletLocation.taxProducts?.find((entry) => entry.id === item.productId);
        return sum + Math.round(item.price * item.quantity * (rates?.cgstRate ?? 0)) / 100;
      }, 0)
    : 0;
  const checkoutTaxTotal = (Math.round(checkoutSgst * 100) + Math.round(checkoutCgst * 100)) / 100;
  const checkoutTotal = cartTotal + checkoutTaxTotal;

  const [user, setUser] = useState<User | null>(null);
  const [checkingSession, setCheckingSession] =
    useState(true);
  const [placingOrder, setPlacingOrder] =
    useState(false);
  const [pendingCashfreePayment, setPendingCashfreePayment] =
    useState<PendingCashfreePayment | null>(null);

  useEffect(() => {
    async function loadCustomer() {
      try {
        const response = await fetch("/api/me");

        if (!response.ok) {
          setUser(null);
          return;
        }

        const data = await response.json();

        if (data.authenticated) {
          if (data.user?.role !== "CUSTOMER") {
            const destination = data.user?.role === "SUPER_ADMIN"
              ? "https://admin.qtoo.in/admin"
              : data.user?.role === "BUSINESS_ADMIN"
                ? "https://business.qtoo.in/business-admin"
                : data.user?.role === "DELIVERY_STAFF"
                  ? "https://qtoo.in/delivery"
                  : "https://qtoo.in/login";
            window.location.replace(destination);
            return;
          }
          setUser(data.user);
          setName(data.user.name || "");
          setPhone(data.user.phone || "");
        }
      } catch (error) {
        console.error(error);
        setUser(null);
      } finally {
        setCheckingSession(false);
      }
    }

    loadCustomer();
  }, []);

  async function handleCheckout() {
    if (checkingSession) {
      alert("Please wait while we check your login.");
      return;
    }

    if (placingOrder) {
      return;
    }

    if (!user) {
      alert("Please login before placing an order.");
      window.location.href = "/login";
      return;
    }

    if (!name.trim()) {
      alert("Please enter your name.");
      return;
    }

    if (!phone.trim()) {
      alert("Phone number is required.");
      return;
    }

    if (!/^[0-9]{10}$/.test(phone)) {
      alert("Please enter a valid 10-digit phone number.");
      return;
    }

    await enableOrderSounds();
    setPlacingOrder(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName: name,
          customerPhone: phone,
          customizationNote: customizationNote.trim(),
            orderType,
            pickupOnly,
            deliveryAddress: null,
            latitude: null,
            longitude: null,
          items: items.map((item) => ({
            outletProductId: item.productId,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Unable to create order.");
        return;
      }

      if (!data.paymentSessionId || (data.cashfreeMode !== "sandbox" && data.cashfreeMode !== "production")) {
        alert("Cashfree did not return a secure payment session. Please try again.");
        return;
      }
      trackCustomerOrderForConfirmation(data.order.id, data.order.status);
      setPendingCashfreePayment({
        paymentSessionId: data.paymentSessionId,
        cashfreeMode: data.cashfreeMode,
        orderNumber: data.order.orderNumber,
        amount: Number(data.order.total),
      });
    } catch (error) {
      console.error(error);
      alert("Something went wrong. Please try again.");
    } finally {
      setPlacingOrder(false);
    }
  }

  if (pendingCashfreePayment) {
    return (
      <main className="mx-auto max-w-xl px-4 py-10 sm:py-16">
        <section className="rounded-3xl border border-green-100 bg-white p-5 shadow-xl sm:p-8">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 text-3xl" aria-hidden="true">₹</div>
            <p className="mt-4 text-sm font-bold uppercase tracking-wide text-orange-700">Checkout</p>
            <h1 className="mt-1 text-2xl font-black text-gray-950">Choose a payment option</h1>
            <p className="mt-2 text-sm text-gray-600">Order {pendingCashfreePayment.orderNumber} · ₹{pendingCashfreePayment.amount.toFixed(2)}</p>
          </div>

          <CashfreePayButton paymentSessionId={pendingCashfreePayment.paymentSessionId} mode={pendingCashfreePayment.cashfreeMode} autoStart />

          <p className="mt-4 text-center text-xs text-gray-500">Your available payment options are opening. Your order is confirmed after payment is verified.</p>
        </section>
      </main>
    );
  }

  if (!cartLoaded) {
    return (
      <div className="p-6 sm:p-8" role="status" aria-live="polite">
        <h2 className="text-xl font-extrabold text-gray-950">Opening your checkout…</h2>
        <p className="mt-2 text-sm text-gray-600">Loading the items in your cart.</p>
        <div className="mt-5 h-16 animate-pulse rounded-2xl bg-orange-50" />
      </div>
    );
  }

  if (cartCount === 0) {
    return (
      <div className="p-6 text-center sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 text-3xl" aria-hidden="true">🛒</div>
        <h2 className="mt-4 text-xl font-extrabold text-gray-950">Your cart is empty</h2>
        <p className="mt-2 text-sm text-gray-600">Add an item from an outlet menu to continue checkout.</p>
        <a href="/#discover" className="mt-5 inline-flex min-h-12 items-center justify-center rounded-xl bg-orange-600 px-5 font-extrabold text-white hover:bg-orange-700">Browse outlets</a>
      </div>
    );
  }

  return (
    <div className="mt-8 overflow-hidden rounded-[28px] border border-orange-100 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.08)]">

      <div className="p-4 sm:p-7">
        <div className="mb-5 flex items-center justify-between gap-3 border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-xl font-extrabold text-gray-950 sm:text-2xl">Checkout</h2>
            {cartOutletName && <p className="mt-1 text-sm text-gray-500">{cartCompanyName?.trim().toLowerCase() === cartOutletName.trim().toLowerCase() ? cartOutletName : `${cartCompanyName} · ${cartOutletName}`}</p>}
          </div>
          <span className="rounded-full bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-700">{cartCount} {cartCount === 1 ? "item" : "items"}</span>
        </div>

        {/* Account */}
        <div>
          {checkingSession ? (
            <p className="mb-4 text-sm text-gray-500">Checking your account…</p>
          ) : user ? (
            null
          ) : (
            <div className="rounded-2xl border border-red-100 bg-red-50 p-5">
              <p className="font-bold text-gray-900">
                Please login to place your order.
              </p>

              <button
                type="button"
                onClick={() => {
                  window.location.href = "/login";
                }}
                className="mt-3 rounded-xl bg-red-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-600"
              >
                Login to Continue
              </button>
            </div>
          )}
        </div>

        {/* Order Type */}
        <fieldset className="mt-5">
          <legend className="mb-2 text-sm font-extrabold text-gray-900">How would you like to enjoy your order?</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              aria-pressed={orderType === "SELF_RECEIVE"}
              onClick={() => setOrderType("SELF_RECEIVE")}
              className={`rounded-2xl border p-4 text-left transition ${orderType === "SELF_RECEIVE" ? "border-green-600 bg-green-50 ring-2 ring-green-100" : "border-gray-200 bg-white hover:border-green-300"}`}
            >
              <span className="block text-base font-extrabold text-gray-950">🏪 Self Receive</span>
              <span className="mt-1 block text-sm text-gray-600">Order ahead and collect it from the outlet.</span>
            </button>
            <button
              type="button"
              aria-pressed={orderType === "DINE_IN"}
              onClick={() => setOrderType("DINE_IN")}
              className={`rounded-2xl border p-4 text-left transition ${orderType === "DINE_IN" ? "border-orange-500 bg-orange-50 ring-2 ring-orange-100" : "border-gray-200 bg-white hover:border-orange-300"}`}
            >
              <span className="block text-base font-extrabold text-gray-950">🍽️ Dine In</span>
              <span className="mt-1 block text-sm text-gray-600">Order ahead and enjoy your food at the outlet.</span>
            </button>
          </div>
        </fieldset>

        {/* Customer Details */}
        <div className="mt-5 rounded-2xl border border-gray-100 bg-gray-50/70 p-4 sm:p-5">
          <div className="mb-5">
            <p className="text-lg font-extrabold text-gray-900">
              👤 Your Details
            </p>

            <p className="mt-1 text-sm text-gray-500">
              We need these details to prepare your order.
            </p>
          </div>

          <div className="space-y-5">

            <div>
              <label className="mb-2 block text-sm font-bold text-gray-800">
                Full Name
              </label>

              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-gray-800">
                Phone Number *
              </label>

              <input
                value={phone}
                onChange={(e) =>
                  setPhone(
                    e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 10)
                  )
                }
                placeholder="10-digit mobile number"
                inputMode="numeric"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
              />

              <p className="mt-2 text-xs text-gray-500">
                🔒 Phone number is linked to your customer account.
              </p>
            </div>

          </div>
        </div>

        {/* Optional food customization */}
        <div className="mt-6 rounded-2xl border border-amber-300 border-l-4 border-l-amber-700 bg-amber-100/80 p-5 shadow-sm">
          <label htmlFor="food-customization" className="block text-base font-extrabold text-amber-950">
            Customize your food <span className="text-sm font-semibold text-gray-500">(optional)</span>
          </label>
          <p className="mt-1 text-sm text-amber-950/75">
            Tell the outlet how you’d like it, such as extra spicy or not spicy.
          </p>
          <textarea
            id="food-customization"
            value={customizationNote}
            onChange={(event) => setCustomizationNote(event.target.value.slice(0, 500))}
            maxLength={500}
            rows={3}
            placeholder="Write your food preference here…"
            className="mt-3 w-full resize-y rounded-xl border border-amber-400 bg-amber-50 px-4 py-3 text-gray-900 outline-none placeholder:text-amber-900/50 focus:border-amber-700 focus:ring-4 focus:ring-amber-200"
          />
          <p className="mt-1 text-right text-xs text-gray-500">{customizationNote.length}/500</p>
        </div>

        {/* Order Summary */}
        <div className="mt-7 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">

          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-extrabold text-gray-900">
                🧾 Order Summary
              </p>

              <p className="mt-1 text-xs text-gray-500">
                {cartCount} item
                {cartCount !== 1 ? "s" : ""} in your order
              </p>
            </div>

            <div className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">
              {orderType === "DINE_IN" ? "Dine In" : "Self Receive"}
            </div>
          </div>

          <div className="mt-5 divide-y divide-gray-100">
            {items.map((item) => (
              <div
                key={item.productId}
                className="flex items-center justify-between gap-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-800">
                    {item.productName}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    ₹{item.price} × {item.quantity}
                  </p>
                </div>

                <p className="shrink-0 font-bold text-gray-900">
                  ₹{item.price * item.quantity}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl bg-gray-50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">
                Subtotal
              </span>

              <span className="font-semibold text-gray-800">
                ₹{cartTotal}
              </span>
            </div>

            {outletLocation?.gstin && (
              <>
                <div className="mt-2 flex items-center justify-between"><span className="text-sm text-gray-500">SGST</span><span className="text-sm font-semibold text-gray-800">₹{(Math.round(checkoutSgst * 100) / 100).toFixed(2)}</span></div>
                <div className="mt-2 flex items-center justify-between"><span className="text-sm text-gray-500">CGST</span><span className="text-sm font-semibold text-gray-800">₹{(Math.round(checkoutCgst * 100) / 100).toFixed(2)}</span></div>
              </>
            )}

          </div>

          <div className="mt-4 flex items-end justify-between border-t border-gray-200 pt-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Total
              </p>

              <p className="mt-1 text-3xl font-extrabold text-gray-900">
                ₹{checkoutTotal.toFixed(2)}
              </p>
            </div>

            <span className="text-2xl">
              😋
            </span>
          </div>
        </div>

        {/* Place order */}
        <button
          type="button"
          onClick={handleCheckout}
          disabled={checkingSession || placingOrder}
          className="mt-7 flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 px-5 py-4 text-lg font-extrabold text-white shadow-lg shadow-orange-200 transition hover:from-orange-600 hover:to-red-600 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
        >
          {checkingSession ? (
            "Checking Account..."
          ) : placingOrder ? (
            <>
              <span className="animate-spin">⏳</span>
              Placing Order...
            </>
          ) : (
            <>
              Checkout
              <span>→</span>
            </>
          )}
        </button>

      </div>
    </div>
  );
}
