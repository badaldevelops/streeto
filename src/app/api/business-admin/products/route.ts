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

    const body = await request.json();

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : null;

    const imageUrl =
      typeof body.imageUrl === "string"
        ? body.imageUrl.trim()
        : null;

    const outletId =
      typeof body.outletId === "string"
        ? body.outletId.trim()
        : "";

    const price = Number(body.price);

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
            price,
            isAvailable,
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

    const body = await request.json();

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
      data.imageUrl =
        typeof body.imageUrl === "string"
          ? body.imageUrl.trim() || null
          : null;
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
      body.isAvailable !== undefined
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
        price?: number;
        isAvailable?: boolean;
      } = {};

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
            isAvailable:
              outletProductData.isAvailable ?? true,
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

    const body = await request.json();

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