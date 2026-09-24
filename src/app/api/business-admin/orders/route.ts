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

    const orders = await prisma.order.findMany({
      where: {
        outlet: {
          companyId: user.companyId,
        },
      },

      include: {
        outlet: {
          select: {
            id: true,
            name: true,
          },
        },

        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },

        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },

        payment: {
          select: {
            id: true,
            amount: true,
            method: true,
            status: true,
            transactionId: true,
          },
        },

        delivery: {
          include: {
            deliveryStaff: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error(
      "Business Admin orders error:",
      error
    );

    return NextResponse.json(
      {
        error: "Unable to load business orders.",
      },
      { status: 500 }
    );
  }
}