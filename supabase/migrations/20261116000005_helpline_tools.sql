-- ============================================================
-- SnapZila — Migration 20261116000005
-- Session 5: Helpline + Tools (Exam Calendar + Employment News)
-- ============================================================
-- Creates:
--   1. helpline_status enum
--   2. contact_status enum
--   3. helpline_entries table
--   4. contact_messages table
--   5. exam_calendar_overrides table
--   6. employment_news_issues table
--   7. RLS policies on all tables
-- ============================================================

-- 0. Enums
do $$
begin
  if not exists (select 1 from pg_type where typname = 'helpline_status') then
    create type public.helpline_status as enum ('draft', 'published', 'unpublished');
  end if;
  if not exists (select 1 from pg_type where typname = 'contact_status') then
    create type public.contact_status as enum ('new', 'read', 'replied', 'archived');
  end if;
  if not exists (select 1 from pg_type where typname = 'employment_news_status') then
    create type public.employment_news_status as enum ('draft', 'published');
  end if;
end$$;

-- ============================================================
-- 1. helpline_entries
-- ============================================================
create table if not exists public.helpline_entries (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  title_hi    text,
  category    text not null default 'General',
  body_md     text,
  body_md_hi  text,
  phone       text,
  email       text,
  website     text,
  sort_order  integer not null default 0,
  status      public.helpline_status not null default 'draft',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists helpline_entries_status_sort_idx
  on public.helpline_entries(status, sort_order);

drop trigger if exists helpline_entries_set_updated_at on public.helpline_entries;
create trigger helpline_entries_set_updated_at
  before update on public.helpline_entries
  for each row execute function public.set_updated_at();

alter table public.helpline_entries enable row level security;
drop policy if exists "helpline: public read published" on public.helpline_entries;
create policy "helpline: public read published"
  on public.helpline_entries for select
  using (status = 'published');
drop policy if exists "helpline: team read all" on public.helpline_entries;
create policy "helpline: team read all"
  on public.helpline_entries for select
  to authenticated using (public.is_team_member());
drop policy if exists "helpline: team write" on public.helpline_entries;
create policy "helpline: team write"
  on public.helpline_entries for all
  to authenticated
  using (public.is_team_member())
  with check (public.is_team_member());

-- ============================================================
-- 2. contact_messages
-- ============================================================
create table if not exists public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  subject    text not null,
  body       text not null,
  category   text,
  user_id    uuid references auth.users(id) on delete set null,
  ip_hash    text,
  status     public.contact_status not null default 'new',
  created_at timestamptz not null default now()
);

create index if not exists contact_messages_status_idx
  on public.contact_messages(status, created_at desc);

alter table public.contact_messages enable row level security;
-- Submitter can read own messages; team can read all
drop policy if exists "contact: submitter read own" on public.contact_messages;
create policy "contact: submitter read own"
  on public.contact_messages for select
  to authenticated
  using (user_id = auth.uid() or public.is_team_member());
-- Any auth user can submit (insert)
drop policy if exists "contact: auth insert" on public.contact_messages;
create policy "contact: auth insert"
  on public.contact_messages for insert
  to authenticated
  with check (true);
-- Team can update status
drop policy if exists "contact: team update" on public.contact_messages;
create policy "contact: team update"
  on public.contact_messages for update
  to authenticated
  using (public.is_team_member())
  with check (public.is_team_member());

-- ============================================================
-- 3. exam_calendar_overrides
-- ============================================================
create table if not exists public.exam_calendar_overrides (
  id          uuid primary key default gen_random_uuid(),
  exam_name   text not null,
  exam_name_hi text,
  date        date not null,
  category    text not null default 'General',
  url         text,
  notes       text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists exam_calendar_overrides_date_idx
  on public.exam_calendar_overrides(date);

alter table public.exam_calendar_overrides enable row level security;
drop policy if exists "exam_overrides: public read" on public.exam_calendar_overrides;
create policy "exam_overrides: public read"
  on public.exam_calendar_overrides for select using (true);
drop policy if exists "exam_overrides: team write" on public.exam_calendar_overrides;
create policy "exam_overrides: team write"
  on public.exam_calendar_overrides for all
  to authenticated
  using (public.is_team_member())
  with check (public.is_team_member());

-- ============================================================
-- 4. employment_news_issues
-- ============================================================
create table if not exists public.employment_news_issues (
  id               uuid primary key default gen_random_uuid(),
  issue_number     integer not null unique,
  week_start       date not null,
  week_end         date not null,
  title            text not null,
  title_hi         text,
  intro_md         text,
  intro_md_hi      text,
  featured_event_ids uuid[] default array[]::uuid[],
  status           public.employment_news_status not null default 'draft',
  published_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists employment_news_week_idx
  on public.employment_news_issues(week_start desc);
create index if not exists employment_news_status_idx
  on public.employment_news_issues(status, published_at desc nulls last);

drop trigger if exists employment_news_issues_set_updated_at on public.employment_news_issues;
create trigger employment_news_issues_set_updated_at
  before update on public.employment_news_issues
  for each row execute function public.set_updated_at();

alter table public.employment_news_issues enable row level security;
drop policy if exists "employment_news: public read published" on public.employment_news_issues;
create policy "employment_news: public read published"
  on public.employment_news_issues for select
  using (status = 'published');
drop policy if exists "employment_news: team read all" on public.employment_news_issues;
create policy "employment_news: team read all"
  on public.employment_news_issues for select
  to authenticated using (public.is_team_member());
drop policy if exists "employment_news: team write" on public.employment_news_issues;
create policy "employment_news: team write"
  on public.employment_news_issues for all
  to authenticated
  using (public.is_team_member())
  with check (public.is_team_member());

-- ============================================================
-- 5. Smoke test
-- ============================================================
select 'migration 005 complete' as status,
       (select count(*) from information_schema.tables where table_schema = 'public') as total_tables;
