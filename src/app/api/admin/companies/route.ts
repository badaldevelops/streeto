import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const admin = await getCurrentUser();

    if (!admin) {
      return NextResponse.json(
        { error: "Please login first." },
        { status: 401 }
      );
    }

    if (admin.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Access denied." },
        { status: 403 }
      );
    }

    const companies = await prisma.company.findMany({
      select: {
        id: true,
        name: true,
        isActive: true,
        verificationStatus: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      companies,
    });
  } catch (error) {
    console.error("Load companies error:", error);

    return NextResponse.json(
      {
        error: "Unable to load businesses.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await getCurrentUser();
    if (!admin) {
      return NextResponse.json({ error: "Please login first." }, { status: 401 });
    }
    if (admin.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }

    const body = (await request.json()) as { companyId?: unknown; isActive?: unknown };
    if (typeof body.companyId !== "string" || !body.companyId || typeof body.isActive !== "boolean") {
      return NextResponse.json({ error: "Business and active status are required." }, { status: 400 });
    }

    if (body.isActive) {
      const company = await prisma.company.findUnique({
        where: { id: body.companyId },
        select: { verificationStatus: true },
      });
      if (!company) return NextResponse.json({ error: "Business not found." }, { status: 404 });
      if (company.verificationStatus !== "APPROVED") {
        return NextResponse.json({ error: "Review the verification request before activating this business." }, { status: 409 });
      }
    }

    const result = await prisma.company.updateMany({
      where: { id: body.companyId },
      data: { isActive: body.isActive },
    });
    if (result.count === 0) {
      return NextResponse.json({ error: "Business not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, companyId: body.companyId, isActive: body.isActive });
  } catch (error) {
    console.error("Update business status error:", error);
    return NextResponse.json({ error: "Unable to update business status." }, { status: 500 });
  }
}
