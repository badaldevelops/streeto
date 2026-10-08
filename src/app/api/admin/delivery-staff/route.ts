import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { isValidPassword, PASSWORD_ERROR } from "@/lib/validation";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const admin = await getCurrentUser();

    if (!admin) {
      return NextResponse.json(
        {
          error: "Please login first.",
        },
        { status: 401 }
      );
    }

    if (admin.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        {
          error: "Access denied.",
        },
        { status: 403 }
      );
    }

    const body = (await request.json()) as any;

    const { name, email, phone, password } = body;

    if (
      !name?.trim() ||
      !email?.trim() ||
      !phone?.trim() ||
      !password
    ) {
      return NextResponse.json(
        {
          error:
            "Name, email, phone and password are required.",
        },
        { status: 400 }
      );
    }

    if (!/^[0-9]{10}$/.test(phone)) {
      return NextResponse.json(
        {
          error: "Please enter a valid 10-digit phone number.",
        },
        { status: 400 }
      );
    }

    if (!isValidPassword(password)) {
      return NextResponse.json(
        {
          error: PASSWORD_ERROR,
        },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          error: "An account with this email already exists.",
        },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const deliveryStaff = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        phone,
        passwordHash,
        role: "DELIVERY_STAFF",
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        deliveryStaff,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Create delivery staff error:",
      error
    );

    return NextResponse.json(
      {
        error: "Unable to create delivery staff.",
      },
      { status: 500 }
    );
  }
}
