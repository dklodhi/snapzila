-- ============================================================
-- SnapZila — Migration 20261116000008
-- Exams + Exam Sessions + Course Masters + Course Offerings
-- ============================================================
-- Model (per old project analysis):
--   Exam (catalog/evergreen) → ExamSession (time-bound instance)
--   CourseMaster (catalog) → CourseOffering (institution-specific)
--   Live updates + guides + dates reuse existing child tables
--   (event_updates/event_guides/event_dates) with added exam_session_id
--   + CHECK constraint ensuring exactly one parent is set.
-- ============================================================

-- 0. Enums
do $$
begin
  if not exists (select 1 from pg_type where typname = 'exam_type') then
    create type public.exam_type as enum (
      'entrance', 'competitive', 'certification', 'recruitment',
      'eligibility', 'board'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'exam_level') then
    create type public.exam_level as enum ('national', 'state', 'institutional');
  end if;
  if not exists (select 1 from pg_type where typname = 'exam_status') then
    create type public.exam_status as enum ('draft', 'published', 'unpublished');
  end if;
  if not exists (select 1 from pg_type where typname = 'course_level') then
    create type public.course_level as enum (
      'undergraduate', 'postgraduate', 'diploma', 'certificate',
      'doctoral', 'school'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'course_status') then
    create type public.course_status as enum ('draft', 'published', 'unpublished');
  end if;
end$$;

