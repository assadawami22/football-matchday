-- Football Matchday — Supabase schema
-- Run this once in the Supabase SQL editor (Project > SQL Editor > New query > paste > Run)

create extension if not exists "pgcrypto";

-- Every known player in the WhatsApp group (seed once, grows slowly over time)
create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  phone text,
  status text not null default 'normal' check (status in ('normal', 'locked')),
  balance numeric not null default 0, -- positive = amount the player still owes (late fees)
  created_at timestamptz not null default now()
);

-- One row per match (a specific Sunday or Tuesday session)
create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  match_date date not null,
  day_type text not null, -- free text label, e.g. "Sunday", "Friday Night" — not restricted to specific days
  status text not null default 'open' check (status in ('open', 'closed')),
  main_capacity int not null default 18,
  bench_capacity int not null default 5,
  match_fee numeric not null default 15,
  created_at timestamptz not null default now()
);

-- One row per player per match
create table if not exists registrations (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  match_id uuid not null references matches(id) on delete cascade,
  type text not null default 'bench' check (type in ('main', 'bench')),
  paid boolean not null default false,
  approved boolean not null default false,
  rejected boolean not null default false,
  created_at timestamptz not null default now(),
  unique (player_id, match_id)
);

-- Requests from the registration page to add a name not yet on the roster
create table if not exists player_add_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

-- Late-fee payment claims made from the /status page, waiting on admin approval
create table if not exists late_fee_payments (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  amount numeric not null,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

-- Simple key/value config table (match fee default, late fee amount, etc.)
create table if not exists settings (
  key text primary key,
  value text not null
);

insert into settings (key, value) values
  ('match_fee', '15'),
  ('late_fee', '10')
on conflict (key) do nothing;

create index if not exists idx_registrations_match on registrations(match_id);
create index if not exists idx_registrations_player on registrations(player_id);

-- Row Level Security: locked down. All access goes through server-side API
-- routes using the Supabase service role key, which bypasses RLS entirely.
-- This keeps the app simple (no client-side Supabase calls, no public anon
-- access) which is appropriate for a private, invite-only group.
alter table players enable row level security;
alter table matches enable row level security;
alter table registrations enable row level security;
alter table player_add_requests enable row level security;
alter table late_fee_payments enable row level security;
alter table settings enable row level security;
-- No policies are created on purpose: without a policy, only the service
-- role key (used server-side only) can read/write these tables.
