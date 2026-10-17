import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getCashfreeConfig, getCashfreeMode, startCashfreeOrder } from "@/lib/cashfree";
import { readProductAddOns, type ProductAddOn } from "@/lib/product-addons";

export async function POST(request: Request) {
  try {
    const customer = await getCurrentUser();
    if (!customer || customer.role !== "CUSTOMER") {
      return NextResponse.json(
        { error: "Please log in as a customer before placing an order." },
        { status: 401 }
      );
    }

    const body = (await request.json()) as any;

    const {
      customerName,
      customerPhone,
      orderType,
      pickupOnly,
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
          (item as { quantity: number }).quantity > 99 ||
          ((item as { addOnIds?: unknown }).addOnIds !== undefined &&
            (!Array.isArray((item as { addOnIds?: unknown }).addOnIds) ||
              ((item as { addOnIds: unknown[] }).addOnIds.length > 20) ||
              (item as { addOnIds: unknown[] }).addOnIds.some((id) => typeof id !== "string" || id.length > 100)))
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
      orderType !== "SELF_RECEIVE" &&
      orderType !== "DINE_IN"
    ) {
      return NextResponse.json(
        {
          error: "Invalid order type.",
        },
        { status: 400 }
      );
    }

    if (orderType === "DELIVERY") {
      return NextResponse.json(
        { error: "Qtoo currently accepts Self Receive and Dine In orders only." },
        { status: 403 }
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
    if (orderType === "DELIVERY" && pickupOnly === true) {
      return NextResponse.json(
        { error: "This outlet was selected for Self Receive only." },
        { status: 400 }
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

    /*
     * Load every cart product from the database.
     * Never trust product price, outlet or company
     * information coming from the browser.
     */
    const outletProductIds = Array.from(new Set(items.map(
      (item: {
        outletProductId: string;
        quantity: number;
      }) => item.outletProductId
    )));

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
              company: { select: { isActive: true, isOpen: true } },
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

    if (!outlet.company.isActive) {
      return NextResponse.json(
        { error: "This business is currently unavailable." },
        { status: 403 }
      );
    }

    if (orderType === "DELIVERY" && !outlet.deliveryEnabled) {
      return NextResponse.json(
        { error: "This outlet is not currently offering delivery. Please choose Self Receive or Dine In." },
        { status: 403 }
      );
    }

    if (!outlet.company.isOpen) {
      return NextResponse.json(
        { error: "This store is closed and is not accepting orders right now." },
        { status: 409 }
      );
    }

    if (!getCashfreeConfig()) {
      return NextResponse.json(
        { error: "Cashfree payment is not configured yet. Please try again later." },
        { status: 503 }
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
    let sgstAmount = 0;
    let cgstAmount = 0;
    const selectedAddOnsByLine = new Map<number, ProductAddOn[]>();

    for (const [itemIndex, item] of items.entries()) {
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

      const configuredAddOns = readProductAddOns(product.addOns);
      const requestedIds: string[] = Array.isArray(item.addOnIds) ? item.addOnIds : [];
      if (new Set(requestedIds).size !== requestedIds.length) {
        return NextResponse.json({ error: "An add-on was selected more than once." }, { status: 400 });
      }
      const selectedAddOns = requestedIds.map((id) => configuredAddOns.find((addOn) => addOn.id === id));
      if (selectedAddOns.some((addOn) => !addOn)) {
        return NextResponse.json({ error: "One of the selected add-ons is no longer available. Please update your cart." }, { status: 400 });
      }
      const validAddOns = selectedAddOns as ProductAddOn[];
      selectedAddOnsByLine.set(itemIndex, validAddOns);

      const unitPrice = product.price + validAddOns.reduce((total, addOn) => total + addOn.price, 0);
      const lineSubtotal = unitPrice * item.quantity;
      subtotal += lineSubtotal;
      if (outlet.gstin) {
        sgstAmount += Math.round(lineSubtotal * product.sgstRate) / 100;
        cgstAmount += Math.round(lineSubtotal * product.cgstRate) / 100;
      }
    }

    subtotal = Math.round(subtotal * 100) / 100;
    sgstAmount = Math.round(sgstAmount * 100) / 100;
    cgstAmount = Math.round(cgstAmount * 100) / 100;
    /*
     * Delivery charge comes from the selected outlet.
     * For self receive, delivery charge is zero.
     */
    const deliveryCharge =
      orderType === "DELIVERY"
        ? outlet.deliveryCharge
        : 0;

    const total = Math.round(
      (subtotal + sgstAmount + cgstAmount + deliveryCharge) * 100
    ) / 100;
    // Qtoo charges the outlet 2% of the full bill. GST is charged on Qtoo's fee,
    // not added to the customer's checkout amount.
    const platformCommission = Math.round(total * 0.02 * 100) / 100;
    const platformCommissionGst = Math.round(platformCommission * 0.18 * 100) / 100;
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
     * Create the order.
     */
    const order =
      await prisma.order.create({
        data: {
          orderNumber: `ORD-${Date.now()}`,
          type: orderType,
          status: "PAYMENT_PENDING",
          outletId: outlet.id,
          customerId: customer.id,

          subtotal,
          sgstAmount,
          cgstAmount,
          gstin: outlet.gstin,
          deliveryCharge,
          total,
          platformCommission,
          platformCommissionGst,

          queueNumber: null,
          queuePosition: null,

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
              }, itemIndex: number) => {
                const product =
                  outletProducts.find(
                    (outletProduct) =>
                      outletProduct.id ===
                      item.outletProductId
                  );

                const selectedAddOns = selectedAddOnsByLine.get(itemIndex) ?? [];
                const unitPrice = product!.price + selectedAddOns.reduce((total, addOn) => total + addOn.price, 0);
                const itemSubtotal = unitPrice * item.quantity;
                return {
                  productId:
                    product!.productId,

                  quantity:
                    item.quantity,

                  unitPrice,

                  totalPrice:
                    itemSubtotal,
                  addOns: selectedAddOns,
                  sgstAmount: outlet.gstin
                    ? Math.round(itemSubtotal * product!.sgstRate) / 100
                    : 0,
                  cgstAmount: outlet.gstin
                    ? Math.round(itemSubtotal * product!.cgstRate) / 100
                    : 0,
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
          outlet: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

    const gatewayOrderId = `qtoo_${order.id}`;
    let cashfreeOrder: { orderId: string; paymentSessionId: string };
    try {
      cashfreeOrder = await startCashfreeOrder({
        orderId: gatewayOrderId,
        amount: total,
        customerId: customer.id,
        customerName: customer.name || customerName.trim(),
        customerPhone: customer.phone || customerPhone,
        customerEmail: customer.email,
        returnUrl: `https://qtoo.in/api/payments/cashfree/return?order_id={order_id}`,
        notifyUrl: "https://qtoo.in/api/payments/cashfree/webhook",
      });
      await prisma.payment.update({
        where: { orderId: order.id },
        data: {
          gatewayOrderId: cashfreeOrder.orderId,
          gatewaySessionId: cashfreeOrder.paymentSessionId,
        },
      });
    } catch (error) {
      console.error("Cashfree order creation failed:", error instanceof Error ? error.message : "Unknown Cashfree error");
      await prisma.$transaction([
        prisma.payment.updateMany({ where: { orderId: order.id, status: "PENDING" }, data: { status: "FAILED" } }),
        prisma.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } }),
      ]);
      return NextResponse.json(
        { error: "Cashfree could not start this payment. Please try again shortly." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        type: order.type,
        status: order.status,
        queueNumber: order.queueNumber,
        total: order.total,
      },
      cashfreeOrderId: cashfreeOrder.orderId,
      paymentSessionId: cashfreeOrder.paymentSessionId,
      cashfreeMode: getCashfreeMode(),
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
