-- Switch plan/subscription billing from Razorpay to PayU (order checkout
-- already made this switch -- see 0033/checkout-actions.ts). Subscriptions
-- have no order_id to hang a `payments` row off of, so a small parallel
-- table tracks plan-checkout PayU sessions the same way `payments` does for
-- orders.
create table plan_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  plan_id uuid not null references plans(id),
  payu_txnid text unique,
  payu_mihpayid text,
  payu_mode text,
  amount numeric(10,2) not null,
  status payment_status not null default 'created',
  raw jsonb,
  created_at timestamptz not null default now()
);
create index on plan_payments (user_id);

alter table plan_payments enable row level security;
-- Read-only for the owner (to poll status); all writes go through the admin
-- client from server actions, same convention as `subscriptions` itself.
create policy "plan_payments owner read" on plan_payments for select using (
  user_id = auth.uid() or public.is_admin()
);

alter table subscriptions
  add column if not exists payu_txnid text;
