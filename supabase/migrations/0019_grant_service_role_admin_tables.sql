-- The service-role client (used by every admin/queries.ts query) bypasses RLS
-- entirely, but still needs base table GRANTs, which were never issued for
-- these tables. Confirmed via Vercel runtime logs: every admin query fails
-- with 42501 "permission denied for table X", each carrying Supabase's own
-- hint naming the exact grant needed.
grant select on public.profiles to service_role;
grant select on public.orders to service_role;
grant select on public.products to service_role;
grant select on public.pro_applications to service_role;
grant select on public.audit_logs to service_role;
grant select on public.return_requests to service_role;
