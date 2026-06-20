-- SmartBuyX initial schema
-- Conventions: uuid pks, timestamptz, RLS on every table.

create extension if not exists "pgcrypto";

-- ============== ENUMS ==============
create type user_role as enum ('buyer','supplier','architect','contractor','admin','superadmin');
create type kyc_status as enum ('none','pending','approved','rejected');
create type application_status as enum ('pending','approved','rejected');
create type order_status as enum ('pending','paid','processing','shipped','delivered','cancelled','refunded');
create type payment_status as enum ('created','authorized','captured','failed','refunded');
create type listing_type as enum ('product','material');
create type rfq_status as enum ('open','quoted','accepted','closed');
create type booking_status as enum ('requested','accepted','in_progress','completed','cancelled');
create type review_target as enum ('product','material','supplier','architect','contractor');

-- ============== PROFILES ==============
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  phone text,
  role user_role not null default 'buyer',
  kyc_status kyc_status not null default 'none',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  label text,
  line1 text not null, line2 text,
  city text not null, state text not null, pincode text not null,
  country text not null default 'IN',
  is_default boolean default false,
  created_at timestamptz not null default now()
);

-- ============== PRO APPLICATIONS & PROFILES ==============
create table pro_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  requested_role user_role not null check (requested_role in ('supplier','architect','contractor')),
  business_name text not null,
  documents jsonb default '[]'::jsonb,
  status application_status not null default 'pending',
  notes text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create table supplier_profiles (
  user_id uuid primary key references profiles(id) on delete cascade,
  business_name text not null, gstin text, bio text,
  service_pincodes text[] default '{}',
  rating_avg numeric(3,2) default 0, rating_count int default 0
);

create table architect_profiles (
  user_id uuid primary key references profiles(id) on delete cascade,
  firm_name text, bio text, years_experience int,
  specialties text[] default '{}', portfolio jsonb default '[]'::jsonb,
  hourly_rate numeric(10,2),
  rating_avg numeric(3,2) default 0, rating_count int default 0
);

create table contractor_profiles (
  user_id uuid primary key references profiles(id) on delete cascade,
  company_name text, bio text, crew_size int,
  service_pincodes text[] default '{}',
  specialties text[] default '{}',
  rating_avg numeric(3,2) default 0, rating_count int default 0
);

-- ============== CATALOG ==============
create table categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references categories(id) on delete cascade,
  name text not null, slug text unique not null,
  kind listing_type not null,
  created_at timestamptz not null default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references profiles(id) on delete cascade,
  category_id uuid references categories(id),
  kind listing_type not null default 'product',
  title text not null, slug text unique not null,
  description text,
  brand text,
  unit text,                              -- 'piece','kg','bag','m','m2','m3'
  base_price numeric(12,2) not null,
  currency text not null default 'INR',
  images jsonb default '[]'::jsonb,
  attributes jsonb default '{}'::jsonb,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  sku text unique not null,
  options jsonb default '{}'::jsonb,
  price numeric(12,2) not null,
  created_at timestamptz not null default now()
);

create table inventory (
  variant_id uuid primary key references product_variants(id) on delete cascade,
  quantity int not null default 0,
  reserved int not null default 0,
  updated_at timestamptz not null default now()
);

-- ============== CART & ORDERS ==============
create table carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references carts(id) on delete cascade,
  variant_id uuid not null references product_variants(id),
  quantity int not null check (quantity > 0),
  added_at timestamptz not null default now(),
  unique(cart_id, variant_id)
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references profiles(id),
  shipping_address_id uuid references addresses(id),
  subtotal numeric(12,2) not null,
  tax numeric(12,2) not null default 0,
  shipping numeric(12,2) not null default 0,
  total numeric(12,2) not null,
  currency text not null default 'INR',
  status order_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  variant_id uuid not null references product_variants(id),
  supplier_id uuid not null references profiles(id),
  title text not null,
  unit_price numeric(12,2) not null,
  quantity int not null,
  total numeric(12,2) not null
);

create table order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  status order_status not null,
  note text,
  created_at timestamptz not null default now()
);

