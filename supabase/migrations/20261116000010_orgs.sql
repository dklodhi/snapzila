-- ============================================================
-- SnapZila — Migration 20261116000010
-- Orgs table + seed from existing tags
-- ============================================================
-- Creates a proper orgs table for conducting bodies (SSC, UPSC, etc.)
-- In the old project, this was the Organisation table — unified for
-- both exam conducting bodies AND educational institutions.
-- Phase 1: separate from institutions table (which handles educational
-- submit flow). Future: merge or link via org_id FK.
-- ============================================================

create table if not exists public.orgs (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  name            text not null,
  full_name       text,
  type            text not null default 'government',
  description     text,
  website         text,
  logo_url        text,
  status          text not null default 'published',
  published_at    timestamptz default now(),
  meta_title      text,
  meta_description text,
  created_by      uuid references public.team_members(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);

create index if not exists orgs_status_idx on public.orgs(status, published_at desc nulls last) where deleted_at is null;
create index if not exists orgs_type_idx on public.orgs(type);
create index if not exists orgs_slug_idx on public.orgs(slug) where deleted_at is null;

drop trigger if exists orgs_set_updated_at on public.orgs;
create trigger orgs_set_updated_at before update on public.orgs
  for each row execute function public.set_updated_at();

alter table public.orgs enable row level security;
drop policy if exists "orgs: public read published" on public.orgs;
create policy "orgs: public read published" on public.orgs for select
  using (status = 'published' and deleted_at is null);
drop policy if exists "orgs: team read all" on public.orgs;
create policy "orgs: team read all" on public.orgs for select to authenticated
  using (public.is_team_member());
drop policy if exists "orgs: team write" on public.orgs;
create policy "orgs: team write" on public.orgs for all to authenticated
  using (public.is_team_member()) with check (public.is_team_member());

-- Seed orgs from existing tags (kind='org')
insert into public.orgs (slug, name, type, status, published_at)
select slug, label, 'government', 'published', now()
from public.tags
where kind = 'org'
on conflict (slug) do nothing;

-- Add org_id FK to events (optional — links event to org)
alter table public.events add column if not exists org_id uuid references public.orgs(id) on delete set null;
create index if not exists events_org_id_idx on public.events(org_id) where org_id is not null;

-- Add 'org' to follow_target_type (already exists from migration 006/007)
-- Verify it exists
do $$
begin
  if not exists (select 1 from pg_enum where enumlabel = 'org' and enumtypid = (select oid from pg_type where typname = 'follow_target_type')) then
    alter type public.follow_target_type add value 'org';
  end if;
end$$;

select 'migration 010 complete' as status,
       (select count(*) from public.orgs) as org_count,
       (select count(*) from information_schema.columns where table_name = 'events' and column_name = 'org_id') as events_has_org_id;
