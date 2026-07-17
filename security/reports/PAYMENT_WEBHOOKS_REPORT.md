# Payment Webhooks Security Report

## Status: PASS (1 low-severity product gap noted, not a security issue)

## Findings

This app uses Razorpay, not Stripe — adapted the audit's checks to Razorpay's equivalent mechanism (HMAC-SHA256 webhook signatures rather than Stripe's signing scheme).

- `verifyWebhookSignature` (`lib/razorpay/verify.ts`) computes `HMAC-SHA256(rawBody, RAZORPAY_WEBHOOK_SECRET)` and compares against the `x-razorpay-signature` header using `crypto.timingSafeEqual` (not `===`, which would be vulnerable to a timing side-channel) — checked byte-length first to avoid `timingSafeEqual` throwing on mismatched lengths, which is the correct pattern.
- The webhook route (`api/razorpay/webhook/route.ts`) verifies the signature as the very first thing, before any parsing or processing, and returns `400` on failure — no event data is trusted until the signature checks out.
- **Idempotency is handled at the state-change layer, not just the event layer**: rather than tracking processed event IDs in a table, `fulfilPaidOrder` (shared by both the webhook and the client-side success callback) does an atomic `update ... where status = 'pending'` claim — only the first caller to flip `pending -> paid` proceeds with fulfilment; every subsequent call (webhook retry, client callback racing the webhook, or a replayed payload) is a safe no-op. This is arguably more robust than an event-ID table, since it makes the actual side effect idempotent rather than relying on remembering which event IDs were seen.
- The checkout-success signature (`verifyPaymentSignature`, used for the client callback) uses the same HMAC + timing-safe comparison pattern.

**Minor gap, not a security issue:** the webhook only handles `payment.captured`/`order.paid`. There's no explicit handler for failed-payment events. This doesn't create a vulnerability — an order that never gets paid simply stays `pending` forever, which grants no goods/services and isn't exploitable — but it does mean there's no webhook-driven visibility into *why* a payment failed (only successful payments are ever recorded via webhook; failures are invisible unless the client-side callback happens to report one).

## What's at risk

Nothing found from a security standpoint.

## What's already secure

Signature verification, idempotency, and timing-safe comparison are all correctly implemented — this is one of the stronger-audited areas of the codebase.

## Recommendations

1. (Low priority, product visibility not security) Consider handling `payment.failed` in the webhook to record failed attempts for analytics/support purposes. Not required for security.
