-- SmartBuyX — cache AI-generated review summaries on products.

alter table products
  add column if not exists ai_review_summary jsonb,
  add column if not exists ai_review_summary_count int not null default 0;
