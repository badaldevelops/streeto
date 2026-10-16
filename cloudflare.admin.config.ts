import { bindings, defineConfig, defineWorker } from "cf/config";

export default defineConfig({
  worker: defineWorker({
    name: "streeto-admin",
    domains: ["admin.qtoo.in"],
    workersDev: true,
    previewUrls: true,
    entrypoint: "vinext/server/fetch-handler",
    compatibilityDate: "2026-09-25",
    compatibilityFlags: ["nodejs_compat"],
    observability: { enabled: true, logs: { enabled: true } },
    assets: { notFoundHandling: "none" },
    env: { ASSETS: bindings.assets() },
  }),
});
