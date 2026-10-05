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

export async function POST(request: Request) {
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

    const body = (await request.json()) as {
      name?: string;
    };

    const name = body.name?.trim();

    if (!name) {
      return NextResponse.json(
        { error: "Business name is required." },
        { status: 400 }
      );
    }

    const existingCompany = await prisma.company.findFirst({
      where: {
        name,
      },
    });

    if (existingCompany) {
      return NextResponse.json(
        { error: "A business with this name already exists." },
        { status: 409 }
      );
    }

    const company = await prisma.company.create({
      data: {
        name,
      },
      select: {
        id: true,
        name: true,
      },
    });

    return NextResponse.json({
      success: true,
      company,
    });
  } catch (error) {
    console.error("Create company error:", error);

    return NextResponse.json(
      {
        error: "Unable to create business.",
      },
      { status: 500 }
    );
  }
}
