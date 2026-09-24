import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
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

    if (user.role !== "DELIVERY_STAFF") {
      return NextResponse.json(
        {
          error: "Access denied.",
        },
        { status: 403 }
      );
    }

    const deliveries =
      await prisma.delivery.findMany({
        where: {
          deliveryStaffId: user.id,
        },
        orderBy: {
          assignedAt: "desc",
        },
        include: {
          order: {
            include: {
              customer: {
                select: {
                  name: true,
                  phone: true,
                },
              },
              outlet: {
                select: {
                  name: true,
                  address: true,
                },
              },
              items: {
                include: {
                  product: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

    return NextResponse.json({
      success: true,
      deliveries,
    });
  } catch (error) {
    console.error(
      "Delivery orders error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to load delivery orders.",
      },
      { status: 500 }
    );
  }
}