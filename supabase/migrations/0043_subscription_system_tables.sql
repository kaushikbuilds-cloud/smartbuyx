-- Usage tracking (numeric feature limits like "6/10 AI House Builder uses")
-- and enterprise services (one-off services, not recurring subscriptions --
-- kept as a separate table per the requirement not to force these into the
-- plans/subscriptions shape).
create table subscription_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  feature_key text not null,           -- 'ai_house_builder', 'architecture_design', 'projects', 'customers'
  usage_count int not null default 0,
  period_start timestamptz not null,
  period_end timestamptz not null,
  updated_at timestamptz not null default now(),
  unique (user_id, feature_key, period_start)
);
create index on subscription_usage (user_id, feature_key);

alter table subscription_usage enable row level security;
create policy "subscription_usage owner read" on subscription_usage for select using (
  user_id = auth.uid() or public.is_admin()
);

create table enterprise_services (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  description text,
  category text,                        -- 'registration', 'hosting', 'legal', 'marketing'
  price_inr numeric(10,2),              -- null = "Contact us" pricing
  features jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  sort_order int default 0,
  created_at timestamptz not null default now()
);
alter table enterprise_services enable row level security;
create policy "enterprise_services public read" on enterprise_services for select using (active = true or public.is_admin());

create table enterprise_service_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  service_id uuid not null references enterprise_services(id),
  status text not null default 'new',   -- new, contacted, in_progress, completed, cancelled
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table enterprise_service_requests enable row level security;
create policy "enterprise_service_requests owner" on enterprise_service_requests for select using (
  user_id = auth.uid() or public.is_admin()
);
create policy "enterprise_service_requests admin write" on enterprise_service_requests for all using (public.is_admin());

insert into enterprise_services (code, name, description, category, price_inr, features, sort_order) values
('company_registration', 'Private Limited Company Registration', 'Full Pvt Ltd incorporation, done for you.', 'registration', null,
 '["MOA & AOA drafting","DIN for all directors","DSC for all directors","Online registration assistance"]'::jsonb, 1),
('domain_hosting', 'Free Domain + 1-Year Hosting', 'A professional web presence from day one.', 'hosting', null,
 '["Free domain registration","1 year of hosting included"]'::jsonb, 2),
('pan_tan', 'PAN & TAN Registration', 'Business tax identity, handled end-to-end.', 'registration', null,
 '["PAN application","TAN application"]'::jsonb, 3),
('pf_esic', 'PF & ESIC Registration', 'Employee provident fund and insurance compliance.', 'registration', null,
 '["PF registration","ESIC registration"]'::jsonb, 4),
('trademark', 'Trademark Registration', 'Protect your brand name and logo.', 'legal', null,
 '["Trademark search","Application filing"]'::jsonb, 5),
('digital_marketing', 'Digital Marketing', 'Get discovered by the right customers.', 'marketing', null,
 '["Campaign strategy","Ad management"]'::jsonb, 6)
on conflict (code) do nothing;

-- ============== CUSTOMER PLAN ==============
insert into plans (code, audience, tier, name, tagline, price_inr, billing_period, features, highlight, sort_order) values
('customer_free_trial', 'customer', 'free', 'Free Trial', '2 Days Free', 0, 'monthly',
 '["Full marketplace access for 2 days","Try before you subscribe"]'::jsonb, false, 1),
('customer_monthly', 'customer', 'starter', 'Premium', 'Most Popular', 499, 'monthly',
 '["Unlocks premium marketplace features","Priority customer support","Early access to deals"]'::jsonb, true, 2)
on conflict (code) do nothing;

-- ============== BUILDER (contractor audience) -- revised per new spec ==============
update plans set active = false where code in ('builder_free','builder_starter','builder_premium','builder_annual');

insert into plans (code, audience, tier, name, tagline, price_inr, billing_period, features, highlight, sort_order) values
('builder_v2_free', 'contractor', 'free', 'Free', 'Free Forever', 0, 'monthly',
 '["Builder profile listing","Standard support","Material cost calculator"]'::jsonb, false, 1),
('builder_v2_starter', 'contractor', 'starter', 'Starter', 'Starter', 499, 'monthly',
 '["2 project details","1 AI House Builder use","Profile verification","Email support","1 Architecture Design"]'::jsonb, false, 2),
('builder_v2_growth', 'contractor', 'growth', 'Growth', 'Most Popular', 999, 'monthly',
 '["Verification badge","Priority listing in search","Direct client contact","Priority support","10 AI House Builder uses","10 Architecture Designs","MSME registration assistance"]'::jsonb, true, 3),
('builder_v2_premium', 'contractor', 'premium', 'Premium', 'Best Value', 2999, 'monthly',
 '["Everything in Growth","Top placement","24/7 support","Verification badge","Free website","GST filing assistance","MSME registration assistance"]'::jsonb, false, 4)
on conflict (code) do update set
  price_inr = excluded.price_inr, features = excluded.features, active = true, highlight = excluded.highlight, sort_order = excluded.sort_order;

