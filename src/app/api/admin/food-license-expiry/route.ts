import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const DAY_MS = 24 * 60 * 60 * 1000;

export async function GET() {
  const admin = await getCurrentUser();
  if (!admin) return NextResponse.json({ error: "Please login first." }, { status: 401 });
  if (admin.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Access denied." }, { status: 403 });

  try {
    const today = new Date();
    const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    const reminderLimit = new Date(todayUtc + 30 * DAY_MS + DAY_MS - 1);
    const companies = await prisma.company.findMany({
      where: {
        verificationStatus: "APPROVED",
        foodLicenseExpiry: { not: null, lte: reminderLimit },
      },
      select: {
        id: true,
        name: true,
        foodLicenseExpiry: true,
        isActive: true,
      },
      orderBy: { foodLicenseExpiry: "asc" },
    });

    const alerts = companies.flatMap((company) => {
      if (!company.foodLicenseExpiry) return [];
      const expiry = company.foodLicenseExpiry;
      const expiryUtc = Date.UTC(expiry.getUTCFullYear(), expiry.getUTCMonth(), expiry.getUTCDate());
      return [{ ...company, daysRemaining: Math.round((expiryUtc - todayUtc) / DAY_MS) }];
    });

    return NextResponse.json({ alerts }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    console.error("Food licence expiry alerts could not be loaded.");
    return NextResponse.json({ error: "Unable to load food licence expiry alerts." }, { status: 500 });
  }
}
