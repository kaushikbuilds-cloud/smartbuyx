-- inventory only ever had a supplier/admin-only policy (0001_init.sql) --
-- meaning any other customer's product-page query joining inventory(quantity)
-- was silently blocked by RLS and fell back to 0, showing "Out of stock" for
-- everyone except the product's own seller or an admin. Stock levels are
-- public storefront information; writes remain restricted to the existing
-- "inventory supplier" policy.
create policy "inventory public read" on inventory for select using (true);