-- ============== ARCHITECT -- revised per new spec ==============
update plans set active = false where code in ('architect_free','architect_starter','architect_premium','architect_annual');

insert into plans (code, audience, tier, name, tagline, price_inr, billing_period, features, highlight, sort_order) values
('architect_v2_free', 'architect', 'free', 'Free', 'Free Forever', 0, 'monthly',
 '["Architect profile listing","Standard support"]'::jsonb, false, 1),
('architect_v2_starter', 'architect', 'starter', 'Starter', 'Starter', 199, 'monthly',
 '["2 projects per month","Blueprint generation","Email support"]'::jsonb, false, 2),
('architect_v2_premium', 'architect', 'premium', 'Premium', 'Most Popular', 1499, 'monthly',
 '["10 projects per month","Priority AI generation","Listed as recommended architect","Priority support","Free website"]'::jsonb, true, 3),
('architect_v2_ultra', 'architect', 'growth', 'Ultra Premium', 'Best Value', 1999, 'monthly',
 '["Everything in Premium","Top-listed architect","GST filing assistance","MSME registration assistance","24/7 priority support","Free website"]'::jsonb, false, 4)
on conflict (code) do update set
  price_inr = excluded.price_inr, features = excluded.features, active = true, highlight = excluded.highlight, sort_order = excluded.sort_order;

-- ============== SELLER/SUPPLIER -- add Ultra Premium tier (Free/Starter/Growth/Premium already exist from 0038) ==============
insert into plans (code, audience, tier, name, tagline, price_inr, billing_period, features, highlight, sort_order, commission_percent) values
('supplier_ultra', 'supplier', 'annual', 'Ultra Premium', 'Maximiser Pro', 2999, 'monthly',
 '["Everything in Premium","100 customer connections/month","Top supplier listing","GST filing assistance","MSME registration assistance","Free website","Bulk price management","24/7 support"]'::jsonb,
 false, 5, 0.00)
on conflict (code) do update set
  price_inr = excluded.price_inr, features = excluded.features, active = true, sort_order = excluded.sort_order;

-- Numeric feature limits referenced by src/features/billing/gating.ts --
-- kept as a small lookup table (rather than only in `plans.features` jsonb
-- bullet text) so limit CHECKS can be a query, not string-parsing.
create table plan_feature_limits (
  plan_id uuid not null references plans(id) on delete cascade,
  feature_key text not null,
  limit_value int, -- null = unlimited
  primary key (plan_id, feature_key)
);
alter table plan_feature_limits enable row level security;
create policy "plan_feature_limits public read" on plan_feature_limits for select using (true);

insert into plan_feature_limits (plan_id, feature_key, limit_value)
select id, 'ai_house_builder', case code when 'builder_v2_starter' then 1 when 'builder_v2_growth' then 10 when 'builder_v2_premium' then null end
from plans where code in ('builder_v2_starter','builder_v2_growth','builder_v2_premium')
on conflict do nothing;

insert into plan_feature_limits (plan_id, feature_key, limit_value)
select id, 'architecture_design', case code when 'builder_v2_starter' then 1 when 'builder_v2_growth' then 10 when 'builder_v2_premium' then null end
from plans where code in ('builder_v2_starter','builder_v2_growth','builder_v2_premium')
on conflict do nothing;

insert into plan_feature_limits (plan_id, feature_key, limit_value)
select id, 'projects', case code when 'architect_v2_starter' then 2 when 'architect_v2_premium' then 10 when 'architect_v2_ultra' then null end
from plans where code in ('architect_v2_starter','architect_v2_premium','architect_v2_ultra')
on conflict do nothing;

insert into plan_feature_limits (plan_id, feature_key, limit_value)
select id, 'customers', case code
  when 'supplier_starter' then 5 when 'supplier_growth' then 10 when 'supplier_premium' then 20 when 'supplier_ultra' then 100 end
from plans where code in ('supplier_starter','supplier_growth','supplier_premium','supplier_ultra')
on conflict do nothing;

-- Free-tier refinement per spec: orders under ₹101 pay no commission at all
-- (shipping only) even on the Free plan.
create or replace function public.release_escrow(p_order uuid, p_seller uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  h escrow_holds;
  commission_pct numeric(4,2);
  commission_amt numeric(12,2);
  net_amt numeric(12,2);
begin
  select * into h from escrow_holds
    where order_id = p_order and seller_id = p_seller and status = 'held'
    for update;
  if not found then return; end if;

  select p.commission_percent into commission_pct
  from subscriptions s join plans p on p.id = s.plan_id
  where s.user_id = p_seller and s.status = 'active' and p.audience = 'supplier'
  order by s.started_at desc limit 1;

  commission_pct := coalesce(commission_pct, 2.00);
  if commission_pct = 2.00 and h.amount < 101 then
    commission_pct := 0;
  end if;

  commission_amt := round(h.amount * commission_pct / 100, 2);
  net_amt := h.amount - commission_amt;

  perform public.credit_wallet(p_seller, net_amt, 'credit', 'escrow:'||p_order);

  update escrow_holds set status = 'released', released_at = now(), commission_amount = commission_amt where id = h.id;
end; $$;
