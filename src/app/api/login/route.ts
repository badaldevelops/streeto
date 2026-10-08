import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";

// Lazily-built bcrypt hash (cost 12) used only to equalise response timing
// when the email is unknown, so login does not reveal which accounts exist.
let dummyHash: Promise<string> | undefined;
function getDummyHash() {
  dummyHash ??= bcrypt.hash("timing-equalisation-placeholder", 12);
  return dummyHash;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
  email?: string;
  password?: string;
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
    });

    if (!user || !user.passwordHash) {
      // Burn comparable time so response timing does not reveal
      // whether an account exists for this email.
      await bcrypt.compare(password, await getDummyHash());
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

    const sessionToken = await createSession(user.id);

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

    response.cookies.set("session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
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
