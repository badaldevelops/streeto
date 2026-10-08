import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/session";
import { sendNewOrderPush } from "@/lib/business-push";
import { isDeliveryEnabled } from "@/lib/platform-settings";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as any;

    const {
      customerName,
      customerPhone,
      orderType,
      deliveryAddress,
      customizationNote,
        latitude,
  longitude,
      items,
    } = body;

    if (
      !customerName ||
      !customerPhone ||
      !orderType ||
      !Array.isArray(items) ||
      !items.length
    ) {
      return NextResponse.json(
        {
          error:
            "Customer details and cart items are required.",
        },
        { status: 400 }
      );
    }

    if (
      items.length > 50 ||
      items.some(
        (item: unknown) =>
          typeof item !== "object" ||
          item === null ||
          typeof (item as { outletProductId?: unknown })
            .outletProductId !== "string" ||
          !(item as { outletProductId: string }).outletProductId ||
          (item as { outletProductId: string }).outletProductId.length > 100 ||
          !Number.isInteger(
            (item as { quantity?: unknown }).quantity
          ) ||
          (item as { quantity: number }).quantity < 1 ||
          (item as { quantity: number }).quantity > 99
      )
    ) {
      return NextResponse.json(
        { error: "Invalid cart items." },
        { status: 400 }
      );
    }

    if (
      typeof customerName !== "string" ||
      !customerName.trim() ||
      customerName.length > 100 ||
      (deliveryAddress !== undefined &&
        deliveryAddress !== null &&
        (typeof deliveryAddress !== "string" ||
          deliveryAddress.length > 500))
    ) {
      return NextResponse.json(
        { error: "Invalid customer details." },
        { status: 400 }
      );
    }

    if (
      typeof customerPhone !== "string" ||
      !/^[0-9]{10}$/.test(customerPhone)
    ) {
      return NextResponse.json(
        {
          error:
            "Please enter a valid 10-digit phone number.",
        },
        { status: 400 }
      );
    }

    if (
      orderType !== "DELIVERY" &&
      orderType !== "SELF_RECEIVE"
    ) {
      return NextResponse.json(
        {
          error: "Invalid order type.",
        },
        { status: 400 }
      );
    }

    if (
      customizationNote !== undefined &&
      customizationNote !== null &&
      (typeof customizationNote !== "string" || customizationNote.length > 500)
    ) {
      return NextResponse.json(
        { error: "Food customization notes must be 500 characters or fewer." },
        { status: 400 }
      );
    }
    if (orderType === "DELIVERY" && !(await isDeliveryEnabled())) {
      return NextResponse.json(
        { error: "Delivery is currently unavailable. Please choose Self Receive." },
        { status: 403 }
      );
    }
    if (
  orderType === "DELIVERY" &&
  (latitude === null ||
    latitude === undefined ||
    longitude === null ||
    longitude === undefined)
) {
  return NextResponse.json(
    {
      error:
        "Please allow location access before placing a delivery order.",
    },
    { status: 400 }
  );
}

const customerLatitude =
  latitude === null || latitude === undefined
    ? null
    : Number(latitude);

const customerLongitude =
  longitude === null || longitude === undefined
    ? null
    : Number(longitude);

