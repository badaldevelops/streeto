"use client";

import { useEffect, useState } from "react";

type OrderItem = {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product: {
    name: string;
  };
};

type Payment = {
  amount: number;
  method: string;
  status: string;
};

type Order = {
  id: string;
  orderNumber: string;
  type: string;
  status: string;
  queueNumber: number | null;
  queuePosition: number | null;
  subtotal: number;
  deliveryCharge: number;
  total: number;
  deliveryAddress: string | null;
  createdAt: string;
  items: OrderItem[];
  payment: Payment | null;
};

type Customer = {
  name: string;
  email: string;
  phone: string;
};

const deliveryStatuses = [
  "PLACED",
  "ACCEPTED",
  "PREPARING",
  "READY",
  "ASSIGNED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

const selfReceiveStatuses = [
  "PLACED",
  "ACCEPTED",
  "PREPARING",
  "READY",
  "COMPLETED",
];

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    PLACED: "Order Placed",
    ACCEPTED: "Order Accepted",
    PREPARING: "Preparing",
    READY: "Ready",
    ASSIGNED: "Delivery Assigned",
    OUT_FOR_DELIVERY: "Out for Delivery",
    DELIVERED: "Delivered",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
  };

  return labels[status] || status;
}

function getStatusMessage(status: string, orderType: string) {
  if (status === "PLACED") {
    return "Your order has been received.";
  }

  if (status === "ACCEPTED") {
    return "Your order has been accepted by the outlet.";
  }

  if (status === "PREPARING") {
    return "Your Dabeli is being prepared.";
  }

  if (status === "READY") {
    if (orderType === "SELF_RECEIVE") {
      return "Your order is ready. Please collect it from the outlet.";
    }

    return "Your order is ready for delivery.";
  }

  if (status === "ASSIGNED") {
    return "A delivery person has been assigned to your order.";
  }

  if (status === "OUT_FOR_DELIVERY") {
    return "Your order is on the way.";
  }

  if (status === "DELIVERED") {
    return "Your order has been delivered.";
  }

  if (status === "COMPLETED") {
    return "Your order has been completed.";
  }

  if (status === "CANCELLED") {
    return "This order has been cancelled.";
  }

  return "";
}

