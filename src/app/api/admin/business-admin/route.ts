import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

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
        { error: "Only Platform Admin can create Business Admins." },
        { status: 403 }
      );
    }

    const body = await request.json();

    const {
      name,
      email,
      phone,
      password,
      companyId,
    } = body;

    if (!name || !email || !password || !companyId) {
      return NextResponse.json(
        {
          error:
            "Name, email, password and company are required.",
        },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          error: "An account with this email already exists.",
        },
        { status: 400 }
      );
    }

    const company = await prisma.company.findUnique({
      where: {
        id: companyId,
      },
    });

    if (!company) {
      return NextResponse.json(
        {
          error: "Business not found.",
        },
        { status: 404 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const businessAdmin = await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        passwordHash,
        role: "BUSINESS_ADMIN",
        companyId: company.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        companyId: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Business Admin created successfully.",
      businessAdmin,
    });
  } catch (error) {
    console.error(
      "Create Business Admin error:",
      error
    );

    return NextResponse.json(
      {
        error: "Unable to create Business Admin.",
      },
      { status: 500 }
    );
  }
}