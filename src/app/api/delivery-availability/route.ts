import { NextResponse } from "next/server";
import { isDeliveryEnabled } from "@/lib/platform-settings";

export async function GET() {
  try {
    return NextResponse.json(
      { deliveryEnabled: await isDeliveryEnabled() },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Load delivery availability error:", error);
    return NextResponse.json(
      { error: "Unable to load delivery availability." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
