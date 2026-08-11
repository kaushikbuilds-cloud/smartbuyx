-- Fastrr Checkout (Shiprocket's checkout product) replaces PayU as the
-- active checkout path. Unlike PayU, Fastrr owns the entire checkout UI --
-- we never create our own `orders` row until their order-webhook confirms
-- payment, so there's a staging table to hold the cart/coupon/address
-- snapshot between "user clicked pay" and "Fastrr confirmed the order".
--
-- Fastrr's order webhook has no field identifying which of our users placed
-- the order (see fastrr/order-webhook route for the matching heuristic this
-- necessitates) -- `session_ref` set on `orders` records which staging row
-- (if any) was matched, for auditability.
create table fastrr_checkout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  address_id uuid references addresses(id),
  coupon_id uuid references coupons(id),
  coupon_code text,
  discount numeric(12,2) not null default 0,
  subtotal numeric(12,2) not null,
  total numeric(12,2) not null,
  cart_snapshot jsonb not null, -- [{variant_id, quantity, unit_price, title, supplier_id}]
  status text not null default 'initiated', -- initiated | completed | expired
  fastrr_order_id text,
  created_at timestamptz not null default now()
);
create index on fastrr_checkout_sessions (user_id, status);

alter table fastrr_checkout_sessions enable row level security;
create policy "fastrr_checkout_sessions owner read" on fastrr_checkout_sessions for select using (
  user_id = auth.uid() or public.is_admin()
);

alter table orders
  add column if not exists fastrr_order_id text unique,
  add column if not exists session_ref uuid references fastrr_checkout_sessions(id);
