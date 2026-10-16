import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const outletProductId =
      searchParams.get("outletProductId")?.trim() || "";

    if (!outletProductId) {
      return NextResponse.json(
        {
          error: "Outlet product ID is required.",
        },
        { status: 400 }
      );
    }

    // First find which outlet this cart item belongs to.
    const outletProduct = await prisma.outletProduct.findUnique({
      where: { id: outletProductId },
      select: { outletId: true },
    });

    if (!outletProduct) {
      return NextResponse.json(
        {
          error: "Outlet product not found.",
        },
        { status: 404 }
      );
    }

    // Now load the outlet separately.
    const outlet = await prisma.outlet.findUnique({
      where: {
        id: outletProduct.outletId,
      },
      select: {
        id: true,
        name: true,
        address: true,
        latitude: true,
        longitude: true,
        businessType: true,
        locationUpdatedAt: true,
        isActive: true,
        companyId: true,
        gstin: true,
        deliveryEnabled: true,
      },
    });

    if (!outlet) {
      return NextResponse.json(
        {
          error: "Outlet not found.",
        },
        { status: 404 }
      );
    }

    if (!outlet.isActive) {
      return NextResponse.json(
        {
          error: "This outlet is currently unavailable.",
        },
        { status: 404 }
      );
    }

    if (
      outlet.latitude === null ||
      outlet.longitude === null
    ) {
      return NextResponse.json(
        {
          error:
            "This outlet has not configured its exact location yet.",
        },
        { status: 404 }
      );
    }

    // Load business/company name separately.
    const company = await prisma.company.findUnique({
      where: {
        id: outlet.companyId,
      },
      select: {
        id: true,
        name: true,
        isActive: true,
      },
    });

    if (!company?.isActive) {
      return NextResponse.json(
        { error: "This business is currently unavailable." },
        { status: 404 }
      );
    }

    const requestedIds = searchParams.getAll("outletProductId").filter(Boolean);
    const taxProducts = await prisma.outletProduct.findMany({
      where: { id: { in: requestedIds }, outletId: outlet.id },
      select: { id: true, sgstRate: true, cgstRate: true },
    });

    return NextResponse.json({
      success: true,

      outlet: {
        id: outlet.id,
        name: outlet.name,

        companyId: outlet.companyId,
        companyName:
          company?.name || "Business",
        address: outlet.address,
        latitude: outlet.latitude,
        longitude: outlet.longitude,

        businessType: outlet.businessType,
        gstin: outlet.gstin,
        deliveryEnabled: outlet.deliveryEnabled,
        taxProducts,
        locationUpdatedAt:
          outlet.locationUpdatedAt,
      },
    });
  } catch (error) {
    console.error(
      "Customer outlet location error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to load outlet location.",
      },
      { status: 500 }
    );
  }
}
