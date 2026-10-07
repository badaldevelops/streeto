import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Please login first." }, { status: 401 });
    }
    if (user.role !== "BUSINESS_ADMIN") {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }
    if (!user.companyId) {
      return NextResponse.json({ error: "Business is not assigned." }, { status: 400 });
    }

    const body = await request.json();
    if (typeof body.isOpen !== "boolean") {
      return NextResponse.json({ error: "A valid open or closed status is required." }, { status: 400 });
    }

    const company = await prisma.company.update({
      where: { id: user.companyId },
      data: { isOpen: body.isOpen },
      select: { id: true, name: true, isOpen: true },
    });

    return NextResponse.json({ success: true, company });
  } catch (error) {
    console.error("Business Admin store status update error:", error);
    return NextResponse.json({ error: "Unable to update store status." }, { status: 500 });
  }
}
