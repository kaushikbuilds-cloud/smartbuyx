-- SmartBuyX — fix: pro_applications has correct RLS policies but was missing
-- the base table-level GRANT to the authenticated role. RLS only restricts
-- which rows a role can see/touch; the role still needs a GRANT on the table
-- itself before RLS is even evaluated, or every operation fails with
-- "permission denied for table pro_applications" regardless of policy.
--
-- This went unnoticed because the only prior write path (admin approval,
-- reviewProApplication) uses the service-role client, which bypasses both
-- grants and RLS. The new self-service submitProApplication action correctly
-- uses the RLS-respecting client, which is what surfaced the gap.

grant select, insert on public.pro_applications to authenticated;