if (
  customerLatitude !== null &&
  (!Number.isFinite(customerLatitude) ||
    customerLatitude < -90 ||
    customerLatitude > 90)
) {
  return NextResponse.json(
    { error: "Invalid customer latitude." },
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
    { error: "Invalid customer longitude." },
    { status: 400 }
  );
}

    if (
      orderType === "DELIVERY" &&
      !deliveryAddress?.trim()
    ) {
      return NextResponse.json(
        {
          error: "Delivery address is required.",
        },
        { status: 400 }
      );
    }

    // Get logged-in customer from session cookie.
    const cookieHeader = request.headers.get("cookie");

    const sessionToken = cookieHeader
      ?.split(";")
      .map((cookie) => cookie.trim())
      .find((cookie) =>
        cookie.startsWith("session=")
      )
      ?.split("=")[1];

    if (!sessionToken) {
      return NextResponse.json(
        {
          error:
            "Please login before placing an order.",
        },
        { status: 401 }
      );
    }

    const customerId =
      await verifySession(sessionToken);

    if (!customerId) {
      return NextResponse.json(
        {
          error:
            "Your session has expired. Please login again.",
        },
        { status: 401 }
      );
    }

    const customer =
      await prisma.user.findUnique({
        where: {
          id: customerId,
        },
      });

    if (
      !customer ||
      customer.role !== "CUSTOMER"
    ) {
      return NextResponse.json(
        {
          error: "Customer account not found.",
        },
        { status: 401 }
      );
    }

    /*
     * Load every cart product from the database.
     * Never trust product price, outlet or company
     * information coming from the browser.
     */
    const outletProductIds = items.map(
      (item: {
        outletProductId: string;
        quantity: number;
      }) => item.outletProductId
    );

    const outletProducts =
      await prisma.outletProduct.findMany({
        where: {
          id: {
            in: outletProductIds,
          },
        },
        include: {
          outlet: {
            include: {
              company: true,
            },
          },
          product: true,
        },
      });

    if (
      outletProducts.length !==
      outletProductIds.length
    ) {
      return NextResponse.json(
        {
          error:
            "One or more products are no longer available.",
        },
        { status: 400 }
      );
    }

    /*
     * Every product in one order must belong to
     * the same outlet.
     */
    const firstOutletId =
      outletProducts[0].outletId;

    const differentOutlet =
      outletProducts.some(
        (product) =>
          product.outletId !== firstOutletId
      );

    if (differentOutlet) {
      return NextResponse.json(
        {
          error:
            "You can only order products from one outlet at a time.",
        },
        { status: 400 }
      );
    }

    const outlet =
      outletProducts[0].outlet;

    if (!outlet.company.isOpen) {
      return NextResponse.json(
        { error: "This store is closed and is not accepting orders right now." },
        { status: 409 }
      );
    }

    /*
     * All products must also be available.
     */
    for (const product of outletProducts) {
      if (
        !product.isAvailable ||
        !product.product.isActive
      ) {
        return NextResponse.json(
          {
            error:
              "One of the products is currently unavailable.",
          },
          { status: 400 }
        );
      }
    }

    /*
     * Validate quantities and calculate subtotal
     * using the database prices.
     */
    let subtotal = 0;

    for (const item of items) {
      if (
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0
      ) {
        return NextResponse.json(
          {
            error:
              "Invalid product quantity.",
          },
          { status: 400 }
        );
      }

      const product =
        outletProducts.find(
          (outletProduct) =>
            outletProduct.id ===
            item.outletProductId
        );

      if (!product) {
        return NextResponse.json(
          {
            error:
              "One of the products is unavailable.",
          },
          { status: 400 }
        );
      }

      subtotal +=
        product.price * item.quantity;
    }

    /*
     * Delivery charge comes from the selected outlet.
     * For self receive, delivery charge is zero.
     */
    const deliveryCharge =
      orderType === "DELIVERY"
        ? outlet.deliveryCharge
        : 0;

    const total =
      subtotal + deliveryCharge;
      if (orderType === "DELIVERY") {
  const outletLatitude = outlet.latitude;
  const outletLongitude = outlet.longitude;

  if (
    outletLatitude === null ||
    outletLongitude === null
  ) {
    return NextResponse.json(
      {
        error:
          "This outlet has not configured its delivery location yet.",
      },
      { status: 400 }
    );
  }

  const earthRadiusKm = 6371;

  const toRadians = (value: number) =>
    (value * Math.PI) / 180;

  const latitudeDifference = toRadians(
    customerLatitude! - outletLatitude
  );

  const longitudeDifference = toRadians(
    customerLongitude! - outletLongitude
  );

  const a =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(toRadians(outletLatitude)) *
      Math.cos(toRadians(customerLatitude!)) *
      Math.sin(longitudeDifference / 2) ** 2;

  const distanceKm =
    2 *
    earthRadiusKm *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  if (distanceKm > outlet.deliveryRadiusKm) {
    return NextResponse.json(
      {
        error: `Delivery is available only within ${outlet.deliveryRadiusKm} km of this outlet. Your location is approximately ${distanceKm.toFixed(2)} km away.`,
      },
      { status: 400 }
    );
  }
}

    /*
     * Self Receive queue.
     */
    let queueNumber: number | null = null;
    let queuePosition: number | null = null;

    if (orderType === "SELF_RECEIVE") {
      const activeSelfReceiveOrders =
        await prisma.order.count({
          where: {
            outletId: outlet.id,
            type: "SELF_RECEIVE",
            status: {
              notIn: [
                "COMPLETED",
                "CANCELLED",
              ],
            },
          },
        });

      queueNumber =
        activeSelfReceiveOrders + 1;

      queuePosition =
        activeSelfReceiveOrders + 1;
    }

    /*
     * Create the order.
     */
    const order =
      await prisma.order.create({
        data: {
          orderNumber: `ORD-${Date.now()}`,
          type: orderType,
          outletId: outlet.id,
          customerId: customer.id,

          subtotal,
          deliveryCharge,
          total,

          queueNumber,
          queuePosition,

          customerPhone:
            customer.phone ||
            customerPhone,

          customerName:
            customer.name ||
            customerName,

          deliveryAddress:
            orderType === "DELIVERY"
              ? deliveryAddress.trim()
              : null,
          customizationNote:
            typeof customizationNote === "string" && customizationNote.trim()
              ? customizationNote.trim()
              : null,
              customerLatitude:
  orderType === "DELIVERY"
    ? customerLatitude
    : null,

customerLongitude:
  orderType === "DELIVERY"
    ? customerLongitude
    : null,

          items: {
            create: items.map(
              (item: {
                outletProductId: string;
                quantity: number;
              }) => {
                const product =
                  outletProducts.find(
                    (outletProduct) =>
                      outletProduct.id ===
                      item.outletProductId
                  );

                return {
                  productId:
                    product!.productId,

                  quantity:
                    item.quantity,

                  unitPrice:
                    product!.price,

                  totalPrice:
                    product!.price *
                    item.quantity,
                };
              }
            ),
          },

          payment: {
            create: {
              amount: total,
              method: "ONLINE",
              status: "PENDING",
            },
          },
        },

        include: {
          items: true,
          payment: true,
        },
      });

    await sendNewOrderPush(outlet.companyId, {
      id: order.id,
      orderNumber: order.orderNumber,
      total: order.total,
    });

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error(
      "Order creation error:",
      error
    );

    return NextResponse.json(
      {
        error: "Unable to create order.",
      },
      { status: 500 }
    );
  }
}
