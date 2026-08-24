create table if not exists public.calculations (
  id text primary key,
  input_hash text not null,
  masked_input text not null,
  input_length integer not null check (input_length between 8 and 64),
  user_id text not null default 'anonymous',
  locale text not null default 'en' check (locale in ('en', 'zh')),
  source text not null default 'web',
  created_at timestamptz not null default now()
);
create index if not exists calculations_created_at_idx on public.calculations (created_at desc);
create index if not exists calculations_input_hash_idx on public.calculations (input_hash);
alter table public.calculations enable row level security;
revoke all on public.calculations from anon, authenticated;

create table if not exists public.payments (
  id text primary key,
  merchant_order_id text not null unique,
  airwallex_session_id text,
  amount numeric not null,
  currency text not null,
  status text not null default 'pending',
  customer_email text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index if not exists payments_status_idx on public.payments (status);
create index if not exists payments_created_at_idx on public.payments (created_at desc);
alter table public.payments enable row level security;
revoke all on public.payments from anon, authenticated;
