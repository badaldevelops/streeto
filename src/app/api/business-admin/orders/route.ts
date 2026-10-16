import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: Request) {
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

    const pendingOnly = new URL(request.url).searchParams.get("pending") === "1";
    const [company, orders] = await Promise.all([
      pendingOnly
        ? Promise.resolve(null)
        : prisma.company.findUnique({
            where: { id: user.companyId },
            select: { isOpen: true },
          }),
      prisma.order.findMany({
        where: {
          outlet: {
            companyId: user.companyId,
          },
          OR: [
            { payment: { is: { method: { not: "ONLINE" } } } },
            { payment: { is: { status: "PAID" } } },
          ],
          createdAt: { gte: new Date(Date.now() - (pendingOnly ? 10 : 72) * 60 * 60 * 1000) },
          ...(pendingOnly
            ? {
                status: { in: ["ACCEPTED", "PREPARING", "READY"] as const },
                payment: { is: { status: "PAID" as const } },
              }
            : {}),
        },
        select: {
          id: true,
          orderNumber: true,
          queueNumber: true,
          type: true,
          status: true,
          subtotal: true,
          sgstAmount: true,
          cgstAmount: true,
          gstin: true,
          deliveryCharge: true,
          total: true,
          createdAt: true,
          customizationNote: true,
          outlet: {
            select: {
              id: true,
              name: true,
            },
          },
          items: {
            select: {
              id: true,
              quantity: true,
              unitPrice: true,
              totalPrice: true,
              sgstAmount: true,
              cgstAmount: true,
              product: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          delivery: {
            select: {
              id: true,
              status: true,
              assignedAt: true,
              pickedUpAt: true,
              deliveredAt: true,
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
          payment: {
            select: { status: true, method: true, amount: true },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: pendingOnly ? 10 : 100,
      }),
    ]);

    return NextResponse.json({
      success: true,
      company,
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
