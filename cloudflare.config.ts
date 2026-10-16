import { bindings, defineConfig, defineWorker } from "cf/config";

// Create a Hyperdrive configuration in Cloudflare and replace this placeholder ID.
const hyperdriveId = "1b8accc75e0b448c9e52d7f286a252c4";
export default defineConfig({
  worker: defineWorker({
    name: "streeto",
    domains: ["qtoo.in", "www.qtoo.in"],
    workersDev: true,
    previewUrls: true,
    entrypoint: "vinext/server/fetch-handler",
    compatibilityDate: "2026-09-25",
    compatibilityFlags: ["nodejs_compat"],
    observability: {
      enabled: true,
      logs: { enabled: true },
    },
    assets: { notFoundHandling: "none" },
    env: {
      ASSETS: bindings.assets(),
      SESSION_SECRET: bindings.secret(),
      VAPID_PRIVATE_KEY: bindings.secret(),
      CASHFREE_APP_ID: bindings.secret(),
      CASHFREE_SECRET_KEY: bindings.secret(),
      BREVO_API_KEY: bindings.secret(),
      BUSINESS_KYC_ENCRYPTION_KEY: bindings.secret(),
      CASHFREE_MODE: bindings.text("production"),
      PASSWORD_RESET_FROM: bindings.text("no-reply@mail.qtoo.in"),
      HYPERDRIVE: bindings.hyperdrive({ id: hyperdriveId }),
    },
  }),
});
