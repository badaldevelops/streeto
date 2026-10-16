import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "BUSINESS_ADMIN" || !user.companyId) {
    return NextResponse.json({ error: "Business admin access is required." }, { status: 403 });
  }

  const [payments, businessOutlets] = await Promise.all([
    prisma.payment.findMany({
      where: {
        method: "ONLINE",
        status: "PAID",
        order: { status: { not: "CANCELLED" }, outlet: { companyId: user.companyId } },
      },
      select: {
        id: true,
        amount: true,
        outletPayoutStatus: true,
        outletPayoutReference: true,
        outletPayoutAt: true,
        createdAt: true,
        order: {
          select: {
            orderNumber: true,
            outlet: { select: { id: true, name: true } },
            platformCommission: true,
            platformCommissionGst: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.outlet.findMany({ where: { companyId: user.companyId }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const outlets = new Map<string, {
    outletId: string;
    outletName: string;
    dueAmount: number;
    withdrawableAmount: number;
    requestedAmount: number;
    dueCount: number;
    paidAmount: number;
    paidCount: number;
    duePayments: Array<{ id: string; orderNumber: string; amount: number; grossAmount: number; commissionAmount: number; commissionGst: number; createdAt: Date; payoutStatus: string }>;
    paidPayments: Array<{ orderNumber: string; amount: number; paidAt: Date | null; reference: string | null }>;
    requests: Array<{ id: string; amount: number; requestedAt: Date }>;
  }>();

  for (const outlet of businessOutlets) {
    outlets.set(outlet.id, {
      outletId: outlet.id,
      outletName: outlet.name,
      dueAmount: 0,
      withdrawableAmount: 0,
      requestedAmount: 0,
      dueCount: 0,
      paidAmount: 0,
      paidCount: 0,
      duePayments: [],
      paidPayments: [],
      requests: [],
    });
  }

  for (const payment of payments) {
    const outlet = payment.order.outlet;
    const summary = outlets.get(outlet.id) ?? {
      outletId: outlet.id,
      outletName: outlet.name,
      dueAmount: 0,
      withdrawableAmount: 0,
      requestedAmount: 0,
      dueCount: 0,
      paidAmount: 0,
      paidCount: 0,
      duePayments: [],
      paidPayments: [],
      requests: [],
    };
    if (payment.outletPayoutStatus === "PAID") {
      const payoutAmount = netOutletAmount(payment.amount, payment.order.platformCommission, payment.order.platformCommissionGst);
      summary.paidAmount += payoutAmount;
      summary.paidCount += 1;
      summary.paidPayments.push({
        orderNumber: payment.order.orderNumber,
        amount: payoutAmount,
        paidAt: payment.outletPayoutAt,
        reference: payment.outletPayoutReference,
      });
    } else {
      const payoutAmount = netOutletAmount(payment.amount, payment.order.platformCommission, payment.order.platformCommissionGst);
      summary.dueAmount += payoutAmount;
      summary.dueCount += 1;
      if (payment.outletPayoutStatus === "REQUESTED") summary.requestedAmount += payoutAmount;
      else summary.withdrawableAmount += payoutAmount;
      summary.duePayments.push({
        id: payment.id,
        orderNumber: payment.order.orderNumber,
        amount: payoutAmount,
        grossAmount: payment.amount,
        commissionAmount: payment.order.platformCommission,
        commissionGst: payment.order.platformCommissionGst,
        createdAt: payment.createdAt,
        payoutStatus: payment.outletPayoutStatus,
      });
    }
    outlets.set(outlet.id, summary);
  }

  const payoutRequests = await prisma.outletPayoutRequest.findMany({
    where: { status: "PENDING", outlet: { companyId: user.companyId } },
    select: { id: true, outletId: true, amount: true, requestedAt: true },
    orderBy: { requestedAt: "desc" },
  });
  for (const request of payoutRequests) {
    const summary = outlets.get(request.outletId);
    summary?.requests.push({ id: request.id, amount: request.amount, requestedAt: request.requestedAt });
  }

  return NextResponse.json({
    success: true,
    outlets: [...outlets.values()].sort((a, b) => a.outletName.localeCompare(b.outletName)),
    note: "Outlet balance is the net amount after Qtoo's 2% fee and 18% GST on that fee. Cashfree processing fees, if applicable, are deducted separately from the merchant settlement.",
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "BUSINESS_ADMIN" || !user.companyId) {
    return NextResponse.json({ error: "Business admin access is required." }, { status: 403 });
  }
  const body = await request.json().catch(() => null) as { outletId?: unknown } | null;
  const outletId = typeof body?.outletId === "string" ? body.outletId : "";
  if (!outletId) {
    return NextResponse.json({ error: "Choose an outlet to request its payout." }, { status: 400 });
  }

  const outlet = await prisma.outlet.findFirst({
    where: { id: outletId, companyId: user.companyId },
    select: { id: true },
  });
  if (!outlet) return NextResponse.json({ error: "Outlet not found for this business." }, { status: 404 });

  try {
    const payoutRequest = await prisma.$transaction(async (tx) => {
      const duePayments = await tx.payment.findMany({
        where: {
          method: "ONLINE",
          status: "PAID",
          outletPayoutStatus: "PENDING",
          order: { status: { not: "CANCELLED" }, outletId: outlet.id },
        },
        select: { id: true, amount: true, order: { select: { platformCommission: true, platformCommissionGst: true } } },
      });
      if (!duePayments.length) throw new Error("This outlet has no withdrawable balance.");

      const amount = roundMoney(duePayments.reduce((sum, payment) => sum + netOutletAmount(payment.amount, payment.order.platformCommission, payment.order.platformCommissionGst), 0));
      if (amount <= 0) throw new Error("This outlet has no withdrawable balance.");

      const created = await tx.outletPayoutRequest.create({
        data: { outletId: outlet.id, amount, requestedByUserId: user.id },
        select: { id: true, amount: true, requestedAt: true },
      });
      const updated = await tx.payment.updateMany({
        where: { id: { in: duePayments.map((payment) => payment.id) }, status: "PAID", outletPayoutStatus: "PENDING" },
        data: { outletPayoutStatus: "REQUESTED", outletPayoutRequestId: created.id },
      });
      if (updated.count !== duePayments.length) throw new Error("The balance changed while requesting payout. Refresh and try again.");
      return { ...created, paymentCount: updated.count };
    });
    return NextResponse.json({ success: true, payoutRequest });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Unable to request payout.";
    return NextResponse.json({ error: message }, { status: message.includes("no withdrawable balance") ? 409 : 500 });
  }
}

function netOutletAmount(grossAmount: number, commission: number, gst: number) {
  return Math.max(0, Math.round((grossAmount - commission - gst) * 100) / 100);
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}
