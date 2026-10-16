import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getCashfreeMode } from "@/lib/cashfree";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "BUSINESS_ADMIN" || !user.companyId) {
    return NextResponse.json({ error: "Business admin access is required." }, { status: 403 });
  }
  const outlets = await prisma.outlet.findMany({
    where: { companyId: user.companyId },
    select: { id: true, name: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ success: true, cashfreeMode: getCashfreeMode(), outlets });
}
