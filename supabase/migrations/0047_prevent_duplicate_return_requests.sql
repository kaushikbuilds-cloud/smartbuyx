-- Defense-in-depth against duplicate return_requests for the same
-- order_item_id: the app now checks for an existing non-cancelled request
-- before creating a new one, but that check-then-insert is still racy under
-- concurrent requests. A partial unique index closes that race at the DB
-- level -- at most one non-cancelled return_requests row per order_item_id,
-- so the same item can't be refunded (returnless or otherwise) more than
-- once by resubmitting the same form repeatedly or in parallel.
create unique index if not exists return_requests_one_active_per_item
  on return_requests (order_item_id)
  where status <> 'cancelled';
