-- Post-approval seller verification: payout (bank/UPI) details + KYC document
-- uploads. Both are sensitive, so:
--   * strict RLS -- an owner sees only their own rows; admins get read (plus
--     KYC status update) but nothing cross-tenant.
--   * KYC files live in a PRIVATE storage bucket, reachable only via short
--     signed URLs; each seller can only touch files under their own uid/ prefix.
-- NOTE (follow-up): raw bank account numbers are stored RLS-protected but NOT
-- column-encrypted. For production, tokenize payouts via the payment provider
-- (e.g. Razorpay Fund Accounts) instead of storing raw account numbers.

create table if not exists seller_payout_details (
  user_id uuid primary key references profiles(id) on delete cascade,
  account_holder text not null,
  bank_name text not null,
  account_number text not null,
  ifsc text not null,
  upi_id text,
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table seller_payout_details enable row level security;
drop policy if exists "payout self" on seller_payout_details;
create policy "payout self" on seller_payout_details for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "payout admin read" on seller_payout_details;
create policy "payout admin read" on seller_payout_details for select using (public.is_admin());

create table if not exists seller_kyc_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  doc_type text not null,
  storage_path text not null,
  status text not null default 'pending',  -- pending | approved | rejected
  created_at timestamptz not null default now()
);
alter table seller_kyc_documents enable row level security;
drop policy if exists "kyc self" on seller_kyc_documents;
create policy "kyc self" on seller_kyc_documents for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "kyc admin read" on seller_kyc_documents;
create policy "kyc admin read" on seller_kyc_documents for select using (public.is_admin());
drop policy if exists "kyc admin update" on seller_kyc_documents;
create policy "kyc admin update" on seller_kyc_documents for update using (public.is_admin());

grant select, insert, update on seller_payout_details to authenticated;
grant select, insert, update, delete on seller_kyc_documents to authenticated;
grant select, insert, update on seller_payout_details to service_role;
grant select, insert, update, delete on seller_kyc_documents to service_role;

-- Private bucket for KYC documents.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('kyc-docs', 'kyc-docs', false, 10 * 1024 * 1024, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- A seller can read/write only files under their own uid/ prefix; admins read all.
drop policy if exists "kyc docs self read" on storage.objects;
create policy "kyc docs self read" on storage.objects for select to authenticated
  using (bucket_id = 'kyc-docs' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "kyc docs self write" on storage.objects;
create policy "kyc docs self write" on storage.objects for insert to authenticated
  with check (bucket_id = 'kyc-docs' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "kyc docs admin read" on storage.objects;
create policy "kyc docs admin read" on storage.objects for select to authenticated
  using (bucket_id = 'kyc-docs' and public.is_admin());
