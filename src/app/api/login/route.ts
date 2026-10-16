import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";

// Precomputed cost-12 bcrypt hash used only to equalise unknown-email timing.
// Generating this hash inside a cold Cloudflare Worker doubled bcrypt CPU work
// on the first invalid login and could trigger Cloudflare error 1102.
const dummyHash = "$2b$12$0gqLe/wdSPQB6498t.Zju.IvqxLSHL5ntqoDwk01t9wwplx9ggdIS";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
  email?: string;
      password?: string;
      expectedRole?: string | string[];
};
    const { email, password } = body;

    if (!email?.trim() || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        email: email.trim().toLowerCase(),
      },
      include: {
        company: { select: { isActive: true, verificationStatus: true } },
      },
    });

    if (!user || !user.passwordHash) {
      // Burn comparable time so response timing does not reveal
      // whether an account exists for this email.
      await bcrypt.compare(password, dummyHash);
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const passwordMatch = await bcrypt.compare(
  password,
  user.passwordHash
);

    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const expectedRoles = body.expectedRole === undefined
      ? undefined
      : Array.isArray(body.expectedRole)
        ? body.expectedRole
        : [body.expectedRole];
    if (expectedRoles && !expectedRoles.includes(user.role)) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    if (user.role === "BUSINESS_ADMIN" && !user.company?.isActive) {
      return NextResponse.json(
        { error: user.company?.verificationStatus === "PENDING"
          ? "Your business registration is waiting for Super Admin verification. You can log in after approval."
          : "This business account is currently deactivated. Please contact Qtoo support." },
        { status: 403 }
      );
    }

    const sessionVersion = user.role === "CUSTOMER" || user.role === "BUSINESS_ADMIN"
      ? (await prisma.user.update({
          where: { id: user.id },
          data: { sessionVersion: { increment: 1 } },
          select: { sessionVersion: true },
        })).sessionVersion
      : user.sessionVersion;
    const sessionToken = await createSession(user.id, sessionVersion);

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });

    response.cookies.set("session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: new Date(0),
      path: "/",
    });
    response.cookies.set("session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
      domain: ".qtoo.in",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);

    return NextResponse.json(
      { error: "Unable to login." },
      { status: 500 }
    );
  }
}
