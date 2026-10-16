import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const allowedStatuses = [
  "PLACED",
  "ACCEPTED",
  "PREPARING",
  "READY",
  "ASSIGNED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
] as const;

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please login first." },
        { status: 401 }
      );
    }

    if (user.role !== "BUSINESS_ADMIN") {
      return NextResponse.json(
        { error: "Access denied." },
        { status: 403 }
      );
    }

    if (!user.companyId) {
      return NextResponse.json(
        { error: "Business is not assigned." },
        { status: 400 }
      );
    }

    const body = (await request.json()) as any;

    const orderId = body.orderId;
    const status = body.status;

    if (body.action === "confirm-upi-payment") {
      if (typeof orderId !== "string" || !orderId) {
        return NextResponse.json({ error: "Order ID is required." }, { status: 400 });
      }
      const order = await prisma.order.findFirst({
        where: { id: orderId, outlet: { companyId: user.companyId } },
        select: { id: true, orderNumber: true, payment: { select: { method: true, status: true } } },
      });
      if (!order) return NextResponse.json({ error: "Order not found or access denied." }, { status: 404 });
      if (order.payment?.method !== "UPI" || order.payment.status !== "PENDING") {
        return NextResponse.json({ error: "This order has no pending direct UPI payment." }, { status: 409 });
      }
      await prisma.payment.update({
        where: { orderId: order.id },
        data: { status: "PAID" },
      });
      return NextResponse.json({ success: true, orderId: order.id, paymentStatus: "PAID" });
    }

    if (!orderId || !status) {
      return NextResponse.json(
        {
          error:
            "Order ID and status are required.",
        },
        { status: 400 }
      );
    }

    if (
      !allowedStatuses.includes(
        status as (typeof allowedStatuses)[number]
      )
    ) {
      return NextResponse.json(
        {
          error: "Invalid order status.",
        },
        { status: 400 }
      );
    }

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        outlet: {
          companyId: user.companyId,
        },
      },
      select: {
        id: true,
        status: true,
        payment: { select: { status: true } },
      },
    });

    if (!order) {
      return NextResponse.json(
        {
          error:
            "Order not found or access denied.",
        },
        { status: 404 }
      );
    }

    if (status !== "CANCELLED" && order.payment?.status !== "PAID") {
      return NextResponse.json(
        { error: "Check the payment in your bank or UPI app and confirm it before accepting this order." },
        { status: 409 }
      );
    }

    const updatedOrder =
      await prisma.order.update({
        where: {
          id: order.id,
        },
        data: {
          status:
            status as (typeof allowedStatuses)[number],
        },
        select: {
          id: true,
          orderNumber: true,
          status: true,
        },
      });

    return NextResponse.json({
      success: true,
      message: "Order status updated successfully.",
      order: updatedOrder,
    });
  } catch (error) {
    console.error(
      "Business Admin order status error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to update order status.",
      },
      { status: 500 }
    );
  }
}
