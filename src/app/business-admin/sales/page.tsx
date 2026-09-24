"use client";

import { useEffect, useState } from "react";

type SalesOrder = {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  type: string;
  createdAt: string;
  outlet: {
    id: string;
    name: string;
  };
  payment: {
    method: string;
    status: string;
  } | null;
};

type SalesData = {
  summary: {
    totalSales: number;
    totalOrders: number;
    paidOrders: number;
    pendingPayments: number;
  };
  orders: SalesOrder[];
};

export default function BusinessAdminSalesPage() {
  const [data, setData] = useState<SalesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadSales() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/business-admin/sales",
        {
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        setError(
          result.error || "Unable to load sales."
        );
        return;
      }

      setData(result);
    } catch (error) {
      console.error("Load sales error:", error);
      setError("Unable to load sales.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSales();
  }, []);

  function formatDate(date: string) {
    return new Date(date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  function formatStatus(status: string) {
    return status.replaceAll("_", " ");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-3xl border border-orange-100 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-3xl">
              📊
            </div>

            <h2 className="text-lg font-extrabold text-gray-900">
              Loading sales...
            </h2>

            <p className="mt-2 text-sm font-medium text-gray-500">
              Please wait while we prepare your sales report.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-3xl border border-red-100 bg-white p-8 shadow-xl">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-2xl">
                ⚠️
              </div>

              <div>
                <h1 className="text-2xl font-extrabold text-gray-900">
                  Sales
                </h1>

                <p className="mt-2 text-sm font-medium text-red-600">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={loadSales}
                  className="mt-5 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 px-5 py-3 text-sm font-extrabold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  ↻ Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const summary = data?.summary;

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 rounded-3xl bg-gradient-to-r from-orange-600 via-orange-500 to-red-500 p-6 text-white shadow-xl sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-3xl backdrop-blur">
                  📊
                </div>

                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-100">
                    Business Analytics
                  </p>

                  <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">
                    Sales
                  </h1>
                </div>
              </div>

              <p className="mt-4 max-w-2xl text-sm font-medium leading-6 text-orange-50 sm:text-base">
                Track your business sales, orders and payment
                summary from one place.
              </p>
            </div>

            <button
              type="button"
              onClick={loadSales}
              className="rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-orange-600 shadow-lg transition hover:-translate-y-0.5 hover:bg-orange-50"
            >
              ↻ Refresh Sales
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            icon="💰"
            title="Total Sales"
            value={`₹${summary?.totalSales.toFixed(2)}`}
            description="Total order value"
            valueClass="text-orange-600"
          />

          <SummaryCard
            icon="🛒"
            title="Total Orders"
            value={String(summary?.totalOrders ?? 0)}
            description="Orders recorded"
            valueClass="text-gray-900"
          />

          <SummaryCard
            icon="✅"
            title="Paid Orders"
            value={String(summary?.paidOrders ?? 0)}
            description="Payments completed"
            valueClass="text-emerald-600"
          />

          <SummaryCard
            icon="⏳"
            title="Pending Payments"
            value={String(
              summary?.pendingPayments ?? 0
            )}
            description="Payments awaiting completion"
            valueClass="text-orange-600"
          />
        </div>

        {/* Sales Orders */}
        <div className="overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-orange-100 bg-gradient-to-r from-orange-50 to-red-50 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-xl shadow-sm">
                  🧾
                </div>

                <div>
                  <h2 className="text-xl font-extrabold text-gray-900">
                    Sales Orders
                  </h2>

                  <p className="mt-1 text-xs font-medium text-gray-500">
                    Order-wise sales and payment details
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-full bg-white px-4 py-2 text-xs font-extrabold text-orange-600 shadow-sm">
              {data?.orders.length ?? 0} Orders
            </div>
          </div>

          {data?.orders.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-100 text-4xl">
                🧾
              </div>

              <h3 className="text-xl font-extrabold text-gray-900">
                No sales orders found
              </h3>

              <p className="mt-2 text-sm font-medium text-gray-500">
                Sales orders will appear here when customers place
                orders.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[1000px]">
                  <thead>
                    <tr className="border-b border-orange-100 bg-gray-50/80 text-left">
                      <th className="px-6 py-4 text-xs font-extrabold uppercase tracking-wide text-gray-400">
                        Order
                      </th>

                      <th className="px-6 py-4 text-xs font-extrabold uppercase tracking-wide text-gray-400">
                        Outlet
                      </th>

                      <th className="px-6 py-4 text-xs font-extrabold uppercase tracking-wide text-gray-400">
                        Type
                      </th>

                      <th className="px-6 py-4 text-xs font-extrabold uppercase tracking-wide text-gray-400">
                        Amount
                      </th>

                      <th className="px-6 py-4 text-xs font-extrabold uppercase tracking-wide text-gray-400">
                        Payment
                      </th>

                      <th className="px-6 py-4 text-xs font-extrabold uppercase tracking-wide text-gray-400">
                        Status
                      </th>

                      <th className="px-6 py-4 text-xs font-extrabold uppercase tracking-wide text-gray-400">
                        Date
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {data?.orders.map((order) => (
                      <tr
                        key={order.id}
                        className="border-b border-gray-100 transition last:border-b-0 hover:bg-orange-50/40"
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-sm">
                              🧾
                            </div>

                            <span className="font-extrabold text-gray-900">
                              {order.orderNumber}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <span className="font-semibold text-gray-700">
                            {order.outlet.name}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                            {formatStatus(order.type)}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <span className="text-base font-extrabold text-orange-600">
                            ₹{order.total.toFixed(2)}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          {order.payment ? (
                            <div>
                              <p className="text-sm font-bold text-gray-800">
                                {order.payment.method}
                              </p>

                              <span
                                className={`mt-1 inline-block rounded-full px-2.5 py-1 text-[10px] font-extrabold ${
                                  order.payment.status ===
                                  "PAID"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-orange-100 text-orange-700"
                                }`}
                              >
                                {order.payment.status}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm font-medium text-gray-400">
                              No payment
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-5">
                          <StatusBadge
                            status={order.status}
                          />
                        </td>

                        <td className="px-6 py-5 text-sm font-medium text-gray-500">
                          {formatDate(order.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="space-y-4 p-4 lg:hidden">
                {data?.orders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-2xl border border-orange-100 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-100">
                          🧾
                        </div>

                        <div>
                          <p className="text-sm font-extrabold text-gray-900">
                            {order.orderNumber}
                          </p>

                          <p className="mt-0.5 text-xs font-medium text-gray-500">
                            {order.outlet.name}
                          </p>
                        </div>
                      </div>

                      <StatusBadge
                        status={order.status}
                      />
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <MobileInfo
                        label="Amount"
                        value={`₹${order.total.toFixed(
                          2
                        )}`}
                        highlight
                      />

                      <MobileInfo
                        label="Type"
                        value={formatStatus(order.type)}
                      />

                      <MobileInfo
                        label="Payment"
                        value={
                          order.payment
                            ? order.payment.status
                            : "No payment"
                        }
                      />

                      <MobileInfo
                        label="Date"
                        value={formatDate(
                          order.createdAt
                        )}
                      />
                    </div>

                    {order.payment && (
                      <div className="mt-3 rounded-xl bg-gray-50 px-3 py-2.5">
                        <p className="text-[10px] font-extrabold uppercase tracking-wide text-gray-400">
                          Payment Method
                        </p>

                        <p className="mt-1 text-sm font-bold text-gray-700">
                          {order.payment.method}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="mt-8 rounded-2xl border border-orange-100 bg-white p-4 text-center text-xs font-medium text-gray-500 shadow-sm">
          Sales management • Order totals and payment information
          are shown from your business sales data
        </div>
      </div>
    </main>
  );
}

function SummaryCard({
  icon,
  title,
  value,
  description,
  valueClass,
}: {
  icon: string;
  title: string;
  value: string;
  description: string;
  valueClass: string;
}) {
  return (
    <div className="rounded-3xl border border-orange-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-gray-400">
            {title}
          </p>

          <p
            className={`mt-2 text-3xl font-black tracking-tight ${valueClass}`}
          >
            {value}
          </p>

          <p className="mt-1 text-xs font-medium text-gray-500">
            {description}
          </p>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-xl">
          {icon}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const normalized = status.toUpperCase();

  let className =
    "bg-gray-100 text-gray-700";

  if (
    normalized === "DELIVERED" ||
    normalized === "COMPLETED" ||
    normalized === "ACCEPTED"
  ) {
    className =
      "bg-emerald-100 text-emerald-700";
  } else if (
    normalized === "CANCELLED"
  ) {
    className =
      "bg-red-100 text-red-700";
  } else if (
    normalized === "PREPARING" ||
    normalized === "READY" ||
    normalized === "ASSIGNED" ||
    normalized === "OUT_FOR_DELIVERY"
  ) {
    className =
      "bg-orange-100 text-orange-700";
  } else if (normalized === "PLACED") {
    className =
      "bg-blue-100 text-blue-700";
  }

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide ${className}`}
    >
      {formatStatusText(status)}
    </span>
  );
}

function MobileInfo({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-xl bg-gray-50 p-3">
      <p className="text-[10px] font-extrabold uppercase tracking-wide text-gray-400">
        {label}
      </p>

      <p
        className={`mt-1 text-sm font-extrabold ${
          highlight
            ? "text-orange-600"
            : "text-gray-800"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function formatStatusText(status: string) {
  return status.replaceAll("_", " ");
}