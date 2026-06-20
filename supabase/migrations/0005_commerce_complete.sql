-- SmartBuyX — Phase 1 completion: inventory, wishlist, coupons, categories, seller fulfilment.

-- ============== ORDERS: discount/coupon ==============
alter table orders
  add column if not exists discount numeric(12,2) not null default 0,
  add column if not exists coupon_id uuid references coupons(id),
  add column if not exists coupon_code text;

-- ============== INVENTORY ==============
-- Auto-create an inventory row for every new variant (qty 0 until seller sets stock).
create or replace function public.ensure_inventory()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.inventory (variant_id, quantity) values (new.id, 0)
  on conflict (variant_id) do nothing;
  return new;
end; $$;

drop trigger if exists on_variant_create_inventory on product_variants;
create trigger on_variant_create_inventory
after insert on product_variants
for each row execute function public.ensure_inventory();

-- Atomic stock decrement + sales increment, used at order fulfilment.
create or replace function public.fulfil_inventory(p_variant uuid, p_qty int, p_product uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update inventory set quantity = greatest(0, quantity - p_qty), updated_at = now()
   where variant_id = p_variant;
  update products set sales_count = sales_count + p_qty where id = p_product;
end; $$;

-- ============== WISHLIST ==============
create table if not exists wishlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, product_id)
);
alter table wishlist_items enable row level security;
create policy "wishlist owner" on wishlist_items for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create index if not exists wishlist_user_idx on wishlist_items (user_id);

-- ============== COUPON VALIDATION ==============
-- Returns the discount (in rupees) for a code against a subtotal, or null if invalid.
create or replace function public.coupon_discount(p_code text, p_subtotal numeric, p_user uuid)
returns table(coupon_id uuid, discount numeric, reason text)
language plpgsql stable security definer set search_path = public as $$
declare c coupons;
declare used int;
begin
  select * into c from coupons where upper(code) = upper(p_code) and active = true;
  if not found then return query select null::uuid, 0::numeric, 'Invalid coupon'; return; end if;
  if c.starts_at is not null and now() < c.starts_at then return query select null::uuid, 0::numeric, 'Coupon not active yet'; return; end if;
  if c.ends_at is not null and now() > c.ends_at then return query select null::uuid, 0::numeric, 'Coupon expired'; return; end if;
  if p_subtotal < c.min_order then return query select null::uuid, 0::numeric, 'Minimum order not met'; return; end if;
  if c.usage_limit is not null and c.used_count >= c.usage_limit then return query select null::uuid, 0::numeric, 'Coupon usage limit reached'; return; end if;

  select count(*) into used from coupon_redemptions where coupon_id = c.id and user_id = p_user;
  if used >= coalesce(c.per_user_limit, 1) then return query select null::uuid, 0::numeric, 'Already used'; return; end if;

  return query select c.id,
    case
      when c.kind = 'percent' then least(coalesce(c.max_discount, 1e9), round(p_subtotal * c.value / 100, 2))
      else least(c.value, p_subtotal)
    end,
    'ok';
end; $$;

create or replace function public.increment_coupon_use(p_coupon uuid)
returns void language sql security definer set search_path = public as $$
  update coupons set used_count = used_count + 1 where id = p_coupon;
$$;

-- ============== CATEGORIES SEED ==============
insert into categories (name, slug, kind) values
  ('Electronics','electronics','product'),
  ('Fashion','fashion','product'),
  ('Home & Kitchen','home-kitchen','product'),
  ('Beauty & Personal Care','beauty','product'),
  ('Sports & Outdoors','sports','product'),
  ('Cement','cement','material'),
  ('Steel','steel','material'),
  ('Bricks & Blocks','bricks','material'),
  ('Sand & Aggregates','sand','material'),
  ('Tiles & Flooring','tiles','material'),
  ('Paint','paint','material'),
  ('Plumbing','plumbing','material'),
  ('Electrical','electrical','material'),
  ('Hardware','hardware','material'),
  ('Roofing','roofing','material'),
  ('Solar Materials','solar','material')
on conflict (slug) do nothing;

-- ============== SAMPLE COUPONS ==============
insert into coupons (code, kind, value, min_order, max_discount, per_user_limit) values
  ('WELCOME10','percent',10,500,500,1),
  ('BUILD500','flat',500,5000,null,3)
on conflict (code) do nothing;
