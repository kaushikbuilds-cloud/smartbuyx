// Delhivery Express API. Unlike Shiprocket, Delhivery isn't self-serve --
// getting an API token requires emailing Delhivery (Vendordesk@delhivery.com
// or a BD/CS contact); a sandbox token comes first, a production token after
// UAT. Endpoints below are sourced from Delhivery's official docs
// (delhivery-express-api-doc.readme.io) as of integration time; their public
// docs don't fully specify every response field, so double-check against a
// real sandbox response once a token is available -- same caution as the
// PayU hash formula, which also needed real-response verification.
//
// Auth: `Authorization: Token <API_TOKEN>` header (Django REST Framework
// TokenAuthentication convention, which Delhivery's docs describe using).
const BASE_URL =
  process.env.DELHIVERY_MODE === "production"
    ? "https://track.delhivery.com"
    : "https://staging-express.delhivery.com";

export function isDelhiveryConfigured(): boolean {
  return Boolean(process.env.DELHIVERY_API_TOKEN && process.env.DELHIVERY_CLIENT_NAME);
}

function authHeaders(extra?: Record<string, string>) {
  return {
    Authorization: `Token ${process.env.DELHIVERY_API_TOKEN}`,
    Accept: "application/json",
    ...extra,
  };
}

export async function checkPincodeServiceable(pincode: string): Promise<boolean> {
  const res = await fetch(`${BASE_URL}/c/api/pin-codes/json/?filter_codes=${pincode}`, { headers: authHeaders() });
  if (!res.ok) return true; // fail open -- don't block booking over a serviceability-check hiccup
  const body = await res.json();
  const rows = body?.delivery_codes ?? [];
  return rows.length > 0;
}

export async function fetchWaybill(): Promise<string> {
  const res = await fetch(
    `${BASE_URL}/waybill/api/fetch/json/?cl=${encodeURIComponent(process.env.DELHIVERY_CLIENT_NAME!)}`,
    { headers: authHeaders() }
  );
  if (!res.ok) throw new Error(`Delhivery fetch-waybill failed: ${res.status} ${await res.text()}`);
  const text = (await res.text()).trim().replace(/^"|"$/g, "");
  if (!text) throw new Error("Delhivery returned an empty waybill.");
  return text;
}

export type CreateWarehouseInput = {
  name: string; // unique per client, used as `pickup_location` on order creation
  registeredName: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
};

export async function createWarehouse(input: CreateWarehouseInput): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await fetch(`${BASE_URL}/api/backend/clientwarehouse/create/`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      name: input.name,
      registered_name: input.registeredName,
      address: input.address,
      city: input.city,
      state: input.state,
      pin: input.pincode,
      phone: input.phone,
      email: input.email,
    }),
  });
  if (!res.ok) return { ok: false, error: await res.text() };
  return { ok: true };
}

export type CreateOrderInput = {
  waybill: string;
  orderId: string;
  pickupLocation: string;
  paymentMode: "Prepaid" | "COD";
  consigneeName: string;
  consigneeAddress: string;
  consigneeCity: string;
  consigneeState: string;
  consigneePincode: string;
  consigneePhone: string;
  productsDesc: string;
  subTotal: number;
  weightKg: number;
  lengthCm: number;
  breadthCm: number;
  heightCm: number;
};

export type CreateOrderResult = { success: boolean; waybill: string; raw: unknown };

// Delhivery's order-creation endpoint takes form-encoded body with the real
// payload JSON-stringified into a `data` field (documented quirk, not a
// typical JSON POST body).
export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  const shipment = {
    waybill: input.waybill,
    order: input.orderId,
    payment_mode: input.paymentMode,
    name: input.consigneeName,
    add: input.consigneeAddress,
    city: input.consigneeCity,
    state: input.consigneeState,
    pin: input.consigneePincode,
    phone: input.consigneePhone,
    products_desc: input.productsDesc,
    order_date: new Date().toISOString().slice(0, 10),
    total_amount: input.subTotal,
    weight: input.weightKg,
    shipment_length: input.lengthCm,
    shipment_width: input.breadthCm,
    shipment_height: input.heightCm,
  };
  const payload = {
    shipments: [shipment],
    pickup_location: { name: input.pickupLocation },
  };

  const body = new URLSearchParams({ format: "json", data: JSON.stringify(payload) });
  const res = await fetch(`${BASE_URL}/api/cmu/create.json`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/x-www-form-urlencoded" }),
    body: body.toString(),
  });
  if (!res.ok) throw new Error(`Delhivery order creation failed: ${res.status} ${await res.text()}`);
  const raw = await res.json();
  const packageResult = raw?.packages?.[0];
  if (!packageResult || packageResult.status !== "Success") {
    throw new Error(`Delhivery rejected the order: ${JSON.stringify(packageResult ?? raw)}`);
  }
  return { success: true, waybill: packageResult.waybill ?? input.waybill, raw };
}

export async function createPickupRequest(input: { warehouseName: string; pickupDate: string; pickupTime: string; count: number }): Promise<void> {
  await fetch(`${BASE_URL}/fm/request/new/`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      pickup_location: input.warehouseName,
      pickup_date: input.pickupDate,
      pickup_time: input.pickupTime,
      expected_package_count: input.count,
    }),
  }).catch(() => null); // best-effort -- a missed pickup request doesn't block the booking itself
}

export async function trackByWaybill(waybill: string): Promise<{ status: string } | null> {
  const res = await fetch(`${BASE_URL}/api/v1/packages/json/?waybill=${waybill}&verbose=1`, { headers: authHeaders() });
  if (!res.ok) return null;
  const body = await res.json();
  const status = body?.ShipmentData?.[0]?.Shipment?.Status?.Status;
  if (!status) return null;
  return { status };
}