-- ============================================================
-- 1. exams (catalog — evergreen info about an exam)
-- ============================================================
create table if not exists public.exams (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  name            text not null,
  name_hi         text,
  full_name       text,
  conducting_body text,
  exam_type       public.exam_type not null default 'competitive',
  level           public.exam_level not null default 'national',
  frequency       text not null default 'yearly',
  description     text,
  description_hi  text,
  eligibility     jsonb default '{}'::jsonb,
  exam_mode       text not null default 'online',
  duration_minutes integer,
  total_questions integer,
  total_marks     integer,
  marking_scheme  text,
  sections        jsonb,
  languages       text[] default array[]::text[],
  official_website text,
  logo_url        text,
  status          public.exam_status not null default 'draft',
  published_at    timestamptz,
  meta_title      text,
  meta_description text,
  tags            text[] default array[]::text[],
  created_by      uuid references public.team_members(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);

create index if not exists exams_status_idx on public.exams(status, published_at desc nulls last) where deleted_at is null;
create index if not exists exams_type_idx on public.exams(exam_type);
create index if not exists exams_level_idx on public.exams(level);

drop trigger if exists exams_set_updated_at on public.exams;
create trigger exams_set_updated_at before update on public.exams
  for each row execute function public.set_updated_at();

alter table public.exams enable row level security;
drop policy if exists "exams: public read published" on public.exams;
create policy "exams: public read published" on public.exams for select
  using (status = 'published' and deleted_at is null);
drop policy if exists "exams: team read all" on public.exams;
create policy "exams: team read all" on public.exams for select to authenticated
  using (public.is_team_member());
drop policy if exists "exams: team write" on public.exams;
create policy "exams: team write" on public.exams for all to authenticated
  using (public.is_team_member()) with check (public.is_team_member());

-- ============================================================
-- 2. exam_sessions (time-bound instance — e.g. MP Board 10th 2026)
-- ============================================================
create table if not exists public.exam_sessions (
  id              uuid primary key default gen_random_uuid(),
  exam_id         uuid not null references public.exams(id) on delete cascade,
  year            integer not null,
  session_slug    text not null,
  session_label   text not null,
  slug            text not null,
  notification_date date,
  application_start date,
  application_end   date,
  exam_date         date,
  admit_card_url    text,
  result_date       date,
  result_url        text,
  apply_link        text,
  auto_status       text,
  status            public.exam_status not null default 'draft',
  published_at      timestamptz,
  meta_description  text,
  created_by        uuid references public.team_members(id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create unique index if not exists exam_sessions_unique_idx
  on public.exam_sessions(exam_id, year, session_slug);
create unique index if not exists exam_sessions_slug_idx
  on public.exam_sessions(exam_id, slug);
create index if not exists exam_sessions_status_idx on public.exam_sessions(status, exam_date);
create index if not exists exam_sessions_year_idx on public.exam_sessions(year, exam_date);

drop trigger if exists exam_sessions_set_updated_at on public.exam_sessions;
create trigger exam_sessions_set_updated_at before update on public.exam_sessions
  for each row execute function public.set_updated_at();

alter table public.exam_sessions enable row level security;
drop policy if exists "exam_sessions: public read published" on public.exam_sessions;
create policy "exam_sessions: public read published" on public.exam_sessions for select
  using (
    status = 'published'
    and exists (select 1 from public.exams e where e.id = exam_sessions.exam_id and e.status = 'published' and e.deleted_at is null)
  );
drop policy if exists "exam_sessions: team read all" on public.exam_sessions;
create policy "exam_sessions: team read all" on public.exam_sessions for select to authenticated
  using (public.is_team_member());
drop policy if exists "exam_sessions: team write" on public.exam_sessions;
create policy "exam_sessions: team write" on public.exam_sessions for all to authenticated
  using (public.is_team_member()) with check (public.is_team_member());

-- ============================================================
-- 3. Add exam_session_id to existing child tables (event_updates, event_guides, event_dates)
--    + CHECK constraint: exactly one parent (event_id OR exam_session_id)
-- ============================================================

-- event_updates
alter table public.event_updates add column if not exists exam_session_id uuid references public.exam_sessions(id) on delete cascade;
do $$
begin
  if not exists (select 1 from information_schema.table_constraints where constraint_name = 'event_updates_parent_check' and table_name = 'event_updates') then
    alter table public.event_updates add constraint event_updates_parent_check check (
      (event_id is not null and exam_session_id is null) or
      (event_id is null and exam_session_id is not null)
    );
  end if;
end$$;
create index if not exists event_updates_exam_session_idx on public.event_updates(exam_session_id, published_at desc) where exam_session_id is not null;

-- RLS for exam_session updates: public read if session's exam is published
drop policy if exists "event_updates: public read via published exam session" on public.event_updates;
create policy "event_updates: public read via published exam session" on public.event_updates for select
  using (
    exam_session_id is not null
    and exists (
      select 1 from public.exam_sessions es
      join public.exams e on e.id = es.exam_id
      where es.id = event_updates.exam_session_id
        and es.status = 'published'
        and e.status = 'published'
        and e.deleted_at is null
    )
  );
drop policy if exists "event_updates: team write for exam sessions" on public.event_updates;
create policy "event_updates: team write for exam sessions" on public.event_updates for all to authenticated
  using (exam_session_id is not null and public.is_team_member())
  with check (exam_session_id is not null and public.is_team_member());

-- event_guides
alter table public.event_guides add column if not exists exam_session_id uuid references public.exam_sessions(id) on delete cascade;
do $$
begin
  if not exists (select 1 from information_schema.table_constraints where constraint_name = 'event_guides_parent_check' and table_name = 'event_guides') then
    alter table public.event_guides add constraint event_guides_parent_check check (
      (event_id is not null and exam_session_id is null) or
      (event_id is null and exam_session_id is not null)
    );
  end if;
end$$;
create index if not exists event_guides_exam_session_idx on public.event_guides(exam_session_id, sort_order) where exam_session_id is not null;

drop policy if exists "event_guides: public read via published exam session" on public.event_guides;
create policy "event_guides: public read via published exam session" on public.event_guides for select
  using (
    exam_session_id is not null
    and exists (select 1 from public.exam_sessions es join public.exams e on e.id = es.exam_id where es.id = event_guides.exam_session_id and es.status = 'published' and e.status = 'published' and e.deleted_at is null)
  );
drop policy if exists "event_guides: team write for exam sessions" on public.event_guides;
create policy "event_guides: team write for exam sessions" on public.event_guides for all to authenticated
  using (exam_session_id is not null and public.is_team_member())
  with check (exam_session_id is not null and public.is_team_member());

-- event_dates
alter table public.event_dates add column if not exists exam_session_id uuid references public.exam_sessions(id) on delete cascade;
do $$
begin
  if not exists (select 1 from information_schema.table_constraints where constraint_name = 'event_dates_parent_check' and table_name = 'event_dates') then
    alter table public.event_dates add constraint event_dates_parent_check check (
      (event_id is not null and exam_session_id is null) or
      (event_id is null and exam_session_id is not null)
    );
  end if;
end$$;
create index if not exists event_dates_exam_session_idx on public.event_dates(exam_session_id, sort_order) where exam_session_id is not null;

drop policy if exists "event_dates: public read via published exam session" on public.event_dates;
create policy "event_dates: public read via published exam session" on public.event_dates for select
  using (
    exam_session_id is not null
    and exists (select 1 from public.exam_sessions es join public.exams e on e.id = es.exam_id where es.id = event_dates.exam_session_id and es.status = 'published' and e.status = 'published' and e.deleted_at is null)
  );
drop policy if exists "event_dates: team write for exam sessions" on public.event_dates;
create policy "event_dates: team write for exam sessions" on public.event_dates for all to authenticated
  using (exam_session_id is not null and public.is_team_member())
  with check (exam_session_id is not null and public.is_team_member());

-- ============================================================
-- 4. Add 'exam' + 'exam-session' to follow_target_type enum
-- ============================================================
alter type public.follow_target_type add value if not exists 'exam';
alter type public.follow_target_type add value if not exists 'exam-session';

-- ============================================================
-- 5. course_masters (catalog — e.g. B.Tech CSE, BCA, MBBS)
-- ============================================================
create table if not exists public.course_masters (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  name            text not null,
  name_hi         text,
  full_name       text,
  level           public.course_level not null default 'undergraduate',
  stream          text,
  description     text,
  description_hi  text,
  duration        text,
  duration_months_min integer,
  duration_months_max integer,
  eligibility     text,
  career_prospects text,
  specializations text[] default array[]::text[],
  typical_entrance_exams text[] default array[]::text[],
  fees_min_total  integer,
  fees_max_total  integer,
  fees_avg_total  integer,
  status          public.course_status not null default 'draft',
  published_at    timestamptz,
  meta_title      text,
  meta_description text,
  created_by      uuid references public.team_members(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);

create index if not exists course_masters_status_idx on public.course_masters(status) where deleted_at is null;
create index if not exists course_masters_level_idx on public.course_masters(level);
create index if not exists course_masters_stream_idx on public.course_masters(stream);

drop trigger if exists course_masters_set_updated_at on public.course_masters;
create trigger course_masters_set_updated_at before update on public.course_masters
  for each row execute function public.set_updated_at();

alter table public.course_masters enable row level security;
drop policy if exists "course_masters: public read published" on public.course_masters;
create policy "course_masters: public read published" on public.course_masters for select
  using (status = 'published' and deleted_at is null);
drop policy if exists "course_masters: team read all" on public.course_masters;
create policy "course_masters: team read all" on public.course_masters for select to authenticated
  using (public.is_team_member());
drop policy if exists "course_masters: team write" on public.course_masters;
create policy "course_masters: team write" on public.course_masters for all to authenticated
  using (public.is_team_member()) with check (public.is_team_member());

-- ============================================================
-- 6. course_offerings (institution-specific — e.g. B.Tech CSE at IIT Delhi)
-- ============================================================
create table if not exists public.course_offerings (
  id              uuid primary key default gen_random_uuid(),
  course_master_id uuid not null references public.course_masters(id) on delete cascade,
  institution_id  uuid not null references public.institutions(id) on delete cascade,
  duration        text,
  duration_months integer,
  fees_total      integer,
  fees_per_year   integer,
  eligibility     text,
  seats           integer,
  specializations text[] default array[]::text[],
  entrance_exams  text[] default array[]::text[],
  brochure_url    text,
  apply_link      text,
  batch_year      integer,
  application_deadline date,
  mode            text not null default 'regular',
  status          public.course_status not null default 'draft',
  published_at    timestamptz,
  created_by      uuid references public.team_members(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists course_offerings_institution_idx on public.course_offerings(institution_id, status);
create index if not exists course_offerings_course_idx on public.course_offerings(course_master_id, status);

drop trigger if exists course_offerings_set_updated_at on public.course_offerings;
create trigger course_offerings_set_updated_at before update on public.course_offerings
  for each row execute function public.set_updated_at();

alter table public.course_offerings enable row level security;
drop policy if exists "course_offerings: public read published" on public.course_offerings;
create policy "course_offerings: public read published" on public.course_offerings for select
  using (
    status = 'published'
    and exists (select 1 from public.institutions i where i.id = course_offerings.institution_id and i.status = 'published' and i.deleted_at is null)
    and exists (select 1 from public.course_masters cm where cm.id = course_offerings.course_master_id and cm.status = 'published' and cm.deleted_at is null)
  );
drop policy if exists "course_offerings: team read all" on public.course_offerings;
create policy "course_offerings: team read all" on public.course_offerings for select to authenticated
  using (public.is_team_member());
drop policy if exists "course_offerings: team write" on public.course_offerings;
create policy "course_offerings: team write" on public.course_offerings for all to authenticated
  using (public.is_team_member()) with check (public.is_team_member());

-- ============================================================
-- 7. Fan-out trigger: new exam_session update → notify followers
-- ============================================================
create or replace function public.notify_exam_session_followers()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  session_record record;
  exam_record record;
begin
  if new.exam_session_id is null then
    return new;
  end if;

  select es.id, es.slug, es.exam_id into session_record
  from public.exam_sessions es
  where es.id = new.exam_session_id and es.status = 'published';

  if not found then return new; end if;

  select e.slug, e.name into exam_record
  from public.exams e
  where e.id = session_record.exam_id and e.status = 'published' and e.deleted_at is null;

  if not found then return new; end if;

  insert into public.user_notifications (user_id, kind, title, body, link, target_type, target_id)
  select
    uf.user_id,
    'live-update'::public.notification_kind,
    new.title,
    left(coalesce(new.body_md, ''), 200),
    '/exams/' || exam_record.slug || '/' || session_record.slug,
    'exam-session',
    new.exam_session_id
  from public.user_follows uf
  where uf.target_type = 'exam-session'
    and uf.target_id = new.exam_session_id;

  return new;
end;
$$;

drop trigger if exists exam_session_updates_notify_followers on public.event_updates;
create trigger exam_session_updates_notify_followers
  after insert on public.event_updates
  for each row execute function public.notify_exam_session_followers();

-- ============================================================
-- 8. Smoke test
-- ============================================================
select 'migration 008 complete' as status,
       (select count(*) from information_schema.tables where table_schema = 'public') as total_tables;
