import type { CashfreeConfig } from "./cashfree-core";

const environmentPrefix = (mode: CashfreeConfig["mode"]) =>
  mode === "production" ? "live" : "test";

export function cashfreeVendorIdForOutlet(
  outletId: string,
  mode: CashfreeConfig["mode"]
) {
  return `qtoo_${environmentPrefix(mode)}_${outletId.replace(/[^a-zA-Z0-9_]/g, "")}`.slice(0, 45);
}

export function cashfreeVendorIdMatchesMode(
  vendorId: string | null | undefined,
  mode: CashfreeConfig["mode"]
) {
  return Boolean(vendorId?.startsWith(`qtoo_${environmentPrefix(mode)}_`));
}
