-- 0019 only granted SELECT to service_role. Every write path in
-- features/admin/actions.ts (approve/reject applications, role changes,
-- suspensions, product moderation, GST verification, audit log) also needs
-- INSERT/UPDATE, which was still missing -- these actions were failing
-- silently (errors discarded, same anti-pattern queries.ts had before the
-- logIfError fix).
grant update on public.profiles to service_role;
grant update on public.products to service_role;
grant update on public.pro_applications to service_role;
grant select, update on public.supplier_profiles to service_role;
grant insert on public.audit_logs to service_role;
