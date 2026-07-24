import crypto from "crypto";

// PayU hosted checkout. Formulas per PayU's official docs
// (docs.payu.in/docs/generate-hash-payu-hosted). Built by joining an array
// that mirrors PayU's documented segment list exactly (not a hand-collapsed
// run of pipe characters) -- a wrong segment count silently produces a hash
// mismatch with no useful error back from PayU, so this is the one place in
// the integration where "looks about right" isn't good enough.
//
// Official templates (docs.payu.in/docs/generate-hash-payu-hosted):
//   request:  key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT
//   response: SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key
// Verified by splitting both literal strings on "|" -- request has 17
// segments (5 empty reserved before SALT), response has 18 segments (5
// empty reserved before udf5).

export function isPayuConfigured(): boolean {
  return Boolean(process.env.PAYU_MERCHANT_KEY && process.env.PAYU_MERCHANT_SALT);
}

export function payuBaseUrl(): string {
  return process.env.PAYU_MODE === "production" ? "https://secure.payu.in/_payment" : "https://test.payu.in/_payment";
}

export type PayuFields = {
  key: string;
  txnid: string;
  amount: string; // exact string used in the hash AND the form -- must match byte-for-byte
  productinfo: string;
  firstname: string;
  email: string;
};

// udf1-5 always empty for us.
const EMPTY_UDFS = ["", "", "", "", ""];
const RESERVED = ["", "", "", "", ""]; // 5 reserved empty segments, confirmed by splitting PayU's literal template on "|"

export function generatePayuRequestHash(f: PayuFields): string {
  const salt = process.env.PAYU_MERCHANT_SALT!;
  const segments = [f.key, f.txnid, f.amount, f.productinfo, f.firstname, f.email, ...EMPTY_UDFS, ...RESERVED, salt];
  return crypto.createHash("sha512").update(segments.join("|")).digest("hex");
}

export function verifyPayuResponseHash(params: {
  key: string;
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  status: string;
  hash: string;
}): boolean {
  const salt = process.env.PAYU_MERCHANT_SALT!;
  const segments = [
    salt, params.status, ...RESERVED, ...EMPTY_UDFS,
    params.email, params.firstname, params.productinfo, params.amount, params.txnid, params.key,
  ];
  const expected = crypto.createHash("sha512").update(segments.join("|")).digest("hex");
  return safeEqual(expected, params.hash);
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

// Deterministic, alphanumeric-only txnid derived from the order id (PayU
// requires alphanumeric txnid, no hyphens) -- also makes it easy to trace an
// order back from PayU's dashboard.
export function txnidForOrder(orderId: string): string {
  return `sbx${orderId.replace(/-/g, "").slice(0, 20)}`;
}
