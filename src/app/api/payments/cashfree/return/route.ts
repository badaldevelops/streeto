import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { confirmCashfreePayment } from "@/lib/cashfree-payment-state";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const gatewayOrderId = url.searchParams.get("order_id");
  const home = new URL("/my-orders", url.origin);
  if (!gatewayOrderId || gatewayOrderId.length > 100) {
    home.searchParams.set("payment", "pending");
    return NextResponse.redirect(home);
  }

  try {
    const result = await confirmCashfreePayment(gatewayOrderId);
    if (result.result === "not_found" || result.result === "mismatch") {
      home.searchParams.set("payment", "pending");
    } else if (result.result === "paid") {
      const payment = await prisma.payment.findUnique({
        where: { gatewayOrderId },
        select: { order: { select: { customerId: true } } },
      });
      // A return link must not reveal another customer's order details.
      if (payment?.order.customerId) {
        home.searchParams.set("payment", "success");
      } else {
        home.searchParams.set("payment", "pending");
      }
    } else {
      home.searchParams.set("payment", "pending");
    }
  } catch (error) {
    console.error("Cashfree return verification error:", error);
    home.searchParams.set("payment", "pending");
  }
  return NextResponse.redirect(home);
}
