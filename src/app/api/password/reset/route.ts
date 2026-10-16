import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { isValidPassword, PASSWORD_ERROR } from "@/lib/validation";

async function hashToken(token: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

class InvalidResetTokenError extends Error {}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { token?: unknown; password?: unknown };
    if (typeof body.token !== "string" || !/^[a-f0-9]{64}$/i.test(body.token)) {
      return NextResponse.json({ error: "This reset link is invalid or expired. Request a new one." }, { status: 400 });
    }
    if (!isValidPassword(body.password)) {
      return NextResponse.json({ error: PASSWORD_ERROR }, { status: 400 });
    }

    const tokenHash = await hashToken(body.token);
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      select: { id: true, userId: true, expiresAt: true, usedAt: true },
    });
    const now = new Date();
    if (!resetToken || resetToken.usedAt || resetToken.expiresAt <= now) {
      return NextResponse.json({ error: "This reset link is invalid or expired. Request a new one." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(body.password, 12);
    try {
      await prisma.$transaction(async (tx) => {
        const claimed = await tx.passwordResetToken.updateMany({
          where: { id: resetToken.id, usedAt: null, expiresAt: { gt: now } },
          data: { usedAt: now },
        });
        if (claimed.count !== 1) throw new InvalidResetTokenError();

        await tx.user.update({
          where: { id: resetToken.userId },
          data: { passwordHash, sessionVersion: { increment: 1 } },
        });
        await tx.passwordResetToken.updateMany({
          where: { userId: resetToken.userId, id: { not: resetToken.id }, usedAt: null },
          data: { usedAt: now },
        });
      });
    } catch (error) {
      if (error instanceof InvalidResetTokenError) {
        return NextResponse.json({ error: "This reset link is invalid or expired. Request a new one." }, { status: 400 });
      }
      throw error;
    }

    return NextResponse.json({ success: true, message: "Your password has been changed. You can now log in." });
  } catch (error) {
    console.error("Password reset failed:", error instanceof Error ? error.name : "unknown");
    return NextResponse.json({ error: "Unable to change your password right now. Please try again." }, { status: 500 });
  }
}
