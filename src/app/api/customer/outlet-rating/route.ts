import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const customer = await getCurrentUser();
  if (!customer || customer.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Customer login is required to rate an outlet." }, { status: 401 });
  }

  const body = await request.json().catch(() => null) as { orderId?: unknown; stars?: unknown } | null;
  const orderId = typeof body?.orderId === "string" ? body.orderId.trim() : "";
  const stars = body?.stars;
  if (!orderId || !Number.isInteger(stars) || typeof stars !== "number" || stars < 1 || stars > 5) {
    return NextResponse.json({ error: "Choose a rating from 1 to 5 stars." }, { status: 400 });
  }

  try {
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        customerId: customer.id,
        status: { in: ["COMPLETED", "DELIVERED"] },
        payment: { is: { status: "PAID" } },
      },
      select: { id: true, outletId: true },
    });
    if (!order) {
      return NextResponse.json({ error: "Only your completed, paid orders can be rated." }, { status: 403 });
    }

    const rating = await prisma.outletRating.upsert({
      where: { orderId: order.id },
      create: { orderId: order.id, outletId: order.outletId, customerId: customer.id, stars },
      update: { stars },
      select: { stars: true, updatedAt: true },
    });

    return NextResponse.json({ success: true, rating });
  } catch (error) {
    console.error("Save outlet rating error:", error);
    return NextResponse.json({ error: "Unable to save your rating." }, { status: 500 });
  }
}
