import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { verifySession } from "@/lib/session";

function unauthenticatedResponse() {
  const response = NextResponse.json(
    { authenticated: false },
    { status: 401 }
  );
  response.cookies.set("session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return response;
}

export async function GET(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie");

    const sessionToken = cookieHeader
      ?.split(";")
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith("session="))
      ?.split("=")[1];

    if (!sessionToken) {
      return unauthenticatedResponse();
    }

    const session = await verifySession(sessionToken);

    if (!session) {
      return unauthenticatedResponse();
    }

    const user = await prisma.user.findUnique({
      where: {
        id: session.userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        companyId: true,
        sessionVersion: true,
        company: { select: { isActive: true } },
      },
    });

    if (
      !user ||
      user.sessionVersion !== session.sessionVersion ||
      (user.role === "BUSINESS_ADMIN" && !user.company?.isActive)
    ) {
      return unauthenticatedResponse();
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        companyId: user.companyId,
      },
    });
  } catch (error) {
    console.error("Session check error:", error);

    return NextResponse.json(
      { authenticated: false },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Please login first." }, { status: 401 });
    }

    if (user.role !== "CUSTOMER") {
      return NextResponse.json(
        { error: "Only customers can update their profile phone number." },
        { status: 403 }
      );
    }

    const body = (await request.json()) as { phone?: unknown };
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";

    if (!/^[0-9]{10}$/.test(phone)) {
      return NextResponse.json(
        { error: "Please enter a valid 10-digit phone number." },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { phone },
      select: { phone: true },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("PATCH /api/me error:", error);
    return NextResponse.json(
      { error: "Unable to update your profile phone number." },
      { status: 500 }
    );
  }
}
