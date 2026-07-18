-- order_items had a select policy but NO insert policy at all -- with RLS
-- enabled, that means every insert was denied by default. checkout-actions.ts
-- inserts order_items as the buyer (RLS-respecting client) right after
-- creating the parent order for themselves, so allow that: the buyer may add
-- items only to an order they own.
create policy "order items buyer insert" on order_items for insert
  with check (exists(select 1 from orders o where o.id = order_id and o.buyer_id = auth.uid()));

-- Same gap on payments: checkout-actions.ts inserts the Razorpay payment row
-- as the buyer right after order_items, immediately hitting the identical
-- missing-insert-policy wall.
create policy "payments buyer insert" on payments for insert
  with check (exists(select 1 from orders o where o.id = order_id and o.buyer_id = auth.uid()));
