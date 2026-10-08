import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isDeliveryEnabled, setDeliveryEnabled } from "@/lib/platform-settings";

async function requireSuperAdmin() {
  const user = await getCurrentUser();
  return user?.role === "SUPER_ADMIN" ? user : null;
}

export async function GET() {
  const admin = await requireSuperAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Super Admin access required." }, { status: 403 });
  }

  try {
    return NextResponse.json({ deliveryEnabled: await isDeliveryEnabled() });
  } catch (error) {
    console.error("Load platform delivery setting error:", error);
    return NextResponse.json({ error: "Unable to load delivery setting." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const admin = await requireSuperAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Super Admin access required." }, { status: 403 });
  }

  try {
    const body = await request.json();
    if (typeof body?.deliveryEnabled !== "boolean") {
      return NextResponse.json({ error: "Choose whether delivery is enabled." }, { status: 400 });
    }

    const settings = await setDeliveryEnabled(body.deliveryEnabled);
    return NextResponse.json({ success: true, ...settings });
  } catch (error) {
    console.error("Update platform delivery setting error:", error);
    return NextResponse.json({ error: "Unable to update delivery setting." }, { status: 500 });
  }
}
