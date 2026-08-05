import { createAdminClient } from "@/lib/supabase/admin";

// Shiprocket auth is email/password -> bearer token (not a static API key like
// PayU/Razorpay). Tokens last ~10 days; we cache the token + its expiry in
// delivery_partners.config (server-only, never sent to the client) instead of
// re-logging-in on every call.
const BASE_URL = "https://apiv2.shiprocket.in/v1/external";

export function isShiprocketConfigured(): boolean {
  return Boolean(process.env.SHIPROCKET_EMAIL && process.env.SHIPROCKET_PASSWORD);
}

type PartnerConfig = { token?: string; expires_at?: string };

async function getToken(): Promise<string> {
  const admin = createAdminClient();
  const { data: partner } = await admin
    .from("delivery_partners")
    .select("id, config")
    .eq("code", "shiprocket")
    .single();
  const config = (partner?.config as PartnerConfig) ?? {};

  if (config.token && config.expires_at && new Date(config.expires_at) > new Date()) {
    return config.token;
  }

  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: process.env.SHIPROCKET_EMAIL,
      password: process.env.SHIPROCKET_PASSWORD,
    }),
  });
  if (!res.ok) throw new Error(`Shiprocket login failed: ${res.status}`);
  const body = (await res.json()) as { token: string };

  // Token is valid ~10 days; refresh a day early to be safe.
  const expiresAt = new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString();
  if (partner) {
    await admin
      .from("delivery_partners")
      .update({ config: { token: body.token, expires_at: expiresAt } })
      .eq("id", partner.id);
  }
  return body.token;
}

async function authedFetch(path: string, init: RequestInit, retried = false): Promise<Response> {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { ...init.headers, Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
  if (res.status === 401 && !retried) {
    // Token may have been invalidated server-side; force a fresh login once.
    const admin = createAdminClient();
    await admin.from("delivery_partners").update({ config: {} }).eq("code", "shiprocket");
    return authedFetch(path, init, true);
  }
  return res;
}

export type AddPickupInput = {
  pickupLocation: string; // unique nickname, e.g. "sbx-<sellerId prefix>"
  name: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
};

// Registers a new pickup address under our single Shiprocket account. Called
// once per seller (from savePickupAddress) -- Shiprocket has no concept of
// per-seller sub-accounts, so every seller's address lives as a distinct
// named pickup location on our one account instead.
export async function addPickupLocation(input: AddPickupInput): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await authedFetch("/settings/company/addpickup", {
    method: "POST",
    body: JSON.stringify({
      pickup_location: input.pickupLocation,
      name: input.name,
      email: input.email,
      phone: input.phone,
      address: input.addressLine1,
      address_2: input.addressLine2 ?? "",
      city: input.city,
      state: input.state,
      country: "India",
      pin_code: input.pincode,
    }),
  });
  if (!res.ok) return { ok: false, error: await res.text() };
  return { ok: true };
}

export type ShiprocketOrderItem = {
  name: string;
  units: number;
  selling_price: number;
};

export type CreateOrderInput = {
  orderId: string; // must be unique per Shiprocket call -- suffix with seller id
  orderDate: string; // "YYYY-MM-DD HH:mm"
  pickupLocation: string; // seller's registered pickup nickname (see addPickupLocation)
  billingName: string;
  billingAddress: string;
  billingCity: string;
  billingState: string;
  billingPincode: string;
  billingPhone: string;
  billingEmail: string;
  items: ShiprocketOrderItem[];
  subTotal: number;
  weightKg: number;
  lengthCm: number;
  breadthCm: number;
  heightCm: number;
};

export type ShiprocketOrderResult = {
  order_id: number;
  shipment_id: number;
  status: string;
};

export async function createShiprocketOrder(input: CreateOrderInput): Promise<ShiprocketOrderResult> {
  const res = await authedFetch("/orders/create/adhoc", {
    method: "POST",
    body: JSON.stringify({
      order_id: input.orderId,
      order_date: input.orderDate,
      pickup_location: input.pickupLocation,
      billing_customer_name: input.billingName,
      billing_last_name: "",
      billing_address: input.billingAddress,
      billing_city: input.billingCity,
      billing_pincode: input.billingPincode,
      billing_state: input.billingState,
      billing_country: "India",
      billing_email: input.billingEmail,
      billing_phone: input.billingPhone,
      shipping_is_billing: true,
      order_items: input.items.map((i) => ({ name: i.name, units: i.units, selling_price: i.selling_price })),
      payment_method: "Prepaid", // already captured via PayU
      sub_total: input.subTotal,
      length: input.lengthCm,
      breadth: input.breadthCm,
      height: input.heightCm,
      weight: input.weightKg,
    }),
  });
  if (!res.ok) throw new Error(`Shiprocket create order failed: ${res.status} ${await res.text()}`);
  return res.json();
}

export type AssignAwbResult = {
  awb_code: string;
  courier_name: string;
};

// No courier_id -> Shiprocket auto-assigns its recommended (cheapest/fastest) courier.
export async function assignAwb(shipmentId: number): Promise<AssignAwbResult> {
  const res = await authedFetch("/courier/assign/awb", {
    method: "POST",
    body: JSON.stringify({ shipment_id: shipmentId }),
  });
  if (!res.ok) throw new Error(`Shiprocket AWB assign failed: ${res.status} ${await res.text()}`);
  const body = await res.json();
  const data = body.response?.data ?? body.data ?? body;
  return { awb_code: data.awb_code, courier_name: data.courier_name };
}

export async function generateLabel(shipmentId: number): Promise<string | null> {
  const res = await authedFetch("/courier/generate/label", {
    method: "POST",
    body: JSON.stringify({ shipment_id: [shipmentId] }),
  });
  if (!res.ok) throw new Error(`Shiprocket label generation failed: ${res.status} ${await res.text()}`);
  const body = await res.json();
  return body.label_url ?? null;
}

export async function trackByAwb(awb: string): Promise<{ current_status: string } | null> {
  const res = await authedFetch(`/courier/track/awb/${awb}`, { method: "GET" });
  if (!res.ok) return null;
  const body = await res.json();
  const tracking = body.tracking_data;
  if (!tracking?.shipment_track?.[0]) return null;
  return { current_status: tracking.shipment_track[0].current_status };
}
