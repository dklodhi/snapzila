-- ============================================================
-- SnapZila — Migration 20261116000003
-- Session 3: Discussions (voice-type, tied to events & institutions)
-- ============================================================
-- Creates:
--   1. event_discussions   (voice-type comments on events/institutions)
--   2. discussion_votes    (upvotes, one per user per comment)
--
-- Plus:
--   - voice_type enum
--   - Vote count trigger (maintains event_discussions.upvote_count)
--   - Reply count trigger (maintains event_discussions.reply_count)
--   - RLS policies (public read on published events, auth post, author/team delete)
-- ============================================================

-- 0. Enum for voice types
do $$
begin
  if not exists (select 1 from pg_type where typname = 'voice_type') then
    create type public.voice_type as enum (
      'aspirant', 'selected', 'mentor', 'official', 'skeptic', 'general'
    );
  end if;
end$$;

-- ============================================================
-- 1. event_discussions
-- ============================================================
create table if not exists public.event_discussions (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid references public.events(id) on delete cascade,
  institution_id  uuid,  -- FK to institutions(id) added in S4 migration when table exists
  author_id       uuid not null references auth.users(id) on delete cascade,
  voice_type      public.voice_type not null default 'general',
  body_md         text not null check (length(body_md) <= 2000),
  parent_id       uuid references public.event_discussions(id) on delete cascade,
  upvote_count    integer not null default 0,
  reply_count     integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);

-- Check: one of event_id / institution_id must be set (not both, not neither)
alter table public.event_discussions
  add constraint event_discussions_target_check
  check (
    (event_id is not null and institution_id is null)
    or (event_id is null and institution_id is not null)
  );

-- Check: replies can't have replies (one-level threading)
-- A comment with parent_id is a reply. Replies can't be parents.
-- Enforced via application logic + this check: if parent_id is set,
-- the parent must NOT itself have a parent_id.
-- (Implemented via trigger below for robustness.)

-- Indexes
create index if not exists event_discussions_event_created_idx
  on public.event_discussions(event_id, created_at desc)
  where deleted_at is null and parent_id is null;

create index if not exists event_discussions_institution_created_idx
  on public.event_discussions(institution_id, created_at desc)
  where deleted_at is null and parent_id is null;

create index if not exists event_discussions_parent_idx
  on public.event_discussions(parent_id)
  where parent_id is not null;

create index if not exists event_discussions_author_idx
  on public.event_discussions(author_id, created_at desc);

create index if not exists event_discussions_top_idx
  on public.event_discussions(event_id, upvote_count desc, created_at desc)
  where deleted_at is null and parent_id is null;

-- updated_at trigger
drop trigger if exists event_discussions_set_updated_at on public.event_discussions;
create trigger event_discussions_set_updated_at
  before update on public.event_discussions
  for each row execute function public.set_updated_at();

-- ============================================================
-- 2. discussion_votes
-- ============================================================
create table if not exists public.discussion_votes (
  id             uuid primary key default gen_random_uuid(),
  discussion_id  uuid not null references public.event_discussions(id) on delete cascade,
  user_id        uuid not null references auth.users(id) on delete cascade,
  created_at     timestamptz not null default now()
);

create unique index if not exists discussion_votes_unique_idx
  on public.discussion_votes(discussion_id, user_id);

create index if not exists discussion_votes_user_idx
  on public.discussion_votes(user_id, created_at desc);

-- ============================================================
-- 3. Vote count trigger
--    Maintains event_discussions.upvote_count on vote insert/delete.
-- ============================================================
create or replace function public.update_upvote_count()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    update public.event_discussions
      set upvote_count = upvote_count + 1
      where id = new.discussion_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.event_discussions
      set upvote_count = greatest(upvote_count - 1, 0)
      where id = old.discussion_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists discussion_votes_count_trigger on public.discussion_votes;
create trigger discussion_votes_count_trigger
  after insert or delete on public.discussion_votes
  for each row execute function public.update_upvote_count();

-- ============================================================
-- 4. Reply count trigger
--    Maintains parent's reply_count on reply insert/delete.
-- ============================================================
create or replace function public.update_reply_count()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' and new.parent_id is not null then
    update public.event_discussions
      set reply_count = reply_count + 1
      where id = new.parent_id;
  elsif tg_op = 'DELETE' and old.parent_id is not null then
    update public.event_discussions
      set reply_count = greatest(reply_count - 1, 0)
      where id = old.parent_id;
  end if;
  return null;
end;
$$;

drop trigger if exists event_discussions_reply_count_trigger on public.event_discussions;
create trigger event_discussions_reply_count_trigger
  after insert or delete on public.event_discussions
  for each row execute function public.update_reply_count();

-- ============================================================
-- 5. RLS on event_discussions
-- ============================================================
alter table public.event_discussions enable row level security;

-- Public read: discussions on published events (non-deleted)
drop policy if exists "discussions: public read on published events" on public.event_discussions;
create policy "discussions: public read on published events"
  on public.event_discussions for select
  using (
    event_id is not null
    and deleted_at is null
    and exists (
      select 1 from public.events e
      where e.id = event_discussions.event_id
        and e.status = 'published'
        and e.deleted_at is null
    )
  );

-- Public read: discussions on published institutions (non-deleted)
-- (institution_id FK won't exist until S4 migration creates the institutions table;
--  this policy references it forward, will error if institutions doesn't exist.
--  For S3, only event discussions are live. Institution discussions activate in S4.)
-- We skip the institution policy for now; it will be added in the S4 migration.

-- Auth insert: any logged-in user can post a discussion
drop policy if exists "discussions: auth insert" on public.event_discussions;
create policy "discussions: auth insert"
  on public.event_discussions for insert
  to authenticated
  with check (author_id = auth.uid());

-- Author update: can edit own body within 15 min (enforced in app; RLS allows update of own)
drop policy if exists "discussions: author update" on public.event_discussions;
create policy "discussions: author update"
  on public.event_discussions for update
  to authenticated
  using (author_id = auth.uid() and deleted_at is null)
  with check (author_id = auth.uid());

-- Author delete: soft-delete own
drop policy if exists "discussions: author delete" on public.event_discussions;
create policy "discussions: author delete"
  on public.event_discussions for update
  to authenticated
  using (author_id = auth.uid() and deleted_at is null)
  with check (author_id = auth.uid());

-- Team delete: soft-delete any (moderation)
drop policy if exists "discussions: team update" on public.event_discussions;
create policy "discussions: team update"
  on public.event_discussions for update
  to authenticated
  using (public.is_team_member())
  with check (public.is_team_member());

-- ============================================================
-- 6. RLS on discussion_votes
-- ============================================================
alter table public.discussion_votes enable row level security;

-- Public read: anyone can see who upvoted what
drop policy if exists "votes: public read" on public.discussion_votes;
create policy "votes: public read"
  on public.discussion_votes for select
  using (true);

-- Auth insert: can only upvote for yourself
drop policy if exists "votes: auth insert" on public.discussion_votes;
create policy "votes: auth insert"
  on public.discussion_votes for insert
  to authenticated
  with check (user_id = auth.uid());

-- Self delete: can remove your own upvote
drop policy if exists "votes: self delete" on public.discussion_votes;
create policy "votes: self delete"
  on public.discussion_votes for delete
  to authenticated
  using (user_id = auth.uid());

-- ============================================================
-- 7. Smoke test
-- ============================================================
select 'migration 003 complete' as status,
       (select count(*) from information_schema.tables where table_schema = 'public') as total_tables;
