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

    const body = await request.json();

    const orderId = body.orderId;
    const status = body.status;

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