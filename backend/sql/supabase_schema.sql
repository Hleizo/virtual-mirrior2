-- Virtual Mirror schema for Supabase
-- Run this in the Supabase SQL editor.

create table if not exists public.sessions (
  id text primary key,
  display_id integer unique,
  child_name text,
  child_age integer,
  child_height_cm numeric,
  child_weight_kg numeric,
  child_gender text,
  child_notes text,
  started_at timestamptz default now(),
  session_type text default 'initial',
  parent_session_id text references public.sessions(id) on delete set null
);

create index if not exists sessions_started_at_idx on public.sessions (started_at desc);
create index if not exists sessions_parent_session_id_idx on public.sessions (parent_session_id);

create table if not exists public.tasks (
  id text primary key,
  session_id text not null references public.sessions(id) on delete cascade,
  task_name text,
  duration_seconds numeric,
  status text,
  notes text
);

create index if not exists tasks_session_id_idx on public.tasks (session_id);

create table if not exists public.metrics (
  id text primary key,
  task_id text not null references public.tasks(id) on delete cascade,
  metric_name text,
  metric_value numeric
);

create index if not exists metrics_task_id_idx on public.metrics (task_id);

-- If you plan to query these tables directly from the Supabase client,
-- enable Row Level Security and add policies in Supabase.
