import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { env } from "cloudflare:workers";
import {
  getRequestContext,
  isInsideUnifiedScope,
  queueAfterCallback,
} from "vinext/shims/unified-request-context";

const requestClientCacheKey = () => undefined;

function getClient() {
  if (!isInsideUnifiedScope()) {
    throw new Error("Cloudflare Prisma access requires an active request.");
  }

  const requestContext = getRequestContext();
  const cachedClient = requestContext.requestCache.get(requestClientCacheKey) as
    | PrismaClient
    | undefined;

  if (cachedClient) {
    return cachedClient;
  }

  const client = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: env.HYPERDRIVE.connectionString,
    }),
  });

  requestContext.requestCache.set(requestClientCacheKey, client);
  queueAfterCallback(requestContext, () => client.$disconnect());

  return client;
}

// Keep the client scoped to Vinext's request context. A module-level client
// can retain a PostgreSQL connection across Worker requests, which may leave
// later requests waiting on a connection owned by a finished invocation.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const instance = getClient();
    const value = Reflect.get(instance, property, instance);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
