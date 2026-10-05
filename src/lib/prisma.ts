import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PrismaD1 } from "@prisma/adapter-d1";
import { PrismaClient } from "../generated/prisma/client";

function createPrisma() {
  const { env } = getCloudflareContext();

  const adapter = new PrismaD1(
    (env as Cloudflare.Env).streeto_db
  );

  return new PrismaClient({ adapter });
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = createPrisma();
    const value = client[property as keyof PrismaClient];

    if (typeof value === "function") {
      return value.bind(client);
    }

    return value;
  },
});