import { prisma } from "@/lib/prisma";
import { fetchCashfreeOrder } from "@/lib/cashfree";
import { sendNewOrderPush } from "@/lib/business-push";

export async function confirmCashfreePayment(gatewayOrderId: string) {
  const payment = await prisma.payment.findUnique({
    where: { gatewayOrderId },
    include: {
      order: {
        include: { outlet: { select: { companyId: true } } },
      },
    },
  });
  if (!payment) return { result: "not_found" as const };
  if (payment.status === "PAID") {
    // Payment may have been marked paid just before this confirmation flow was
    // deployed. Promote any still-unconfirmed paid order exactly once.
    if (payment.order.status === "PLACED") {
      const promoted = await prisma.order.updateMany({
        where: { id: payment.order.id, status: "PLACED" },
        data: { status: "ACCEPTED" },
      });
      if (promoted.count === 1) {
        await sendNewOrderPush(payment.order.outlet.companyId, {
          id: payment.order.id,
          orderNumber: payment.order.orderNumber,
          total: payment.order.total,
        });
      }
    }
    return { result: "paid" as const };
  }

  const gatewayOrder = await fetchCashfreeOrder(gatewayOrderId);
  const amountMatches =
    typeof gatewayOrder.order_amount === "number" &&
    Math.abs(gatewayOrder.order_amount - payment.amount) < 0.01;
  if (
    gatewayOrder.order_id !== gatewayOrderId ||
    gatewayOrder.order_currency !== "INR" ||
    !amountMatches
  ) {
    return { result: "mismatch" as const };
  }
  if (gatewayOrder.order_status !== "PAID") {
    return { result: "pending" as const };
  }

  const confirmed = await prisma.$transaction(async (transaction) => {
    const activeQueueCount = payment.order.type === "SELF_RECEIVE" || payment.order.type === "DINE_IN"
      ? await transaction.order.count({
          where: {
            outletId: payment.order.outletId,
            type: { in: ["SELF_RECEIVE", "DINE_IN"] },
            status: { notIn: ["COMPLETED", "CANCELLED", "PAYMENT_PENDING"] },
            payment: { is: { status: "PAID" } },
          },
        })
      : null;
    const updated = await transaction.payment.updateMany({
      where: { id: payment.id, status: "PENDING" },
      data: { status: "PAID" },
    });
    if (updated.count !== 1) return false;

    await transaction.order.update({
      where: { id: payment.order.id },
      data: {
        status: "ACCEPTED",
        queueNumber: activeQueueCount === null ? null : activeQueueCount + 1,
        queuePosition: activeQueueCount === null ? null : activeQueueCount + 1,
      },
    });
    return true;
  });

  if (confirmed) {
    await sendNewOrderPush(payment.order.outlet.companyId, {
      id: payment.order.id,
      orderNumber: payment.order.orderNumber,
      total: payment.order.total,
    });
    return { result: "paid" as const };
  }
  const currentPayment = await prisma.payment.findUnique({
    where: { id: payment.id },
    select: { status: true },
  });
  return { result: currentPayment?.status === "PAID" ? "paid" as const : "pending" as const };
}
