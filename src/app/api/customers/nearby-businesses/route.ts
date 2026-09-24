import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const earthRadiusKm = 6371;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c =
    2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const latitude = Number(
      searchParams.get("latitude")
    );

    const longitude = Number(
      searchParams.get("longitude")
    );

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return NextResponse.json(
        {
          error:
            "Valid customer latitude and longitude are required.",
        },
        { status: 400 }
      );
    }

    const outlets = await prisma.outlet.findMany({
      where: {
        isActive: true,
        latitude: {
          not: null,
        },
        longitude: {
          not: null,
        },
      },

      select: {
        id: true,
        name: true,
        businessType: true,
        address: true,
        phone: true,
        latitude: true,
        longitude: true,
        deliveryRadiusKm: true,
        deliveryCharge: true,
        locationUpdatedAt: true,

        company: {
          select: {
            id: true,
            name: true,
          },
        },

        _count: {
          select: {
            outletProducts: true,
            orders: true,
          },
        },
      },

      orderBy: {
        name: "asc",
      },
    });

    const nearbyBusinesses = outlets
      .map((outlet) => {
        if (
          outlet.latitude === null ||
          outlet.longitude === null
        ) {
          return null;
        }

        const distanceKm = calculateDistanceKm(
          latitude,
          longitude,
          outlet.latitude,
          outlet.longitude
        );

        return {
          outletId: outlet.id,
          outletName: outlet.name,

          companyId: outlet.company.id,
          companyName: outlet.company.name,

          businessType: outlet.businessType,

          address: outlet.address,
          phone: outlet.phone,

          latitude: outlet.latitude,
          longitude: outlet.longitude,

          deliveryRadiusKm:
            outlet.deliveryRadiusKm,

          deliveryCharge:
            outlet.deliveryCharge,

          locationUpdatedAt:
            outlet.locationUpdatedAt,

          distanceKm: Number(
            distanceKm.toFixed(2)
          ),

          distanceText:
            distanceKm < 1
              ? `${Math.round(
                  distanceKm * 1000
                )} m`
              : `${distanceKm.toFixed(1)} km`,

          productCount:
            outlet._count.outletProducts,

          orderCount:
            outlet._count.orders,
        };
      })
      .filter(
        (
          business
        ): business is NonNullable<
          typeof business
        > => business !== null
      )
      .sort(
        (a, b) =>
          a.distanceKm - b.distanceKm
      );

    return NextResponse.json({
      success: true,

      customerLocation: {
        latitude,
        longitude,
      },

      businesses: nearbyBusinesses,
    });
  } catch (error) {
    console.error(
      "Nearby businesses error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to load nearby businesses.",
      },
      { status: 500 }
    );
  }
}