import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please login first." },
        { status: 401 }
      );
    }

    if (user.role !== "BUSINESS_ADMIN") {
      return NextResponse.json(
        { error: "Access denied." },
        { status: 403 }
      );
    }

    if (!user.companyId) {
      return NextResponse.json(
        { error: "Business is not assigned." },
        { status: 400 }
      );
    }

    const staff = await prisma.user.findMany({
      where: {
        companyId: user.companyId,
        role: "DELIVERY_STAFF",
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
        outletId: true,
        outlet: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            deliveries: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      staff,
    });
  } catch (error) {
    console.error(
      "Business Admin delivery staff error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to load delivery staff.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please login first." },
        { status: 401 }
      );
    }

    if (user.role !== "BUSINESS_ADMIN") {
      return NextResponse.json(
        { error: "Access denied." },
        { status: 403 }
      );
    }

    if (!user.companyId) {
      return NextResponse.json(
        { error: "Business is not assigned." },
        { status: 400 }
      );
    }

    const body = await request.json();

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const phone =
      typeof body.phone === "string"
        ? body.phone.trim()
        : "";

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    const outletId =
      typeof body.outletId === "string"
        ? body.outletId.trim()
        : "";

    if (!name) {
      return NextResponse.json(
        { error: "Name is required." },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        {
          error:
            "Password must be at least 6 characters.",
        },
        { status: 400 }
      );
    }

    if (!outletId) {
      return NextResponse.json(
        { error: "Outlet is required." },
        { status: 400 }
      );
    }

    const outlet = await prisma.outlet.findFirst({
      where: {
        id: outletId,
        companyId: user.companyId,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!outlet) {
      return NextResponse.json(
        {
          error:
            "Outlet not found or access denied.",
        },
        { status: 404 }
      );
    }

    const existingUser =
      await prisma.user.findUnique({
        where: {
          email,
        },
        select: {
          id: true,
        },
      });

    if (existingUser) {
      return NextResponse.json(
        {
          error:
            "A user with this email already exists.",
        },
        { status: 409 }
      );
    }

    const passwordHash =
      await bcrypt.hash(password, 10);

    const staff = await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        passwordHash,
        role: "DELIVERY_STAFF",
        isActive: true,
        companyId: user.companyId,
        outletId: outlet.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
        outletId: true,
        outlet: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message:
          "Delivery staff created successfully.",
        staff,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Business Admin create delivery staff error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to create delivery staff.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please login first." },
        { status: 401 }
      );
    }

    if (user.role !== "BUSINESS_ADMIN") {
      return NextResponse.json(
        { error: "Access denied." },
        { status: 403 }
      );
    }

    if (!user.companyId) {
      return NextResponse.json(
        { error: "Business is not assigned." },
        { status: 400 }
      );
    }

    const body = await request.json();

    const staffId =
      typeof body.staffId === "string"
        ? body.staffId.trim()
        : "";

    if (!staffId) {
      return NextResponse.json(
        { error: "Staff ID is required." },
        { status: 400 }
      );
    }

    const existingStaff =
      await prisma.user.findFirst({
        where: {
          id: staffId,
          companyId: user.companyId,
          role: "DELIVERY_STAFF",
        },
        select: {
          id: true,
        },
      });

    if (!existingStaff) {
      return NextResponse.json(
        {
          error:
            "Delivery staff not found or access denied.",
        },
        { status: 404 }
      );
    }

    const data: {
      name?: string;
      phone?: string | null;
      outletId?: string;
      isActive?: boolean;
      passwordHash?: string;
    } = {};

    if (body.name !== undefined) {
      const name =
        typeof body.name === "string"
          ? body.name.trim()
          : "";

      if (!name) {
        return NextResponse.json(
          { error: "Name is required." },
          { status: 400 }
        );
      }

      data.name = name;
    }

    if (body.phone !== undefined) {
      data.phone =
        typeof body.phone === "string"
          ? body.phone.trim() || null
          : null;
    }

    if (body.outletId !== undefined) {
      const outletId =
        typeof body.outletId === "string"
          ? body.outletId.trim()
          : "";

      if (!outletId) {
        return NextResponse.json(
          { error: "Outlet is required." },
          { status: 400 }
        );
      }

      const outlet =
        await prisma.outlet.findFirst({
          where: {
            id: outletId,
            companyId: user.companyId,
          },
          select: {
            id: true,
          },
        });

      if (!outlet) {
        return NextResponse.json(
          {
            error:
              "Outlet not found or access denied.",
          },
          { status: 404 }
        );
      }

      data.outletId = outlet.id;
    }

    if (body.isActive !== undefined) {
      if (typeof body.isActive !== "boolean") {
        return NextResponse.json(
          {
            error:
              "isActive must be true or false.",
          },
          { status: 400 }
        );
      }

      data.isActive = body.isActive;
    }

    if (body.password !== undefined) {
      const password =
        typeof body.password === "string"
          ? body.password
          : "";

      if (password.length < 6) {
        return NextResponse.json(
          {
            error:
              "Password must be at least 6 characters.",
          },
          { status: 400 }
        );
      }

      data.passwordHash =
        await bcrypt.hash(password, 10);
    }

    const staff = await prisma.user.update({
      where: {
        id: existingStaff.id,
      },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
        outletId: true,
        outlet: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "Delivery staff updated successfully.",
      staff,
    });
  } catch (error) {
    console.error(
      "Business Admin update delivery staff error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to update delivery staff.",
      },
      { status: 500 }
    );
  }
}