function formatDate(date: string) {
  return new Date(date).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function OrderProgress({ order }: { order: Order }) {
  if (order.status === "CANCELLED") {
    return (
      <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-100 text-xl">
            ✕
          </div>

          <div>
            <p className="font-black text-red-700">
              Order Cancelled
            </p>

            <p className="mt-1 text-sm font-medium text-red-600">
              {getStatusMessage(order.status, order.type)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const statuses =
    order.type === "DELIVERY"
      ? deliveryStatuses
      : selfReceiveStatuses;

  const currentIndex = statuses.indexOf(order.status);

  return (
    <div className="mt-5 overflow-hidden rounded-[24px] border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-red-50 p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-500">
            Live Order Status
          </p>

          <h3 className="mt-1 text-xl font-black text-gray-950">
            {getStatusLabel(order.status)}
          </h3>

          <p className="mt-1 text-sm font-medium leading-6 text-gray-500">
            {getStatusMessage(order.status, order.type)}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start rounded-full bg-white px-4 py-2 shadow-sm ring-1 ring-orange-100">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-green-500" />
          <span className="text-xs font-black text-gray-700">
            LIVE
          </span>
        </div>
      </div>

      <div className="mt-7">
        <div className="relative">
          <div className="absolute left-4 right-4 top-4 h-1 rounded-full bg-orange-100" />

          <div
            className="absolute left-4 top-4 h-1 rounded-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-500"
            style={{
              width:
                currentIndex <= 0
                  ? "0%"
                  : `calc(${(currentIndex / (statuses.length - 1)) * 100}% - 32px)`,
            }}
          />

          <div className="relative flex justify-between gap-2">
            {statuses.map((status, index) => {
              const completed = index <= currentIndex;
              const current = status === order.status;

              return (
                <div
                  key={status}
                  className="flex min-w-0 flex-1 flex-col items-center text-center"
                >
                  <div
                    className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-black transition-all ${
                      completed
                        ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-200"
                        : "border-2 border-orange-100 bg-white text-gray-400"
                    } ${
                      current
                        ? "ring-4 ring-orange-100"
                        : ""
                    }`}
                  >
                    {completed ? "✓" : index + 1}
                  </div>

                  <p
                    className={`mt-3 max-w-[90px] text-[10px] font-extrabold leading-4 sm:text-xs ${
                      current
                        ? "text-orange-600"
                        : completed
                        ? "text-gray-700"
                        : "text-gray-400"
                    }`}
                  >
                    {getStatusLabel(status)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadOrders(showLoading = false) {
    try {
      if (showLoading) {
        setLoading(true);
      }

      const response = await fetch("/api/my-orders", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to load orders.");
        return;
      }

      setOrders(data.orders || []);
      setCustomer(data.customer || null);
      setError("");
    } catch (error) {
      console.error(error);

      if (showLoading) {
        setError(
          "Something went wrong while loading your orders."
        );
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    loadOrders(true);

    const interval = setInterval(() => {
      loadOrders(false);
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#fffaf5] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="animate-pulse">
            <div className="h-4 w-28 rounded-full bg-orange-100" />
            <div className="mt-4 h-10 w-64 rounded-xl bg-orange-100" />
            <div className="mt-3 h-4 w-80 rounded-full bg-orange-50" />

            <div className="mt-8 h-64 rounded-[28px] bg-white shadow-sm ring-1 ring-orange-100" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fffaf5] px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* HEADER */}
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <a
              href="/"
              className="inline-flex items-center gap-2 text-sm font-extrabold text-orange-600 transition hover:text-red-600"
            >
              ← Back to Menu
            </a>

            <p className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-orange-500">
              Your Orders
            </p>

            <h1 className="mt-1 text-4xl font-black tracking-tight text-gray-950 sm:text-5xl">
              My Orders
            </h1>

            {customer && (
              <p className="mt-2 text-sm font-medium text-gray-500">
                {customer.name} · {customer.phone}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-orange-100 bg-white px-4 py-3 shadow-sm">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50">
              🛍️
            </span>

            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                Total Orders
              </p>

              <p className="text-lg font-black text-gray-950">
                {orders.length}
              </p>
            </div>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5">
            <p className="font-bold text-red-700">
              Unable to load your orders
            </p>

            <p className="mt-1 text-sm font-medium text-red-600">
              {error}
            </p>
          </div>
        )}

        {/* EMPTY */}
        {!error && orders.length === 0 && (
          <div className="rounded-[30px] border border-orange-100 bg-white p-10 text-center shadow-xl shadow-orange-100/40 sm:p-16">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-orange-100 text-4xl">
              🛒
            </div>

            <p className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-orange-500">
              Nothing here yet
            </p>

            <h2 className="mt-2 text-2xl font-black text-gray-950">
              No orders yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-6 text-gray-500">
              Explore local businesses, choose something delicious,
              and place your first order.
            </p>

            <a
              href="/"
              className="mt-7 inline-flex rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 px-7 py-3.5 text-sm font-black text-white shadow-lg shadow-orange-200 transition hover:-translate-y-0.5"
            >
              Explore Food →
            </a>
          </div>
        )}

        {/* ORDERS */}
        <div className="space-y-6">
          {orders.map((order) => (
            <article
              key={order.id}
              className="overflow-hidden rounded-[30px] border border-orange-100 bg-white shadow-xl shadow-orange-100/30"
            >
              {/* ORDER HEADER */}
              <div className="border-b border-orange-100 bg-gradient-to-r from-white to-orange-50/60 p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-500">
                      Order Number
                    </p>

                    <h2 className="mt-1 text-xl font-black text-gray-950">
                      {order.orderNumber}
                    </h2>

                    <p className="mt-1 text-xs font-medium text-gray-500">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-orange-100 px-3 py-1.5 text-xs font-black text-orange-700">
                      {order.type === "DELIVERY"
                        ? "🚚 Delivery"
                        : "🏪 Self Receive"}
                    </span>

                    <span className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-black text-green-600">
                      Auto-updating
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-6">
                {/* PROGRESS */}
                <OrderProgress order={order} />

                {/* SELF RECEIVE QUEUE */}
                {order.type === "SELF_RECEIVE" &&
                  order.queuePosition !== null &&
                  order.status !== "COMPLETED" &&
                  order.status !== "CANCELLED" && (
                    <div className="mt-5 overflow-hidden rounded-[24px] border border-orange-200 bg-gradient-to-r from-orange-500 to-red-500 p-5 text-white shadow-lg shadow-orange-200">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-100">
                            Self Receive Queue
                          </p>

                          <p className="mt-1 text-3xl font-black">
                            #{order.queueNumber}
                          </p>

                          <p className="mt-1 text-sm font-medium text-orange-50">
                            {order.queuePosition === 1
                              ? "You are next in line."
                              : `${order.queuePosition - 1} orders are ahead of you.`}
                          </p>
                        </div>

                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-3xl backdrop-blur-sm">
                          🎟️
                        </div>
                      </div>
                    </div>
                  )}

                {/* ITEMS */}
                <div className="mt-6">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-lg font-black text-gray-950">
                      Your Items
                    </h3>

                    <span className="text-xs font-bold text-gray-400">
                      {order.items.length} item
                      {order.items.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-gray-100">
                    {order.items.map((item, index) => (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between gap-4 p-4 ${
                          index !== order.items.length - 1
                            ? "border-b border-gray-100"
                            : ""
                        }`}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-lg">
                            🌯
                          </div>

                          <div className="min-w-0">
                            <p className="truncate font-extrabold text-gray-950">
                              {item.product.name}
                            </p>

                            <p className="mt-1 text-xs font-medium text-gray-500">
                              ₹{item.unitPrice} × {item.quantity}
                            </p>
                          </div>
                        </div>

                        <p className="shrink-0 font-black text-gray-950">
                          ₹{item.totalPrice}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* BILL + ORDER INFO */}
                <div className="mt-6 grid gap-5 lg:grid-cols-2">
                  {/* BILL */}
                  <div className="rounded-[24px] border border-orange-100 bg-orange-50/60 p-5">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-500">
                      Bill Summary
                    </p>

                    <div className="mt-4 space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-500">
                          Subtotal
                        </span>

                        <span className="font-bold text-gray-900">
                          ₹{order.subtotal}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="font-medium text-gray-500">
                          Delivery
                        </span>

                        <span className="font-bold text-gray-900">
                          ₹{order.deliveryCharge}
                        </span>
                      </div>

                      <div className="border-t border-orange-200 pt-3">
                        <div className="flex items-center justify-between">
                          <span className="text-base font-black text-gray-950">
                            Total
                          </span>

                          <span className="text-2xl font-black text-orange-600">
                            ₹{order.total}
                          </span>
                        </div>
                      </div>
                    </div>

                    {order.payment && (
                      <div className="mt-4 flex items-center justify-between rounded-xl bg-white px-3 py-2.5">
                        <span className="text-xs font-bold text-gray-500">
                          Payment
                        </span>

                        <span className="rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-black uppercase text-green-600">
                          {order.payment.status}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* ORDER DETAILS */}
                  <div className="rounded-[24px] border border-gray-100 bg-gray-50 p-5">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-gray-400">
                      Order Details
                    </p>

                    <div className="mt-4 space-y-4">
                      <div>
                        <p className="text-xs font-bold text-gray-400">
                          Order Type
                        </p>

                        <p className="mt-1 font-extrabold text-gray-950">
                          {order.type === "DELIVERY"
                            ? "🚚 Delivery"
                            : "🏪 Self Receive"}
                        </p>
                      </div>

                      {order.deliveryAddress && (
                        <div>
                          <p className="text-xs font-bold text-gray-400">
                            Delivery Address
                          </p>

                          <p className="mt-1 text-sm font-semibold leading-5 text-gray-700">
                            📍 {order.deliveryAddress}
                          </p>
                        </div>
                      )}

                      {order.type === "SELF_RECEIVE" && (
                        <div>
                          <p className="text-xs font-bold text-gray-400">
                            Collection
                          </p>

                          <p className="mt-1 text-sm font-extrabold text-gray-700">
                            📍 Collect from the selected outlet
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}