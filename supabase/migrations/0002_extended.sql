-- SmartBuyX extended schema (full platform spec)
-- Adds: engineer/interior_designer/creator/d2c_brand roles, projects,
-- AR sessions, AI house builder, wallet/coupons/cashback, creator commerce.

-- ============== ROLE EXTENSION ==============
alter type user_role add value if not exists 'customer';
alter type user_role add value if not exists 'engineer';
alter type user_role add value if not exists 'interior_designer';
alter type user_role add value if not exists 'creator';
alter type user_role add value if not exists 'd2c_brand';
-- 'buyer' is retained as legacy alias; new signups should use 'customer'.

-- ============== NEW ENUMS ==============
create type project_stage as enum ('planning','foundation','structure','roofing','finishing','handover');
create type project_status as enum ('draft','active','on_hold','completed','cancelled');
create type wallet_txn_kind as enum ('credit','debit','refund','cashback','payout');
create type coupon_kind as enum ('percent','flat','cashback');
create type reel_status as enum ('draft','published','removed');

-- ============== ADDITIONAL PRO PROFILES ==============
create table engineer_profiles (
  user_id uuid primary key references profiles(id) on delete cascade,
  firm_name text, bio text, years_experience int,
  specialties text[] default '{}',          -- structural, MEP, geotech...
  license_no text,
  service_pincodes text[] default '{}',
  hourly_rate numeric(10,2),
  rating_avg numeric(3,2) default 0, rating_count int default 0
);
alter table engineer_profiles enable row level security;
create policy "engineer profile read" on engineer_profiles for select using (true);
create policy "engineer profile self" on engineer_profiles for all using (user_id = auth.uid());

create table interior_designer_profiles (
  user_id uuid primary key references profiles(id) on delete cascade,
  studio_name text, bio text, years_experience int,
  styles text[] default '{}',               -- minimal, modern, traditional...
  portfolio jsonb default '[]'::jsonb,
  package_starts_at numeric(10,2),
  rating_avg numeric(3,2) default 0, rating_count int default 0
);
alter table interior_designer_profiles enable row level security;
create policy "id profile read" on interior_designer_profiles for select using (true);
create policy "id profile self" on interior_designer_profiles for all using (user_id = auth.uid());

create table d2c_brand_profiles (
  user_id uuid primary key references profiles(id) on delete cascade,
  brand_name text not null, gstin text, bio text, logo_url text,
  website text, social jsonb default '{}'::jsonb,
  rating_avg numeric(3,2) default 0, rating_count int default 0
);
alter table d2c_brand_profiles enable row level security;
create policy "brand profile read" on d2c_brand_profiles for select using (true);
create policy "brand profile self" on d2c_brand_profiles for all using (user_id = auth.uid());

create table creator_profiles (
  user_id uuid primary key references profiles(id) on delete cascade,
  handle text unique not null,
  bio text, avatar_url text, cover_url text,
  niches text[] default '{}',
  followers int default 0,
  affiliate_rate numeric(5,2) default 5.00,  -- default % commission
  total_earnings numeric(12,2) default 0
);
alter table creator_profiles enable row level security;
create policy "creator profile read" on creator_profiles for select using (true);
create policy "creator profile self" on creator_profiles for all using (user_id = auth.uid());

