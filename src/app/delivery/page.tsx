"use client";

import { useEffect, useState } from "react";

type Delivery = {
  id: string;
  status: string;
  assignedAt: string | null;
  pickedUpAt: string | null;
  deliveredAt: string | null;
  order: {
    id: string;
    orderNumber: string;
    type: string;
    status: string;
    total: number;
    deliveryAddress: string | null;
    customerLatitude: number | null;
    customerLongitude: number | null;
    customer: {
      name: string;
      phone: string | null;
    } | null;
    outlet: {
      name: string;
      address: string | null;
    };
    items: {
      quantity: number;
      product: {
        name: string;
      };
    }[];
  };
};

function getDeliveryStatusLabel(status: string) {
  const labels: Record<string, string> = {
    ASSIGNED: "Assigned",
    OUT_FOR_DELIVERY: "Out for Delivery",
    DELIVERED: "Delivered",
  };

  return labels[status] || status;
}

function getStatusStyle(status: string) {
  if (status === "ASSIGNED") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (status === "OUT_FOR_DELIVERY") {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }

  if (status === "DELIVERED") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  return "border-gray-200 bg-gray-50 text-gray-700";
}

async function updateDeliveryStatus(
  orderId: string,
  status: string
) {
  try {
    const response = await fetch(
      "/api/delivery-orders/status",
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
          status,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      alert(
        data.error ||
          "Unable to update delivery status."
      );
      return;
    }

    window.location.reload();
  } catch (error) {
    console.error(error);
    alert("Something went wrong.");
  }
}

