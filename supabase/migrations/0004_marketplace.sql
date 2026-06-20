-- SmartBuyX — Phase 1: multi-vendor marketplace (Amazon/Flipkart flow)
-- Seller posts product → user buys → pays → order → (delivery held) → rate & review.

-- ============== SELLER HELPER ==============
create or replace function public.is_seller() returns boolean
language sql stable as $$ select public.jwt_role() in ('supplier','d2c_brand','admin','superadmin') $$;

-- ============== PRODUCT EXTENSIONS ==============
alter table products
  add column if not exists compare_at_price numeric(12,2),   -- strike-through MRP
  add column if not exists rating_avg numeric(3,2) not null default 0,
  add column if not exists rating_count int not null default 0,
  add column if not exists sales_count int not null default 0,
  add column if not exists is_featured boolean not null default false;

-- Simple full-text search vector over title/brand/description.
alter table products add column if not exists search_tsv tsvector
  generated always as (
    to_tsvector('simple',
      coalesce(title,'') || ' ' || coalesce(brand,'') || ' ' || coalesce(description,''))
  ) stored;
create index if not exists products_search_idx on products using gin (search_tsv);
create index if not exists products_kind_status_idx on products (kind, status);
create index if not exists products_featured_idx on products (is_featured) where is_featured;

-- Tighten write policy: only seller roles (owner) may create/manage their products.
drop policy if exists "products supplier write" on products;
create policy "products seller write" on products for all
  using ((supplier_id = auth.uid() and public.is_seller()) or public.is_admin())
  with check ((supplier_id = auth.uid() and public.is_seller()) or public.is_admin());

-- ============== REVIEW EXTENSIONS ==============
alter table reviews
  add column if not exists title text,
  add column if not exists order_item_id uuid references order_items(id) on delete set null,
  add column if not exists verified_purchase boolean not null default false,
  add column if not exists helpful_count int not null default 0;

-- One review per author per product target.
create unique index if not exists reviews_one_per_target
  on reviews (author_id, target_type, target_id);

-- Recompute product rating aggregates whenever a product review changes.
create or replace function public.recompute_product_rating()
returns trigger language plpgsql security definer set search_path = public as $$
declare tgt uuid;
begin
  tgt := coalesce(new.target_id, old.target_id);
  if coalesce(new.target_type, old.target_type) <> 'product' then
    return coalesce(new, old);
  end if;
  update products p set
    rating_count = sub.cnt,
    rating_avg = coalesce(sub.avg, 0)
  from (
    select count(*)::int cnt, round(avg(rating)::numeric, 2) avg
    from reviews where target_type = 'product' and target_id = tgt
  ) sub
  where p.id = tgt;
  return coalesce(new, old);
end; $$;

drop trigger if exists on_review_change on reviews;
create trigger on_review_change
after insert or update or delete on reviews
for each row execute function public.recompute_product_rating();

-- ============== DELIVERY (integration-ready, inert until partner chosen) ==============
create type shipment_status as enum (
  'pending','ready_to_ship','assigned','picked_up','in_transit','out_for_delivery','delivered','returned','cancelled'
);

create table delivery_partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique not null,                 -- 'shiprocket','delhivery','manual'
  active boolean not null default true,
  config jsonb default '{}'::jsonb,          -- api creds reference (server-side only)
  created_at timestamptz not null default now()
);

create table shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  seller_id uuid not null references profiles(id),
  partner_id uuid references delivery_partners(id),
  status shipment_status not null default 'pending',
  tracking_number text,
  awb text,                                  -- airway bill (3PL)
  label_url text,
  shipped_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on shipments (order_id);
create index on shipments (seller_id, status);

alter table delivery_partners enable row level security;
alter table shipments enable row level security;

create policy "partners public read" on delivery_partners for select using (active = true);
create policy "partners admin write" on delivery_partners for all using (public.is_admin());
create policy "shipments parties" on shipments for select using (
  seller_id = auth.uid()
  or exists(select 1 from orders o where o.id = order_id and o.buyer_id = auth.uid())
  or public.is_admin()
);
create policy "shipments seller write" on shipments for all using (seller_id = auth.uid() or public.is_admin());

-- Keep order_items aware of fulfillment per seller (which shipment).
alter table order_items add column if not exists shipment_id uuid references shipments(id) on delete set null;

-- Seed a manual partner placeholder so orders can complete pre-integration.
insert into delivery_partners (name, code) values ('Manual / In-house', 'manual')
on conflict (code) do nothing;
