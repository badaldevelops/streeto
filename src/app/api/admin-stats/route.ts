import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          error: "Please login first.",
        },
        { status: 401 }
      );
    }

    if (user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        {
          error: "Access denied.",
        },
        { status: 403 }
      );
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const todayOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
      select: {
        id: true,
        type: true,
        total: true,
      },
    });

    const todaysOrders = todayOrders.length;

    const todaysSales = todayOrders.reduce(
      (total, order) => total + order.total,
      0
    );

    const onlineOrders = todayOrders.length;

const offlineOrders = 0;
    return NextResponse.json({
      success: true,
      stats: {
        todaysOrders,
        todaysSales,
        onlineOrders,
        offlineOrders,
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error);

    return NextResponse.json(
      {
        error: "Unable to load admin statistics.",
      },
      { status: 500 }
    );
  }
}