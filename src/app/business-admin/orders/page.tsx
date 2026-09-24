"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Order = {
  id: string;
  orderNumber: string;
  type: string;
  status: string;
  subtotal: number;
  deliveryCharge: number;
  total: number;
  createdAt: string;
  customerName: string | null;
  customerPhone: string | null;
  deliveryAddress: string | null;

  outlet: {
    id: string;
    name: string;
  };

  customer: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  } | null;

  items: {
    id: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    product: {
      id: string;
      name: string;
    };
  }[];

  payment: {
    id: string;
    amount: number;
    method: string;
    status: string;
    transactionId: string | null;
  } | null;

  delivery: {
    id: string;
    status: string;
    assignedAt: string | null;
    pickedUpAt: string | null;
    deliveredAt: string | null;
    deliveryStaff: {
      id: string;
      name: string;
      email: string;
      phone: string | null;
    } | null;
  } | null;
};

const orderStatuses = [
  "PLACED",
  "ACCEPTED",
  "PREPARING",
  "READY",
  "ASSIGNED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
];

function formatMoney(amount: number) {
  return `₹${amount.toFixed(2)}`;
}

function formatDate(date: string) {
  return new Date(date).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

function getStatusStyle(status: string) {
  switch (status) {
    case "PLACED":
      return "bg-blue-50 text-blue-700 border-blue-100";

    case "ACCEPTED":
      return "bg-indigo-50 text-indigo-700 border-indigo-100";

    case "PREPARING":
      return "bg-amber-50 text-amber-700 border-amber-100";

    case "READY":
      return "bg-purple-50 text-purple-700 border-purple-100";

    case "ASSIGNED":
      return "bg-cyan-50 text-cyan-700 border-cyan-100";

    case "OUT_FOR_DELIVERY":
      return "bg-orange-50 text-orange-700 border-orange-100";

    case "DELIVERED":
      return "bg-green-50 text-green-700 border-green-100";

    case "COMPLETED":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";

    case "CANCELLED":
      return "bg-red-50 text-red-700 border-red-100";

    default:
      return "bg-gray-50 text-gray-700 border-gray-100";
  }
}

export default function BusinessAdminOrdersPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedOrder, setExpandedOrder] =
    useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] =
    useState<string | null>(null);
  const [successMessage, setSuccessMessage] =
    useState("");
      const [deliveryStaff, setDeliveryStaff] = useState<
    {
      id: string;
      name: string;
      email: string;
      phone: string | null;
    }[]
  >([]);

  const [assigningOrderId, setAssigningOrderId] =
    useState<string | null>(null);

  async function loadOrders() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/business-admin/orders",
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error || "Unable to load orders."
        );
        return;
      }

      setOrders(data.orders || []);
    } catch (error) {
      console.error(
        "Load business orders error:",
        error
      );

      setError(
        "Something went wrong while loading orders."
      );
    } finally {
      setLoading(false);
    }
  }

    async function loadDeliveryStaff() {
    try {
      const response = await fetch(
        "/api/business-admin/delivery-staff",
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(
          "Unable to load delivery staff:",
          data.error
        );
        return;
      }

      setDeliveryStaff(data.staff || []);
    } catch (error) {
      console.error(
        "Load delivery staff error:",
        error
      );
    }
  }
  
  useEffect(() => {
    async function checkLogin() {
      try {
        const response = await fetch("/api/me", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok || !data.authenticated) {
          router.push("/login");
          return;
        }

       if (data.user?.role !== "BUSINESS_ADMIN") {
  router.push("/");
  return;
}

await loadOrders();
await loadDeliveryStaff();
        
      } catch (error) {
        console.error(
          "Business admin session error:",
          error
        );

        router.push("/login");
      }
    }

    checkLogin();
  }, [router]);

  function toggleOrder(orderId: string) {
    setExpandedOrder((current) =>
      current === orderId ? null : orderId
    );
  }

  async function updateOrderStatus(
    orderId: string,
    status: string
  ) {
    try {
      setUpdatingOrderId(orderId);
      setError("");
      setSuccessMessage("");

      const response = await fetch(
        "/api/business-admin/orders/status",
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
        setError(
          data.error ||
            "Unable to update order status."
        );
        return;
      }

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === orderId
            ? {
                ...order,
                status: data.order.status,
              }
            : order
        )
      );

      setSuccessMessage(
        "Order status updated successfully."
      );

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (error) {
      console.error(
        "Update order status error:",
        error
      );

      setError(
        "Something went wrong while updating the order."
      );
    } finally {
      setUpdatingOrderId(null);
    }
  }

   async function assignDelivery(
    orderId: string,
    deliveryStaffId: string
  ) {
    try {
      setAssigningOrderId(orderId);
      setError("");
      setSuccessMessage("");

      const response = await fetch(
        "/api/business-admin/assign-delivery",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId,
            deliveryStaffId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            "Unable to assign delivery staff."
        );
        return;
      }

      setSuccessMessage(
        "Delivery staff assigned successfully."
      );

      await loadOrders();

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (error) {
      console.error(
        "Assign delivery error:",
        error
      );

      setError(
        "Something went wrong while assigning delivery staff."
      );
    } finally {
      setAssigningOrderId(null);
    }
  }
 
  return (
    <main className="min-h-screen bg-[#fff8f2] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-orange-500 via-orange-500 to-red-500 p-6 text-white shadow-[0_18px_45px_rgba(234,88,12,0.18)] sm:p-8">

          <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10" />
          <div className="absolute -bottom-28 right-24 h-64 w-64 rounded-full bg-white/5" />

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <button
                type="button"
                onClick={() =>
                  router.push("/business-admin")
                }
                className="mb-4 rounded-full bg-white/15 px-4 py-2 text-sm font-bold text-white backdrop-blur transition hover:bg-white/25"
              >
                ← Dashboard
              </button>

              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-3xl backdrop-blur">
                  🛒
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-orange-100">
                    Business Management
                  </p>

                  <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
                    Orders
                  </h1>
                </div>
              </div>

              <p className="mt-4 max-w-xl text-sm font-medium leading-6 text-orange-50 sm:text-base">
                Manage customer orders, update their status
                and keep your kitchen and delivery team in sync.
              </p>
            </div>

            <button
              type="button"
              onClick={loadOrders}
              disabled={loading}
              className="rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-orange-600 shadow-lg transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Loading..."
                : "↻ Refresh Orders"}
            </button>

          </div>
        </section>

        {/* Messages */}
        {successMessage && (
          <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-700">
            ✅ {successMessage}
          </div>
        )}

        {error && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            ⚠️ {error}
          </div>
        )}

        {/* Summary */}
        {!loading && !error && (
          <div className="mt-7 grid gap-4 sm:grid-cols-3">

            <div className="rounded-[22px] border border-orange-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-xl">
                  🛒
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Total Orders
                  </p>

                  <p className="mt-1 text-2xl font-black text-gray-900">
                    {orders.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[22px] border border-green-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 text-xl">
                  💰
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Order Value
                  </p>

                  <p className="mt-1 text-2xl font-black text-gray-900">
                    {formatMoney(
                      orders.reduce(
                        (total, order) =>
                          total + order.total,
                        0
                      )
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[22px] border border-blue-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-xl">
                  📦
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Active Orders
                  </p>

                  <p className="mt-1 text-2xl font-black text-gray-900">
                    {
                      orders.filter(
                        (order) =>
                          ![
                            "COMPLETED",
                            "CANCELLED",
                          ].includes(order.status)
                      ).length
                    }
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="mt-7 space-y-4">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="animate-pulse rounded-[24px] bg-white p-6 shadow-sm"
              >
                <div className="h-6 w-48 rounded-lg bg-gray-200" />
                <div className="mt-4 h-4 w-72 rounded-lg bg-gray-100" />
                <div className="mt-6 h-12 rounded-xl bg-gray-100" />
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading &&
          !error &&
          orders.length === 0 && (
            <div className="mt-7 rounded-[26px] border border-orange-100 bg-white px-5 py-14 text-center shadow-sm">

              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-100 text-4xl">
                📦
              </div>

              <h2 className="mt-5 text-2xl font-black text-gray-900">
                No orders yet
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                Orders from your customers will appear here
                when they place an order.
              </p>

              <button
                type="button"
                onClick={loadOrders}
                className="mt-6 rounded-xl bg-orange-500 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-orange-600"
              >
                Refresh Orders
              </button>
            </div>
          )}

        {/* Orders */}
        {!loading && orders.length > 0 && (
          <div className="mt-7 space-y-5">

            {orders.map((order) => {
              const isExpanded =
                expandedOrder === order.id;

              const isUpdating =
                updatingOrderId === order.id;

              return (
                <article
                  key={order.id}
                  className="overflow-hidden rounded-[26px] border border-orange-100 bg-white shadow-sm transition hover:shadow-lg"
                >

                  {/* Order top */}
                  <div className="p-5 sm:p-6">

                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                      <div className="flex items-start gap-4">

                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-xl">
                          🧾
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-lg font-black text-gray-900">
                              #{order.orderNumber}
                            </h2>

                            <span
                              className={`rounded-full border px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide ${getStatusStyle(
                                order.status
                              )}`}
                            >
                              {formatStatus(
                                order.status
                              )}
                            </span>
                          </div>

                          <p className="mt-1 text-xs font-medium text-gray-400">
                            {formatDate(order.createdAt)}
                          </p>
                        </div>

                      </div>

                      <div className="flex flex-wrap items-center gap-3">

                        <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-600">
                          {order.type.replaceAll(
                            "_",
                            " "
                          )}
                        </span>

                        <div className="rounded-xl bg-green-50 px-4 py-2">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-green-600">
                            Total
                          </p>

                          <p className="text-lg font-black text-gray-900">
                            {formatMoney(order.total)}
                          </p>
                        </div>

                      </div>

                    </div>

                    {/* Status */}
                    <div className="mt-6 rounded-2xl border border-orange-100 bg-orange-50/60 p-4">

                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-orange-600">
                            Order Status
                          </p>

                          <p className="mt-1 text-sm font-bold text-gray-800">
                            Update the current order stage
                          </p>
                        </div>

                        <select
                          value={order.status}
                          disabled={isUpdating}
                          onChange={(event) =>
                            updateOrderStatus(
                              order.id,
                              event.target.value
                            )
                          }
                          className="rounded-xl border border-orange-200 bg-white px-4 py-3 text-sm font-bold text-gray-900 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {orderStatuses.map(
                            (status) => (
                              <option
                                key={status}
                                value={status}
                              >
                                {formatStatus(status)}
                              </option>
                            )
                          )}
                        </select>

                      </div>

                      {isUpdating && (
                        <p className="mt-3 text-xs font-semibold text-orange-600">
                          ⏳ Updating order status...
                        </p>
                      )}
                    </div>

                    {/* Quick details */}
                    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

                      <div className="rounded-2xl bg-gray-50 p-4">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          Customer
                        </p>

                        <p className="mt-2 truncate font-extrabold text-gray-900">
                          {order.customerName ||
                            order.customer?.name ||
                            "Guest Customer"}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          {order.customerPhone ||
                            order.customer?.phone ||
                            "No phone"}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-gray-50 p-4">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          Outlet
                        </p>

                        <p className="mt-2 font-extrabold text-gray-900">
                          🏪 {order.outlet.name}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-gray-50 p-4">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          Payment
                        </p>

                        <p className="mt-2 font-extrabold text-gray-900">
                          {order.payment
                            ? order.payment.method
                            : "Not available"}
                        </p>

                        <p className="mt-1 text-xs font-semibold text-gray-500">
                          {order.payment
                            ? order.payment.status
                            : "No payment record"}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-gray-50 p-4">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          Delivery
                        </p>

                        <p className="mt-2 truncate font-extrabold text-gray-900">
                          {order.delivery
                            ?.deliveryStaff?.name ||
                            "Not assigned"}
                        </p>

                        <p className="mt-1 text-xs font-semibold text-gray-500">
                          {order.delivery
                            ? order.delivery.status
                            : "No delivery"}
                        </p>
                      </div>

                    </div>

                  </div>

                  {/* Expand */}
                  <div className="border-t border-gray-100 bg-gray-50/70 px-5 py-4 sm:px-6">

                    <button
                      type="button"
                      onClick={() =>
                        toggleOrder(order.id)
                      }
                      className="flex w-full items-center justify-between text-left text-sm font-extrabold text-orange-600 transition hover:text-orange-700"
                    >
                      <span>
                        {isExpanded
                          ? "Hide Order Details"
                          : "View Order Details"}
                      </span>

                      <span
                        className={`transition-transform ${
                          isExpanded
                            ? "rotate-180"
                            : ""
                        }`}
                      >
                        ↓
                      </span>
                    </button>

                  </div>

                  {/* Expanded */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-[#fffaf6] p-5 sm:p-6">

                      {/* Items */}
                      <div>
                        <div className="mb-4 flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-lg">
                            🍔
                          </div>

                          <div>
                            <h3 className="font-black text-gray-900">
                              Order Items
                            </h3>

                            <p className="text-xs text-gray-500">
                              Products included in this order
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {order.items.map(
                            (item) => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-4"
                              >
                                <div className="min-w-0">
                                  <p className="font-bold text-gray-900">
                                    {item.product.name}
                                  </p>

                                  <p className="mt-1 text-xs text-gray-500">
                                    {item.quantity} ×{" "}
                                    {formatMoney(
                                      item.unitPrice
                                    )}
                                  </p>
                                </div>

                                <p className="shrink-0 font-black text-gray-900">
                                  {formatMoney(
                                    item.totalPrice
                                  )}
                                </p>
                              </div>
                            )
                          )}
                        </div>
                      </div>

                      {/* Price */}
                      <div className="mt-5 rounded-2xl border border-gray-100 bg-white p-5">

                        <div className="flex justify-between text-sm text-gray-500">
                          <span>Subtotal</span>

                          <span className="font-semibold text-gray-800">
                            {formatMoney(
                              order.subtotal
                            )}
                          </span>
                        </div>

                        <div className="mt-3 flex justify-between text-sm text-gray-500">
                          <span>Delivery Charge</span>

                          <span className="font-semibold text-gray-800">
                            {formatMoney(
                              order.deliveryCharge
                            )}
                          </span>
                        </div>

                        <div className="mt-4 flex justify-between border-t border-gray-100 pt-4">
                          <span className="text-lg font-black text-gray-900">
                            Total
                          </span>

                          <span className="text-xl font-black text-orange-600">
                            {formatMoney(order.total)}
                          </span>
                        </div>

                      </div>

                      {/* Address */}
                      {order.deliveryAddress && (
                        <div className="mt-5 rounded-2xl border border-gray-100 bg-white p-5">

                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-lg">
                              📍
                            </div>

                            <div>
                              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                                Delivery Address
                              </p>

                              <p className="mt-2 text-sm font-semibold leading-6 text-gray-800">
                                {order.deliveryAddress}
                              </p>
                            </div>
                          </div>

                        </div>
                      )}

                                           {/* Delivery Staff Assignment */}
                      <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex items-start gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-xl">
                              🚴
                            </div>

                            <div>
                              <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                                Delivery Staff
                              </p>

                              <p className="mt-1 font-black text-gray-900">
                                {order.delivery?.deliveryStaff?.name ||
                                  "Not assigned"}
                              </p>

                              {order.delivery?.deliveryStaff?.phone && (
                                <p className="mt-1 text-sm text-gray-600">
                                  {order.delivery.deliveryStaff.phone}
                                </p>
                              )}

                              {order.delivery?.deliveryStaff?.email && (
                                <p className="mt-1 text-xs text-gray-500">
                                  {order.delivery.deliveryStaff.email}
                                </p>
                              )}
                            </div>
                          </div>

                          {order.type === "DELIVERY" && (
                            <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[280px]">
                              <select
                                defaultValue={
                                  order.delivery?.deliveryStaff?.id || ""
                                }
                                disabled={
                                  assigningOrderId === order.id
                                }
                                onChange={(event) => {
                                  const staffId =
                                    event.target.value;

                                  if (!staffId) {
                                    return;
                                  }

                                  assignDelivery(
                                    order.id,
                                    staffId
                                  );
                                }}
                                className="w-full rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-bold text-gray-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                <option value="">
                                  Select Delivery Staff
                                </option>

                                {deliveryStaff.map(
                                  (staff) => (
                                    <option
                                      key={staff.id}
                                      value={staff.id}
                                    >
                                      {staff.name}
                                      {staff.phone
                                        ? ` — ${staff.phone}`
                                        : ""}
                                    </option>
                                  )
                                )}
                              </select>

                              {assigningOrderId ===
                                order.id && (
                                <p className="text-xs font-semibold text-blue-600">
                                  Assigning delivery staff...
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                                             </div>
                      </div>
                    )}
                  </article>
                                );
            })}
          </div>
        )}

                        
        <div className="py-8 text-center">
          <p className="text-xs font-medium text-gray-400">
            Business Orders Management
          </p>
        </div>

      </div>
    </main>
  );
}