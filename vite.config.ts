import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import vinext from "vinext";
import { cloudflare } from "@cloudflare/vite-plugin";

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
    ],
  },
  plugins: [
    vinext(),
    cloudflare({
      viteEnvironment: {
        name: "rsc",
        childEnvironments: ["ssr"],
      },
    }),
  ],
});
