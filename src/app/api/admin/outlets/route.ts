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

    if (user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Access denied." },
        { status: 403 }
      );
    }

    const outlets = await prisma.outlet.findMany({
      orderBy: [
        {
          company: {
            name: "asc",
          },
        },
        {
          name: "asc",
        },
      ],
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            isActive: true,
          },
          orderBy: {
            name: "asc",
          },
        },
        _count: {
          select: {
            orders: true,
            users: true,
            payoutRequests: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      outlets,
    });
  } catch (error) {
    console.error("Super Admin outlets error:", error);

    return NextResponse.json(
      { error: "Unable to load outlets." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Please login first." }, { status: 401 });
    if (user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Access denied." }, { status: 403 });

    const body = (await request.json()) as Record<string, unknown>;
    const outletId = typeof body.outletId === "string" ? body.outletId.trim() : "";
    if (!outletId || typeof body.isActive !== "boolean") {
      return NextResponse.json({ error: "Outlet and active status are required." }, { status: 400 });
    }

    const result = await prisma.outlet.updateMany({ where: { id: outletId }, data: { isActive: body.isActive } });
    if (result.count === 0) return NextResponse.json({ error: "Outlet not found." }, { status: 404 });
    return NextResponse.json({ success: true, isActive: body.isActive });
  } catch (error) {
    console.error("Super Admin update outlet status error:", error);
    return NextResponse.json({ error: "Unable to update outlet status." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Please login first." }, { status: 401 });
    if (user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Access denied." }, { status: 403 });

    const body = (await request.json()) as Record<string, unknown>;
    const outletId = typeof body.outletId === "string" ? body.outletId.trim() : "";
    if (!outletId) return NextResponse.json({ error: "Outlet ID is required." }, { status: 400 });

    const outlet = await prisma.outlet.findUnique({
      where: { id: outletId },
      select: { id: true, _count: { select: { orders: true, payoutRequests: true } } },
    });
    if (!outlet) return NextResponse.json({ error: "Outlet not found." }, { status: 404 });
    if (outlet._count.orders > 0 || outlet._count.payoutRequests > 0) {
      return NextResponse.json(
        { error: "This outlet has order or settlement history. Deactivate it to preserve those records." },
        { status: 409 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.updateMany({
        where: { outletId, role: "DELIVERY_STAFF" },
        data: { outletId: null, isActive: false, sessionVersion: { increment: 1 } },
      });
      await tx.user.updateMany({ where: { outletId }, data: { outletId: null } });
      await tx.outletProduct.deleteMany({ where: { outletId } });
      await tx.outlet.delete({ where: { id: outletId } });
    });

    return NextResponse.json({ success: true, message: "Outlet permanently deleted." });
  } catch (error) {
    console.error("Super Admin delete outlet error:", error);
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2003") {
      return NextResponse.json(
        { error: "This outlet has linked records. Deactivate it to preserve its history." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Unable to delete outlet." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Please login first." }, { status: 401 });
    }

    if (user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Only Super Admin can create outlets." }, { status: 403 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const companyId = typeof body.companyId === "string" ? body.companyId.trim() : "";

    if (!name || !companyId) {
      return NextResponse.json({ error: "Outlet name and business are required." }, { status: 400 });
    }

    const company = await prisma.company.findUnique({ where: { id: companyId }, select: { id: true } });
    if (!company) {
      return NextResponse.json({ error: "Business not found." }, { status: 404 });
    }

    const outlet = await prisma.outlet.create({
      data: {
        name,
        companyId,
        city: typeof body.city === "string" ? body.city.trim() || null : null,
        address: typeof body.address === "string" ? body.address.trim() || null : null,
        phone: typeof body.phone === "string" ? body.phone.trim() || null : null,
        isActive: true,
      },
      include: { company: { select: { id: true, name: true } } },
    });

    return NextResponse.json({ success: true, outlet }, { status: 201 });
  } catch (error) {
    console.error("Super Admin create outlet error:", error);
    return NextResponse.json({ error: "Unable to create outlet." }, { status: 500 });
  }
}
