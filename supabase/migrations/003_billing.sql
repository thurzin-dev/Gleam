-- ============================================================
-- Gleam QC — Billing / subscription columns on organizations
-- ============================================================

alter table organizations
  add column if not exists plan text not null default 'trial'
    check (plan in ('trial', 'starter', 'growth', 'pro')),
  add column if not exists trial_ends_at timestamptz not null default (now() + interval '14 days'),
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists subscription_status text not null default 'trialing',
  add column if not exists current_period_end timestamptz;
