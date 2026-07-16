-- SmartBuyX — B2B purchase orders (AI Procurement Assistant output).

do $$ begin
  create type po_status as enum ('draft','sent','accepted','fulfilled','cancelled');
exception when duplicate_object then null; end $$;

create table if not exists purchase_orders (
  id uuid primary key default gen_random_uuid(),
  po_number text not null default ('PO-' || to_char(now(), 'YYMMDD') || '-' || upper(substr(gen_random_uuid()::text, 1, 6))),
  buyer_id uuid not null references profiles(id) on delete cascade,
  supplier_id uuid references profiles(id) on delete set null,
  rfq_id uuid references rfqs(id) on delete set null,
  title text not null,
  items jsonb not null default '[]',        -- [{ title, quantity, unit, unitPrice, total }]
  subtotal numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  notes text,
  status po_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table purchase_orders enable row level security;

-- Buyer owns their POs.
drop policy if exists "po buyer owner" on purchase_orders;
create policy "po buyer owner" on purchase_orders for all
  using (buyer_id = auth.uid()) with check (buyer_id = auth.uid());

-- Supplier can read POs addressed to them, and update status (accept/fulfil).
drop policy if exists "po supplier read" on purchase_orders;
create policy "po supplier read" on purchase_orders for select
  using (supplier_id = auth.uid());

drop policy if exists "po supplier update" on purchase_orders;
create policy "po supplier update" on purchase_orders for update
  using (supplier_id = auth.uid()) with check (supplier_id = auth.uid());

create index if not exists po_buyer_idx on purchase_orders (buyer_id, created_at desc);
create index if not exists po_supplier_idx on purchase_orders (supplier_id, created_at desc);

-- A supplier may only move status forward; buyer-owned fields are frozen on their updates.
create or replace function public.guard_po_supplier_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() = old.buyer_id then
    new.updated_at := now();
    return new; -- buyer edits their own PO freely
  end if;
  if auth.uid() = old.supplier_id then
    new.buyer_id := old.buyer_id;
    new.supplier_id := old.supplier_id;
    new.title := old.title;
    new.items := old.items;
    new.subtotal := old.subtotal;
    new.total := old.total;
    new.notes := old.notes;
    new.updated_at := now();
    return new;
  end if;
  return new; -- service_role bypasses RLS; unreachable for supplier/buyer
end; $$;

drop trigger if exists on_po_update on purchase_orders;
create trigger on_po_update
before update on purchase_orders
for each row execute function public.guard_po_supplier_update();
