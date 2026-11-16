-- ============================================================
-- SnapZila — Migration 20261116000004
-- Session 4: Institutions + Institution Submissions
-- ============================================================
-- Creates:
--   1. institution_category enum (15 categories)
--   2. institution_status enum
--   3. submission_status enum
--   4. institutions table
--   5. institution_submissions table
--   6. FK from event_discussions.institution_id → institutions.id
--   7. search_vector trigger on institutions
--   8. RLS policies on both tables
--   9. Public read policy for discussions on published institutions
-- ============================================================

-- 0. Enums
do $$
begin
  if not exists (select 1 from pg_type where typname = 'institution_category') then
    create type public.institution_category as enum (
      'exams', 'courses', 'universities', 'iits', 'nits', 'iims',
      'aiims', 'iiits', 'nifts', 'schools', 'colleges', 'coaching',
      'training-skill-centres', 'iti', 'fake-universities', 'law-universities'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'institution_status') then
    create type public.institution_status as enum (
      'draft', 'published', 'unpublished', 'rejected'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'submission_status') then
    create type public.submission_status as enum (
      'pending', 'approved', 'rejected', 'merged'
    );
  end if;
end$$;

-- ============================================================
-- 1. institutions
-- ============================================================
create table if not exists public.institutions (
  id              uuid primary key default gen_random_uuid(),
  category        public.institution_category not null,
  name            text not null,
  name_hi         text,
  slug            text not null,
  city            text,
  state           text,
  established_year integer,
  website         text,
  logo_url        text,
  description     text,
  description_hi  text,
  contact_email   text,
  contact_phone   text,
  status          public.institution_status not null default 'draft',
  published_at    timestamptz,
  featured        boolean not null default false,
  tags            text[] default array[]::text[],
  meta_jsonb      jsonb default '{}'::jsonb,
  search_vector   tsvector,
  created_by      uuid references public.team_members(id),
  submission_id   uuid,  -- FK added below after institution_submissions exists
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);

-- Unique slug per (category, not-deleted)
create unique index if not exists institutions_slug_unique
  on public.institutions(category, slug) where deleted_at is null;

create index if not exists institutions_category_status_idx
  on public.institutions(category, status, published_at desc nulls last)
  where deleted_at is null;

create index if not exists institutions_state_idx
  on public.institutions(state) where deleted_at is null and status = 'published';

create index if not exists institutions_search_idx
  on public.institutions using gin(search_vector);

create index if not exists institutions_featured_idx
  on public.institutions(category, featured, published_at desc)
  where status = 'published' and deleted_at is null;

-- updated_at trigger
drop trigger if exists institutions_set_updated_at on public.institutions;
create trigger institutions_set_updated_at
  before update on public.institutions
  for each row execute function public.set_updated_at();

-- search_vector trigger
create or replace function public.institutions_update_search_vector()
returns trigger
language plpgsql
as $$
begin
  new.search_vector :=
    to_tsvector('english',
      coalesce(new.name, '') || ' ' ||
      coalesce(new.name_hi, '') || ' ' ||
      coalesce(new.city, '') || ' ' ||
      coalesce(new.state, '') || ' ' ||
      coalesce(new.description, '')
    );
  return new;
end;
$$;
drop trigger if exists institutions_update_search_vector on public.institutions;
create trigger institutions_update_search_vector
  before insert or update on public.institutions
  for each row execute function public.institutions_update_search_vector();

-- ============================================================
-- 2. institution_submissions
-- ============================================================
create table if not exists public.institution_submissions (
  id                      uuid primary key default gen_random_uuid(),
  category                public.institution_category not null,
  name                    text not null,
  city                    text,
  state                   text,
  website                 text,
  description             text,
  submitter_name          text not null,
  submitter_email         text not null,
  submitter_phone         text,
  submitter_user_id       uuid references auth.users(id) on delete set null,
  status                  public.submission_status not null default 'pending',
  review_notes            text,
  reviewed_by             uuid references public.team_members(id),
  reviewed_at             timestamptz,
  resulting_institution_id uuid,  -- FK added below
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index if not exists institution_submissions_status_idx
  on public.institution_submissions(status, created_at desc);

drop trigger if exists institution_submissions_set_updated_at on public.institution_submissions;
create trigger institution_submissions_set_updated_at
  before update on public.institution_submissions
  for each row execute function public.set_updated_at();

-- ============================================================
-- 3. Cross-table FKs (now that both tables exist)
-- ============================================================

-- institutions.submission_id → institution_submissions.id
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'institutions_submission_id_fkey'
      and table_name = 'institutions'
  ) then
    alter table public.institutions
      add constraint institutions_submission_id_fkey
      foreign key (submission_id) references public.institution_submissions(id)
      on delete set null;
  end if;
