import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

type OutletData = {
  name?: string;
  address?: string | null;
  phone?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  deliveryRadiusKm?: number;
  deliveryCharge?: number;
  businessType?: string;
  locationUpdatedAt?: Date | null;
  isActive?: boolean;
};

function normalizeBusinessType(value: unknown) {
  if (value === "MOVING_CART") {
    return "MOVING_CART";
  }

  return "FIXED_SHOP";
}

function parseCoordinate(
  value: unknown
): number | null | "invalid" {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "invalid";
  }

  return number;
}

function validateCoordinates(
  latitude: number | null,
  longitude: number | null
) {
  if (
    latitude !== null &&
    (latitude < -90 || latitude > 90)
  ) {
    return "Latitude must be between -90 and 90.";
  }

  if (
    longitude !== null &&
    (longitude < -180 || longitude > 180)
  ) {
    return "Longitude must be between -180 and 180.";
  }

  return null;
}

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please login first." },
        { status: 401 }
      );
    }

    if (user.role !== "BUSINESS_ADMIN") {
      return NextResponse.json(
        { error: "Access denied." },
        { status: 403 }
      );
    }

    if (!user.companyId) {
      return NextResponse.json(
        { error: "Business is not assigned." },
        { status: 400 }
      );
    }

    const outlets = await prisma.outlet.findMany({
      where: {
        companyId: user.companyId,
      },
      include: {
        _count: {
          select: {
            users: true,
            orders: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      outlets,
    });
  } catch (error) {
    console.error(
      "Business Admin outlets error:",
      error
    );

    return NextResponse.json(
      {
        error: "Unable to load business outlets.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please login first." },
        { status: 401 }
      );
    }

    if (user.role !== "BUSINESS_ADMIN") {
      return NextResponse.json(
        { error: "Access denied." },
        { status: 403 }
      );
    }

    if (!user.companyId) {
      return NextResponse.json(
        { error: "Business is not assigned." },
        { status: 400 }
      );
    }

    const body = await request.json();

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const address =
      typeof body.address === "string"
        ? body.address.trim()
        : null;

    const phone =
      typeof body.phone === "string"
        ? body.phone.trim()
        : null;

    const deliveryRadiusKm =
      Number(body.deliveryRadiusKm);

    const deliveryCharge =
      Number(body.deliveryCharge);

    const businessType =
      normalizeBusinessType(body.businessType);

    const latitude = parseCoordinate(
      body.latitude
    );

    const longitude = parseCoordinate(
      body.longitude
    );

    if (!name) {
      return NextResponse.json(
        { error: "Outlet name is required." },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(deliveryRadiusKm) ||
      deliveryRadiusKm <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Delivery radius must be greater than 0.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(deliveryCharge) ||
      deliveryCharge < 0
    ) {
      return NextResponse.json(
        {
          error:
            "Delivery charge cannot be negative.",
        },
        { status: 400 }
      );
    }

    if (
      latitude === "invalid" ||
      longitude === "invalid"
    ) {
      return NextResponse.json(
        {
          error:
            "Latitude and longitude must be valid numbers.",
        },
        { status: 400 }
      );
    }

    const coordinateError =
      validateCoordinates(
        latitude,
        longitude
      );

    if (coordinateError) {
      return NextResponse.json(
        { error: coordinateError },
        { status: 400 }
      );
    }

    const outlet =
      await prisma.outlet.create({
        data: {
          name,
          address: address || null,
          phone: phone || null,
          latitude,
          longitude,
          deliveryRadiusKm,
          deliveryCharge,
          businessType,
          locationUpdatedAt:
            latitude !== null &&
            longitude !== null
              ? new Date()
              : null,
          isActive: true,
          companyId: user.companyId,
        },
      });

    return NextResponse.json(
      {
        success: true,
        message:
          "Outlet created successfully.",
        outlet,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Business Admin create outlet error:",
      error
    );

    return NextResponse.json(
      {
        error: "Unable to create outlet.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please login first." },
        { status: 401 }
      );
    }

    if (user.role !== "BUSINESS_ADMIN") {
      return NextResponse.json(
        { error: "Access denied." },
        { status: 403 }
      );
    }

    if (!user.companyId) {
      return NextResponse.json(
        { error: "Business is not assigned." },
        { status: 400 }
      );
    }

    const body = await request.json();

    const outletId =
      typeof body.outletId === "string"
        ? body.outletId.trim()
        : "";

    if (!outletId) {
      return NextResponse.json(
        { error: "Outlet ID is required." },
        { status: 400 }
      );
    }

    const existingOutlet =
      await prisma.outlet.findFirst({
        where: {
          id: outletId,
          companyId: user.companyId,
        },
      });

    if (!existingOutlet) {
      return NextResponse.json(
        {
          error:
            "Outlet not found or access denied.",
        },
        { status: 404 }
      );
    }

    const data: OutletData = {};

    if (body.name !== undefined) {
      const name =
        typeof body.name === "string"
          ? body.name.trim()
          : "";

      if (!name) {
        return NextResponse.json(
          {
            error:
              "Outlet name is required.",
          },
          { status: 400 }
        );
      }

      data.name = name;
    }

    if (body.address !== undefined) {
      data.address =
        typeof body.address === "string"
          ? body.address.trim() || null
          : null;
    }

    if (body.phone !== undefined) {
      data.phone =
        typeof body.phone === "string"
          ? body.phone.trim() || null
          : null;
    }

    if (body.businessType !== undefined) {
      data.businessType =
        normalizeBusinessType(
          body.businessType
        );
    }

    if (
      body.deliveryRadiusKm !== undefined
    ) {
      const deliveryRadiusKm =
        Number(body.deliveryRadiusKm);

      if (
        !Number.isFinite(
          deliveryRadiusKm
        ) ||
        deliveryRadiusKm <= 0
      ) {
        return NextResponse.json(
          {
            error:
              "Delivery radius must be greater than 0.",
          },
          { status: 400 }
        );
      }

      data.deliveryRadiusKm =
        deliveryRadiusKm;
    }

    if (
      body.deliveryCharge !== undefined
    ) {
      const deliveryCharge =
        Number(body.deliveryCharge);

      if (
        !Number.isFinite(
          deliveryCharge
        ) ||
        deliveryCharge < 0
      ) {
        return NextResponse.json(
          {
            error:
              "Delivery charge cannot be negative.",
          },
          { status: 400 }
        );
      }

      data.deliveryCharge =
        deliveryCharge;
    }

    let locationWasUpdated = false;

    if (body.latitude !== undefined) {
      const latitude =
        parseCoordinate(
          body.latitude
        );

      if (latitude === "invalid") {
        return NextResponse.json(
          {
            error:
              "Latitude must be a valid number.",
          },
          { status: 400 }
        );
      }

      data.latitude = latitude;
      locationWasUpdated = true;
    }

    if (body.longitude !== undefined) {
      const longitude =
        parseCoordinate(
          body.longitude
        );

      if (longitude === "invalid") {
        return NextResponse.json(
          {
            error:
              "Longitude must be a valid number.",
          },
          { status: 400 }
        );
      }

      data.longitude = longitude;
      locationWasUpdated = true;
    }

    const finalLatitude =
      data.latitude !== undefined
        ? data.latitude
        : existingOutlet.latitude;

    const finalLongitude =
      data.longitude !== undefined
        ? data.longitude
        : existingOutlet.longitude;

    const coordinateError =
      validateCoordinates(
        finalLatitude,
        finalLongitude
      );

    if (coordinateError) {
      return NextResponse.json(
        { error: coordinateError },
        { status: 400 }
      );
    }

    if (locationWasUpdated) {
      if (
        finalLatitude !== null &&
        finalLongitude !== null
      ) {
        data.locationUpdatedAt =
          new Date();
      } else {
        data.locationUpdatedAt = null;
      }
    }

    if (body.isActive !== undefined) {
      if (
        typeof body.isActive !== "boolean"
      ) {
        return NextResponse.json(
          {
            error:
              "isActive must be true or false.",
          },
          { status: 400 }
        );
      }

      data.isActive =
        body.isActive;
    }

    const outlet =
      await prisma.outlet.update({
        where: {
          id: existingOutlet.id,
        },
        data,
      });

    return NextResponse.json({
      success: true,
      message:
        "Outlet updated successfully.",
      outlet,
    });
   } catch (error) {
    console.error(
      "Business Admin update outlet error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update outlet.",
      },
      { status: 500 }
    );
  }
}