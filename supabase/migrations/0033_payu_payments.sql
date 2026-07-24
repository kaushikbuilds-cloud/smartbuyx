-- Switch checkout from Razorpay to PayU. Razorpay columns are kept (nullable,
-- unused going forward) rather than dropped -- non-destructive, and
-- src/components/billing/subscribe-button.tsx still uses Razorpay for plan
-- subscriptions (out of scope for this change; flagged separately).
alter table payments
  add column if not exists payu_txnid text unique,
  add column if not exists payu_mihpayid text unique,
  add column if not exists payu_mode text;
