import { bindings, defineConfig, defineWorker } from "cf/config";

// Create a Hyperdrive configuration in Cloudflare and replace this placeholder ID.
const hyperdriveId = "1b8accc75e0b448c9e52d7f286a252c4";

export default defineConfig({
  worker: defineWorker({
    name: "streeto",
    entrypoint: "vinext/server/fetch-handler",
    compatibilityDate: "2026-10-07",
    compatibilityFlags: ["nodejs_compat"],
    assets: { notFoundHandling: "none" },
    env: {
      ASSETS: bindings.assets(),
      SESSION_SECRET: bindings.secret(),
      HYPERDRIVE: bindings.hyperdrive({ id: hyperdriveId }),
    },
  }),
});
