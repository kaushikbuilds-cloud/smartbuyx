-- Store branding for the public supplier storefront.
alter table supplier_profiles add column if not exists store_logo_url text;

-- Sellers manage their own supplier_profiles row (RLS policy "supplier profile
-- self" already exists), but this project doesn't rely on Supabase's default
-- grants, so make the table-level UPDATE grant explicit.
grant select, update on public.supplier_profiles to authenticated;