-- ============== PAYMENTS ==============
create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  razorpay_order_id text unique,
  razorpay_payment_id text unique,
  razorpay_signature text,
  amount numeric(12,2) not null,
  currency text not null default 'INR',
  status payment_status not null default 'created',
  raw jsonb,
  created_at timestamptz not null default now()
);

create table payouts (
  id uuid primary key default gen_random_uuid(),
  payee_id uuid not null references profiles(id),
  amount numeric(12,2) not null,
  status text not null default 'pending',
  reference text,
  created_at timestamptz not null default now()
);

-- ============== RFQ / SERVICES ==============
create table rfqs (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references profiles(id),
  title text not null, description text,
  category_id uuid references categories(id),
  pincode text,
  budget_min numeric(12,2), budget_max numeric(12,2),
  status rfq_status not null default 'open',
  created_at timestamptz not null default now()
);

create table quotes (
  id uuid primary key default gen_random_uuid(),
  rfq_id uuid not null references rfqs(id) on delete cascade,
  pro_id uuid not null references profiles(id),
  amount numeric(12,2) not null,
  message text,
  accepted boolean default false,
  created_at timestamptz not null default now()
);

create table service_bookings (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references profiles(id),
  pro_id uuid not null references profiles(id),
  pro_role user_role not null check (pro_role in ('architect','contractor')),
  title text not null, scope text,
  amount numeric(12,2),
  status booking_status not null default 'requested',
  created_at timestamptz not null default now()
);

-- ============== SOCIAL ==============
create table reviews (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles(id),
  target_type review_target not null,
  target_id uuid not null,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create table conversations (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references profiles(id),
  user_b uuid not null references profiles(id),
  last_message_at timestamptz,
  created_at timestamptz not null default now()
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id uuid not null references profiles(id),
  body text not null,
  created_at timestamptz not null default now()
);

-- ============== AI ==============
create table ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text,
  created_at timestamptz not null default now()
);

create table ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references ai_conversations(id) on delete cascade,
  role text not null check (role in ('user','assistant','system','tool')),
  content jsonb not null,
  created_at timestamptz not null default now()
);

create table estimates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  project_type text not null,           -- 'house','apartment','renovation'
  area_sqft numeric(10,2) not null,
  finish_level text,                    -- 'basic','standard','premium'
  input jsonb not null,
  bom jsonb not null,                   -- bill of materials
  total_estimate numeric(12,2),
  currency text not null default 'INR',
  created_at timestamptz not null default now()
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  kind text not null, payload jsonb not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- ============== INDEXES ==============
create index on products (supplier_id);
create index on products (category_id);
create index on product_variants (product_id);
create index on order_items (order_id);
create index on order_items (supplier_id);
create index on reviews (target_type, target_id);
create index on ai_messages (conversation_id);
create index on messages (conversation_id);

-- ============== AUTH BOOTSTRAP ==============
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id,
          coalesce(new.raw_user_meta_data->>'full_name', new.email),
          new.raw_user_meta_data->>'avatar_url');
  insert into public.carts (user_id) values (new.id);
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Mirror role into JWT app_metadata so RLS can read it.
create or replace function public.sync_role_to_jwt()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update auth.users
     set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
                             || jsonb_build_object('role', new.role::text)
   where id = new.id;
  return new;
end; $$;

drop trigger if exists on_profile_role_change on profiles;
create trigger on_profile_role_change
after insert or update of role on profiles
for each row execute function public.sync_role_to_jwt();

-- ============== RLS ==============
alter table profiles enable row level security;
alter table addresses enable row level security;
alter table pro_applications enable row level security;
alter table supplier_profiles enable row level security;
alter table architect_profiles enable row level security;
alter table contractor_profiles enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table product_variants enable row level security;
alter table inventory enable row level security;
alter table carts enable row level security;
alter table cart_items enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table order_status_history enable row level security;
alter table payments enable row level security;
alter table payouts enable row level security;
alter table rfqs enable row level security;
alter table quotes enable row level security;
alter table service_bookings enable row level security;
alter table reviews enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table ai_conversations enable row level security;
alter table ai_messages enable row level security;
alter table estimates enable row level security;
alter table notifications enable row level security;

-- Helpers
create or replace function public.jwt_role() returns text
language sql stable as $$ select coalesce(auth.jwt()->>'role','buyer') $$;

