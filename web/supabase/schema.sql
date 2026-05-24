create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  google_id text unique,
  google_refresh_token text,
  brone_nim text,
  brone_password_encrypted text,
  created_at timestamptz not null default now()
);

create or replace function public.set_brone_credentials(user_id_param uuid, nim_param text, password_param text, secret_key text)
returns void
language plpgsql security definer
as $$
begin
  update public.users
  set brone_nim = nim_param,
      brone_password_encrypted = encode(encrypt(password_param::bytea, secret_key::bytea, 'aes'), 'hex')
  where id = user_id_param;
end;
$$;

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  code text,
  source text not null check (source in ('classroom','brone','manual')),
  classroom_course_id text,
  created_at timestamptz not null default now()
);

create unique index if not exists courses_user_source_classroom_course_id_uq
  on public.courses (user_id, source, classroom_course_id)
  where classroom_course_id is not null;

create table if not exists public.attendances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  total_meetings int not null default 0,
  attended_meetings int not null default 0,
  percentage numeric(5,2) not null default 0.00,
  last_synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, course_id)
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
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
  user_id uuid not null references public.users(id) on delete cascade,
  course_id uuid references public.courses(id) on delete set null,
  title text,
  day_of_week int not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  room text,
  lecturer text,
  source text not null check (source in ('brone','siam','manual')),
  is_recurring boolean default false,
  recurrence_rule text,
  google_calendar_event_id text,
  created_at timestamptz not null default now()
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

-- Function to decrypt Brone password
create or replace function public.get_decrypted_brone_password(
  user_id_param uuid,
  secret_key text
) returns text
language plpgsql
security definer
as $$
declare
  decrypted_pass text;
begin
  select pgp_sym_decrypt(brone_password_encrypted, secret_key)
  into decrypted_pass
  from public.users
  where id = user_id_param;
  
  return decrypted_pass;
end;
$$;
