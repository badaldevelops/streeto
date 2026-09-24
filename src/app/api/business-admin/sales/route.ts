import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
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

    const companyId = user.companyId;

    const orders = await prisma.order.findMany({
      where: {
        outlet: {
          companyId,
        },
        status: {
          not: "CANCELLED",
        },
      },
      select: {
        id: true,
        orderNumber: true,
        total: true,
        status: true,
        type: true,
        createdAt: true,
        outlet: {
          select: {
            id: true,
            name: true,
          },
        },
        payment: {
          select: {
            method: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const totalSales = orders.reduce(
      (sum, order) => sum + order.total,
      0
    );

    const totalOrders = orders.length;

    const paidOrders = orders.filter(
      (order) => order.payment?.status === "PAID"
    ).length;

    const pendingPayments = orders.filter(
      (order) =>
        !order.payment ||
        order.payment.status === "PENDING"
    ).length;

    return NextResponse.json({
      success: true,
      summary: {
        totalSales,
        totalOrders,
        paidOrders,
        pendingPayments,
      },
      orders,
    });
  } catch (error) {
    console.error(
      "Business Admin sales error:",
      error
    );

    return NextResponse.json(
      {
        error: "Unable to load sales data.",
      },
      { status: 500 }
    );
  }
}