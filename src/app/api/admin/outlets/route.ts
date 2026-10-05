import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please login first." },
        { status: 401 }
      );
    }

    if (user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Access denied." },
        { status: 403 }
      );
    }

    const outlets = await prisma.outlet.findMany({
      orderBy: [
        {
          company: {
            name: "asc",
          },
        },
        {
          name: "asc",
        },
      ],
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            isActive: true,
          },
          orderBy: {
            name: "asc",
          },
        },
        _count: {
          select: {
            orders: true,
            users: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      outlets,
    });
  } catch (error) {
    console.error("Super Admin outlets error:", error);

    return NextResponse.json(
      { error: "Unable to load outlets." },
      { status: 500 }
    );
  }
}