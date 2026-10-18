import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { safeHttpsUrl } from "@/lib/validation";
import { parseProductAddOns } from "@/lib/product-addons";
import { parseProductVariants } from "@/lib/product-variants";

function parseGstin(value: unknown): string | null | "invalid" {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") return "invalid";
  const gstin = value.trim().toUpperCase();
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/.test(gstin)
    ? gstin
    : "invalid";
}

function parseGstRate(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  const rate = Number(value);
  return Number.isFinite(rate) && rate >= 0 && rate <= 100
    ? rate
    : null;
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

    const products = await prisma.product.findMany({
      where: {
        companyId: user.companyId,
      },
      include: {
        outletProducts: {
          include: {
            outlet: {
              select: {
                id: true,
                name: true,
                isActive: true,
                gstin: true,
                foodType: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      products,
    });
  } catch (error) {
    console.error(
      "Business Admin products error:",
      error
    );

    return NextResponse.json(
      {
        error: "Unable to load business products.",
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

    const body = (await request.json()) as any;

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";
    const category = typeof body.category === "string" ? body.category.trim() : "Other";
    const addOns = parseProductAddOns(body.addOns);
    const variants = parseProductVariants(body.variants);

    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : null;

    const imageUrl = safeHttpsUrl(body.imageUrl);

    if (
      typeof body.imageUrl === "string" &&
      body.imageUrl.trim() &&
      !imageUrl
    ) {
      return NextResponse.json(
        { error: "Image URL must start with https://." },
        { status: 400 }
      );
    }

    const outletId =
      typeof body.outletId === "string"
        ? body.outletId.trim()
        : "";

    const price = Number(body.price);
    const gstin = parseGstin(body.gstin);
    const sgstRate = parseGstRate(body.sgstRate);
    const cgstRate = parseGstRate(body.cgstRate);

    const isAvailable =
      body.isAvailable === undefined
        ? true
        : body.isAvailable;

    if (!name) {
      return NextResponse.json(
        { error: "Product name is required." },
        { status: 400 }
      );
    }

    if (!category || category.length > 60) {
      return NextResponse.json({ error: "Enter a menu section name up to 60 characters." }, { status: 400 });
    }
    if (!addOns) {
      return NextResponse.json({ error: "Check each add-on name and price." }, { status: 400 });
    }
    if (!variants) {
      return NextResponse.json({ error: "Check each variant name and price (up to 50 options)." }, { status: 400 });
    }

    if (!outletId) {
      return NextResponse.json(
        { error: "Outlet is required." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json(
        {
          error:
            "Product price must be 0 or greater.",
        },
        { status: 400 }
      );
    }

    if (gstin === "invalid") {
      return NextResponse.json({ error: "Enter a valid 15-character GSTIN, or leave it blank." }, { status: 400 });
    }
    if (gstin && (sgstRate === null || cgstRate === null)) {
      return NextResponse.json({ error: "Enter SGST and CGST rates between 0 and 100%." }, { status: 400 });
    }

    if (typeof isAvailable !== "boolean") {
      return NextResponse.json(
        {
          error:
            "isAvailable must be true or false.",
        },
        { status: 400 }
      );
    }

    const outlet = await prisma.outlet.findFirst({
      where: {
        id: outletId,
        companyId: user.companyId,
      },
      select: {
        id: true,
        name: true,
        foodType: true,
      },
    });

    if (!outlet) {
      return NextResponse.json(
        {
          error:
            "Outlet not found or access denied.",
        },
        { status: 404 }
      );
    }

    if (outlet.foodType === "BOTH" && body.isVeg !== undefined && typeof body.isVeg !== "boolean") {
      return NextResponse.json({ error: "Choose whether this product is veg or non-veg." }, { status: 400 });
    }
    const isVeg = outlet.foodType === "VEG"
      ? true
      : outlet.foodType === "NON_VEG"
        ? false
        : body.isVeg !== false;

    await prisma.outlet.update({ where: { id: outlet.id }, data: { gstin } });

    const product = await prisma.product.create({
      data: {
        name,
        description: description || null,
        imageUrl: imageUrl || null,
        isActive: true,
        companyId: user.companyId,
        outletProducts: {
          create: {
            outletId: outlet.id,
            category,
            addOns,
            variants,
            price,
            sgstRate: gstin ? sgstRate! : 0,
            cgstRate: gstin ? cgstRate! : 0,
            isAvailable,
            isVeg,
          },
        },
      },
      include: {
        outletProducts: {
          include: {
            outlet: {
              select: {
                id: true,
                name: true,
                isActive: true,
                gstin: true,
                foodType: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Product created successfully.",
        product,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Business Admin create product error:",
      error
    );

    return NextResponse.json(
      {
        error: "Unable to create product.",
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

    const body = (await request.json()) as any;

    const productId =
      typeof body.productId === "string"
        ? body.productId.trim()
        : "";

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required." },
        { status: 400 }
      );
    }

    const existingProduct =
      await prisma.product.findFirst({
        where: {
          id: productId,
          companyId: user.companyId,
        },
        include: {
          outletProducts: true,
        },
      });

    if (!existingProduct) {
      return NextResponse.json(
        {
          error:
            "Product not found or access denied.",
        },
        { status: 404 }
      );
    }

    const data: {
      name?: string;
      description?: string | null;
      imageUrl?: string | null;
      isActive?: boolean;
    } = {};

    if (body.name !== undefined) {
      const name =
        typeof body.name === "string"
          ? body.name.trim()
          : "";

      if (!name) {
        return NextResponse.json(
          { error: "Product name is required." },
          { status: 400 }
        );
      }

      data.name = name;
    }

    if (body.description !== undefined) {
      data.description =
        typeof body.description === "string"
          ? body.description.trim() || null
          : null;
    }

    if (body.imageUrl !== undefined) {
      const imageUrl = safeHttpsUrl(body.imageUrl);

      if (
        typeof body.imageUrl === "string" &&
        body.imageUrl.trim() &&
        !imageUrl
      ) {
        return NextResponse.json(
          { error: "Image URL must start with https://." },
          { status: 400 }
        );
      }

      data.imageUrl = imageUrl;
    }

    if (body.isActive !== undefined) {
      if (typeof body.isActive !== "boolean") {
        return NextResponse.json(
          {
            error:
              "isActive must be true or false.",
          },
          { status: 400 }
        );
      }

      data.isActive = body.isActive;
    }

    const updatedProduct =
      await prisma.product.update({
        where: {
          id: existingProduct.id,
        },
        data,
        include: {
          outletProducts: {
            include: {
              outlet: {
                select: {
                  id: true,
                  name: true,
                  isActive: true,
                },
              },
            },
          },
        },
      });

    if (
      body.outletId !== undefined ||
      body.price !== undefined ||
      body.isAvailable !== undefined ||
      body.isVeg !== undefined ||
      body.gstin !== undefined ||
      body.sgstRate !== undefined ||
      body.cgstRate !== undefined ||
      body.category !== undefined ||
      body.addOns !== undefined ||
      body.variants !== undefined
    ) {
      const outletId =
        body.outletId !== undefined
          ? typeof body.outletId === "string"
            ? body.outletId.trim()
            : ""
          : existingProduct.outletProducts[0]
              ?.outletId;

      if (!outletId) {
        return NextResponse.json(
          {
            error: "Outlet is required.",
          },
          { status: 400 }
        );
      }

      const outlet =
        await prisma.outlet.findFirst({
          where: {
            id: outletId,
            companyId: user.companyId,
          },
          select: {
            id: true,
            gstin: true,
            foodType: true,
          },
        });

      if (!outlet) {
        return NextResponse.json(
          {
            error:
              "Outlet not found or access denied.",
          },
          { status: 404 }
        );
      }

      if (outlet.foodType === "BOTH" && body.isVeg !== undefined && typeof body.isVeg !== "boolean") {
        return NextResponse.json({ error: "Choose whether this product is veg or non-veg." }, { status: 400 });
      }
      const isVeg = outlet.foodType === "VEG"
        ? true
        : outlet.foodType === "NON_VEG"
          ? false
          : body.isVeg !== undefined
            ? body.isVeg
            : existingProduct.outletProducts.find((entry) => entry.outletId === outletId)?.isVeg ?? true;

      const gstin = body.gstin !== undefined
        ? parseGstin(body.gstin)
        : outlet.gstin;
      if (gstin === "invalid") {
        return NextResponse.json({ error: "Enter a valid 15-character GSTIN, or leave it blank." }, { status: 400 });
      }
      const sgstRate = body.sgstRate !== undefined
        ? parseGstRate(body.sgstRate)
        : existingProduct.outletProducts.find((entry) => entry.outletId === outletId)?.sgstRate ?? 0;
      const cgstRate = body.cgstRate !== undefined
        ? parseGstRate(body.cgstRate)
        : existingProduct.outletProducts.find((entry) => entry.outletId === outletId)?.cgstRate ?? 0;
      if (gstin && (sgstRate === null || cgstRate === null)) {
        return NextResponse.json({ error: "Enter SGST and CGST rates between 0 and 100%." }, { status: 400 });
      }
      await prisma.outlet.update({ where: { id: outlet.id }, data: { gstin } });

      const existingOutletProduct =
        await prisma.outletProduct.findUnique({
          where: {
            outletId_productId: {
              outletId,
              productId: existingProduct.id,
            },
          },
        });

      const outletProductData: {
        category?: string;
        addOns?: Prisma.InputJsonValue;
        variants?: Prisma.InputJsonValue;
        price?: number;
        isAvailable?: boolean;
        isVeg?: boolean;
        sgstRate?: number;
        cgstRate?: number;
      } = {};

      if (body.category !== undefined) {
        if (typeof body.category !== "string" || !body.category.trim() || body.category.trim().length > 60) {
          return NextResponse.json({ error: "Enter a menu section name up to 60 characters." }, { status: 400 });
        }
        outletProductData.category = body.category.trim();
      }
      if (body.addOns !== undefined) {
        const addOns = parseProductAddOns(body.addOns);
        if (!addOns) {
          return NextResponse.json({ error: "Check each add-on name and price." }, { status: 400 });
        }
        outletProductData.addOns = addOns as Prisma.InputJsonValue;
      }
      if (body.variants !== undefined) {
        const variants = parseProductVariants(body.variants);
        if (!variants) {
          return NextResponse.json({ error: "Check each variant name and price (up to 50 options)." }, { status: 400 });
        }
        outletProductData.variants = variants as Prisma.InputJsonValue;
      }

      if (body.price !== undefined) {
        const price = Number(body.price);

        if (!Number.isFinite(price) || price < 0) {
          return NextResponse.json(
            {
              error:
                "Product price must be 0 or greater.",
            },
            { status: 400 }
          );
        }

        outletProductData.price = price;
      }

      outletProductData.sgstRate = gstin ? sgstRate! : 0;
      outletProductData.cgstRate = gstin ? cgstRate! : 0;
      outletProductData.isVeg = isVeg;

      if (body.isAvailable !== undefined) {
        if (typeof body.isAvailable !== "boolean") {
          return NextResponse.json(
            {
              error:
                "isAvailable must be true or false.",
            },
            { status: 400 }
          );
        }

        outletProductData.isAvailable =
          body.isAvailable;
      }

      if (existingOutletProduct) {
        await prisma.outletProduct.update({
          where: {
            id: existingOutletProduct.id,
          },
          data: outletProductData,
        });
      } else {
        await prisma.outletProduct.create({
          data: {
            outletId,
            productId: existingProduct.id,
            price:
              outletProductData.price ?? 0,
            sgstRate: outletProductData.sgstRate ?? 0,
            cgstRate: outletProductData.cgstRate ?? 0,
            isAvailable:
              outletProductData.isAvailable ?? true,
            isVeg: outletProductData.isVeg ?? true,
          },
        });
      }
    }

    const product =
      await prisma.product.findUnique({
        where: {
          id: existingProduct.id,
        },
        include: {
          outletProducts: {
            include: {
              outlet: {
                select: {
                  id: true,
                  name: true,
                  isActive: true,
                  gstin: true,
                },
              },
            },
          },
        },
      });

    return NextResponse.json({
      success: true,
      message: "Product updated successfully.",
      product,
    });
  } catch (error) {
    console.error(
      "Business Admin update product error:",
      error
    );

    return NextResponse.json(
      {
        error: "Unable to update product.",
      },
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

    const body = (await request.json()) as any;

    const productId =
      typeof body.productId === "string"
        ? body.productId.trim()
        : "";

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required." },
        { status: 400 }
      );
    }

    const product =
      await prisma.product.findFirst({
        where: {
          id: productId,
          companyId: user.companyId,
        },
        select: {
          id: true,
          name: true,
          isActive: true,
        },
      });

    if (!product) {
      return NextResponse.json(
        {
          error:
            "Product not found or access denied.",
        },
        { status: 404 }
      );
    }

    const updatedProduct =
      await prisma.product.update({
        where: {
          id: product.id,
        },
        data: {
          isActive: false,
        },
      });

    return NextResponse.json({
      success: true,
      message: "Product deactivated successfully.",
      product: updatedProduct,
    });
  } catch (error) {
    console.error(
      "Business Admin delete product error:",
      error
    );

    return NextResponse.json(
      {
        error: "Unable to deactivate product.",
      },
      { status: 500 }
    );
  }
}
