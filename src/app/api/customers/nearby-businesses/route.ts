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
    const hasLocation =
      searchParams.has("latitude") &&
      searchParams.has("longitude");
    const search = searchParams.get("search")?.trim().slice(0, 100) || "";
    const area = searchParams.get("area")?.trim().slice(0, 100) || "";
    const directory = searchParams.get("directory") === "1";

    if (hasLocation && (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    )) {
      return NextResponse.json(
        {
          error:
            "Valid customer latitude and longitude are required.",
        },
        { status: 400 }
      );
    }

    if (!hasLocation && !search && !area && !directory) {
      return NextResponse.json({ error: "Choose a location or search for an outlet." }, { status: 400 });
    }

    const radiusKm = 5;
    const latitudeRange = radiusKm / 110.574;
    const longitudeRange = hasLocation
      ? radiusKm / (111.32 * Math.max(Math.cos((latitude * Math.PI) / 180), 0.01))
      : 180;

    const outlets = await prisma.outlet.findMany({
      where: {
        isActive: true,
        company: { isActive: true },
        ...(hasLocation && !search && !directory
          ? {
              latitude: { not: null },
              longitude: { not: null },
            }
          : {}),
        ...(hasLocation && !search && !directory
          ? {
              latitude: { gte: latitude - latitudeRange, lte: latitude + latitudeRange },
              longitude: { gte: longitude - longitudeRange, lte: longitude + longitudeRange },
            }
          : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" as const } },
                { company: { is: { name: { contains: search, mode: "insensitive" as const } } } },
                { city: { contains: search, mode: "insensitive" as const } },
                { locality: { contains: search, mode: "insensitive" as const } },
                { address: { contains: search, mode: "insensitive" as const } },
                {
                  outletProducts: {
                    some: {
                      isAvailable: true,
                      product: {
                        isActive: true,
                        name: { contains: search, mode: "insensitive" as const },
                      },
                    },
                  },
                },
              ],
            }
          : {}),
        ...(area
          ? {
              OR: [
                { city: { contains: area, mode: "insensitive" as const } },
                { locality: { contains: area, mode: "insensitive" as const } },
                { address: { contains: area, mode: "insensitive" as const } },
              ],
            }
          : {}),
      },

      select: {
        id: true,
        name: true,
        city: true,
        locality: true,
        businessType: true,
        foodType: true,
        address: true,
        latitude: true,
        longitude: true,
        deliveryRadiusKm: true,
        deliveryCharge: true,
        deliveryEnabled: true,
        locationUpdatedAt: true,

        company: {
          select: {
            id: true,
            name: true,
          },
        },

      },

      orderBy: { name: "asc" },
      take: directory ? 1000 : 250,
    });

    // Outlet search suggestions only need outlet/business names. Avoid the
    // aggregate ratings query until a nearby/search result actually needs it.
    const [ratingGroups, foodMatches] = await Promise.all([
      outlets.length
        ? prisma.outletRating.groupBy({
          by: ["outletId"],
          where: {
            outletId: { in: outlets.map((outlet) => outlet.id) },
            order: { status: { in: ["COMPLETED", "DELIVERED"] }, payment: { is: { status: "PAID" } } },
          },
          _avg: { stars: true },
          _count: { stars: true },
        })
        : Promise.resolve([]),
      outlets.length && search
        ? prisma.outletProduct.findMany({
            where: {
              outletId: { in: outlets.map((outlet) => outlet.id) },
              isAvailable: true,
              product: {
                isActive: true,
                name: { contains: search, mode: "insensitive" },
              },
            },
            select: { outletId: true, product: { select: { name: true } } },
          })
        : Promise.resolve([]),
    ]);
    const ratingsByOutlet = new Map(ratingGroups.map((rating) => [rating.outletId, {
      averageRating: rating._avg.stars === null ? null : Number(rating._avg.stars.toFixed(2)),
      ratingCount: rating._count.stars,
    }]));
    const matchedFoodsByOutlet = new Map<string, string[]>();
    for (const match of foodMatches) {
      const names = matchedFoodsByOutlet.get(match.outletId) ?? [];
      if (!names.includes(match.product.name)) names.push(match.product.name);
      matchedFoodsByOutlet.set(match.outletId, names);
    }

    const nearbyBusinesses = outlets
      .map((outlet) => {
        const distanceKm = hasLocation && outlet.latitude !== null && outlet.longitude !== null
          ? calculateDistanceKm(latitude, longitude, outlet.latitude, outlet.longitude)
          : null;

        return {
          outletId: outlet.id,
          outletName: outlet.name,
          averageRating: ratingsByOutlet.get(outlet.id)?.averageRating ?? null,
          ratingCount: ratingsByOutlet.get(outlet.id)?.ratingCount ?? 0,
          matchedFoodNames: matchedFoodsByOutlet.get(outlet.id) ?? [],

          companyId: outlet.company.id,
          companyName: outlet.company.name,

          businessType: outlet.businessType,
          foodType: outlet.foodType,

          address: outlet.address,
          city: outlet.city,
          locality: outlet.locality,
          latitude: outlet.latitude,
          longitude: outlet.longitude,

          deliveryRadiusKm:
            outlet.deliveryRadiusKm,

          deliveryCharge:
            outlet.deliveryCharge,

          deliveryEnabled: outlet.deliveryEnabled,

          locationUpdatedAt:
            outlet.locationUpdatedAt,

          distanceKm: distanceKm === null ? null : Number(distanceKm.toFixed(2)),

          distanceText: distanceKm === null
            ? null
            : distanceKm < 1
              ? `${Math.round(
                  distanceKm * 1000
                )} m`
              : `${distanceKm.toFixed(1)} km`,
          isNearby: distanceKm !== null && distanceKm <= radiusKm,
          canDeliver: distanceKm !== null && distanceKm <= outlet.deliveryRadiusKm,
        };
      })
      .filter((business) => directory || Boolean(search) || Boolean(area) || business.isNearby)
      .sort(
        (a, b) => (a.distanceKm ?? Number.POSITIVE_INFINITY) - (b.distanceKm ?? Number.POSITIVE_INFINITY)
      );

    return NextResponse.json({
      success: true,

      customerLocation: hasLocation ? { latitude, longitude } : null,

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
