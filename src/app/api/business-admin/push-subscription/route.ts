import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

function isAllowedEndpoint(endpoint: string) {
  try {
    const url = new URL(endpoint);
    return url.protocol === "https:" && (
      url.hostname === "fcm.googleapis.com" ||
      url.hostname.endsWith(".push.services.mozilla.com") ||
      url.hostname.endsWith(".push.apple.com")
    );
  } catch {
    return false;
  }
}

async function getBusinessAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "BUSINESS_ADMIN" || !user.companyId) {
    return null;
  }
  return user;
}

export async function GET() {
  const user = await getBusinessAdmin();
  if (!user) {
    return NextResponse.json({ error: "Business Admin access required." }, { status: 403 });
  }

  const count = await prisma.businessPushSubscription.count({
    where: { userId: user.id, companyId: user.companyId! },
  });
  return NextResponse.json({ enabled: count > 0 });
}

export async function POST(request: Request) {
  try {
    const user = await getBusinessAdmin();
    if (!user) {
      return NextResponse.json({ error: "Business Admin access required." }, { status: 403 });
    }

    const body = await request.json();
    const endpoint = body?.endpoint;
    const p256dh = body?.keys?.p256dh;
    const auth = body?.keys?.auth;

    if (
      typeof endpoint !== "string" ||
      !isAllowedEndpoint(endpoint) ||
      typeof p256dh !== "string" ||
      typeof auth !== "string"
    ) {
      return NextResponse.json({ error: "Invalid notification subscription." }, { status: 400 });
    }

    const existing = await prisma.businessPushSubscription.findUnique({
      where: { endpoint },
      select: { companyId: true },
    });
    if (existing && existing.companyId !== user.companyId) {
      return NextResponse.json({ error: "This device is already assigned to another business." }, { status: 409 });
    }

    await prisma.businessPushSubscription.upsert({
      where: { endpoint },
      create: {
        endpoint,
        p256dh,
        auth,
        userId: user.id,
        companyId: user.companyId!,
      },
      update: {
        p256dh,
        auth,
        userId: user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Save business push subscription error:", error);
    return NextResponse.json({ error: "Unable to enable background alerts." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getBusinessAdmin();
    if (!user) {
      return NextResponse.json({ error: "Business Admin access required." }, { status: 403 });
    }

    const body = await request.json();
    if (typeof body?.endpoint === "string") {
      await prisma.businessPushSubscription.deleteMany({
        where: {
          endpoint: body.endpoint,
          userId: user.id,
          companyId: user.companyId!,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Remove business push subscription error:", error);
    return NextResponse.json({ error: "Unable to disable background alerts." }, { status: 500 });
  }
}
