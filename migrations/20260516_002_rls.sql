alter table public.courses enable row level security;
alter table public.tasks enable row level security;
alter table public.schedules enable row level security;
alter table public.sync_logs enable row level security;
alter table public.user_settings enable row level security;
alter table public.user_google_tokens enable row level security;
alter table public.user_brone_credentials enable row level security;

drop policy if exists courses_select_own on public.courses;
create policy courses_select_own
on public.courses
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists courses_insert_own on public.courses;
create policy courses_insert_own
on public.courses
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists courses_update_own on public.courses;
create policy courses_update_own
on public.courses
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists courses_delete_own on public.courses;
create policy courses_delete_own
on public.courses
for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists tasks_select_own on public.tasks;
create policy tasks_select_own
on public.tasks
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists tasks_insert_own on public.tasks;
create policy tasks_insert_own
on public.tasks
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists tasks_update_own on public.tasks;
create policy tasks_update_own
on public.tasks
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists tasks_delete_own on public.tasks;
create policy tasks_delete_own
on public.tasks
for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists schedules_select_own on public.schedules;
create policy schedules_select_own
on public.schedules
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists schedules_insert_own on public.schedules;
create policy schedules_insert_own
on public.schedules
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists schedules_update_own on public.schedules;
create policy schedules_update_own
on public.schedules
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists schedules_delete_own on public.schedules;
create policy schedules_delete_own
on public.schedules
for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists sync_logs_select_own on public.sync_logs;
create policy sync_logs_select_own
on public.sync_logs
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists user_settings_select_own on public.user_settings;
create policy user_settings_select_own
on public.user_settings
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists user_settings_upsert_own on public.user_settings;
create policy user_settings_upsert_own
on public.user_settings
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

