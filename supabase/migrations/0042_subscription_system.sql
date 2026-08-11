-- Full subscription/feature-gating system: usage tracking, enterprise
-- services, and Customer + revised Builder/Architect plan tiers. Reuses the
-- existing plans/subscriptions tables (0003) and PayU billing flow rather
-- than creating parallel infrastructure.

alter type plan_audience add value if not exists 'customer';
