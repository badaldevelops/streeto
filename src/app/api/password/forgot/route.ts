import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isPasswordResetEmailConfigured, sendPasswordResetEmail } from "@/lib/password-reset-email";
import { normalizeEmail } from "@/lib/validation";

const genericMessage = "If an account exists for that email, we’ve sent a password reset link.";
const resetOrigin = "https://qtoo.in";
const resetLifetimeMs = 30 * 60 * 1000;
const resetLimitPerHour = 3;

async function hashToken(token: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function POST(request: Request) {
  const noStore = { "Cache-Control": "no-store" };
  try {
    const body = await request.json() as { email?: unknown };
    const email = normalizeEmail(body.email);
    if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400, headers: noStore });
    }

    if (!isPasswordResetEmailConfigured()) {
      return NextResponse.json(
        { error: "Password reset email is not configured yet. Please contact Qtoo support." },
        { status: 503, headers: noStore }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, passwordHash: true },
    });

    if (!user?.passwordHash) {
      return NextResponse.json({ success: true, message: genericMessage }, { headers: noStore });
    }

    const now = new Date();
    await prisma.passwordResetToken.deleteMany({
      where: { expiresAt: { lt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } },
    });
    const recentRequests = await prisma.passwordResetToken.count({
      where: { userId: user.id, createdAt: { gte: new Date(now.getTime() - 60 * 60 * 1000) } },
    });
    if (recentRequests >= resetLimitPerHour) {
      return NextResponse.json({ success: true, message: genericMessage }, { headers: noStore });
    }

    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: now },
    });

    const random = crypto.getRandomValues(new Uint8Array(32));
    const token = Array.from(random, (byte) => byte.toString(16).padStart(2, "0")).join("");
    const tokenHash = await hashToken(token);
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(now.getTime() + resetLifetimeMs),
      },
    });

    const resetUrl = new URL("/reset-password", resetOrigin);
    resetUrl.hash = token;
    try {
      await sendPasswordResetEmail(email, user.name, resetUrl.toString());
    } catch (error) {
      await prisma.passwordResetToken.deleteMany({ where: { tokenHash } });
      const code = error && typeof error === "object" && "code" in error ? String(error.code) : "send_failed";
      console.error("Password reset email delivery failed:", code);
    }

    return NextResponse.json({ success: true, message: genericMessage }, { headers: noStore });
  } catch (error) {
    console.error("Password reset request failed:", error instanceof Error ? error.name : "unknown");
    return NextResponse.json(
      { error: "Password reset is temporarily unavailable. Please try again shortly." },
      { status: 503, headers: noStore }
    );
  }
}
