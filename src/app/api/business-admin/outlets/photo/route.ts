import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MAX_FILE_SIZE = 4 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please login first." },
        { status: 401 }
      );
    }

    if (user.role !== "BUSINESS_ADMIN" || !user.companyId) {
      return NextResponse.json(
        { error: "Access denied." },
        { status: 403 }
      );
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        {
          error:
            "Photo storage is not configured yet. Ask the project owner to connect a Vercel Blob store.",
        },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const outletIdValue = formData.get("outletId");
    const file = formData.get("file");

    if (typeof outletIdValue !== "string" || !outletIdValue.trim()) {
      return NextResponse.json(
        { error: "Outlet ID is required." },
        { status: 400 }
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Choose an image to upload." },
        { status: 400 }
      );
    }

    const extension = ALLOWED_IMAGE_TYPES.get(file.type);

    if (!extension) {
      return NextResponse.json(
        { error: "Use a JPEG, PNG, or WebP image." },
        { status: 400 }
      );
    }

    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Image must be smaller than 4 MB." },
        { status: 400 }
      );
    }

    const outlet = await prisma.outlet.findFirst({
      where: {
        id: outletIdValue.trim(),
        companyId: user.companyId,
      },
      select: {
        id: true,
      },
    });

    if (!outlet) {
      return NextResponse.json(
        { error: "Outlet not found or access denied." },
        { status: 404 }
      );
    }

    const blob = await put(
      `outlets/${outlet.id}/photo.${extension}`,
      file,
      {
        access: "public",
        addRandomSuffix: true,
        contentType: file.type,
      }
    );

    const updatedOutlet = await prisma.outlet.update({
      where: { id: outlet.id },
      data: { photoUrl: blob.url },
      select: { id: true, photoUrl: true },
    });

    return NextResponse.json({
      success: true,
      photoUrl: updatedOutlet.photoUrl,
    });
  } catch (error) {
    console.error("Business Admin outlet photo upload error:", error);

    return NextResponse.json(
      { error: "Unable to upload outlet photo. Please try again." },
      { status: 500 }
    );
  }
}
