import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/session";

export async function GET(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie");

    const sessionToken = cookieHeader
      ?.split(";")
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith("session="))
      ?.split("=")[1];

    if (!sessionToken) {
      return NextResponse.json(
        {
          error: "Please login first.",
        },
        { status: 401 }
      );
    }

    const customerId = await verifySession(sessionToken);

    if (!customerId) {
      return NextResponse.json(
        {
          error: "Your session has expired. Please login again.",
        },
        { status: 401 }
      );
    }

    const customer = await prisma.user.findUnique({
      where: {
        id: customerId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
      },
    });

    if (!customer || customer.role !== "CUSTOMER") {
      return NextResponse.json(
        {
          error: "Customer account not found.",
        },
        { status: 401 }
      );
    }

    const orders = await prisma.order.findMany({
      where: {
        customerId: customer.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        outlet: true,
        items: {
          include: {
            product: true,
          },
        },
        payment: true,
        delivery: true,
      },
    });
    const ordersWithQueue = await Promise.all(
  orders.map(async (order) => {
    if (
      order.type !== "SELF_RECEIVE" ||
      order.queueNumber === null ||
      order.status === "COMPLETED" ||
      order.status === "CANCELLED"
    ) {
      return {
        ...order,
        queuePosition: null,
      };
    }

    const ordersAhead = await prisma.order.count({
      where: {
        outletId: order.outletId,
        type: "SELF_RECEIVE",
        queueNumber: {
          lt: order.queueNumber,
        },
        status: {
          notIn: ["COMPLETED", "CANCELLED"],
        },
      },
    });

    return {
      ...order,
      queuePosition: ordersAhead + 1,
    };
  })
);

    return NextResponse.json({
  success: true,
  customer,
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