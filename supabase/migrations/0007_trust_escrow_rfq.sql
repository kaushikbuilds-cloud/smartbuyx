-- SmartBuyX — Trust Score, Escrow Payments, One-Click RFQ.

-- ============== SUPPLIER VERIFICATION & RESPONSE ==============
alter table supplier_profiles
  add column if not exists gstin_verified boolean not null default false,
  add column if not exists gstin_verified_at timestamptz,
  add column if not exists verified_business boolean not null default false,
  add column if not exists business_started_on date,
  add column if not exists trust_score int not null default 0,
  add column if not exists trust_score_updated_at timestamptz,
  add column if not exists avg_response_minutes int;

-- Response tracking on RFQ quotes (already exists in 0001). Recompute response rate here.
-- ============== TRUST SCORE ==============
-- Composite 0–100 score: GST(25) + business age(15) + orders(20) + reviews(25) + responsiveness(15).
create or replace function public.compute_trust_score(p_supplier uuid)
returns int language plpgsql stable security definer set search_path = public as $$
declare
  gst_pts int := 0;
  age_pts int := 0;
  order_pts int := 0;
  review_pts int := 0;
  resp_pts int := 0;
  sp supplier_profiles;
  prof profiles;
  age_years numeric;
  orders_cnt int;
  rating numeric;
  rating_n int;
  resp_min int;
begin
  select * into sp from supplier_profiles where user_id = p_supplier;
  select * into prof from profiles where id = p_supplier;
  if not found then return 0; end if;

  -- 1) GST verified (25)
  if sp.gstin_verified then gst_pts := 25; end if;

  -- 2) Business age (15) — 5 pts/year, capped
  if sp.business_started_on is not null then
    age_years := extract(epoch from (now() - sp.business_started_on)) / (365.25 * 86400);
    age_pts := least(15, floor(age_years * 5))::int;
  end if;

  -- 3) Order history (20) — log curve; 50 orders ~ full marks
  select count(distinct o.id) into orders_cnt
    from orders o join order_items oi on oi.order_id = o.id
   where oi.supplier_id = p_supplier and o.status in ('paid','processing','shipped','delivered');
  order_pts := least(20, floor(20 * ln(1 + coalesce(orders_cnt,0)) / ln(51)))::int;

  -- 4) Customer reviews (25) — uses supplier rating
  rating := coalesce(sp.rating_avg, 0);
  rating_n := coalesce(sp.rating_count, 0);
  if rating_n >= 3 then
    review_pts := floor(25 * (rating / 5.0))::int;
  elsif rating_n > 0 then
    review_pts := floor(25 * (rating / 5.0) * (rating_n / 3.0))::int;
  end if;

  -- 5) Responsiveness (15) — quotes within 60 min = full marks
  resp_min := coalesce(sp.avg_response_minutes, 9999);
  if resp_min <= 60 then resp_pts := 15;
  elsif resp_min <= 240 then resp_pts := 10;
  elsif resp_min <= 1440 then resp_pts := 5;
  else resp_pts := 0; end if;

  return gst_pts + age_pts + order_pts + review_pts + resp_pts;
end; $$;

create or replace function public.recompute_trust_score(p_supplier uuid)
returns void language plpgsql security definer set search_path = public as $$
declare s int; begin
  s := public.compute_trust_score(p_supplier);
  update supplier_profiles
    set trust_score = s, trust_score_updated_at = now()
    where user_id = p_supplier;
end; $$;

-- ============== ESCROW PAYMENTS ==============
-- Funds are captured at checkout (Razorpay), then HELD in an escrow ledger
-- until buyer confirms delivery (or auto-releases after grace period).

create type escrow_status as enum ('held','released','refunded','disputed');

create table escrow_holds (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  seller_id uuid not null references profiles(id),
  amount numeric(12,2) not null,
  status escrow_status not null default 'held',
  released_at timestamptz,
  auto_release_at timestamptz,            -- e.g. delivered_at + 7 days
  dispute_reason text,
  created_at timestamptz not null default now()
);
create index on escrow_holds (seller_id, status);
create index on escrow_holds (order_id);

alter table escrow_holds enable row level security;
create policy "escrow buyer & seller read" on escrow_holds for select using (
  seller_id = auth.uid()
  or exists(select 1 from orders o where o.id = order_id and o.buyer_id = auth.uid())
  or public.is_admin()
);
create policy "escrow admin write" on escrow_holds for all using (public.is_admin());

-- Release escrow to seller's wallet (called when buyer confirms delivery).
create or replace function public.release_escrow(p_order uuid, p_seller uuid)
returns void language plpgsql security definer set search_path = public as $$
declare h escrow_holds;
begin
  select * into h from escrow_holds
    where order_id = p_order and seller_id = p_seller and status = 'held'
    for update;
  if not found then return; end if;

  perform public.credit_wallet(p_seller, h.amount, 'credit', 'escrow:'||p_order);

  update escrow_holds set status = 'released', released_at = now() where id = h.id;
end; $$;

-- ============== ONE-CLICK RFQ EXTENSIONS ==============
-- Categories on RFQs + a junction table for which suppliers received it.
alter table rfqs
  add column if not exists categories text[] default '{}',
  add column if not exists pincodes text[] default '{}',
  add column if not exists target_supplier_count int default 0,
  add column if not exists attachments jsonb default '[]'::jsonb;

create table if not exists rfq_recipients (
  id uuid primary key default gen_random_uuid(),
  rfq_id uuid not null references rfqs(id) on delete cascade,
  supplier_id uuid not null references profiles(id) on delete cascade,
  notified_at timestamptz not null default now(),
  viewed_at timestamptz,
  unique(rfq_id, supplier_id)
);
create index on rfq_recipients (supplier_id, viewed_at);
alter table rfq_recipients enable row level security;
create policy "rfq recipients self" on rfq_recipients for select using (
  supplier_id = auth.uid()
  or exists(select 1 from rfqs r where r.id = rfq_id and r.buyer_id = auth.uid())
  or public.is_admin()
);
