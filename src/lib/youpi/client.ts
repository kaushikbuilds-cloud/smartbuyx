import crypto from "node:crypto";

// YouPI PG (self-hosted UPI/COD gateway). The merchant-facing checkout script
// is served by our own YouPI deployment (YOUPI_BASE_URL/youpi.js); payment
// confirmation reaches us as an HMAC-SHA256-signed webhook.
export function isYoupiConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_YOUPI_BASE_URL && process.env.NEXT_PUBLIC_YOUPI_PUBLIC_KEY && process.env.YOUPI_WEBHOOK_SECRET
  );
}

export function txnidForOrder(orderId: string): string {
  return `yp${orderId.replace(/-/g, "").slice(0, 20)}`;
}

// The signature covers the raw, unparsed request body -- callers must pass the
// exact bytes (req.text()) and only JSON.parse after this returns true.
export function verifyYoupiSignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.YOUPI_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) return false;
  const expected = "sha256=" + crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(signatureHeader);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
