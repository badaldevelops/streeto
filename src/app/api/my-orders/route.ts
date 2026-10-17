import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getCashfreeMode } from "@/lib/cashfree";

export async function GET(request: Request) {
  try {
    const requestedOrderIds = new URL(request.url).searchParams
      .get("orderIds")
      ?.split(",")
      .filter(Boolean)
      .slice(0, 25);

    const customer = await getCurrentUser();
    if (!customer || customer.role !== "CUSTOMER") {
      return NextResponse.json(
        {
          error: "Customer account not found.",
        },
        { status: 401 }
      );
    }

    const where = {
      customerId: customer.id,
      ...(requestedOrderIds
        ? { id: { in: requestedOrderIds } }
        : { createdAt: { gte: new Date(Date.now() - 48 * 60 * 60 * 1000) } }),
    };

    if (requestedOrderIds) {
      const orders = await prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          orderNumber: true,
          type: true,
          status: true,
        },
      });

      return NextResponse.json({
        success: true,
        orders,
      });
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        outletId: true,
        orderNumber: true,
        type: true,
        status: true,
        queueNumber: true,
        subtotal: true,
        sgstAmount: true,
        cgstAmount: true,
        gstin: true,
        deliveryCharge: true,
        total: true,
        deliveryAddress: true,
        customizationNote: true,
        createdAt: true,
        outlet: {
          select: {
            id: true,
            name: true,
            address: true,
            latitude: true,
            longitude: true,
            businessType: true,
          },
        },
        items: {
          select: {
            id: true,
            quantity: true,
            unitPrice: true,
            totalPrice: true,
            addOns: true,
            sgstAmount: true,
            cgstAmount: true,
            product: {
              select: {
                id: true,
                name: true,
                description: true,
                imageUrl: true,
              },
            },
          },
        },
        payment: { select: { status: true, method: true, gatewaySessionId: true } },
        rating: { select: { stars: true, updatedAt: true } },
      },
    });
    const ordersWithQueue = await Promise.all(
  orders.map(async (order) => {
    const { outletId, ...customerSafeOrder } = order;
    if (
      (order.type !== "SELF_RECEIVE" && order.type !== "DINE_IN") ||
      order.queueNumber === null ||
      order.status === "COMPLETED" ||
      order.status === "CANCELLED"
    ) {
      return {
        ...customerSafeOrder,
        queuePosition: null,
      };
    }

    const ordersAhead = await prisma.order.count({
      where: {
        outletId,
        type: { in: ["SELF_RECEIVE", "DINE_IN"] },
        queueNumber: {
          lt: order.queueNumber,
        },
        status: {
          notIn: ["COMPLETED", "CANCELLED"],
        },
      },
    });

    return {
      ...customerSafeOrder,
      queuePosition: ordersAhead + 1,
    };
  })
);

    return NextResponse.json({
  success: true,
  customer,
      cashfreeMode: getCashfreeMode(),
  orders: ordersWithQueue,
});

    
  } catch (error) {
    console.error("My orders error:", error);

    return NextResponse.json(
      {
        error: "Unable to load your orders.",
      },
      { status: 500 }
    );
  }
}
