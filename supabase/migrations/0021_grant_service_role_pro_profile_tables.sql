-- reviewProApplication now upserts into supplier_profiles/architect_profiles/
-- contractor_profiles on approval (0020 only granted SELECT/UPDATE on
-- supplier_profiles, no INSERT anywhere) -- an upsert needs INSERT too.
grant select, insert, update on public.supplier_profiles to service_role;
grant select, insert, update on public.architect_profiles to service_role;
grant select, insert, update on public.contractor_profiles to service_role;
