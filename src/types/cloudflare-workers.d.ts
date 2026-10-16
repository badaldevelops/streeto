declare module "cloudflare:workers" {
  export const env: {
    SESSION_SECRET: string;
    CASHFREE_APP_ID?: string;
    CASHFREE_SECRET_KEY?: string;
    CASHFREE_MODE?: string;
    BREVO_API_KEY?: string;
    BUSINESS_KYC_ENCRYPTION_KEY?: string;
    HYPERDRIVE: { connectionString: string };
    PASSWORD_RESET_FROM?: string;
  };
}
