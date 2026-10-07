import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { env } from "cloudflare:workers";

const adapter = new PrismaPg({
  connectionString: env.HYPERDRIVE.connectionString,
});

export const prisma = new PrismaClient({ adapter });
