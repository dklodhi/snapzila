-- ============================================================
-- SnapZila — Migration 20261116000001
-- Session 1: team_members table + RLS
-- ============================================================
-- Purpose: RBAC layer for the console. Identity lives in
-- Supabase Auth (auth.users); this table maps auth users to
-- team roles (super_admin | admin | content_writer).
--
-- Consumer users (students/job-seekers/learners) do NOT get a
-- row here — they are simply authenticated auth.users with no
-- team role. Console access requires a team_members row with
-- status='active'.
-- ============================================================

-- 1. Enum for team roles
do $$
begin
  if not exists (select 1 from pg_type where typname = 'team_role') then
    create type public.team_role as enum ('super_admin', 'admin', 'content_writer');
  end if;
end$$;

-- 2. Enum for team member status
do $$
begin
  if not exists (select 1 from pg_type where typname = 'team_member_status') then
    create type public.team_member_status as enum ('active', 'invited', 'disabled');
  end if;
end$$;

-- 3. Table
create table if not exists public.team_members (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  email       text not null,
  role        public.team_role not null,
  status      public.team_member_status not null default 'invited',
  invited_by  uuid references public.team_members(id) on delete set null,
  added_at    timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 4. Unique constraints + indexes
create unique index if not exists team_members_user_id_idx
  on public.team_members(user_id);

create unique index if not exists team_members_email_idx
  on public.team_members(lower(email));

create index if not exists team_members_role_status_idx
  on public.team_members(role, status);

-- 5. updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists team_members_set_updated_at on public.team_members;
create trigger team_members_set_updated_at
  before update on public.team_members
  for each row execute function public.set_updated_at();

-- 6. Helper function: is the current auth user an active team member?
--    (with optional role filter)
--    Returns boolean. Safe to call from RLS policies.
create or replace function public.is_team_member(min_role public.team_role default null)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.team_members tm
    where tm.user_id = auth.uid()
      and tm.status = 'active'
      and (min_role is null or tm.role = min_role)
  );
$$;

-- 7. Helper: team role hierarchy for "min_role" checks
--    super_admin > admin > content_writer
create or replace function public.has_min_role(required public.team_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with role_rank(role, rank) as (
    values ('content_writer'::public.team_role, 1),
           ('admin'::public.team_role, 2),
           ('super_admin'::public.team_role, 3)
  )
  select exists (
    select 1
    from public.team_members tm
    join role_rank rr on rr.role = tm.role
    where tm.user_id = auth.uid()
      and tm.status = 'active'
      and rr.rank >= (select rank from role_rank where role = required)
  );
$$;

-- ============================================================
-- 8. RLS Policies
-- ============================================================

alter table public.team_members enable row level security;

-- Team members can read other team members (needed for console UI:
-- showing who created a post, listing team in admin, etc.)
drop policy if exists "team_members: team read all" on public.team_members;
create policy "team_members: team read all"
  on public.team_members for select
  to authenticated
  using (public.is_team_member());

-- A user can always read their OWN row (even if not yet active,
-- so they can see their invitation status after signup).
drop policy if exists "team_members: self read" on public.team_members;
create policy "team_members: self read"
  on public.team_members for select
  to authenticated
  using (user_id = auth.uid());

-- Only super_admin can insert (inviting new team members)
drop policy if exists "team_members: super_admin insert" on public.team_members;
create policy "team_members: super_admin insert"
  on public.team_members for insert
  to authenticated
  with check (public.has_min_role('super_admin'));

-- Only super_admin can delete
drop policy if exists "team_members: super_admin delete" on public.team_members;
create policy "team_members: super_admin delete"
  on public.team_members for delete
  to authenticated
  using (public.has_min_role('super_admin'));

-- super_admin can update any row; team members can update their own
-- (e.g., to change nothing yet — but reserving for future profile edits)
drop policy if exists "team_members: super_admin update any" on public.team_members;
create policy "team_members: super_admin update any"
  on public.team_members for update
  to authenticated
  using (public.has_min_role('super_admin'))
  with check (public.has_min_role('super_admin'));

drop policy if exists "team_members: self update" on public.team_members;
create policy "team_members: self update"
  on public.team_members for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ============================================================
-- 9. Smoke test
-- ============================================================
select 'team_members table created' as status,
       (select count(*) from public.team_members) as initial_row_count;
