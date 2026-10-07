declare module "cloudflare:workers" {
  export const env: {
    SESSION_SECRET: string;
    HYPERDRIVE: { connectionString: string };
  };
}
