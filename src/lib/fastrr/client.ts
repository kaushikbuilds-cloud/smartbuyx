import crypto from "crypto";

// Fastrr Checkout (Shiprocket's checkout product). Unlike PayU/Delhivery,
// Fastrr owns the entire checkout UI/flow -- our app's payment integration
// (checkout-actions.ts, payu-result.ts) is bypassed entirely for orders that
// go through this. Source: "SR Checkout Integration Guide for Custom
// Websites" (provided directly by Shiprocket, not public docs).
const BASE_URL = "https://checkout-api.shiprocket.com";

export function isFastrrConfigured(): boolean {
  return Boolean(process.env.FASTRR_API_KEY && process.env.FASTRR_SECRET_KEY);
}

// "X-Api-HMAC-SHA256: HMAC SHA256 in Base64, calculated using the entire
// request payload and your API Secret Key" -- guide's exact wording.
function hmac(body: string): string {
  return crypto.createHmac("sha256", process.env.FASTRR_SECRET_KEY!).update(body).digest("base64");
}

async function signedFetch(path: string, body: unknown): Promise<Response> {
  const payload = JSON.stringify(body);
  return fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // The guide's prose says "Bearer <key>" but its own working curl
      // example shows the raw key with no prefix -- following the concrete
      // example over the summary text (same class of contradiction that
      // caused the original PayU hash bug).
      "X-Api-Key": process.env.FASTRR_API_KEY!,
      "X-Api-HMAC-SHA256": hmac(payload),
    },
    body: payload,
  });
}

export type CartItem = { variant_id: string; quantity: number };

export type AccessTokenResult = { token: string; raw: unknown };

// Called at checkout time -- the returned token drives Fastrr's checkout
// iframe (see HeadlessCheckout.addToCart in the button script). redirectUrl
// should carry a correlation reference (query param) since Fastrr's order
// webhook has no field identifying which of our users placed the order --
// Fastrr owns the cart, we only find out who via this round-trip.
export async function generateAccessToken(items: CartItem[], redirectUrl: string): Promise<AccessTokenResult> {
  const res = await signedFetch("/api/v1/access-token/checkout", {
    cart_data: { items },
    redirect_url: redirectUrl,
    timestamp: new Date().toISOString(),
  });
  if (!res.ok) throw new Error(`Fastrr access-token failed: ${res.status} ${await res.text()}`);
  const raw = await res.json();
  const token = raw?.result?.token;
  if (!token) throw new Error(`Fastrr access-token response missing token: ${JSON.stringify(raw)}`);
  return { token, raw };
}

export type FastrrOrderDetails = {
  order_id: string;
  status: string;
  phone: string;
  email: string;
  payment_type: string;
  total_amount_payable: number;
  cart_data: { items: CartItem[] };
};

// Used to independently re-confirm an order server-to-server before trusting
// it -- the order webhook Fastrr sends us (see fastrr/order-webhook route)
// has no visible signature/HMAC in the guide's example, so it alone isn't
// trustworthy the way PayU's hash-verified callback was.
export async function fetchOrderDetails(orderId: string): Promise<FastrrOrderDetails> {
  const res = await signedFetch("/api/v1/custom-platform-order/details", {
    order_id: orderId,
    timestamp: new Date().toISOString(),
  });
  if (!res.ok) throw new Error(`Fastrr order-details failed: ${res.status} ${await res.text()}`);
  return res.json();
}

// Push-on-change sync -- call whenever a product/collection is created or
// updated so Fastrr's catalog copy doesn't drift from ours. Logs (rather than
// silently swallows) a non-2xx response -- their `id`/`variant_id` fields
// are shown as numeric in the guide's example, so a UUID-based id here is a
// real candidate for silent rejection on their side.
export async function pushProductUpdate(product: unknown): Promise<void> {
  try {
    const res = await signedFetch("/wh/v1/custom/product", product);
    if (!res.ok) console.error("[fastrr] product push rejected", { status: res.status, body: await res.text() });
  } catch (e) {
    console.error("[fastrr] product push failed", e instanceof Error ? e.message : e);
  }
}

export async function pushCollectionUpdate(collection: unknown): Promise<void> {
  try {
    const res = await signedFetch("/wh/v1/custom/collection", collection);
    if (!res.ok) console.error("[fastrr] collection push rejected", { status: res.status, body: await res.text() });
  } catch (e) {
    console.error("[fastrr] collection push failed", e instanceof Error ? e.message : e);
  }
}
