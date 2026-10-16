import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Super admin access is required." }, { status: admin ? 403 : 401 });
  }

  try {
    const [outlets, payments, payoutRequests] = await Promise.all([
      prisma.outlet.findMany({
        select: { id: true, name: true, address: true, company: { select: { name: true, upiId: true } } },
        orderBy: [{ company: { name: "asc" } }, { name: "asc" }],
      }),
      prisma.payment.findMany({
        where: {
          method: { in: ["ONLINE", "UPI"] },
          status: "PAID",
          order: { status: { not: "CANCELLED" } },
        },
        select: {
          id: true,
          amount: true,
          method: true,
          outletPayoutStatus: true,
          outletPayoutReference: true,
          outletPayoutAt: true,
          createdAt: true,
          order: {
            select: {
              id: true,
              orderNumber: true,
              createdAt: true,
              total: true,
              platformCommissionGst: true,
              platformCommission: true,
              outlet: { select: { id: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.outletPayoutRequest.findMany({
        where: { status: "PENDING" },
        select: {
          id: true,
          amount: true,
          requestedAt: true,
          outlet: {
            select: {
              id: true,
              name: true,
              address: true,
              phone: true,
              cashfreeVendorLast4: true,
              cashfreeVendorIfsc: true,
              company: { select: { name: true, upiId: true } },
            },
          },
          _count: { select: { payments: true } },
        },
        orderBy: { requestedAt: "asc" },
      }),
    ]);

    const summaries = outlets.map((outlet) => {
      const outletPayments = payments.filter((payment) => payment.order.outlet.id === outlet.id);
      const settleablePayments = outletPayments.filter((payment) => payment.method === "ONLINE");
      const pending = settleablePayments.filter((payment) => payment.outletPayoutStatus !== "PAID");
      const paid = settleablePayments.filter((payment) => payment.outletPayoutStatus === "PAID");
      return {
        outletId: outlet.id,
        outletName: outlet.name,
        businessName: outlet.company.name,
        businessUpiId: outlet.company.upiId,
        address: outlet.address,
        paidOrderCount: outletPayments.length,
        pendingCount: pending.length,
        pendingAmount: roundMoney(pending.reduce((sum, payment) => sum + netOutletAmount(payment.amount, payment.order.platformCommission, payment.order.platformCommissionGst), 0)),
        paidCount: paid.length,
        paidAmount: roundMoney(paid.reduce((sum, payment) => sum + netOutletAmount(payment.amount, payment.order.platformCommission, payment.order.platformCommissionGst), 0)),
        commissionEarned: roundMoney(outletPayments.reduce((sum, payment) => sum + payment.order.platformCommission, 0)),
        commissionGst: roundMoney(outletPayments.reduce((sum, payment) => sum + payment.order.platformCommissionGst, 0)),
        netEarned: roundMoney(outletPayments.reduce((sum, payment) => sum + netOutletAmount(payment.amount, payment.order.platformCommission, payment.order.platformCommissionGst), 0)),
        orders: outletPayments.map((payment) => ({
          paymentId: payment.id,
          orderId: payment.order.id,
          orderNumber: payment.order.orderNumber,
          orderDate: payment.order.createdAt,
          paidAt: payment.createdAt,
          amount: payment.amount,
          commissionGst: payment.order.platformCommissionGst,
          outletPayoutAmount: netOutletAmount(payment.amount, payment.order.platformCommission, payment.order.platformCommissionGst),
          method: payment.method,
          platformCommission: payment.order.platformCommission,
          payoutStatus: payment.outletPayoutStatus === "PAID" ? "RECORDED_PAID" : "PENDING",
          payoutReference: payment.outletPayoutReference,
          payoutAt: payment.outletPayoutAt,
        })),
      };
    });

    return NextResponse.json({
      success: true,
      summaries,
      payoutRequests: payoutRequests.map((request) => ({
        id: request.id,
        amount: request.amount,
        requestedAt: request.requestedAt,
        paymentCount: request._count.payments,
        outletId: request.outlet.id,
        outletName: request.outlet.name,
        businessName: request.outlet.company.name,
        address: request.outlet.address,
        phone: request.outlet.phone,
        upiId: request.outlet.company.upiId,
        bankLast4: request.outlet.cashfreeVendorLast4,
        bankIfsc: request.outlet.cashfreeVendorIfsc,
      })),
      totals: {
        pendingAmount: roundMoney(summaries.reduce((sum, outlet) => sum + outlet.pendingAmount, 0)),
        paidAmount: roundMoney(summaries.reduce((sum, outlet) => sum + outlet.paidAmount, 0)),
        outletCount: outlets.length,
        paidOrderCount: summaries.reduce((sum, outlet) => sum + outlet.paidOrderCount, 0),
        commissionEarned: roundMoney(summaries.reduce((sum, outlet) => sum + outlet.commissionEarned, 0)),
        commissionGst: roundMoney(summaries.reduce((sum, outlet) => sum + outlet.commissionGst, 0)),
        netEarned: roundMoney(summaries.reduce((sum, outlet) => sum + outlet.netEarned, 0)),
        pendingRequestCount: payoutRequests.length,
      },
      note: "For new orders, Qtoo commission is 2% of the total bill with 18% GST on that commission. The outlet payout is customer payment less the fee and GST. Cashfree processing fees, if applicable, are a separate deduction from the merchant settlement. UPI is paid directly to the business account; this report does not initiate or independently verify bank transfers.",
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Load super admin settlement overview error:", error);
    return NextResponse.json({ error: "Unable to load outlet settlement overview." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Super admin access is required." }, { status: admin ? 403 : 401 });
  }

  const body = await request.json().catch(() => null) as { payoutRequestId?: unknown; utr?: unknown } | null;
  const payoutRequestId = typeof body?.payoutRequestId === "string" ? body.payoutRequestId.trim() : "";
  const utr = typeof body?.utr === "string" ? body.utr.trim() : "";
  if (!payoutRequestId || utr.length < 4 || utr.length > 100) {
    return NextResponse.json({ error: "Payout request and valid UTR are required." }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const payout = await tx.outletPayoutRequest.findUnique({
        where: { id: payoutRequestId },
        select: { id: true, amount: true, status: true, _count: { select: { payments: true } } },
      });
      if (!payout) throw new Error("Payout request not found.");
      if (payout.status !== "PENDING") throw new Error("This payout request has already been processed.");
      if (!payout._count.payments) throw new Error("This request has no payable orders.");

      const paidAt = new Date();
      const payments = await tx.payment.updateMany({
        where: { outletPayoutRequestId: payout.id, status: "PAID", outletPayoutStatus: "REQUESTED" },
        data: { outletPayoutStatus: "PAID", outletPayoutReference: utr, outletPayoutAt: paidAt },
      });
      if (payments.count !== payout._count.payments) throw new Error("Payout records changed. Refresh the page before retrying.");

      const requestUpdate = await tx.outletPayoutRequest.updateMany({
        where: { id: payout.id, status: "PENDING" },
        data: { status: "PAID", utr, paidAt, paidByUserId: admin.id },
      });
      if (requestUpdate.count !== 1) throw new Error("This payout request has already been processed.");

      return { amount: payout.amount, paymentCount: payments.count, utr, paidAt };
    });
    return NextResponse.json({ success: true, payout: result });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Unable to record outlet payout.";
    return NextResponse.json({ error: message }, { status: message.includes("not found") ? 404 : 409 });
  }
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function netOutletAmount(grossAmount: number, commission: number, gst: number) {
  return Math.max(0, roundMoney(grossAmount - commission - gst));
}
