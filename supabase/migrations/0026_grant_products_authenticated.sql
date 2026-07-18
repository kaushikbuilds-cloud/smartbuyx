-- Sellers create/manage listings through the RLS-respecting client (the
-- `authenticated` role). RLS policies for this already exist ("products seller
-- write", "variants supplier write", "inventory supplier"), but the base
-- table-level GRANTs were never issued -- so every create-product attempt
-- failed with "permission denied for table products" before RLS was even
-- evaluated. Same gap previously fixed for pro_applications / supplier_profiles.
grant select, insert, update, delete on public.products to authenticated;
grant select, insert, update, delete on public.product_variants to authenticated;
grant select, insert, update on public.inventory to authenticated;
