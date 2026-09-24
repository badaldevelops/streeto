import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please login first." },
        { status: 401 }
      );
    }

    if (user.role !== "CUSTOMER") {
      return NextResponse.json(
        { error: "Only customers can manage addresses." },
        { status: 403 }
      );
    }

    const addresses = await prisma.address.findMany({
      where: {
        customerId: user.id,
      },
      orderBy: [
        {
          isDefault: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
    });

    return NextResponse.json({
      addresses,
    });
  } catch (error) {
    console.error("GET /api/addresses error:", error);

    return NextResponse.json(
      { error: "Unable to load addresses." },
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

    if (user.role !== "CUSTOMER") {
      return NextResponse.json(
        { error: "Only customers can manage addresses." },
        { status: 403 }
      );
    }

    const body = await request.json();

    const {
      label,
      fullName,
      phone,
      addressLine,
      landmark,
      latitude,
      longitude,
      isDefault,
    } = body;

    if (
      !label ||
      !fullName ||
      !phone ||
      !addressLine
    ) {
      return NextResponse.json(
        {
          error:
            "Label, name, phone and address are required.",
        },
        { status: 400 }
      );
    }

    if (!/^\d{10}$/.test(String(phone))) {
      return NextResponse.json(
        {
          error: "Please enter a valid 10-digit phone number.",
        },
        { status: 400 }
      );
    }

    const customerLatitude =
      latitude === null ||
      latitude === undefined ||
      latitude === ""
        ? null
        : Number(latitude);

    const customerLongitude =
      longitude === null ||
      longitude === undefined ||
      longitude === ""
        ? null
        : Number(longitude);

    if (
      customerLatitude !== null &&
      (!Number.isFinite(customerLatitude) ||
        customerLatitude < -90 ||
        customerLatitude > 90)
    ) {
      return NextResponse.json(
        { error: "Invalid latitude." },
        { status: 400 }
      );
    }

    if (
      customerLongitude !== null &&
      (!Number.isFinite(customerLongitude) ||
        customerLongitude < -180 ||
        customerLongitude > 180)
    ) {
      return NextResponse.json(
        { error: "Invalid longitude." },
        { status: 400 }
      );
    }

    const shouldBeDefault = Boolean(isDefault);

    if (shouldBeDefault) {
      await prisma.address.updateMany({
        where: {
          customerId: user.id,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    const existingAddressCount =
      await prisma.address.count({
        where: {
          customerId: user.id,
        },
      });

    const address = await prisma.address.create({
      data: {
        customerId: user.id,
        label: String(label).trim(),
        fullName: String(fullName).trim(),
        phone: String(phone).trim(),
        addressLine: String(addressLine).trim(),
        landmark:
          landmark &&
          String(landmark).trim().length > 0
            ? String(landmark).trim()
            : null,
        latitude: customerLatitude,
        longitude: customerLongitude,
        isDefault:
          shouldBeDefault ||
          existingAddressCount === 0,
      },
    });

    return NextResponse.json(
      {
        message: "Address added successfully.",
        address,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/addresses error:", error);

    return NextResponse.json(
      { error: "Unable to add address." },
      { status: 500 }
    );
  }
}
export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please login first." },
        { status: 401 }
      );
    }

    if (user.role !== "CUSTOMER") {
      return NextResponse.json(
        { error: "Only customers can manage addresses." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const addressId = String(body.addressId || "").trim();

    if (!addressId) {
      return NextResponse.json(
        { error: "Address ID is required." },
        { status: 400 }
      );
    }

    const address = await prisma.address.findFirst({
      where: {
        id: addressId,
        customerId: user.id,
      },
    });

    if (!address) {
      return NextResponse.json(
        { error: "Address not found." },
        { status: 404 }
      );
    }

    await prisma.address.delete({
      where: {
        id: address.id,
      },
    });

    if (address.isDefault) {
      const nextAddress = await prisma.address.findFirst({
        where: {
          customerId: user.id,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      if (nextAddress) {
        await prisma.address.update({
          where: {
            id: nextAddress.id,
          },
          data: {
            isDefault: true,
          },
        });
      }
    }

    return NextResponse.json({
      message: "Address deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE /api/addresses error:", error);

    return NextResponse.json(
      { error: "Unable to delete address." },
      { status: 500 }
    );
  }
}