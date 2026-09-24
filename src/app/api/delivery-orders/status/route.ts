import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const allowedStatuses = [
  "ASSIGNED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please login first." },
        { status: 401 }
      );
    }

    if (user.role !== "DELIVERY_STAFF") {
      return NextResponse.json(
        { error: "Access denied." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { orderId, status } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required." },
        { status: 400 }
      );
    }

    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid delivery status." },
        { status: 400 }
      );
    }

    const delivery = await prisma.delivery.findFirst({
      where: {
        orderId,
        deliveryStaffId: user.id,
      },
    });

    if (!delivery) {
      return NextResponse.json(
        { error: "Delivery order not found." },
        { status: 404 }
      );
    }

    const now = new Date();

    const deliveryData: {
      status: string;
      pickedUpAt?: Date;
      deliveredAt?: Date;
    } = {
      status,
    };

    if (status === "OUT_FOR_DELIVERY") {
      deliveryData.pickedUpAt = now;
    }

    if (status === "DELIVERED") {
      deliveryData.deliveredAt = now;
    }

    const updatedDelivery = await prisma.delivery.update({
      where: {
        id: delivery.id,
      },
      data: deliveryData,
    });

    await prisma.order.update({
      where: {
        id: orderId,
      },
      data: {
        status,
      },
    });

    return NextResponse.json({
      success: true,
      delivery: updatedDelivery,
    });
  } catch (error) {
    console.error("Delivery status update error:", error);

    return NextResponse.json(
      { error: "Unable to update delivery status." },
      { status: 500 }
    );
  }
}