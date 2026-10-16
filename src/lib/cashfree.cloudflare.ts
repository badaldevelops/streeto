import { env } from "cloudflare:workers";
import {
  type CashfreeConfig,
  createCashfreeOrder,
  getCashfreeVendor,
  getCashfreeOrder,
  saveCashfreeVendor,
  verifyCashfreeWebhook,
} from "./cashfree-core";

function getConfig(): CashfreeConfig | null {
  if (!env.CASHFREE_APP_ID || !env.CASHFREE_SECRET_KEY) return null;
  return {
    appId: env.CASHFREE_APP_ID,
    secretKey: env.CASHFREE_SECRET_KEY,
    mode: env.CASHFREE_MODE === "production" ? "production" : "sandbox",
  };
}

export function getCashfreeConfig() {
  return getConfig();
}

export function getCashfreeMode() {
  return getConfig()?.mode ?? null;
}

export async function startCashfreeOrder(input: Parameters<typeof createCashfreeOrder>[1]) {
  const config = getConfig();
  if (!config) throw new Error("Cashfree credentials are not configured.");
  return createCashfreeOrder(config, input);
}

export async function fetchCashfreeOrder(orderId: string) {
  const config = getConfig();
  if (!config) throw new Error("Cashfree credentials are not configured.");
  return getCashfreeOrder(config, orderId);
}

export async function validateCashfreeWebhook(
  rawBody: string,
  timestamp: string,
  signature: string
) {
  const config = getConfig();
  if (!config) throw new Error("Cashfree credentials are not configured.");
  return verifyCashfreeWebhook(config.secretKey, rawBody, timestamp, signature);
}

export async function registerCashfreeVendor(
  input: Parameters<typeof saveCashfreeVendor>[1]
) {
  const config = getConfig();
  if (!config) throw new Error("Cashfree credentials are not configured.");
  return saveCashfreeVendor(config, input);
}

export async function fetchCashfreeVendor(vendorId: string) {
  const config = getConfig();
  if (!config) throw new Error("Cashfree credentials are not configured.");
  return getCashfreeVendor(config, vendorId);
}