export default function DeliveryPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>(
    []
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDeliveries() {
    try {
      const response = await fetch(
        "/api/delivery-orders",
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            "Unable to load deliveries."
        );
        return;
      }

      setDeliveries(data.deliveries || []);
      setError("");
    } catch (error) {
      console.error(error);
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDeliveries();

    const interval = setInterval(() => {
      loadDeliveries();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  async function logout() {
    await fetch("/api/logout", {
      method: "POST",
    });

    window.location.href = "/login";
  }

  const assignedCount = deliveries.filter(
    (delivery) =>
      delivery.status === "ASSIGNED"
  ).length;

  const activeCount = deliveries.filter(
    (delivery) =>
      delivery.status === "OUT_FOR_DELIVERY"
  ).length;

  const deliveredCount = deliveries.filter(
    (delivery) =>
      delivery.status === "DELIVERED"
  ).length;

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="overflow-hidden rounded-[32px] bg-gradient-to-r from-orange-500 to-red-500 p-8 shadow-xl">
            <div className="animate-pulse">
              <div className="h-4 w-32 rounded bg-white/30" />

              <div className="mt-3 h-10 w-72 rounded bg-white/30" />

              <div className="mt-3 h-5 w-96 max-w-full rounded bg-white/20" />
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-28 animate-pulse rounded-3xl bg-white shadow-sm"
              />
            ))}
          </div>

          <div className="mt-6 h-72 animate-pulse rounded-3xl bg-white shadow-sm" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="overflow-hidden rounded-[32px] bg-gradient-to-br from-orange-500 via-orange-500 to-red-600 p-6 text-white shadow-[0_20px_60px_rgba(234,88,12,0.22)] sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.15em] backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-green-300 shadow-[0_0_10px_rgba(134,239,172,0.9)]" />
                Delivery Team
              </div>

              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                Delivery Panel
              </h1>

              <p className="mt-2 max-w-xl text-sm font-medium leading-6 text-orange-50 sm:text-base">
                Manage your assigned orders, navigate to
                customers and update delivery status from
                one place.
              </p>
            </div>

            <button
              type="button"
              onClick={logout}
              className="rounded-2xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-extrabold text-white backdrop-blur transition hover:bg-white/20"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Summary */}
        {!error && (
          <div className="mt-6 grid gap-4 sm:grid-cols-3">

            <div className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-gray-400">
                    Assigned
                  </p>

                  <p className="mt-2 text-3xl font-black text-gray-900">
                    {assignedCount}
                  </p>

                  <p className="mt-1 text-xs font-medium text-gray-500">
                    Waiting to start
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-2xl">
                  📋
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-orange-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-gray-400">
                    On The Way
                  </p>

                  <p className="mt-2 text-3xl font-black text-gray-900">
                    {activeCount}
                  </p>

                  <p className="mt-1 text-xs font-medium text-gray-500">
                    Active deliveries
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-2xl">
                  🛵
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-gray-400">
                    Delivered
                  </p>

                  <p className="mt-2 text-3xl font-black text-gray-900">
                    {deliveredCount}
                  </p>

                  <p className="mt-1 text-xs font-medium text-gray-500">
                    Completed orders
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-2xl">
                  ✅
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-5 text-red-700 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="text-2xl">
                ⚠️
              </div>

              <div>
                <p className="font-extrabold">
                  Unable to load deliveries
                </p>

                <p className="mt-1 text-sm font-medium">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!error && deliveries.length === 0 && (
          <div className="mt-6 overflow-hidden rounded-[32px] border border-orange-100 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-50 text-4xl">
              🛵
            </div>

            <h2 className="mt-5 text-2xl font-black text-gray-900">
              No delivery orders
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
              Orders assigned to you will appear here
              automatically.
            </p>

            <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-xs font-bold text-green-700">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              Checking for new orders
            </div>
          </div>
        )}

        {/* Delivery Orders */}
        <div className="mt-6 space-y-6">

          {deliveries.map((delivery) => (
            <div
              key={delivery.id}
              className="overflow-hidden rounded-[32px] border border-orange-100 bg-white shadow-[0_15px_45px_rgba(0,0,0,0.07)] transition hover:shadow-[0_20px_55px_rgba(0,0,0,0.1)]"
            >

              {/* Order Header */}
              <div className="border-b border-gray-100 bg-gradient-to-r from-orange-50 via-white to-red-50 p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-orange-500">
                      Delivery Order
                    </p>

                    <h2 className="mt-1 text-2xl font-black tracking-tight text-gray-900">
                      {delivery.order.orderNumber}
                    </h2>

                    <p className="mt-1 text-xs font-medium text-gray-500">
                      {delivery.order.type === "DELIVERY"
                        ? "🚚 Customer Delivery"
                        : "🏪 Self Receive"}
                    </p>
                  </div>

                  <div
                    className={`inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-xs font-extrabold ${getStatusStyle(
                      delivery.status
                    )}`}
                  >
                    <span className="h-2 w-2 rounded-full bg-current" />

                    {getDeliveryStatusLabel(
                      delivery.status
                    )}
                  </div>

                </div>
              </div>

              <div className="p-5 sm:p-6">

                {/* Customer + Outlet */}
                <div className="grid gap-4 lg:grid-cols-2">

                  {/* Customer */}
                  <div className="rounded-3xl border border-gray-100 bg-gray-50 p-5">
                    <div className="flex items-start gap-4">

                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
                        👤
                      </div>

                      <div className="min-w-0">
                        <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-gray-400">
                          Customer
                        </p>

                        <p className="mt-1 text-lg font-black text-gray-900">
                          {delivery.order.customer?.name ||
                            "Customer"}
                        </p>

                        {delivery.order.customer?.phone && (
                          <a
                            href={`tel:${delivery.order.customer.phone}`}
                            className="mt-2 inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-bold text-blue-600 shadow-sm transition hover:bg-blue-50"
                          >
                            📞{" "}
                            {delivery.order.customer.phone}
                          </a>
                        )}
                      </div>

                    </div>
                  </div>

                  {/* Outlet */}
                  <div className="rounded-3xl border border-gray-100 bg-gray-50 p-5">
                    <div className="flex items-start gap-4">

                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
                        🏪
                      </div>

                      <div className="min-w-0">
                        <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-gray-400">
                          Pickup Outlet
                        </p>

                        <p className="mt-1 text-lg font-black text-gray-900">
                          {delivery.order.outlet.name}
                        </p>

                        {delivery.order.outlet.address && (
                          <p className="mt-1 text-sm leading-5 text-gray-500">
                            {delivery.order.outlet.address}
                          </p>
                        )}
                      </div>

                    </div>
                  </div>

                </div>

                {/* Delivery Address */}
                <div className="mt-4 rounded-3xl border border-orange-100 bg-orange-50/60 p-5">
                  <div className="flex items-start gap-4">

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-500 text-2xl text-white shadow-md shadow-orange-200">
                      📍
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-orange-600">
                        Customer Location
                      </p>

                      <p className="mt-1 text-base font-extrabold text-gray-900">
                        Delivery Address
                      </p>

                      <p className="mt-1 text-sm leading-6 text-gray-600">
                        {delivery.order.deliveryAddress ||
                          "Address not available"}
                      </p>
                    </div>

                  </div>
                </div>

                {/* Items */}
                <div className="mt-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-gray-400">
                        Order Items
                      </p>

                      <p className="mt-1 text-sm font-bold text-gray-900">
                        {delivery.order.items.length}{" "}
                        item
                        {delivery.order.items.length !== 1
                          ? "s"
                          : ""}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-gray-50 px-4 py-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Total
                      </p>

                      <p className="text-xl font-black text-gray-900">
                        ₹{delivery.order.total}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {delivery.order.items.map(
                      (item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3"
                        >
                          <div className="flex items-center gap-3">
                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-sm font-black shadow-sm">
                              {item.quantity}
                            </span>

                            <span className="text-sm font-bold text-gray-800">
                              {item.product.name}
                            </span>
                          </div>

                          <span className="text-xs font-bold text-gray-400">
                            × {item.quantity}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Navigation */}
                {delivery.order.deliveryAddress && (
                  <a
                    href={
                      delivery.order.customerLatitude !==
                        null &&
                      delivery.order.customerLongitude !==
                        null
                        ? `https://www.google.com/maps/dir/?api=1&destination=${delivery.order.customerLatitude},${delivery.order.customerLongitude}`
                        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            delivery.order.deliveryAddress
                          )}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="mt-5 flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-gray-900 to-black px-5 py-4 text-sm font-extrabold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
                  >
                    🗺️ Open Customer Navigation
                    <span className="text-lg">
                      →
                    </span>
                  </a>
                )}

                {/* Status Actions */}
                <div className="mt-3">

                  {delivery.status === "ASSIGNED" && (
                    <button
                      type="button"
                      onClick={() =>
                        updateDeliveryStatus(
                          delivery.order.id,
                          "OUT_FOR_DELIVERY"
                        )
                      }
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-4 text-sm font-extrabold text-white shadow-lg shadow-blue-100 transition hover:-translate-y-0.5 hover:shadow-xl"
                    >
                      🛵 Start Delivery
                    </button>
                  )}

                  {delivery.status ===
                    "OUT_FOR_DELIVERY" && (
                    <button
                      type="button"
                      onClick={() =>
                        updateDeliveryStatus(
                          delivery.order.id,
                          "DELIVERED"
                        )
                      }
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 px-5 py-4 text-sm font-extrabold text-white shadow-lg shadow-emerald-100 transition hover:-translate-y-0.5 hover:shadow-xl"
                    >
                      ✅ Mark Delivered
                    </button>
                  )}

                  {delivery.status === "DELIVERED" && (
                    <div className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-extrabold text-emerald-700">
                      <span className="text-lg">
                        ✅
                      </span>
                      Order Delivered Successfully
                    </div>
                  )}

                </div>

              </div>
            </div>
          ))}

        </div>

        {/* Footer */}
        {!error && deliveries.length > 0 && (
          <div className="mt-8 rounded-3xl border border-orange-100 bg-white p-5 text-center shadow-sm">
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-gray-500">
              <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
              Delivery orders refresh automatically
            </div>
          </div>
        )}

      </div>
    </main>
  );
}