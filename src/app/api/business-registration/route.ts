import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { encryptOwnerAadhaar } from "@/lib/business-kyc";
import { isValidPassword, normalizeEmail, PASSWORD_ERROR } from "@/lib/validation";

type RegistrationBody = {
  businessName?: unknown;
  ownerName?: unknown;
  email?: unknown;
  phone?: unknown;
  password?: unknown;
  outletName?: unknown;
  city?: unknown;
  locality?: unknown;
  address?: unknown;
  foodType?: unknown;
  foodLicenseNumber?: unknown;
  foodLicenseExpiry?: unknown;
  aadhaarNumber?: unknown;
  aadhaarConsent?: unknown;
};

function requiredText(value: unknown, maxLength: number) {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= maxLength
    ? value.trim()
    : "";
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null) as RegistrationBody | null;
    if (!body) return NextResponse.json({ error: "Enter the business registration details." }, { status: 400 });

    const businessName = requiredText(body.businessName, 120);
    const ownerName = requiredText(body.ownerName, 120);
    const email = normalizeEmail(typeof body.email === "string" ? body.email : "");
    const phone = typeof body.phone === "string" ? body.phone.replace(/\D/g, "") : "";
    const password = typeof body.password === "string" ? body.password : "";
    const outletName = requiredText(body.outletName, 120);
    const city = requiredText(body.city, 100);
    const locality = requiredText(body.locality, 100);
    const address = requiredText(body.address, 500);
    const foodType = body.foodType;
    const foodLicenseNumber = requiredText(body.foodLicenseNumber, 100);
    const expiryInput = typeof body.foodLicenseExpiry === "string" ? body.foodLicenseExpiry : "";
    const aadhaarNumber = typeof body.aadhaarNumber === "string" ? body.aadhaarNumber.replace(/\D/g, "") : "";

    if (!businessName || !ownerName || !email || !outletName || !city || !locality || !address || !foodLicenseNumber || !expiryInput || !aadhaarNumber) {
      return NextResponse.json({ error: "Complete every required business, outlet, owner and verification field." }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Enter a valid owner email address." }, { status: 400 });
    }
    if (!/^[0-9]{10}$/.test(phone)) {
      return NextResponse.json({ error: "Enter a valid 10-digit owner mobile number." }, { status: 400 });
    }
    if (!isValidPassword(password)) {
      return NextResponse.json({ error: PASSWORD_ERROR }, { status: 400 });
    }
    if (foodType !== "VEG" && foodType !== "NON_VEG" && foodType !== "BOTH") {
      return NextResponse.json({ error: "Choose the outlet food type." }, { status: 400 });
    }
    if (!/^[0-9]{12}$/.test(aadhaarNumber)) {
      return NextResponse.json({ error: "Enter a valid 12-digit Aadhaar number." }, { status: 400 });
    }
    if (body.aadhaarConsent !== true) {
      return NextResponse.json({ error: "Confirm the Aadhaar verification consent to submit this request." }, { status: 400 });
    }

    const foodLicenseExpiry = new Date(`${expiryInput}T00:00:00.000Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(expiryInput) || Number.isNaN(foodLicenseExpiry.getTime())) {
      return NextResponse.json({ error: "Enter a valid food licence expiry date." }, { status: 400 });
    }

    if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
      return NextResponse.json({ error: "An account with this email already exists. Try business login instead." }, { status: 409 });
    }

    let aadhaarCiphertext: string;
    try {
      aadhaarCiphertext = await encryptOwnerAadhaar(aadhaarNumber);
    } catch {
      return NextResponse.json({ error: "Business registration is temporarily unavailable. Please contact Qtoo support." }, { status: 503 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const now = new Date();
    const registered = await prisma.$transaction(async (transaction) => {
      const company = await transaction.company.create({
        data: {
          name: businessName,
          isActive: false,
          verificationStatus: "PENDING",
          foodLicenseNumber,
          foodLicenseExpiry,
          ownerAadhaarCiphertext: aadhaarCiphertext,
          ownerAadhaarLast4: aadhaarNumber.slice(-4),
          verificationSubmittedAt: now,
          isOpen: false,
        },
        select: { id: true, name: true },
      });

      const outlet = await transaction.outlet.create({
        data: {
          name: outletName,
          city,
          locality,
          address,
          phone,
          foodType,
          isActive: false,
          companyId: company.id,
        },
        select: { id: true, name: true },
      });

      await transaction.user.create({
        data: {
          name: ownerName,
          email,
          phone,
          passwordHash,
          role: "BUSINESS_ADMIN",
          companyId: company.id,
        },
        select: { id: true },
      });

      return { company, outlet };
    });

    return NextResponse.json({
      success: true,
      message: "Business verification request submitted. You can sign in after Super Admin approval.",
      company: registered.company,
      outlet: registered.outlet,
    }, { status: 201 });
  } catch {
    console.error("Business registration request failed.");
    return NextResponse.json({ error: "Unable to submit the business registration. Check the details and try again." }, { status: 500 });
  }
}