end$$;

-- institution_submissions.resulting_institution_id → institutions.id
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'institution_submissions_resulting_institution_id_fkey'
      and table_name = 'institution_submissions'
  ) then
    alter table public.institution_submissions
      add constraint institution_submissions_resulting_institution_id_fkey
      foreign key (resulting_institution_id) references public.institutions(id)
      on delete set null;
  end if;
end$$;

-- event_discussions.institution_id → institutions.id (deferred from S3 migration)
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'event_discussions_institution_id_fkey'
      and table_name = 'event_discussions'
  ) then
    alter table public.event_discussions
      add constraint event_discussions_institution_id_fkey
      foreign key (institution_id) references public.institutions(id)
      on delete cascade;
  end if;
end$$;

-- ============================================================
-- 4. RLS on institutions
-- ============================================================
alter table public.institutions enable row level security;

-- Public read published
drop policy if exists "institutions: public read published" on public.institutions;
create policy "institutions: public read published"
  on public.institutions for select
  using (status = 'published' and deleted_at is null);

-- Team read all
drop policy if exists "institutions: team read all" on public.institutions;
create policy "institutions: team read all"
  on public.institutions for select
  to authenticated
  using (public.is_team_member());

-- Team insert
drop policy if exists "institutions: team insert" on public.institutions;
create policy "institutions: team insert"
  on public.institutions for insert
  to authenticated
  with check (public.is_team_member());

-- Team update
drop policy if exists "institutions: team update" on public.institutions;
create policy "institutions: team update"
  on public.institutions for update
  to authenticated
  using (public.is_team_member())
  with check (public.is_team_member());

-- Team delete (hard delete allowed for institutions — they can be re-submitted)
drop policy if exists "institutions: team delete" on public.institutions;
create policy "institutions: team delete"
  on public.institutions for delete
  to authenticated
  using (public.is_team_member());

-- ============================================================
-- 5. RLS on institution_submissions
-- ============================================================
alter table public.institution_submissions enable row level security;

-- Submitter can read own submissions; team can read all
drop policy if exists "submissions: submitter read own" on public.institution_submissions;
create policy "submissions: submitter read own"
  on public.institution_submissions for select
  to authenticated
  using (
    submitter_user_id = auth.uid()
    or public.is_team_member()
  );

-- Any auth user can submit (insert)
drop policy if exists "submissions: auth insert" on public.institution_submissions;
create policy "submissions: auth insert"
  on public.institution_submissions for insert
  to authenticated
  with check (true);

-- Only team can update (review/publish/reject)
drop policy if exists "submissions: team update" on public.institution_submissions;
create policy "submissions: team update"
  on public.institution_submissions for update
  to authenticated
  using (public.is_team_member())
  with check (public.is_team_member());

-- ============================================================
-- 6. Add public read policy for discussions on published institutions
--    (deferred from S3 migration — institutions table didn't exist then)
-- ============================================================
drop policy if exists "discussions: public read on published institutions" on public.event_discussions;
create policy "discussions: public read on published institutions"
  on public.event_discussions for select
  using (
    institution_id is not null
    and deleted_at is null
    and exists (
      select 1 from public.institutions i
      where i.id = event_discussions.institution_id
        and i.status = 'published'
        and i.deleted_at is null
    )
  );

-- ============================================================
-- 7. Smoke test
-- ============================================================
select 'migration 004 complete' as status,
       (select count(*) from information_schema.tables where table_schema = 'public') as total_tables;
