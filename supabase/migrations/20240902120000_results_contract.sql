-- Migration: results contract and trials table
-- Adds optional session metadata columns and a dedicated trials table while preserving existing data.

-- Extend game_sessions with optional metadata fields used by ResultsService
alter table if exists public.game_sessions
  add column if not exists difficulty_end integer,
  add column if not exists summary jsonb,
  add column if not exists duration_ms integer,
  add column if not exists app_version text,
  add column if not exists game_version text,
  add column if not exists metadata jsonb;

-- Dedicated trials table for canonical per-trial payloads
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

-- Row level security policies for trials
alter table public.game_trials enable row level security;

drop policy if exists game_trials_owner_select on public.game_trials;
drop policy if exists game_trials_owner_insert on public.game_trials;
drop policy if exists game_trials_owner_update on public.game_trials;

drop policy if exists game_trials_owner_delete on public.game_trials;

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
