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

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const [todaysOrders, todaysSales, outlets, products] =
      await Promise.all([
        prisma.order.count({
          where: {
            outlet: {
              companyId,
            },
            createdAt: {
              gte: startOfToday,
              lte: endOfToday,
            },
          },
        }),

        prisma.order.aggregate({
          where: {
            outlet: {
              companyId,
            },
            createdAt: {
              gte: startOfToday,
              lte: endOfToday,
            },
            status: {
              not: "CANCELLED",
            },
          },
          _sum: {
            total: true,
          },
        }),

        prisma.outlet.count({
          where: {
            companyId,
            isActive: true,
          },
        }),

        prisma.product.count({
          where: {
            companyId,
            isActive: true,
          },
        }),
      ]);

    return NextResponse.json({
      success: true,
      stats: {
        todaysOrders,
        todaysSales: todaysSales._sum.total ?? 0,
        outlets,
        products,
      },
    });
  } catch (error) {
    console.error(
      "Business Admin stats error:",
      error
    );

    return NextResponse.json(
      {
        error: "Unable to load business statistics.",
      },
      { status: 500 }
    );
  }
}