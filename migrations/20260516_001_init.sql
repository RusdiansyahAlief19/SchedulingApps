create extension if not exists pgcrypto;

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  code text,
  source text not null check (source in ('classroom','brone','manual')),
  classroom_course_id text,
  created_at timestamptz not null default now()
);

create unique index if not exists courses_user_source_classroom_course_id_uq
  on public.courses (user_id, source, classroom_course_id)
  where classroom_course_id is not null;

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid references public.courses(id) on delete set null,
  title text not null,
  description text,
  deadline timestamptz,
  status text not null default 'BELUM' check (status in ('BELUM','SEDANG','SELESAI')),
  source text not null check (source in ('classroom','brone','manual')),
  priority text not null default 'NORMAL' check (priority in ('LOW','NORMAL','HIGH')),
  external_url text,
  classroom_coursework_id text,
  submission_state text,
  google_calendar_event_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists tasks_user_source_classroom_coursework_id_uq
  on public.tasks (user_id, source, classroom_coursework_id)
  where classroom_coursework_id is not null;

create index if not exists tasks_user_deadline_idx on public.tasks (user_id, deadline);
create index if not exists tasks_user_status_idx on public.tasks (user_id, status);

create table if not exists public.schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid references public.courses(id) on delete set null,
  day_of_week int not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  room text,
  lecturer text,
  source text not null check (source in ('brone','manual')),
  created_at timestamptz not null default now()
);

create table if not exists public.sync_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  source text not null check (source in ('classroom','brone')),
  last_synced_at timestamptz not null default now(),
  status text not null check (status in ('SUCCESS','FAILED')),
  message text
);

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  auto_sync_classroom boolean not null default true,
  auto_sync_brone boolean not null default true,
  auto_sync_manual boolean not null default true,
  default_reminders jsonb not null default '[{"unit":"day","value":1},{"unit":"hour","value":2}]'::jsonb,
  theme text not null default 'system' check (theme in ('light','dark','system')),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_google_tokens (
  user_id uuid primary key references auth.users(id) on delete cascade,
  refresh_token_encrypted text not null,
  access_token text,
  access_token_expires_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.user_brone_credentials (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nim text not null,
  password_encrypted text not null,
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at
before update on public.tasks
for each row
execute function public.set_updated_at();

drop trigger if exists user_settings_set_updated_at on public.user_settings;
create trigger user_settings_set_updated_at
before update on public.user_settings
for each row
execute function public.set_updated_at();

drop trigger if exists user_google_tokens_set_updated_at on public.user_google_tokens;
create trigger user_google_tokens_set_updated_at
before update on public.user_google_tokens
for each row
execute function public.set_updated_at();

drop trigger if exists user_brone_credentials_set_updated_at on public.user_brone_credentials;
create trigger user_brone_credentials_set_updated_at
before update on public.user_brone_credentials
for each row
execute function public.set_updated_at();
