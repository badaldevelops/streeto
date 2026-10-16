export function getBusinessKycEncryptionSecret() {
  return process.env.BUSINESS_KYC_ENCRYPTION_KEY || "";
}
