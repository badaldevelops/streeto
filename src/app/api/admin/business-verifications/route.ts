import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { decryptOwnerAadhaar } from "@/lib/business-kyc";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const admin = await getCurrentUser();
  if (!admin) return NextResponse.json({ error: "Please login first." }, { status: 401 });
  if (admin.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Access denied." }, { status: 403 });

  try {
    const requests = await prisma.company.findMany({
      where: { verificationStatus: "PENDING" },
      select: {
        id: true,
        name: true,
        foodLicenseNumber: true,
        foodLicenseExpiry: true,
        ownerAadhaarCiphertext: true,
        ownerAadhaarLast4: true,
        verificationSubmittedAt: true,
        users: {
          where: { role: "BUSINESS_ADMIN" },
          select: { name: true, email: true, phone: true },
          orderBy: { createdAt: "asc" },
          take: 1,
        },
        outlets: {
          select: { id: true, name: true, city: true, locality: true, address: true, phone: true, foodType: true },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { verificationSubmittedAt: "asc" },
    });

    const safeRequests = await Promise.all(requests.map(async (request) => {
      let aadhaarNumber: string | null = null;
      if (request.ownerAadhaarCiphertext) {
        try {
          aadhaarNumber = await decryptOwnerAadhaar(request.ownerAadhaarCiphertext);
        } catch {
          // A bad or missing encryption key must never expose stored ciphertext.
        }
      }
      const { ownerAadhaarCiphertext: _ciphertext, ...safeRequest } = request;
      return { ...safeRequest, aadhaarNumber };
    }));

    return NextResponse.json({ requests: safeRequests }, { headers: { "Cache-Control": "no-store" } });
    } catch {
    console.error("Business verification requests could not be loaded.");
    return NextResponse.json({ error: "Unable to load verification requests." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const admin = await getCurrentUser();
  if (!admin) return NextResponse.json({ error: "Please login first." }, { status: 401 });
  if (admin.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Access denied." }, { status: 403 });

  const body = await request.json().catch(() => null) as { companyId?: unknown } | null;
  const companyId = typeof body?.companyId === "string" ? body.companyId.trim() : "";
  if (!companyId) return NextResponse.json({ error: "Choose a business verification request." }, { status: 400 });

  try {
    const approved = await prisma.$transaction(async (transaction) => {
      const result = await transaction.company.updateMany({
        where: { id: companyId, verificationStatus: "PENDING" },
        data: {
          verificationStatus: "APPROVED",
          isActive: true,
          isOpen: true,
          ownerAadhaarCiphertext: null,
          verificationReviewedAt: new Date(),
          verificationReviewedById: admin.id,
        },
      });
      if (result.count === 0) return false;
      await transaction.outlet.updateMany({ where: { companyId }, data: { isActive: true } });
      return true;
    });

    if (!approved) return NextResponse.json({ error: "This request is no longer pending." }, { status: 409 });
    return NextResponse.json({ success: true, companyId, isActive: true });
  } catch {
    console.error("Business verification approval failed.");
    return NextResponse.json({ error: "Unable to approve this business." }, { status: 500 });
  }
}
