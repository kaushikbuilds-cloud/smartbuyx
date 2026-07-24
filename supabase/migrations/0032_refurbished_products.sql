-- Refurbished Products: a distinct listing type with mandatory quality
-- inspection before it's allowed to go live, plus condition/battery/
-- warranty/accessories disclosure. Serial/IMEI is sensitive (device
-- identity) so it lives in a separate, tightly-RLS'd table rather than
-- alongside the publicly-readable condition details.

alter table products add column if not exists is_refurbished boolean not null default false;
create index if not exists products_refurbished_idx on products (is_refurbished) where is_refurbished;

create table if not exists refurbished_details (
  product_id uuid primary key references products(id) on delete cascade,
  condition_grade text not null check (condition_grade in ('excellent', 'very_good', 'good')),
  battery_health int check (battery_health between 0 and 100),
  warranty_months int not null default 0,
  accessories_included text,
  qc_status text not null default 'pending' check (qc_status in ('pending', 'passed', 'failed')),
  qc_notes text,
  qc_reviewed_by uuid references profiles(id),
  qc_reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Device serial/IMEI kept separate from the publicly-readable condition
-- report -- owner (seller) and admin only, never exposed to shoppers.
create table if not exists refurbished_serials (
  product_id uuid primary key references refurbished_details(product_id) on delete cascade,
  serial_or_imei text not null,
  created_at timestamptz not null default now()
);

alter table refurbished_details enable row level security;
alter table refurbished_serials enable row level security;

-- Sellers manage their own product's refurb details; admins can read+update
-- (QC review) any. Public can read PASSED items only -- pending/failed stay
-- hidden from shoppers (a failed inspection should never be visible).
drop policy if exists "refurb details owner" on refurbished_details;
create policy "refurb details owner" on refurbished_details for all
  using (exists (select 1 from products p where p.id = product_id and p.supplier_id = auth.uid()))
  with check (exists (select 1 from products p where p.id = product_id and p.supplier_id = auth.uid()));
drop policy if exists "refurb details admin" on refurbished_details;
create policy "refurb details admin" on refurbished_details for all using (public.is_admin());
drop policy if exists "refurb details public read passed" on refurbished_details;
create policy "refurb details public read passed" on refurbished_details for select
  using (qc_status = 'passed');

drop policy if exists "refurb serials owner" on refurbished_serials;
create policy "refurb serials owner" on refurbished_serials for all
  using (exists (select 1 from products p where p.id = product_id and p.supplier_id = auth.uid()))
  with check (exists (select 1 from products p where p.id = product_id and p.supplier_id = auth.uid()));
drop policy if exists "refurb serials admin" on refurbished_serials;
create policy "refurb serials admin" on refurbished_serials for all using (public.is_admin());
-- No public policy on refurbished_serials at all -- shoppers can never read it.

grant select, insert, update, delete on public.refurbished_details to authenticated;
grant select, insert, update, delete on public.refurbished_serials to authenticated;
grant select, insert, update on public.refurbished_details to service_role;
grant select, insert, update on public.refurbished_serials to service_role;
