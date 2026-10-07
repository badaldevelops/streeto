import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const companies = await prisma.company.findMany({
      select: { id: true, isOpen: true },
    });
    const statuses = Object.fromEntries(
      companies.map((company) => [company.id, company.isOpen])
    );

    return NextResponse.json(
      { statuses },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (error) {
    console.error("Store status lookup error:", error);
    return NextResponse.json(
      { error: "Unable to load store status." },
      { status: 500, headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }
}
