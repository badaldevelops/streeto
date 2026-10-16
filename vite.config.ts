import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import path from "node:path";
import vinext from "vinext";
import { cloudflare } from "@cloudflare/vite-plugin";

const qtooApp = process.env.QTOO_APP ?? "customer";
const appDir = path.resolve(`.qtoo-app-build/${qtooApp}`);
const standaloneWorkerConfig = qtooApp === "customer" ? undefined : (workerConfig) => {
  workerConfig.name = qtooApp === "business" ? "streeto-business" : "streeto-admin";
  workerConfig.domains = [qtooApp === "business" ? "business.qtoo.in" : "admin.qtoo.in"];
  workerConfig.workersDev = true;
  workerConfig.previewUrls = true;
  workerConfig.env = { ASSETS: workerConfig.env.ASSETS };
};

export default defineConfig({
  resolve: {
    alias: [
      {
        find: "@/lib/prisma",
        replacement: fileURLToPath(
          new URL("./src/lib/prisma.cloudflare.ts", import.meta.url)
        ),
      },
      {
        find: "@/lib/session",
        replacement: fileURLToPath(
          new URL("./src/lib/session.cloudflare.ts", import.meta.url)
        ),
      },
      {
        find: "@/lib/password-reset-email",
        replacement: fileURLToPath(
          new URL("./src/lib/password-reset-email.cloudflare.ts", import.meta.url)
        ),
      },
      {
        find: /^@\/lib\/cashfree$/,
        replacement: fileURLToPath(
          new URL("./src/lib/cashfree.cloudflare.ts", import.meta.url)
        ),
      },
      {
        find: "@/lib/business-kyc-secret",
        replacement: fileURLToPath(
          new URL("./src/lib/business-kyc-secret.cloudflare.ts", import.meta.url)
        ),
      },
    ],
  },
  plugins: [
    vinext({ appDir }),
    cloudflare({
      ...(standaloneWorkerConfig ? { config: standaloneWorkerConfig } : {}),
      viteEnvironment: {
        name: "rsc",
        childEnvironments: ["ssr"],
      },
    }),
  ],
});