-- ============== CONSTRUCTION PROJECTS ==============
create table projects (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  plot_size_sqft numeric(10,2),
  floors int default 1,
  pincode text,
  budget numeric(14,2),
  current_stage project_stage not null default 'planning',
  status project_status not null default 'draft',
  architect_id uuid references profiles(id),
  engineer_id uuid references profiles(id),
  contractor_id uuid references profiles(id),
  interior_designer_id uuid references profiles(id),
  start_date date, target_end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table project_milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  stage project_stage not null,
  title text not null,
  due_date date,
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create table project_materials (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  variant_id uuid references product_variants(id),
  name text not null, unit text not null,
  planned_qty numeric(12,2) not null,
  ordered_qty numeric(12,2) default 0,
  delivered_qty numeric(12,2) default 0,
  estimated_cost numeric(12,2)
);

create table project_expenses (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  category text not null,                    -- labour, material, transport, misc
  amount numeric(12,2) not null,
  description text,
  incurred_at date not null default current_date,
  created_at timestamptz not null default now()
);

create table site_reports (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  author_id uuid not null references profiles(id),
  kind text not null,                        -- progress, inspection, issue
  body text,
  attachments jsonb default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table consultations (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references profiles(id),
  pro_id uuid not null references profiles(id),
  pro_role user_role not null,
  scheduled_at timestamptz not null,
  mode text not null default 'video',        -- video, in_person, chat
  status text not null default 'scheduled',  -- scheduled, completed, cancelled
  notes text,
  created_at timestamptz not null default now()
);

alter table projects enable row level security;
alter table project_milestones enable row level security;
alter table project_materials enable row level security;
alter table project_expenses enable row level security;
alter table site_reports enable row level security;
alter table consultations enable row level security;

create policy "project parties" on projects for all using (
  customer_id = auth.uid() or auth.uid() in (architect_id, engineer_id, contractor_id, interior_designer_id) or public.is_admin()
);
create policy "milestones via project" on project_milestones for all using (
  exists(select 1 from projects p where p.id = project_id and (
    p.customer_id = auth.uid() or auth.uid() in (p.architect_id, p.engineer_id, p.contractor_id, p.interior_designer_id) or public.is_admin()))
);
create policy "materials via project" on project_materials for all using (
  exists(select 1 from projects p where p.id = project_id and (
    p.customer_id = auth.uid() or auth.uid() in (p.architect_id, p.engineer_id, p.contractor_id) or public.is_admin()))
);
create policy "expenses via project" on project_expenses for all using (
  exists(select 1 from projects p where p.id = project_id and (
    p.customer_id = auth.uid() or auth.uid() in (p.architect_id, p.engineer_id, p.contractor_id) or public.is_admin()))
);
create policy "site reports via project" on site_reports for all using (
  exists(select 1 from projects p where p.id = project_id and (
    p.customer_id = auth.uid() or auth.uid() in (p.architect_id, p.engineer_id, p.contractor_id, p.interior_designer_id) or public.is_admin()))
);
create policy "consultations parties" on consultations for all using (
  customer_id = auth.uid() or pro_id = auth.uid() or public.is_admin()
);

-- ============== CREATOR COMMERCE ==============
create table reels (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references profiles(id) on delete cascade,
  title text, caption text,
  video_url text not null,
  thumbnail_url text,
  duration_sec int,
  status reel_status not null default 'draft',
  views int default 0, likes int default 0, shares int default 0,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create table reel_products (
  id uuid primary key default gen_random_uuid(),
  reel_id uuid not null references reels(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  tag_position jsonb,                        -- {x,y,t_sec}
  unique(reel_id, product_id)
);

create table affiliate_links (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references profiles(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  code text unique not null,
  commission_pct numeric(5,2) not null,
  created_at timestamptz not null default now()
);

create table affiliate_earnings (
  id uuid primary key default gen_random_uuid(),
  link_id uuid not null references affiliate_links(id) on delete cascade,
  order_id uuid not null references orders(id) on delete cascade,
  amount numeric(12,2) not null,
  status text not null default 'pending',    -- pending, locked, paid
  created_at timestamptz not null default now()
);

create table live_sessions (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  scheduled_at timestamptz,
  started_at timestamptz, ended_at timestamptz,
  stream_url text, status text not null default 'scheduled',
  created_at timestamptz not null default now()
);

create table brand_collaborations (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references profiles(id),
  creator_id uuid not null references profiles(id),
  brief text, fee numeric(12,2),
  status text not null default 'requested',  -- requested, accepted, completed, cancelled
  created_at timestamptz not null default now()
);

alter table reels enable row level security;
alter table reel_products enable row level security;
alter table affiliate_links enable row level security;
alter table affiliate_earnings enable row level security;
alter table live_sessions enable row level security;
alter table brand_collaborations enable row level security;

create policy "reels public read" on reels for select using (status = 'published' or creator_id = auth.uid() or public.is_admin());
create policy "reels creator write" on reels for all using (creator_id = auth.uid());
create policy "reel products read" on reel_products for select using (true);
create policy "reel products owner" on reel_products for all using (
  exists(select 1 from reels r where r.id = reel_id and r.creator_id = auth.uid())
);
create policy "affiliate links creator" on affiliate_links for all using (creator_id = auth.uid() or public.is_admin());
create policy "affiliate links read" on affiliate_links for select using (true);
create policy "affiliate earnings creator" on affiliate_earnings for select using (
  exists(select 1 from affiliate_links l where l.id = link_id and l.creator_id = auth.uid()) or public.is_admin()
);
create policy "live sessions public read" on live_sessions for select using (true);
create policy "live sessions creator write" on live_sessions for all using (creator_id = auth.uid());
create policy "collab parties" on brand_collaborations for all using (
  brand_id = auth.uid() or creator_id = auth.uid() or public.is_admin()
);

-- ============== AR & AI HOUSE BUILDER ==============
create table ar_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  category text not null,                    -- clothes, shoes, sofa, paint, tile...
  product_id uuid references products(id),
  snapshot_url text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table ar_sessions enable row level security;
create policy "ar owner" on ar_sessions for all using (user_id = auth.uid());

create table house_builder_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  plot_size_sqft numeric(10,2),
  floors int default 1,
  input jsonb not null,                      -- uploads: sketch_url, floor_plan_url
  outputs jsonb,                             -- floor_plans[], elevations[], 3d_concepts[], material_estimate, cost_estimate
  status text not null default 'queued',     -- queued, processing, done, failed
  created_at timestamptz not null default now()
);
alter table house_builder_runs enable row level security;
create policy "hb owner" on house_builder_runs for all using (user_id = auth.uid());

-- Material estimate runs (from CAD/blueprint/floor plan)
create table material_estimate_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  source_kind text not null,                 -- cad, blueprint, floor_plan
  source_url text,
  boq jsonb,                                 -- bill of quantities
  cost_estimate numeric(12,2),
  currency text not null default 'INR',
  status text not null default 'queued',
  created_at timestamptz not null default now()
);
alter table material_estimate_runs enable row level security;
create policy "me owner" on material_estimate_runs for all using (user_id = auth.uid());

-- ============== WALLET / COUPONS / CASHBACK ==============
create table wallets (
  user_id uuid primary key references profiles(id) on delete cascade,
  balance numeric(12,2) not null default 0,
  currency text not null default 'INR',
  updated_at timestamptz not null default now()
);

create table wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  kind wallet_txn_kind not null,
  amount numeric(12,2) not null,
  reference text,                            -- order_id, payout_id, etc.
  balance_after numeric(12,2) not null,
  created_at timestamptz not null default now()
);

create table coupons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  kind coupon_kind not null,
  value numeric(12,2) not null,
  min_order numeric(12,2) default 0,
  max_discount numeric(12,2),
  usage_limit int, used_count int default 0,
  per_user_limit int default 1,
  starts_at timestamptz, ends_at timestamptz,
  active boolean default true,
  created_at timestamptz not null default now()
);

create table coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references coupons(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  order_id uuid references orders(id) on delete cascade,
  amount numeric(12,2) not null,
  created_at timestamptz not null default now()
);

alter table wallets enable row level security;
alter table wallet_transactions enable row level security;
alter table coupons enable row level security;
alter table coupon_redemptions enable row level security;

create policy "wallet owner" on wallets for all using (user_id = auth.uid() or public.is_admin());
create policy "wallet txn owner" on wallet_transactions for select using (user_id = auth.uid() or public.is_admin());
create policy "coupons public read" on coupons for select using (active = true);
create policy "coupons admin write" on coupons for all using (public.is_admin());
create policy "redemptions self" on coupon_redemptions for select using (user_id = auth.uid() or public.is_admin());

-- Auto-create wallet on profile creation
create or replace function public.ensure_wallet()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.wallets (user_id) values (new.id) on conflict do nothing;
  return new;
end; $$;

drop trigger if exists on_profile_create_wallet on profiles;
create trigger on_profile_create_wallet
after insert on profiles
for each row execute function public.ensure_wallet();

-- ============== AUDIT LOGS / DEVICES ==============
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id),
  action text not null,
  target_type text, target_id uuid,
  metadata jsonb default '{}'::jsonb,
  ip text, user_agent text,
  created_at timestamptz not null default now()
);
create index on audit_logs (actor_id, created_at desc);

create table user_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  device_id text not null,
  platform text,                             -- ios, android, web
  push_token text,
  last_seen_at timestamptz default now(),
  created_at timestamptz not null default now(),
  unique(user_id, device_id)
);

alter table audit_logs enable row level security;
alter table user_devices enable row level security;
create policy "audit admin" on audit_logs for select using (public.is_admin());
create policy "devices owner" on user_devices for all using (user_id = auth.uid());

-- ============== INDEXES ==============
create index on projects (customer_id);
create index on projects (architect_id);
create index on projects (contractor_id);
create index on reels (creator_id, status);
create index on affiliate_links (creator_id);
create index on consultations (pro_id, scheduled_at);
create index on project_expenses (project_id, incurred_at desc);
