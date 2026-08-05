-- New supplier pricing needs a 4th tier between Starter and Premium.
-- ALTER TYPE ... ADD VALUE cannot be used in the same transaction it's added
-- in (Postgres restriction), so this is its own migration, run and committed
-- before 0038 (which seeds rows using 'growth').
alter type plan_tier add value if not exists 'growth';
