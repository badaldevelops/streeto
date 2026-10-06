import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured.");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const company = await prisma.company.create({
    data: {
      name: "MR DABS",
    },
  });

  const outlet = await prisma.outlet.create({
    data: {
      name: "Outlet 1",
      companyId: company.id,
      deliveryRadiusKm: 5,
      deliveryCharge: 0,
    },
  });

  const product = await prisma.product.create({
    data: {
      name: "Dabeli",
      description: "Delicious MR DABS Dabeli",
      companyId: company.id,
    },
  });

  await prisma.outletProduct.create({
    data: {
      outletId: outlet.id,
      productId: product.id,
      price: 40,
      isAvailable: true,
    },
  });

  console.log("MR DABS database setup complete!");
  console.log("Company: MR DABS");
  console.log("Outlet: Outlet 1");
  console.log("Product: Dabeli");
  console.log("Price: ₹40");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });