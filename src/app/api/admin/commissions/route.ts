import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getCompanyBalances() {
  const [companies, orders, collectionTotals, collections] = await Promise.all([
    prisma.company.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.order.findMany({
      where: { status: { not: "CANCELLED" } },
      select: { total: true, platformCommission: true, platformCommissionGst: true, payment: { select: { status: true, outletPayoutStatus: true } }, outlet: { select: { companyId: true } } },
    }),
    prisma.commissionCollection.groupBy({
      by: ["companyId"],
      _sum: { amount: true },
    }),
    prisma.commissionCollection.findMany({
      orderBy: { collectedAt: "desc" }, take: 100,
      select: { id: true, companyId: true, amount: true, reference: true, note: true, collectedAt: true, company: { select: { name: true } } },
    }),
  ]);

  const byCompany = new Map(companies.map((company) => [company.id, {
    ...company, orderCount: 0, paidOrderCount: 0, paidSales: 0, commissionEarned: 0, commissionGst: 0, commissionCollected: 0, commissionDue: 0,
  }]));
  for (const order of orders) {
    const summary = byCompany.get(order.outlet.companyId);
    if (!summary) continue;
    summary.orderCount += 1;
    if (order.payment?.status === "PAID") {
      summary.paidOrderCount += 1;
      summary.paidSales += order.total;
      summary.commissionEarned += order.platformCommission;
      summary.commissionGst += order.platformCommissionGst;
      if (order.payment?.outletPayoutStatus === "PAID") summary.commissionCollected += order.platformCommission + order.platformCommissionGst;
    }
  }
  for (const collection of collectionTotals) {
    const summary = byCompany.get(collection.companyId);
    if (summary) summary.commissionCollected += collection._sum.amount ?? 0;
  }
  const summaries = [...byCompany.values()].map((summary) => ({
    ...summary,
    paidSales: Math.round(summary.paidSales * 100) / 100,
    commissionEarned: Math.round(summary.commissionEarned * 100) / 100,
    commissionGst: Math.round(summary.commissionGst * 100) / 100,
    commissionCollected: Math.round(summary.commissionCollected * 100) / 100,
    commissionDue: Math.max(0, Math.round((summary.commissionEarned + summary.commissionGst - summary.commissionCollected) * 100) / 100),
  }));
  return { summaries, collections };
}

export async function GET() {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Access denied." }, { status: admin ? 403 : 401 });
    }
    const { summaries, collections } = await getCompanyBalances();
    return NextResponse.json({ success: true, summaries, collections });
  } catch (error) {
    console.error("Load commission ledger error:", error);
    return NextResponse.json({ error: "Unable to load commission ledger." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Access denied." }, { status: admin ? 403 : 401 });
    }
    const body = (await request.json()) as { companyId?: unknown; amount?: unknown; reference?: unknown; note?: unknown };
    const companyId = typeof body.companyId === "string" ? body.companyId : "";
    const amount = typeof body.amount === "number" ? Math.round(body.amount * 100) / 100 : Number.NaN;
    const reference = typeof body.reference === "string" ? body.reference.trim().slice(0, 100) : "";
    const note = typeof body.note === "string" ? body.note.trim().slice(0, 250) : "";
    if (!companyId || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Select a business and enter a valid amount." }, { status: 400 });
    }
    const company = await prisma.company.findUnique({ where: { id: companyId }, select: { id: true } });
    if (!company) return NextResponse.json({ error: "Business not found." }, { status: 404 });

    const paidOrders = await prisma.order.findMany({
      where: { status: { not: "CANCELLED" }, payment: { is: { status: "PAID" } }, outlet: { companyId } },
      select: { platformCommission: true, platformCommissionGst: true, payment: { select: { outletPayoutStatus: true } } },
    });
    const collections = await prisma.commissionCollection.aggregate({ where: { companyId }, _sum: { amount: true } });
    const earned = paidOrders.reduce((sum, order) => sum + order.platformCommission + order.platformCommissionGst, 0);
    const retained = paidOrders.reduce((sum, order) => sum + (order.payment?.outletPayoutStatus === "PAID" ? order.platformCommission + order.platformCommissionGst : 0), 0);
    const collected = collections._sum.amount ?? 0;
    const due = Math.round((earned - retained - collected) * 100) / 100;
    if (amount > due + 0.001) {
      return NextResponse.json({ error: `Collection cannot exceed the outstanding ₹${Math.max(due, 0).toFixed(2)}.` }, { status: 409 });
    }

    await prisma.commissionCollection.create({ data: { companyId, amount, reference: reference || null, note: note || null } });
    return NextResponse.json({ success: true, message: "Commission collection recorded." });
  } catch (error) {
    console.error("Record commission collection error:", error);
    return NextResponse.json({ error: "Unable to record the commission collection." }, { status: 500 });
  }
}
