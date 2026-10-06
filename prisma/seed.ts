import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { PrismaClient } from "../src/generated/prisma/client";

const databaseUrl = process.env.DATABASE_URL;
const adminEmail = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
const adminPassword = process.env.SUPER_ADMIN_PASSWORD;
const adminName = process.env.SUPER_ADMIN_NAME || "Super Admin";

if (!databaseUrl) throw new Error("DATABASE_URL is not configured.");
if (!adminEmail) throw new Error("SUPER_ADMIN_EMAIL is not configured.");
if (!adminPassword) throw new Error("SUPER_ADMIN_PASSWORD is not configured.");

const adapter = new PrismaLibSQL({
  url: databaseUrl,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: adminName,
      passwordHash,
      role: "SUPER_ADMIN",
      isActive: true,
      companyId: null,
      outletId: null,
    },
    create: {
      name: adminName,
      email: adminEmail,
      passwordHash,
      role: "SUPER_ADMIN",
      isActive: true,
    },
  });

  console.log("Super Admin ready.");
  console.log("ID:", admin.id);
  console.log("Email:", admin.email);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
