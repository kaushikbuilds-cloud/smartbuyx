-- Price history tracking -- foundation for price trend/prediction features.
-- NOTE: true "price prediction" needs weeks/months of accumulated data points
-- to mean anything; this migration only starts the data collection and
-- supports an honest "trend so far" read (up/down/at lowest recorded), not a
-- forecast. Revisit prediction once there's real history to learn from.

create table if not exists price_history (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  price numeric(12,2) not null,
  recorded_at timestamptz not null default now()
);
create index if not exists price_history_product_idx on price_history (product_id, recorded_at desc);

alter table price_history enable row level security;
drop policy if exists "price history public read" on price_history;
create policy "price history public read" on price_history for select using (true);

grant select on public.price_history to authenticated, anon;
grant select, insert on public.price_history to service_role;

-- Log a row whenever a product's price actually changes.
create or replace function public.log_price_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- OLD isn't assigned on INSERT -- referencing it unconditionally would error.
  if tg_op = 'INSERT' or new.base_price is distinct from old.base_price then
    insert into price_history (product_id, price) values (new.id, new.base_price);
  end if;
  return new;
end; $$;

drop trigger if exists price_history_on_change on products;
create trigger price_history_on_change
  after insert or update of base_price on products
  for each row execute function public.log_price_change();

-- Backfill: seed one history row at the current price for every existing
-- active product so the feature has at least one data point immediately.
insert into price_history (product_id, price)
select id, base_price from products
where status = 'active'
  and not exists (select 1 from price_history ph where ph.product_id = products.id);
