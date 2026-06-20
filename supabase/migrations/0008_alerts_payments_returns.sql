-- SmartBuyX — Price Alerts, saved payment methods (UPI), returns/refunds.

-- ============== PRICE ALERTS ==============
create table if not exists price_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  target_price numeric(12,2) not null check (target_price > 0),
  active boolean not null default true,
  triggered_at timestamptz,
  notified_at timestamptz,
  created_at timestamptz not null default now(),
  unique(user_id, product_id)
);
alter table price_alerts enable row level security;
create policy "alerts owner" on price_alerts for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create index if not exists price_alerts_active_idx on price_alerts (product_id) where active and triggered_at is null;

-- Auto-trigger an alert when a product's base_price drops at/below target.
create or replace function public.evaluate_price_alerts_for_product()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update price_alerts
     set triggered_at = now()
   where product_id = new.id
     and active
     and triggered_at is null
     and new.base_price <= target_price;

  insert into notifications (user_id, kind, payload)
  select a.user_id, 'price.drop', jsonb_build_object(
    'product_id', new.id, 'title', new.title, 'price', new.base_price, 'target', a.target_price
  )
   from price_alerts a
  where a.product_id = new.id
    and a.active
    and a.triggered_at = now()
    and a.notified_at is null;

  update price_alerts set notified_at = now()
   where product_id = new.id and triggered_at = now() and notified_at is null;

  return new;
end; $$;

drop trigger if exists on_product_price_change on products;
create trigger on_product_price_change
after update of base_price on products
for each row when (old.base_price is distinct from new.base_price)
execute function public.evaluate_price_alerts_for_product();

-- ============== SAVED PAYMENT METHODS (UPI) ==============
-- We don't store cards (PCI). UPI IDs are safe to save by user choice.
create type payment_method_kind as enum ('upi', 'cod', 'card_token');

create table if not exists payment_methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  kind payment_method_kind not null,
  label text,                                -- "GPay", "Personal"
  upi_id text,                               -- when kind = 'upi'
  razorpay_token text,                       -- when kind = 'card_token' (future)
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
alter table payment_methods enable row level security;
create policy "payment_methods owner" on payment_methods for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create index if not exists payment_methods_user_idx on payment_methods (user_id);

-- ============== RETURNS & REFUNDS ==============
create type return_status as enum ('requested','approved','rejected','pickup_scheduled','picked_up','refunded','cancelled');
create type return_reason as enum ('damaged','wrong_item','not_as_described','size_fit','no_longer_needed','better_price','other');

create table if not exists return_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  order_id uuid not null references orders(id) on delete cascade,
  order_item_id uuid not null references order_items(id) on delete cascade,
  reason return_reason not null,
  notes text,
  status return_status not null default 'requested',
  amount numeric(12,2) not null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);
alter table return_requests enable row level security;
create policy "returns owner" on return_requests for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create index if not exists returns_user_idx on return_requests (user_id, created_at desc);

-- Window: only delivered orders within 7 days can be returned (enforced in app code too).
-- Refund flow: on status -> 'refunded', credit wallet with the amount.
create or replace function public.handle_return_refund()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'refunded' and (old.status is null or old.status <> 'refunded') then
    perform public.credit_wallet(new.user_id, new.amount, 'refund', new.id::text);
    new.resolved_at = now();
  end if;
  return new;
end; $$;

drop trigger if exists on_return_status_change on return_requests;
create trigger on_return_status_change
before update of status on return_requests
for each row execute function public.handle_return_refund();
