export type CashfreeConfig = {
  appId: string;
  secretKey: string;
  mode: "sandbox" | "production";
};

const CASHFREE_API_VERSION = "2026-01-01";

export function cashfreeBaseUrl(mode: CashfreeConfig["mode"]) {
  return mode === "production"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";
}

function cashfreeHeaders(config: CashfreeConfig) {
  return {
    "x-client-id": config.appId,
    "x-client-secret": config.secretKey,
    "x-api-version": CASHFREE_API_VERSION,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

export function getCashfreeErrorMessage(payload: unknown) {
  if (payload && typeof payload === "object") {
    const details = payload as { message?: unknown; type?: unknown };
    if (typeof details.message === "string") return details.message;
    if (typeof details.type === "string") return details.type;
  }
  return "Cashfree could not process the payment request.";
}

export async function createCashfreeOrder(
  config: CashfreeConfig,
  input: {
    orderId: string;
    amount: number;
    customerId: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string | null;
    returnUrl: string;
    notifyUrl: string;
  }
) {
  const response = await fetch(`${cashfreeBaseUrl(config.mode)}/orders`, {
    method: "POST",
    headers: cashfreeHeaders(config),
    body: JSON.stringify({
      order_id: input.orderId,
      order_amount: input.amount,
      order_currency: "INR",
      customer_details: {
        customer_id: input.customerId.slice(0, 50),
        customer_name: input.customerName.slice(0, 100),
        customer_phone: input.customerPhone,
        ...(input.customerEmail ? { customer_email: input.customerEmail } : {}),
      },
      order_meta: {
        return_url: input.returnUrl,
        notify_url: input.notifyUrl,
      },
    }),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(getCashfreeErrorMessage(payload));
  }
  if (
    !payload ||
    typeof payload.payment_session_id !== "string" ||
    typeof payload.order_id !== "string"
  ) {
    throw new Error("Cashfree returned an incomplete payment session.");
  }
  return {
    orderId: payload.order_id as string,
    paymentSessionId: payload.payment_session_id as string,
  };
}

export async function saveCashfreeVendor(
  config: CashfreeConfig,
  input: {
    vendorId: string;
    name: string;
    email: string;
    phone: string;
    accountHolder: string;
    accountNumber: string;
    ifsc: string;
    pan: string;
    gst?: string;
    existingVendor: boolean;
  }
) {
  const endpoint = input.existingVendor
    ? `/easy-split/vendors/${encodeURIComponent(input.vendorId)}`
    : "/easy-split/vendors";
  const response = await fetch(`${cashfreeBaseUrl(config.mode)}${endpoint}`, {
    method: input.existingVendor ? "PATCH" : "POST",
    headers: cashfreeHeaders(config),
    body: JSON.stringify({
      vendor_id: input.vendorId,
      status: "ACTIVE",
      name: input.name,
      email: input.email,
      phone: input.phone,
      verify_account: true,
      dashboard_access: false,
      schedule_option: 1,
      bank: {
        account_number: input.accountNumber,
        account_holder: input.accountHolder,
        ifsc: input.ifsc,
      },
      kyc_details: {
        account_type: "BUSINESS",
        pan: input.pan,
        ...(input.gst ? { gst: input.gst } : {}),
      },
    }),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(getCashfreeErrorMessage(payload));
  return payload as { vendor_id?: string; status?: string };
}

export async function getCashfreeVendor(config: CashfreeConfig, vendorId: string) {
  const response = await fetch(
    `${cashfreeBaseUrl(config.mode)}/easy-split/vendors/${encodeURIComponent(vendorId)}`,
    { headers: cashfreeHeaders(config) }
  );
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(getCashfreeErrorMessage(payload));
  return payload as { vendor_id?: string; status?: string };
}

export async function getCashfreeOrder(config: CashfreeConfig, orderId: string) {
  const response = await fetch(
    `${cashfreeBaseUrl(config.mode)}/orders/${encodeURIComponent(orderId)}`,
    { headers: cashfreeHeaders(config) }
  );
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(getCashfreeErrorMessage(payload));
  }
  return payload as {
    order_id?: string;
    order_amount?: number;
    order_currency?: string;
    order_status?: string;
  };
}

export async function verifyCashfreeWebhook(
  secret: string,
  rawBody: string,
  timestamp: string,
  signature: string
) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signed = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(timestamp + rawBody)
  );
  const expected = btoa(String.fromCharCode(...new Uint8Array(signed)));
  const left = new TextEncoder().encode(expected);
  const right = new TextEncoder().encode(signature);
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left[index] ^ right[index];
  }
  return mismatch === 0;
}
