-- SmartBuyX — Returns: video proof, instant exchange, seller disputes, return score.

alter table return_requests
  add column if not exists video_url text,
  add column if not exists is_exchange boolean not null default false,
  add column if not exists disputed boolean not null default false,
  add column if not exists seller_notes text;

-- Sellers can view and annotate (dispute) return requests against their own products.
-- They cannot change status or amount — only admins resolve disputes.
drop policy if exists "returns seller read" on return_requests;
create policy "returns seller read" on return_requests for select
  using (exists (
    select 1 from order_items
    where order_items.id = return_requests.order_item_id
      and order_items.supplier_id = auth.uid()
  ));

drop policy if exists "returns seller dispute" on return_requests;
create policy "returns seller dispute" on return_requests for update
  using (exists (
    select 1 from order_items
    where order_items.id = return_requests.order_item_id
      and order_items.supplier_id = auth.uid()
  ))
  with check (exists (
    select 1 from order_items
    where order_items.id = return_requests.order_item_id
      and order_items.supplier_id = auth.uid()
  ));

-- Sellers may only touch disputed/seller_notes; status/amount/refunds stay admin-only.
create or replace function public.guard_seller_return_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() = old.user_id then
    return new; -- buyer cancelling their own return (existing behaviour)
  end if;
  if exists (
    select 1 from order_items
    where order_items.id = old.order_item_id and order_items.supplier_id = auth.uid()
  ) then
    new.status := old.status;
    new.amount := old.amount;
    new.resolved_at := old.resolved_at;
    new.video_url := old.video_url;
    new.is_exchange := old.is_exchange;
    return new;
  end if;
  return new; -- service_role (admin client) bypasses RLS entirely, this branch is unreachable for it
end; $$;

drop trigger if exists on_return_seller_update on return_requests;
create trigger on_return_seller_update
before update on return_requests
for each row execute function public.guard_seller_return_update();

-- ============== STORAGE: return proof (photo/video) bucket ==============
insert into storage.buckets (id, name, public)
values ('return-proof', 'return-proof', true)
on conflict (id) do nothing;

drop policy if exists "return proof public read" on storage.objects;
create policy "return proof public read" on storage.objects
  for select using (bucket_id = 'return-proof');

drop policy if exists "return proof authenticated write" on storage.objects;
create policy "return proof authenticated write" on storage.objects
  for insert to authenticated with check (bucket_id = 'return-proof');
