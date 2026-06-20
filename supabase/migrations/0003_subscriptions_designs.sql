-- SmartBuyX — subscriptions, design artifacts, project attributes
-- Inspired by competitor patterns: role-tiered SaaS plans + rich house design workspace.

-- ============== ENUMS ==============
create type plan_tier as enum ('free','starter','premium','annual');
create type plan_audience as enum ('architect','engineer','contractor','interior_designer','supplier','d2c_brand','creator','consultant');
create type subscription_status as enum ('active','past_due','cancelled','expired','trialing');
create type design_artifact_kind as enum (
  '3d_model','render','blueprint','interior','concept','floor_plan','cost','smart','vr_tour','vastu'
);
create type facing_direction as enum ('north','south','east','west','north_east','north_west','south_east','south_west');
create type budget_tier as enum ('low','standard','premium','luxury');
create type design_style as enum ('traditional','modern','contemporary','minimal','colonial','industrial','scandinavian','vastu');

-- ============== PLANS & SUBSCRIPTIONS ==============
create table plans (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,                 -- 'architect_free', 'architect_premium' ...
  audience plan_audience not null,
  tier plan_tier not null,
  name text not null,                        -- 'Free', 'Starter', 'Premium', 'Annual'
  tagline text,                              -- 'Most Popular', 'Best Value'
  price_inr numeric(10,2) not null default 0,
  billing_period text not null default 'monthly',  -- monthly, yearly, one_time
  features jsonb not null default '[]'::jsonb,     -- ['15 Projects/month', 'Unlimited AI chat', ...]
  highlight boolean default false,
  sort_order int default 0,
  active boolean default true,
  created_at timestamptz not null default now(),
  unique(audience, tier)
);

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  plan_id uuid not null references plans(id),
  status subscription_status not null default 'active',
  started_at timestamptz not null default now(),
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  razorpay_subscription_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table subscription_usage (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references subscriptions(id) on delete cascade,
  metric text not null,                      -- 'projects', 'ai_messages', 'leads', 'renders_hd'
  period_start date not null,
  used int not null default 0,
  unique(subscription_id, metric, period_start)
);

alter table plans enable row level security;
alter table subscriptions enable row level security;
alter table subscription_usage enable row level security;

create policy "plans public read" on plans for select using (active = true);
create policy "plans admin write" on plans for all using (public.is_admin());
create policy "subs owner" on subscriptions for select using (user_id = auth.uid() or public.is_admin());
create policy "subs admin write" on subscriptions for all using (public.is_admin());
create policy "usage owner" on subscription_usage for select using (
  exists(select 1 from subscriptions s where s.id = subscription_id and (s.user_id = auth.uid() or public.is_admin()))
);

-- ============== DESIGN PROJECT EXTENSIONS ==============
alter table projects
  add column if not exists style design_style,
  add column if not exists bhk smallint,
  add column if not exists plot_width_ft numeric(8,2),
  add column if not exists plot_length_ft numeric(8,2),
  add column if not exists facing facing_direction,
  add column if not exists vastu_compliant boolean default false,
  add column if not exists budget_tier budget_tier,
  add column if not exists cover_image_url text,
  add column if not exists tags text[] default '{}';

-- Design artifacts produced by AI House Builder & pros, one per tab.
create table design_artifacts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  kind design_artifact_kind not null,
  title text,
  payload jsonb not null,                    -- model_url, render_urls[], pages[], rooms[], vr_tour_url, vastu_report, etc.
  generated_by text,                         -- 'ai', architect user_id, ...
  version int default 1,
  created_at timestamptz not null default now()
);
create index on design_artifacts (project_id, kind);

create table cost_breakdowns (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  category text not null,                    -- foundation, structure, roofing, finishing, interior, electrical, plumbing, labour
  estimated numeric(14,2) not null,
  actual numeric(14,2),
  notes text
);
create index on cost_breakdowns (project_id);

-- AI chat usage daily for free-tier metering (mirrors "10 msgs/day").
create or replace function public.bump_ai_usage()
returns trigger language plpgsql security definer set search_path = public as $$
declare sub_id uuid; begin
  select s.id into sub_id from subscriptions s
   where s.user_id = (select user_id from ai_conversations where id = new.conversation_id)
     and s.status = 'active' limit 1;
  if sub_id is not null and new.role = 'user' then
    insert into subscription_usage (subscription_id, metric, period_start, used)
    values (sub_id, 'ai_messages', current_date, 1)
    on conflict (subscription_id, metric, period_start)
    do update set used = subscription_usage.used + 1;
  end if;
  return new;
end; $$;

drop trigger if exists on_ai_msg_bump_usage on ai_messages;
create trigger on_ai_msg_bump_usage
after insert on ai_messages
for each row execute function public.bump_ai_usage();

