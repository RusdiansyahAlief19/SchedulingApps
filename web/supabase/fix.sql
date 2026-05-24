alter table public.courses drop constraint if exists courses_user_source_classroom_course_id_uq;
drop index if exists courses_user_source_classroom_course_id_uq;
alter table public.courses add constraint courses_user_source_classroom_course_id_uq unique (user_id, source, classroom_course_id);

alter table public.tasks drop constraint if exists tasks_user_source_classroom_coursework_id_uq;
drop index if exists tasks_user_source_classroom_coursework_id_uq;
alter table public.tasks add constraint tasks_user_source_classroom_coursework_id_uq unique (user_id, source, classroom_coursework_id);
