-- SmartBuyX — security fix: "profile public pros" exposed phone, date_of_birth,
-- and preferences for every supplier/architect/contractor to anyone with just
-- the anon key (RLS is row-level, so a SELECT * was fully permitted). No app
-- code actually depends on this — public listings correctly read from
-- supplier_profiles/architect_profiles/contractor_profiles instead, which
-- already have their own narrow, business-safe public read policies.
--
-- The one legitimate cross-user read (consultation counterparty name lookup
-- in features/consultations/queries.ts) is preserved via a policy scoped to
-- an actual consultation relationship, not "any pro, to anyone".

drop policy if exists "profile public pros" on profiles;

drop policy if exists "profile consultation counterparty" on profiles;
create policy "profile consultation counterparty" on profiles for select
  using (exists (
    select 1 from consultations
    where (consultations.customer_id = auth.uid() and consultations.pro_id = profiles.id)
       or (consultations.pro_id = auth.uid() and consultations.customer_id = profiles.id)
  ));
