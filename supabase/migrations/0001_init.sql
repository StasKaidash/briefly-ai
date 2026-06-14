-- briefly-ai · initial schema
-- Run via Supabase SQL Editor (Project → SQL → New query → paste → Run).

-- ---------------------------------------------------------------------------
-- profiles: 1:1 with auth.users
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- briefs
-- ---------------------------------------------------------------------------
create table public.briefs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  url text not null,
  title text not null,
  byline text,
  tldr text not null default '',          -- 3 sentences
  key_points text[] not null default '{}',
  tags text[] not null default '{}',
  reading_time_min int,                   -- estimated original reading time
  status text not null default 'pending', -- 'pending' | 'ready' | 'failed'
  error text,
  created_at timestamptz not null default now()
);

create index briefs_user_id_created_at_idx on public.briefs (user_id, created_at desc);
create index briefs_tags_idx on public.briefs using gin (tags);

-- ---------------------------------------------------------------------------
-- rate_limits (token-bucket-ish: one row per user per minute window)
-- Used by the create-brief server action to cap at 10/min/user.
-- ---------------------------------------------------------------------------
create table public.rate_limits (
  user_id uuid not null references auth.users(id) on delete cascade,
  bucket_started_at timestamptz not null,
  count int not null default 0,
  primary key (user_id, bucket_started_at)
);

create index rate_limits_bucket_idx on public.rate_limits (bucket_started_at);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles    enable row level security;
alter table public.briefs      enable row level security;
alter table public.rate_limits enable row level security;

create policy "profiles: self read" on public.profiles
  for select using (auth.uid() = id);

create policy "briefs: owner all" on public.briefs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "rate_limits: owner all" on public.rate_limits
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Auto-create profile on signup
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
