import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const admin = await getCurrentUser();

    if (!admin) {
      return NextResponse.json(
        { error: "Please login first." },
        { status: 401 }
      );
    }

    if (admin.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Access denied." },
        { status: 403 }
      );
    }

    const deliveryStaff = await prisma.user.findMany({
      where: {
        role: "DELIVERY_STAFF",
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      deliveryStaff,
    });
  } catch (error) {
    console.error(
      "Load delivery staff error:",
      error
    );

    return NextResponse.json(
      {
        error: "Unable to load delivery staff.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const admin = await getCurrentUser();

    if (!admin) {
      return NextResponse.json(
        { error: "Please login first." },
        { status: 401 }
      );
    }

    if (admin.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Access denied." },
        { status: 403 }
      );
    }

    const body = await request.json();

    const { orderId, deliveryStaffId } = body;

    if (!orderId || !deliveryStaffId) {
      return NextResponse.json(
        {
          error:
            "Order ID and delivery staff ID are required.",
        },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found." },
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

    const deliveryStaff = await prisma.user.findUnique({
      where: {
        id: deliveryStaffId,
      },
    });

    if (!deliveryStaff) {
      return NextResponse.json(
        { error: "Delivery staff not found." },
        { status: 404 }
      );
    }

    if (deliveryStaff.role !== "DELIVERY_STAFF") {
      return NextResponse.json(
        {
          error:
            "Selected user is not delivery staff.",
        },
        { status: 400 }
      );
    }

    const delivery = await prisma.delivery.upsert({
      where: {
        orderId,
      },
      update: {
        status: "ASSIGNED",
        assignedAt: new Date(),
        deliveryStaffId,
        pickedUpAt: null,
        deliveredAt: null,
      },
      create: {
        orderId,
        status: "ASSIGNED",
        assignedAt: new Date(),
        deliveryStaffId,
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
      "Assign delivery order error:",
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