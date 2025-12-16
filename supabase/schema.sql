-- Plasticity game session and event logging schema

-- Ensure required extension for UUID generation is available
create extension if not exists pgcrypto;

-- Game sessions played by authenticated users
create table if not exists public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  game_id text not null,
  difficulty_level integer,
  difficulty_end integer,
  variant text,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  duration_ms integer,
  score integer,
  accuracy double precision,
  completed boolean not null default false,
  summary jsonb,
  extra jsonb,
  app_version text,
  game_version text,
  metadata jsonb
);

create index if not exists game_sessions_user_game_started_idx
  on public.game_sessions (user_id, game_id, started_at);

-- Per-session event log entries
create table if not exists public.game_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.game_sessions(id) on delete cascade,
  event_type text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists game_events_session_created_idx
  on public.game_events (session_id, created_at);

-- Canonical per-trial records for results payloads
create table if not exists public.game_trials (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.game_sessions(id) on delete cascade,
  trial_index integer not null,
  trial_data jsonb not null,
  score jsonb not null,
  created_at timestamptz not null default now(),
  constraint game_trials_session_idx_unique unique (session_id, trial_index)
);

create index if not exists game_trials_session_idx
  on public.game_trials (session_id, trial_index);

-- Row level security policies
alter table public.game_sessions enable row level security;
alter table public.game_events enable row level security;
alter table public.game_trials enable row level security;

-- Drop existing policies if they exist so this script can be re-run safely
drop policy if exists game_sessions_owner_select  on public.game_sessions;
drop policy if exists game_sessions_owner_insert  on public.game_sessions;
drop policy if exists game_sessions_owner_update  on public.game_sessions;
drop policy if exists game_events_owner_select    on public.game_events;
drop policy if exists game_events_owner_insert    on public.game_events;
drop policy if exists game_trials_owner_select   on public.game_trials;
drop policy if exists game_trials_owner_insert   on public.game_trials;
drop policy if exists game_trials_owner_update   on public.game_trials;
drop policy if exists game_trials_owner_delete   on public.game_trials;

-- game_sessions: allow owner to select/insert/update
create policy game_sessions_owner_select
  on public.game_sessions
  for select
  using (user_id = auth.uid());

create policy game_sessions_owner_insert
  on public.game_sessions
  for insert
  with check (user_id = auth.uid());

create policy game_sessions_owner_update
  on public.game_sessions
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- game_events: allow select/insert when tied to the user's session
create policy game_events_owner_select
  on public.game_events
  for select
  using (exists (
    select 1 from public.game_sessions s
    where s.id = game_events.session_id
      and s.user_id = auth.uid()
  ));

create policy game_events_owner_insert
  on public.game_events
  for insert
  with check (exists (
    select 1 from public.game_sessions s
    where s.id = game_events.session_id
      and s.user_id = auth.uid()
  ));

create policy game_trials_owner_select
  on public.game_trials
  for select
  using (exists (
    select 1 from public.game_sessions s
    where s.id = game_trials.session_id
      and s.user_id = auth.uid()
  ));

create policy game_trials_owner_insert
  on public.game_trials
  for insert
  with check (exists (
    select 1 from public.game_sessions s
    where s.id = game_trials.session_id
      and s.user_id = auth.uid()
  ));

create policy game_trials_owner_update
  on public.game_trials
  for update
  using (exists (
    select 1 from public.game_sessions s
    where s.id = game_trials.session_id
      and s.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.game_sessions s
    where s.id = game_trials.session_id
      and s.user_id = auth.uid()
  ));

create policy game_trials_owner_delete
  on public.game_trials
  for delete
  using (exists (
    select 1 from public.game_sessions s
    where s.id = game_trials.session_id
      and s.user_id = auth.uid()
  ));
