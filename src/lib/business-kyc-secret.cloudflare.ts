import { env } from "cloudflare:workers";

export function getBusinessKycEncryptionSecret() {
  return env.BUSINESS_KYC_ENCRYPTION_KEY || "";
}