create or replace function public.is_admin() returns boolean
language sql stable as $$ select public.jwt_role() in ('admin','superadmin') $$;

-- Profiles
create policy "profile self read" on profiles for select using (auth.uid() = id or public.is_admin());
create policy "profile self update" on profiles for update using (auth.uid() = id);
create policy "profile public pros" on profiles for select using (role in ('supplier','architect','contractor'));

-- Addresses
create policy "address owner all" on addresses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Catalog public read
create policy "categories public read" on categories for select using (true);
create policy "products public read" on products for select using (status = 'active' or supplier_id = auth.uid() or public.is_admin());
create policy "products supplier write" on products for all
  using (supplier_id = auth.uid() or public.is_admin())
  with check (supplier_id = auth.uid() or public.is_admin());
create policy "variants read" on product_variants for select using (true);
create policy "variants supplier write" on product_variants for all
  using (exists(select 1 from products p where p.id = product_id and (p.supplier_id = auth.uid() or public.is_admin())));
create policy "inventory supplier" on inventory for all
  using (exists(select 1 from product_variants v join products p on p.id = v.product_id
                where v.id = variant_id and (p.supplier_id = auth.uid() or public.is_admin())));

-- Cart
create policy "cart owner" on carts for all using (user_id = auth.uid());
create policy "cart items owner" on cart_items for all
  using (exists(select 1 from carts c where c.id = cart_id and c.user_id = auth.uid()));

-- Orders
create policy "orders buyer read" on orders for select using (buyer_id = auth.uid() or public.is_admin());
create policy "orders buyer insert" on orders for insert with check (buyer_id = auth.uid());
create policy "order items read" on order_items for select using (
  supplier_id = auth.uid() or exists(select 1 from orders o where o.id = order_id and o.buyer_id = auth.uid()) or public.is_admin()
);

-- Payments
create policy "payments read" on payments for select using (
  exists(select 1 from orders o where o.id = order_id and (o.buyer_id = auth.uid() or public.is_admin()))
);

-- Pro profiles public read
create policy "supplier profile read" on supplier_profiles for select using (true);
create policy "architect profile read" on architect_profiles for select using (true);
create policy "contractor profile read" on contractor_profiles for select using (true);
create policy "supplier profile self" on supplier_profiles for all using (user_id = auth.uid());
create policy "architect profile self" on architect_profiles for all using (user_id = auth.uid());
create policy "contractor profile self" on contractor_profiles for all using (user_id = auth.uid());

-- AI / messages / notifications: owner-only
create policy "ai conv owner" on ai_conversations for all using (user_id = auth.uid());
create policy "ai msg owner" on ai_messages for all
  using (exists(select 1 from ai_conversations c where c.id = conversation_id and c.user_id = auth.uid()));
create policy "estimates owner" on estimates for all using (user_id = auth.uid());
create policy "notifications owner" on notifications for all using (user_id = auth.uid());
create policy "conversations participant" on conversations for all using (auth.uid() in (user_a, user_b));
create policy "messages participant" on messages for all using (
  exists(select 1 from conversations c where c.id = conversation_id and auth.uid() in (c.user_a, c.user_b))
);

-- Reviews
create policy "reviews public read" on reviews for select using (true);
create policy "reviews author write" on reviews for all using (author_id = auth.uid());

-- Pro applications
create policy "pro app self" on pro_applications for select using (user_id = auth.uid() or public.is_admin());
create policy "pro app insert" on pro_applications for insert with check (user_id = auth.uid());
create policy "pro app admin update" on pro_applications for update using (public.is_admin());

-- RFQs / quotes / bookings
create policy "rfq public read" on rfqs for select using (true);
create policy "rfq buyer write" on rfqs for all using (buyer_id = auth.uid());
create policy "quotes read" on quotes for select using (
  pro_id = auth.uid() or exists(select 1 from rfqs r where r.id = rfq_id and r.buyer_id = auth.uid())
);
create policy "quotes pro write" on quotes for all using (pro_id = auth.uid());
create policy "bookings parties" on service_bookings for all using (buyer_id = auth.uid() or pro_id = auth.uid());
