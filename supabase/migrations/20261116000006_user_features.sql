-- ============================================================
-- SnapZila — Migration 20261116000006
-- Session 6: User Features (Profiles, Follow, Save, Notifications)
-- ============================================================
-- Creates:
--   1. target_type enum (event/institution/tag/sector/state/org)
--   2. notification_kind enum
--   3. user_profiles table (onboarding/personalization)
--   4. user_follows table (polymorphic — events, institutions, tags/sectors/states/orgs)
--   5. user_saves table (same polymorphic structure)
--   6. user_notifications table (in-app bell)
--   7. Fan-out trigger: new event_update → notifications to followers of that event
--   8. RLS policies on all tables
-- ============================================================

-- 0. Enums
do $$
begin
  if not exists (select 1 from pg_type where typname = 'follow_target_type') then
    create type public.follow_target_type as enum (
      'event', 'institution', 'tag', 'sector', 'state', 'org'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'notification_kind') then
    create type public.notification_kind as enum (
      'live-update', 'deadline', 'result', 'system'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'target_group') then
    create type public.target_group as enum (
      'student', 'job-seeker', 'learner', 'other'
    );
  end if;
end$$;

-- ============================================================
-- 1. user_profiles
-- ============================================================
create table if not exists public.user_profiles (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null unique references auth.users(id) on delete cascade,
  full_name         text,
  avatar_url        text,
  target_group      public.target_group,
  state             text,
  exam_interests    text[] default array[]::text[],
  content_interests text[] default array[]::text[],
  preferred_locale  text not null default 'en-IN',
  onboarded_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists user_profiles_user_id_idx on public.user_profiles(user_id);

drop trigger if exists user_profiles_set_updated_at on public.user_profiles;
create trigger user_profiles_set_updated_at
  before update on public.user_profiles
  for each row execute function public.set_updated_at();

alter table public.user_profiles enable row level security;
drop policy if exists "user_profiles: owner read" on public.user_profiles;
create policy "user_profiles: owner read"
  on public.user_profiles for select to authenticated
  using (user_id = auth.uid());
drop policy if exists "user_profiles: owner insert" on public.user_profiles;
create policy "user_profiles: owner insert"
  on public.user_profiles for insert to authenticated
  with check (user_id = auth.uid());
drop policy if exists "user_profiles: owner update" on public.user_profiles;
create policy "user_profiles: owner update"
  on public.user_profiles for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ============================================================
-- 2. user_follows
-- ============================================================
create table if not exists public.user_follows (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  target_type public.follow_target_type not null,
  target_id   uuid not null,
  created_at  timestamptz not null default now()
);

create unique index if not exists user_follows_unique_idx
  on public.user_follows(user_id, target_type, target_id);
create index if not exists user_follows_target_idx
  on public.user_follows(target_type, target_id);
create index if not exists user_follows_user_idx
  on public.user_follows(user_id);

alter table public.user_follows enable row level security;
-- Owner can read own follows; anyone can read follows (for public "N followers" counts)
drop policy if exists "user_follows: public read" on public.user_follows;
create policy "user_follows: public read"
  on public.user_follows for select using (true);
-- Auth user can insert own follows
drop policy if exists "user_follows: owner insert" on public.user_follows;
create policy "user_follows: owner insert"
  on public.user_follows for insert to authenticated
  with check (user_id = auth.uid());
-- Owner can delete own follows
drop policy if exists "user_follows: owner delete" on public.user_follows;
create policy "user_follows: owner delete"
  on public.user_follows for delete to authenticated
  using (user_id = auth.uid());

-- ============================================================
-- 3. user_saves
-- ============================================================
create table if not exists public.user_saves (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  target_type public.follow_target_type not null,
  target_id   uuid not null,
  created_at  timestamptz not null default now()
);

create unique index if not exists user_saves_unique_idx
  on public.user_saves(user_id, target_type, target_id);
create index if not exists user_saves_user_idx on public.user_saves(user_id);

alter table public.user_saves enable row level security;
drop policy if exists "user_saves: owner read" on public.user_saves;
create policy "user_saves: owner read"
  on public.user_saves for select to authenticated
  using (user_id = auth.uid());
drop policy if exists "user_saves: owner insert" on public.user_saves;
create policy "user_saves: owner insert"
  on public.user_saves for insert to authenticated
  with check (user_id = auth.uid());
drop policy if exists "user_saves: owner delete" on public.user_saves;
create policy "user_saves: owner delete"
  on public.user_saves for delete to authenticated
  using (user_id = auth.uid());

-- ============================================================
-- 4. user_notifications
-- ============================================================
create table if not exists public.user_notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  kind        public.notification_kind not null default 'system',
  title       text not null,
  body        text,
  link        text,
  target_type text,
  target_id   uuid,
  priority    text not null default 'normal',
  read_at     timestamptz,
  seen_at     timestamptz,
  archived_at timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists user_notifications_user_idx
  on public.user_notifications(user_id, read_at, created_at desc);

alter table public.user_notifications enable row level security;
drop policy if exists "user_notifications: owner read" on public.user_notifications;
create policy "user_notifications: owner read"
  on public.user_notifications for select to authenticated
  using (user_id = auth.uid());
drop policy if exists "user_notifications: owner update" on public.user_notifications;
create policy "user_notifications: owner update"
  on public.user_notifications for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
-- System can insert (via security definer function below)
drop policy if exists "user_notifications: system insert" on public.user_notifications;
create policy "user_notifications: system insert"
  on public.user_notifications for insert to authenticated
  with check (user_id = auth.uid());

-- ============================================================
-- 5. Fan-out trigger: new event_update → notify followers of that event
-- ============================================================
-- When a new event_updates row is inserted, create a notification
-- for every user following that event.
create or replace function public.notify_event_followers()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  follower_record record;
  event_record record;
begin
  -- Fetch the event for context
  select e.id, e.title, e.type, e.slug into event_record
  from public.events e
  where e.id = new.event_id
    and e.status = 'published'
    and e.deleted_at is null;

  if not found then
    return new;
  end if;

  -- Insert notifications for all followers of this event
  insert into public.user_notifications (user_id, kind, title, body, link, target_type, target_id)
  select
    uf.user_id,
    'live-update'::public.notification_kind,
    new.title,
    left(coalesce(new.body_md, ''), 200),
    '/opportunities/' || event_record.type || '/' || event_record.slug || '#update-' || new.id,
    'event',
    new.event_id
  from public.user_follows uf
  where uf.target_type = 'event'
    and uf.target_id = new.event_id;

  return new;
end;
$$;

drop trigger if exists event_updates_notify_followers on public.event_updates;
create trigger event_updates_notify_followers
  after insert on public.event_updates
  for each row execute function public.notify_event_followers();

-- ============================================================
-- 6. Smoke test
-- ============================================================
select 'migration 006 complete' as status,
       (select count(*) from information_schema.tables where table_schema = 'public') as total_tables;
