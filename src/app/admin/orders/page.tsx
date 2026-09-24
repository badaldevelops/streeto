"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type OrderItem = {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product: {
    name: string;
  };
};

type Customer = {
  name: string;
  email: string;
  phone: string;
} | null;

type Outlet = {
  name: string;
};

type Payment = {
  amount: number;
  method: string;
  status: string;
} | null;

type Delivery = {
  status: string;
} | null;

type DeliveryStaff = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
};

type Order = {
  id: string;
  orderNumber: string;
  type: string;
  status: string;
  subtotal: number;
  deliveryCharge: number;
  total: number;
  deliveryAddress: string | null;
  customerPhone: string | null;
  customerName: string | null;
  createdAt: string;
  customer: Customer;
  outlet: Outlet;
  items: OrderItem[];
  payment: Payment;
  delivery: Delivery;
};

async function updateOrderStatus(
  orderId: string,
  status: string
) {
  const response = await fetch(
    "/api/admin-orders/status",
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
        "Unable to update order status."
    );
    return false;
  }

  return true;
}

export default function AdminOrdersPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveryStaff, setDeliveryStaff] = useState<
    DeliveryStaff[]
  >([]);

  const [selectedStaff, setSelectedStaff] =
    useState<Record<string, string>>({});

  const [assigningOrderId, setAssigningOrderId] =
    useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadOrders() {
      try {
        const meResponse = await fetch("/api/me");

        if (!meResponse.ok) {
          router.replace("/login");
          return;
        }

        const meData = await meResponse.json();

        if (
          !meData.authenticated ||
          meData.user?.role !== "SUPER_ADMIN"
        ) {
          router.replace("/");
          return;
        }

        const [ordersResponse, staffResponse] =
          await Promise.all([
            fetch("/api/admin-orders"),
            fetch("/api/orders/assign-delivery"),
          ]);

        const ordersData =
          await ordersResponse.json();

        const staffData =
          await staffResponse.json();

        if (!ordersResponse.ok) {
          setError(
            ordersData.error ||
              "Unable to load orders."
          );
          return;
        }

        if (!staffResponse.ok) {
          setError(
            staffData.error ||
              "Unable to load delivery staff."
          );
          return;
        }

        setOrders(ordersData.orders || []);
        setDeliveryStaff(
          staffData.deliveryStaff || []
        );
      } catch (error) {
        console.error(error);
        setError("Unable to load orders.");
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, [router]);

  async function assignDelivery(
    orderId: string
  ) {
    const deliveryStaffId =
      selectedStaff[orderId];

    if (!deliveryStaffId) {
      alert(
        "Please select a delivery staff member."
      );
      return;
    }

    setAssigningOrderId(orderId);

    try {
      const response = await fetch(
        "/api/orders/assign-delivery",
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
        alert(
          data.error ||
            "Unable to assign delivery."
        );
        return;
      }

      setOrders((currentOrders) =>
        currentOrders.map((currentOrder) =>
          currentOrder.id === orderId
            ? {
                ...currentOrder,
                status: "ASSIGNED",
                delivery: {
                  status: "ASSIGNED",
                },
              }
            : currentOrder
        )
      );

      alert(
        "Delivery order assigned successfully."
      );
    } catch (error) {
      console.error(error);
      alert(
        "Something went wrong while assigning delivery."
      );
    } finally {
      setAssigningOrderId(null);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 px-5 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-gray-600">
              Loading orders...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 px-5 py-10">
      <div className="mx-auto max-w-6xl">

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-gray-500">
              MR DABS ADMIN
            </p>

            <h1 className="mt-1 text-3xl font-bold">
              Orders
            </h1>

            <p className="mt-1 text-gray-600">
              Manage customer orders.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/admin")}
            className="rounded-xl border bg-white px-5 py-3 text-sm font-semibold hover:bg-gray-50"
          >
            Back to Dashboard
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            {error}
          </div>
        )}

        {!error && orders.length === 0 && (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <h2 className="text-xl font-bold">
              No orders found
            </h2>

            <p className="mt-2 text-gray-500">
              Customer orders will appear here.
            </p>
          </div>
        )}

        <div className="space-y-6">

          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-2xl bg-white p-6 shadow-sm"
            >

              <div className="flex flex-wrap items-start justify-between gap-4 border-b pb-5">

                <div>
                  <p className="text-sm text-gray-500">
                    Order Number
                  </p>

                  <h2 className="text-xl font-bold">
                    {order.orderNumber}
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    {new Date(
                      order.createdAt
                    ).toLocaleString("en-IN")}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">

                  <div className="rounded-full bg-gray-100 px-4 py-2 text-sm font-semibold">
                    {order.status}
                  </div>

                  {[
                    "ACCEPTED",
                    "PREPARING",
                    "READY",
                    ...(order.type === "DELIVERY"
                      ? [
                          "OUT_FOR_DELIVERY",
                          "DELIVERED",
                        ]
                      : ["COMPLETED"]),
                  ].map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={async () => {
                        const success =
                          await updateOrderStatus(
                            order.id,
                            status
                          );

                        if (success) {
                          setOrders(
                            (currentOrders) =>
                              currentOrders.map(
                                (currentOrder) =>
                                  currentOrder.id ===
                                  order.id
                                    ? {
                                        ...currentOrder,
                                        status,
                                      }
                                    : currentOrder
                              )
                          );
                        }
                      }}
                      className="rounded-lg border px-3 py-2 text-xs font-semibold hover:bg-gray-100"
                    >
                      {status.replaceAll(
                        "_",
                        " "
                      )}
                    </button>
                  ))}

                </div>
              </div>

              <div className="mt-5 grid gap-5 md:grid-cols-2">

                <div>
                  <h3 className="font-bold">
                    Customer
                  </h3>

                  <p className="mt-2 text-sm">
                    {order.customer?.name ||
                      order.customerName ||
                      "Customer"}
                  </p>

                  <p className="text-sm text-gray-600">
                    {order.customer?.phone ||
                      order.customerPhone ||
                      "No phone"}
                  </p>

                  {order.customer?.email && (
                    <p className="text-sm text-gray-600">
                      {order.customer.email}
                    </p>
                  )}
                </div>

                <div>
                  <h3 className="font-bold">
                    Order Details
                  </h3>

                  <p className="mt-2 text-sm text-gray-600">
                    Type:{" "}
                    {order.type === "DELIVERY"
                      ? "Delivery"
                      : "Self Receive"}
                  </p>

                  <p className="text-sm text-gray-600">
                    Outlet: {order.outlet.name}
                  </p>

                  {order.deliveryAddress && (
                    <p className="text-sm text-gray-600">
                      Address:{" "}
                      {order.deliveryAddress}
                    </p>
                  )}
                </div>

              </div>

              {order.type === "DELIVERY" && (
                <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-5">

                  <h3 className="font-bold text-blue-900">
                    Delivery Assignment
                  </h3>

                  {order.delivery?.status ===
                    "ASSIGNED" && (
                    <p className="mt-2 text-sm font-semibold text-green-700">
                      ✅ Delivery Staff Assigned
                    </p>
                  )}

                  <div className="mt-3 flex flex-col gap-3 sm:flex-row">

                    <select
                      value={
                        selectedStaff[order.id] || ""
                      }
                      onChange={(event) =>
                        setSelectedStaff(
                          (current) => ({
                            ...current,
                            [order.id]:
                              event.target.value,
                          })
                        )
                      }
                      className="w-full rounded-xl border bg-white px-4 py-3 text-sm font-medium sm:flex-1"
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
                            {staff.name} —{" "}
                            {staff.phone ||
                              staff.email}
                          </option>
                        )
                      )}
                    </select>

                    <button
                      type="button"
                      onClick={() =>
                        assignDelivery(order.id)
                      }
                      disabled={
                        assigningOrderId ===
                        order.id
                      }
                      className="rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {assigningOrderId ===
                      order.id
                        ? "Assigning..."
                        : "Assign Delivery"}
                    </button>

                  </div>

                  {deliveryStaff.length === 0 && (
                    <p className="mt-3 text-sm text-red-600">
                      No delivery staff accounts found.
                    </p>
                  )}

                </div>
              )}

              <div className="mt-5 border-t pt-5">

                <h3 className="font-bold">
                  Items
                </h3>

                <div className="mt-3 space-y-2">

                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span>
                        {item.product.name} ×{" "}
                        {item.quantity}
                      </span>

                      <span className="font-semibold">
                        ₹{item.totalPrice}
                      </span>
                    </div>
                  ))}

                </div>

              </div>

              <div className="mt-5 border-t pt-5">

                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>
                    ₹{order.subtotal}
                  </span>
                </div>

                <div className="mt-1 flex justify-between text-sm">
                  <span>Delivery Charge</span>
                  <span>
                    ₹{order.deliveryCharge}
                  </span>
                </div>

                <div className="mt-3 flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>
                    ₹{order.total}
                  </span>
                </div>

              </div>

              <div className="mt-5 flex flex-wrap gap-4 border-t pt-5 text-sm">

                <div>
                  <span className="font-semibold">
                    Payment:
                  </span>{" "}
                  {order.payment?.status ||
                    "N/A"}
                </div>

                {order.delivery && (
                  <div>
                    <span className="font-semibold">
                      Delivery:
                    </span>{" "}
                    {order.delivery.status}
                  </div>
                )}

              </div>

            </div>
          ))}

        </div>

      </div>
    </main>
  );
}