alter table design_artifacts enable row level security;
alter table cost_breakdowns enable row level security;

create policy "artifacts via project" on design_artifacts for all using (
  exists(select 1 from projects p where p.id = project_id and (
    p.customer_id = auth.uid() or auth.uid() in (p.architect_id, p.engineer_id, p.contractor_id, p.interior_designer_id) or public.is_admin()))
);
create policy "costs via project" on cost_breakdowns for all using (
  exists(select 1 from projects p where p.id = project_id and (
    p.customer_id = auth.uid() or auth.uid() in (p.architect_id, p.engineer_id, p.contractor_id, p.interior_designer_id) or public.is_admin()))
);

-- ============== SEED: PLANS ==============
insert into plans (code, audience, tier, name, tagline, price_inr, billing_period, features, highlight, sort_order) values
-- Architect
('architect_free','architect','free','Free','Free Forever',0,'monthly',
 '["5 Projects/month","Basic 3D renders","Blueprint generation","AI chat (10 msgs/day)"]'::jsonb, false, 1),
('architect_starter','architect','starter','Starter','Starter',999,'monthly',
 '["15 Projects/month","Standard 3D renders","Blueprint generation","Unlimited AI chat","Email support"]'::jsonb, false, 2),
('architect_premium','architect','premium','Premium','Most Popular',2999,'monthly',
 '["Unlimited Projects","HD 3D renders + VR Tour","Priority AI generation","Unlimited AI chat","Listed as recommended architect","Client leads & referrals","Portfolio showcase","Priority support"]'::jsonb, true, 3),
('architect_annual','architect','annual','Annual','Best Value',24999,'yearly',
 '["Everything in Premium","2 months FREE (save ₹11k)","HD 3D + VR + Night renders","Dedicated account manager","Top-listed architect","Client leads priority","Custom portfolio page","24/7 priority support"]'::jsonb, false, 4),

-- Consultant (engineer / advisory)
('consultant_free','engineer','free','Free','Free Forever',0,'monthly',
 '["Consultant profile listing","Basic project advisory","3 client connections/month","Standard support"]'::jsonb, false, 1),
('consultant_starter','engineer','starter','Starter','Starter',1499,'monthly',
 '["10 client connections/month","Featured in searches","Project advisory tools","Email support"]'::jsonb, false, 2),
('consultant_premium','engineer','premium','Premium','Most Popular',3499,'monthly',
 '["Unlimited client connections","Verified consultant badge","Priority listing","Direct WhatsApp connect","Analytics dashboard","Client review management","Priority support"]'::jsonb, true, 3),
('consultant_annual','engineer','annual','Annual','Best Value',29999,'yearly',
 '["Everything in Premium","2 months FREE","Top placement in search","Dedicated account manager","Custom profile page","Lead generation tools","24/7 priority support"]'::jsonb, false, 4),

-- Builder / contractor
('builder_free','contractor','free','Free','Free Forever',0,'monthly',
 '["Builder profile listing","Basic project views","5 leads/month","Standard support"]'::jsonb, false, 1),
('builder_starter','contractor','starter','Starter','Starter',799,'monthly',
 '["20 leads/month","Profile verification","Basic analytics","Email support"]'::jsonb, false, 2),
('builder_premium','contractor','premium','Premium','Most Popular',1999,'monthly',
 '["Verified badge","Priority listing in search","Unlimited leads","Featured in recommendations","Direct client connect","Analytics dashboard","Priority support"]'::jsonb, true, 3),
('builder_annual','contractor','annual','Annual','Best Value',16999,'yearly',
 '["Everything in Premium","2 months FREE (save ₹7k)","Top placement","Dedicated manager","24/7 support"]'::jsonb, false, 4),

-- Supplier
('supplier_free','supplier','free','Free','Free Forever',0,'monthly',
 '["Supplier profile listing","Material catalog (10 items)","5 inquiries/month","Standard support"]'::jsonb, false, 1),
('supplier_starter','supplier','starter','Starter','Starter',599,'monthly',
 '["50 material listings","20 inquiries/month","Basic analytics","Email support"]'::jsonb, false, 2),
('supplier_premium','supplier','premium','Premium','Most Popular',1499,'monthly',
 '["Verified supplier badge","Unlimited material listings","Priority in cost calculator","Unlimited customer inquiries","Featured supplier badge","Analytics & reports","Priority support"]'::jsonb, true, 3),
('supplier_annual','supplier','annual','Annual','Best Value',12499,'yearly',
 '["Everything in Premium","2 months FREE (save ₹5k)","Top supplier listing","Bulk price management","24/7 support"]'::jsonb, false, 4)
on conflict (code) do nothing;
