import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const admin = await getCurrentUser();

    if (!admin) {
      return NextResponse.json(
        { error: "Please login first." },
        { status: 401 }
      );
    }

    if (admin.role !== "BUSINESS_ADMIN") {
      return NextResponse.json(
        { error: "Access denied." },
        { status: 403 }
      );
    }

    if (!admin.companyId) {
      return NextResponse.json(
        { error: "Business is not assigned." },
        { status: 400 }
      );
    }

    const body = await request.json();

    const orderId =
      typeof body.orderId === "string"
        ? body.orderId.trim()
        : "";

    const deliveryStaffId =
      typeof body.deliveryStaffId === "string"
        ? body.deliveryStaffId.trim()
        : "";

    if (!orderId || !deliveryStaffId) {
      return NextResponse.json(
        {
          error:
            "Order ID and delivery staff ID are required.",
        },
        { status: 400 }
      );
    }

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        outlet: {
          companyId: admin.companyId,
        },
      },
      select: {
        id: true,
        type: true,
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

    if (order.type !== "DELIVERY") {
      return NextResponse.json(
        {
          error:
            "Only delivery orders can be assigned to delivery staff.",
        },
        { status: 400 }
      );
    }

    const deliveryStaff =
      await prisma.user.findFirst({
        where: {
          id: deliveryStaffId,
          companyId: admin.companyId,
          role: "DELIVERY_STAFF",
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });

    if (!deliveryStaff) {
      return NextResponse.json(
        {
          error:
            "Delivery staff not found, inactive, or access denied.",
        },
        { status: 404 }
      );
    }

    const delivery =
      await prisma.delivery.upsert({
        where: {
          orderId,
        },
        update: {
          status: "ASSIGNED",
          assignedAt: new Date(),
          deliveryStaffId:
            deliveryStaff.id,
          pickedUpAt: null,
          deliveredAt: null,
        },
        create: {
          orderId,
          status: "ASSIGNED",
          assignedAt: new Date(),
          deliveryStaffId:
            deliveryStaff.id,
        },
      });

    await prisma.order.update({
      where: {
        id: orderId,
      },
      data: {
        status: "ASSIGNED",
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "Delivery order assigned successfully.",
      delivery,
    });
  } catch (error) {
    console.error(
      "Business Admin assign delivery error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to assign delivery order.",
      },
      { status: 500 }
    );
  }
}
