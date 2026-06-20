-- SmartBuyX — Phase 1 polish: GST billing, wallet refunds, cancellation.

-- ============== GST ON PRODUCTS ==============
alter table products
  add column if not exists gst_rate numeric(4,1) not null default 18,   -- % GST (prices are GST-inclusive)
  add column if not exists hsn_code text;

-- ============== ORDER CANCELLATION ==============
alter table orders
  add column if not exists cancelled_reason text,
  add column if not exists cancelled_at timestamptz;

-- ============== WALLET CREDIT (refunds / cashback) ==============
create or replace function public.credit_wallet(
  p_user uuid, p_amount numeric, p_kind wallet_txn_kind, p_reference text
) returns void language plpgsql security definer set search_path = public as $$
declare new_balance numeric;
begin
  insert into wallets (user_id, balance) values (p_user, p_amount)
  on conflict (user_id) do update set balance = wallets.balance + p_amount, updated_at = now()
  returning balance into new_balance;

  insert into wallet_transactions (user_id, kind, amount, reference, balance_after)
  values (p_user, p_kind, p_amount, p_reference, new_balance);
end; $$;

-- ============== STORAGE: product images bucket ==============
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Public read; authenticated sellers can upload/manage their own files.
drop policy if exists "product images public read" on storage.objects;
create policy "product images public read" on storage.objects
  for select using (bucket_id = 'product-images');

drop policy if exists "product images seller write" on storage.objects;
create policy "product images seller write" on storage.objects
  for insert to authenticated with check (bucket_id = 'product-images');

drop policy if exists "product images seller update" on storage.objects;
create policy "product images seller update" on storage.objects
  for update to authenticated using (bucket_id = 'product-images');

drop policy if exists "product images seller delete" on storage.objects;
create policy "product images seller delete" on storage.objects
  for delete to authenticated using (bucket_id = 'product-images');
