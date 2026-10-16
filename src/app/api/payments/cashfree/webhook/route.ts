import { NextResponse } from "next/server";
import { validateCashfreeWebhook } from "@/lib/cashfree";
import { confirmCashfreePayment } from "@/lib/cashfree-payment-state";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-webhook-signature");
    const timestamp = request.headers.get("x-webhook-timestamp");
    if (!signature || !timestamp) {
      return NextResponse.json({ error: "Missing webhook signature." }, { status: 400 });
    }
    if (!(await validateCashfreeWebhook(rawBody, timestamp, signature))) {
      return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
    }
    const payload = JSON.parse(rawBody) as {
      type?: string;
      data?: { order?: { order_id?: string }; payment?: { payment_status?: string } };
    };
    const gatewayOrderId = payload.data?.order?.order_id;
    if (!gatewayOrderId) return NextResponse.json({ received: true });
    if (
      payload.type === "PAYMENT_SUCCESS_WEBHOOK" &&
      payload.data?.payment?.payment_status === "SUCCESS"
    ) {
      const confirmation = await confirmCashfreePayment(gatewayOrderId);
      if (confirmation.result === "mismatch") {
        return NextResponse.json({ error: "Payment details did not match." }, { status: 400 });
      }
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Cashfree webhook error:", error);
    return NextResponse.json({ error: "Unable to process webhook." }, { status: 500 });
  }
}
