import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { env } from "cloudflare:workers";

let client: PrismaClient | undefined;

function getClient() {
  return (client ??= new PrismaClient({
    adapter: new PrismaPg({
      connectionString: env.HYPERDRIVE.connectionString,
    }),
  }));
}

// Prisma's PostgreSQL adapter must be created on first request in Workers;
// connecting while the module is initialized is disallowed by the runtime.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const instance = getClient();
    const value = Reflect.get(instance, property, instance);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
