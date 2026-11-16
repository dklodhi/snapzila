-- ============================================================
-- SnapZila — Migration 20261116000002
-- Session 2: Content tables + RLS + create_event_from_json RPC
-- ============================================================
-- Creates:
--   1. tags                 (lightweight taxonomy)
--   2. events               (parent posts, 6 content types)
--   3. event_updates        (live-update timeline)
--   4. event_guides         (structured guide sections)
--   5. event_dates          (important dates)
--   6. event_documents      (PDFs / attachments)
--   7. static_pages         (About, Contact, etc.)
--   8. site_settings        (KV config store)
--   9. audit_logs           (console activity log)
--
-- Plus:
--   - search_vector trigger on events
--   - updated_at triggers on all content tables
--   - create_event_from_json(jsonb) RPC for JSON paste editor
--   - RLS policies on every table
-- ============================================================

-- ============================================================
-- 0. Enums
-- ============================================================
do $$
begin
  if not exists (select 1 from pg_type where typname = 'event_type') then
    create type public.event_type as enum (
      'govt-jobs', 'admissions', 'scholarships', 'govt-schemes', 'news', 'articles'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'event_status') then
    create type public.event_status as enum (
      'draft', 'scheduled', 'published', 'unpublished', 'rejected'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'apply_mode') then
    create type public.apply_mode as enum ('online', 'offline', 'hybrid', 'na');
  end if;
  if not exists (select 1 from pg_type where typname = 'update_kind') then
    create type public.update_kind as enum (
      'info', 'warning', 'result', 'admit-card', 'corrigendum', 'extension', 'deadline'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'guide_section') then
    create type public.guide_section as enum (
      'eligibility', 'apply_steps', 'fees', 'dates', 'documents', 'faq', 'other'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'doc_type') then
    create type public.doc_type as enum (
      'notification', 'admit-card', 'result', 'syllabus', 'other'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'tag_kind') then
    create type public.tag_kind as enum (
      'sector', 'state', 'exam', 'org', 'skill', 'qualification', 'target-group'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'page_status') then
    create type public.page_status as enum ('draft', 'published');
  end if;
end$$;

-- ============================================================
-- 1. tags
-- ============================================================
create table if not exists public.tags (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  label      text not null,
  label_hi   text,
  kind       public.tag_kind not null default 'sector',
  created_at timestamptz not null default now()
);
create index if not exists tags_kind_slug_idx on public.tags(kind, slug);
alter table public.tags enable row level security;
drop policy if exists "tags: public read" on public.tags;
create policy "tags: public read" on public.tags for select using (true);
drop policy if exists "tags: team write" on public.tags;
create policy "tags: team write" on public.tags for all
  to authenticated
  using (public.is_team_member())
  with check (public.is_team_member());

-- ============================================================
-- 2. events (the core table)
-- ============================================================
create table if not exists public.events (
  id                  uuid primary key default gen_random_uuid(),
  type                public.event_type not null,
  slug                text not null,
  title               text not null,
  title_hi            text,
  summary             text,
  summary_hi          text,
  conducting_body     text,
  conducting_body_slug text,
  locations           text[] default array[]::text[],
  apply_mode          public.apply_mode default 'na',
  apply_link          text,
  apply_start_date    date,
  apply_end_date      date,
  exam_date           date,
  result_date         date,
  status              public.event_status not null default 'draft',
  published_at        timestamptz,
  scheduled_at        timestamptz,
  featured            boolean not null default false,
  tags                text[] default array[]::text[],
  -- Flexible JSONB fields (per DB_SCHEMA.md)
  eligibility         jsonb default '{}'::jsonb,
  vacancy             jsonb default '{}'::jsonb,
  fees_breakdown      jsonb default '{}'::jsonb,
  selection_process   text[] default array[]::text[],
  apply_steps         jsonb default '[]'::jsonb,
  fees_inr_paise      integer,
  body_md             text,
  body_md_hi          text,
  -- SEO
  meta_title          text,
  meta_description    text,
  meta_title_hi       text,
  meta_description_hi text,
  og_image_url        text,
  canonical_url       text,
  -- Search vector (maintained by trigger)
  search_vector       tsvector,
  -- Audit
  created_by          uuid references public.team_members(id),
  updated_by          uuid references public.team_members(id),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  deleted_at          timestamptz
);

-- Unique slug per (type, not-deleted)
create unique index if not exists events_slug_unique
  on public.events(type, slug) where deleted_at is null;
create index if not exists events_type_status_published_idx
  on public.events(type, status, published_at desc nulls last) where deleted_at is null;
create index if not exists events_conducting_body_slug_idx on public.events(conducting_body_slug);
create index if not exists events_tags_idx on public.events using gin(tags);
create index if not exists events_featured_idx on public.events(featured, published_at desc) where status = 'published' and deleted_at is null;
create index if not exists events_apply_end_idx on public.events(apply_end_date) where status = 'published' and deleted_at is null;
create index if not exists events_search_idx on public.events using gin(search_vector);

-- updated_at trigger (reuse function from migration 001)
drop trigger if exists events_set_updated_at on public.events;
create trigger events_set_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

-- search_vector trigger
create or replace function public.events_update_search_vector()
returns trigger
language plpgsql
as $$
begin
  new.search_vector :=
    to_tsvector('english',
      coalesce(new.title, '') || ' ' ||
      coalesce(new.title_hi, '') || ' ' ||
      coalesce(new.conducting_body, '') || ' ' ||
      coalesce(new.summary, '') || ' ' ||
      coalesce(new.summary_hi, '') || ' ' ||
      coalesce(array_to_string(new.tags, ' '), '')
    );
  return new;
end;
$$;
drop trigger if exists events_update_search_vector on public.events;
create trigger events_update_search_vector
  before insert or update on public.events
  for each row execute function public.events_update_search_vector();

-- RLS on events
alter table public.events enable row level security;
-- Public reads published, non-deleted
drop policy if exists "events: public read published" on public.events;
create policy "events: public read published" on public.events for select
  using (status = 'published' and deleted_at is null);
-- Team reads all (incl. drafts, deleted)
drop policy if exists "events: team read all" on public.events;
create policy "events: team read all" on public.events for select
  to authenticated
  using (public.is_team_member());
-- Team can insert
drop policy if exists "events: team insert" on public.events;
create policy "events: team insert" on public.events for insert
  to authenticated
  with check (public.is_team_member());
-- Team can update (any team member can edit any event)
drop policy if exists "events: team update" on public.events;
create policy "events: team update" on public.events for update
  to authenticated
  using (public.is_team_member())
  with check (public.is_team_member());
-- No hard delete policy — soft delete only (update deleted_at)

-- ============================================================
-- 3. event_updates (live-update timeline)
-- ============================================================
create table if not exists public.event_updates (
  id           uuid primary key default gen_random_uuid(),
  event_id     uuid not null references public.events(id) on delete cascade,
  kind         public.update_kind not null default 'info',
  title        text not null,
  title_hi     text,
  body_md      text,
  body_md_hi   text,
  doc_url      text,
  published_at timestamptz not null default now(),
  sort_order   integer not null default 0,
  created_by   uuid references public.team_members(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists event_updates_event_published_idx
  on public.event_updates(event_id, published_at desc, sort_order desc);
drop trigger if exists event_updates_set_updated_at on public.event_updates;
create trigger event_updates_set_updated_at
  before update on public.event_updates
  for each row execute function public.set_updated_at();
alter table public.event_updates enable row level security;
drop policy if exists "event_updates: public read via published event" on public.event_updates;
create policy "event_updates: public read via published event" on public.event_updates for select
  using (
    exists (
      select 1 from public.events e
      where e.id = event_updates.event_id
        and e.status = 'published'
        and e.deleted_at is null
    )
  );
drop policy if exists "event_updates: team read all" on public.event_updates;
create policy "event_updates: team read all" on public.event_updates for select
  to authenticated
  using (public.is_team_member());
drop policy if exists "event_updates: team insert" on public.event_updates;
create policy "event_updates: team insert" on public.event_updates for insert
  to authenticated
  with check (public.is_team_member());
drop policy if exists "event_updates: team update" on public.event_updates;
create policy "event_updates: team update" on public.event_updates for update
  to authenticated
  using (public.is_team_member())
  with check (public.is_team_member());
drop policy if exists "event_updates: team delete" on public.event_updates;
create policy "event_updates: team delete" on public.event_updates for delete
  to authenticated
  using (public.is_team_member());

-- ============================================================
-- 4. event_guides (structured guide sections)
-- ============================================================
create table if not exists public.event_guides (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events(id) on delete cascade,
  section    public.guide_section not null,
  title      text not null,
  title_hi   text,
  body_md    text,
  body_md_hi text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists event_guides_event_sort_idx on public.event_guides(event_id, sort_order);
drop trigger if exists event_guides_set_updated_at on public.event_guides;
create trigger event_guides_set_updated_at
  before update on public.event_guides
  for each row execute function public.set_updated_at();
alter table public.event_guides enable row level security;
drop policy if exists "event_guides: public read via published event" on public.event_guides;
create policy "event_guides: public read via published event" on public.event_guides for select
  using (
    exists (select 1 from public.events e where e.id = event_guides.event_id and e.status = 'published' and e.deleted_at is null)
  );
drop policy if exists "event_guides: team read all" on public.event_guides;
create policy "event_guides: team read all" on public.event_guides for select
  to authenticated using (public.is_team_member());
drop policy if exists "event_guides: team insert" on public.event_guides;
create policy "event_guides: team insert" on public.event_guides for insert
  to authenticated with check (public.is_team_member());
drop policy if exists "event_guides: team update" on public.event_guides;
create policy "event_guides: team update" on public.event_guides for update
  to authenticated using (public.is_team_member()) with check (public.is_team_member());
drop policy if exists "event_guides: team delete" on public.event_guides;
create policy "event_guides: team delete" on public.event_guides for delete
  to authenticated using (public.is_team_member());

-- ============================================================
-- 5. event_dates (important dates)
-- ============================================================
create table if not exists public.event_dates (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events(id) on delete cascade,
  label      text not null,
  label_hi   text,
  date       date not null,
  time       time,
  url        text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists event_dates_event_sort_idx on public.event_dates(event_id, sort_order);
create index if not exists event_dates_date_idx on public.event_dates(date);
alter table public.event_dates enable row level security;
drop policy if exists "event_dates: public read via published event" on public.event_dates;
create policy "event_dates: public read via published event" on public.event_dates for select
  using (
    exists (select 1 from public.events e where e.id = event_dates.event_id and e.status = 'published' and e.deleted_at is null)
  );
drop policy if exists "event_dates: team read all" on public.event_dates;
create policy "event_dates: team read all" on public.event_dates for select
  to authenticated using (public.is_team_member());
drop policy if exists "event_dates: team insert" on public.event_dates;
create policy "event_dates: team insert" on public.event_dates for insert
  to authenticated with check (public.is_team_member());
drop policy if exists "event_dates: team update" on public.event_dates;
create policy "event_dates: team update" on public.event_dates for update
  to authenticated using (public.is_team_member()) with check (public.is_team_member());
drop policy if exists "event_dates: team delete" on public.event_dates;
create policy "event_dates: team delete" on public.event_dates for delete
  to authenticated using (public.is_team_member());

-- ============================================================
-- 6. event_documents (PDFs / attachments)
-- ============================================================
create table if not exists public.event_documents (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid not null references public.events(id) on delete cascade,
  title           text not null,
  title_hi        text,
  doc_type        public.doc_type not null default 'notification',
  storage_path    text not null,
  public_url      text not null,
  file_size_bytes bigint,
  mime_type       text,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now()
);
create index if not exists event_documents_event_sort_idx on public.event_documents(event_id, sort_order);
alter table public.event_documents enable row level security;
drop policy if exists "event_documents: public read via published event" on public.event_documents;
create policy "event_documents: public read via published event" on public.event_documents for select
  using (
    exists (select 1 from public.events e where e.id = event_documents.event_id and e.status = 'published' and e.deleted_at is null)
  );
drop policy if exists "event_documents: team read all" on public.event_documents;
create policy "event_documents: team read all" on public.event_documents for select
  to authenticated using (public.is_team_member());
drop policy if exists "event_documents: team insert" on public.event_documents;
create policy "event_documents: team insert" on public.event_documents for insert
  to authenticated with check (public.is_team_member());
drop policy if exists "event_documents: team update" on public.event_documents;
create policy "event_documents: team update" on public.event_documents for update
  to authenticated using (public.is_team_member()) with check (public.is_team_member());
drop policy if exists "event_documents: team delete" on public.event_documents;
create policy "event_documents: team delete" on public.event_documents for delete
  to authenticated using (public.is_team_member());

-- ============================================================
-- 7. static_pages
-- ============================================================
create table if not exists public.static_pages (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  title           text not null,
  title_hi        text,
  body_md         text,
  body_md_hi      text,
  meta_title      text,
  meta_description text,
  show_in_header  boolean not null default false,
  show_in_footer  boolean not null default false,
  sort_order      integer not null default 0,
  status          public.page_status not null default 'draft',
  created_by      uuid references public.team_members(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists static_pages_status_idx on public.static_pages(status, sort_order);
drop trigger if exists static_pages_set_updated_at on public.static_pages;
create trigger static_pages_set_updated_at
  before update on public.static_pages
  for each row execute function public.set_updated_at();
alter table public.static_pages enable row level security;
drop policy if exists "static_pages: public read published" on public.static_pages;
create policy "static_pages: public read published" on public.static_pages for select
  using (status = 'published');
drop policy if exists "static_pages: team read all" on public.static_pages;
create policy "static_pages: team read all" on public.static_pages for select
  to authenticated using (public.is_team_member());
drop policy if exists "static_pages: team insert" on public.static_pages;
create policy "static_pages: team insert" on public.static_pages for insert
  to authenticated with check (public.is_team_member());
drop policy if exists "static_pages: team update" on public.static_pages;
create policy "static_pages: team update" on public.static_pages for update
  to authenticated using (public.is_team_member()) with check (public.is_team_member());
drop policy if exists "static_pages: team delete" on public.static_pages;
create policy "static_pages: team delete" on public.static_pages for delete
  to authenticated using (public.is_team_member());

-- ============================================================
-- 8. site_settings (KV store)
-- ============================================================
create table if not exists public.site_settings (
  id         uuid primary key default gen_random_uuid(),
  key        text not null unique,
  value      jsonb not null default '{}'::jsonb,
  updated_by uuid references public.team_members(id),
  updated_at timestamptz not null default now()
);
alter table public.site_settings enable row level security;
-- Public can read non-secret keys (we expose all for now; secrets live in env vars)
drop policy if exists "site_settings: public read" on public.site_settings;
create policy "site_settings: public read" on public.site_settings for select using (true);
drop policy if exists "site_settings: super_admin write" on public.site_settings;
create policy "site_settings: super_admin write" on public.site_settings for all
  to authenticated
  using (public.has_min_role('super_admin'))
  with check (public.has_min_role('super_admin'));

-- ============================================================
-- 9. audit_logs
-- ============================================================
create table if not exists public.audit_logs (
  id           uuid primary key default gen_random_uuid(),
  actor_id     uuid references public.team_members(id),
  action       text not null,
  entity_type  text not null,
  entity_id    uuid,
  before_data  jsonb,
  after_data   jsonb,
  ip_address   text,
  user_agent   text,
  created_at   timestamptz not null default now()
);
create index if not exists audit_logs_actor_idx on public.audit_logs(actor_id, created_at desc);
create index if not exists audit_logs_entity_idx on public.audit_logs(entity_type, entity_id);
create index if not exists audit_logs_created_idx on public.audit_logs(created_at desc);
alter table public.audit_logs enable row level security;
-- Team can read all audit logs
drop policy if exists "audit_logs: team read" on public.audit_logs;
create policy "audit_logs: team read" on public.audit_logs for select
  to authenticated using (public.is_team_member());
-- Team members can insert (the data-access layer writes logs)
drop policy if exists "audit_logs: team insert" on public.audit_logs;
create policy "audit_logs: team insert" on public.audit_logs for insert
  to authenticated with check (public.is_team_member());
-- No update / delete — audit logs are append-only

-- ============================================================
-- 10. create_event_from_json RPC
--     Called by the JSON paste editor.
--     Input: { type, slug, title, ... , updates: [...], guides: [...], dates: [...] }
--     Returns: { event_id: uuid }
--     Runs as security invoker — RLS on events enforces team membership.
-- ============================================================
create or replace function public.create_event_from_json(payload jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_event_id uuid;
  v_type     public.event_type;
  v_update   jsonb;
  v_guide    jsonb;
  v_date     jsonb;
  v_result   jsonb;
begin
  -- Extract + validate type
  v_type := (payload->>'type')::public.event_type;

  -- Insert the event
  insert into public.events (
    type, slug, title, title_hi, summary, summary_hi,
    conducting_body, conducting_body_slug, locations, apply_mode, apply_link,
    apply_start_date, apply_end_date, exam_date, result_date,
    status, published_at, featured, tags,
    eligibility, vacancy, fees_breakdown, fees_inr_paise,
    selection_process, apply_steps, body_md, body_md_hi,
    meta_title, meta_description, created_by
  )
  select
    v_type,
    payload->>'slug',
    payload->>'title',
    nullif(payload->>'title_hi', ''),
    nullif(payload->>'summary', ''),
    nullif(payload->>'summary_hi', ''),
    nullif(payload->>'conducting_body', ''),
    nullif(payload->>'conducting_body_slug', ''),
    coalesce((payload->'locations')::text[], array[]::text[]),
    coalesce((payload->>'apply_mode')::public.apply_mode, 'na'),
    nullif(payload->>'apply_link', ''),
    nullif(payload->>'apply_start_date', '')::date,
    nullif(payload->>'apply_end_date', '')::date,
    nullif(payload->>'exam_date', '')::date,
    nullif(payload->>'result_date', '')::date,
    coalesce((payload->>'status')::public.event_status, 'draft'),
    case when (payload->>'status') = 'published' then now() else null end,
    coalesce((payload->>'featured')::boolean, false),
    coalesce((payload->'tags')::text[], array[]::text[]),
    coalesce(payload->'eligibility', '{}'::jsonb),
    coalesce(payload->'vacancy', '{}'::jsonb),
    coalesce(payload->'fees_breakdown', '{}'::jsonb),
    nullif(payload->>'fees_inr_paise', '')::integer,
    coalesce((payload->'selection_process')::text[], array[]::text[]),
    coalesce(payload->'apply_steps', '[]'::jsonb),
    nullif(payload->>'body_md', ''),
    nullif(payload->>'body_md_hi', ''),
    nullif(payload->>'meta_title', ''),
    nullif(payload->>'meta_description', ''),
    (select tm.id from public.team_members tm where tm.user_id = auth.uid() and tm.status = 'active' limit 1)
  returning id into v_event_id;

  -- Insert live updates
  if payload ? 'updates' then
    foreach v_update in array (payload->'updates')::jsonb[] loop
      insert into public.event_updates (event_id, kind, title, title_hi, body_md, body_md_hi, doc_url, sort_order)
      select
        v_event_id,
        coalesce((v_update->>'kind')::public.update_kind, 'info'),
        v_update->>'title',
        nullif(v_update->>'title_hi', ''),
        nullif(v_update->>'body_md', ''),
        nullif(v_update->>'body_md_hi', ''),
        nullif(v_update->>'doc_url', ''),
        coalesce((v_update->>'sort_order')::integer, 0);
    end loop;
  end if;

  -- Insert guide sections
  if payload ? 'guides' then
    foreach v_guide in array (payload->'guides')::jsonb[] loop
      insert into public.event_guides (event_id, section, title, title_hi, body_md, body_md_hi, sort_order)
      select
        v_event_id,
        coalesce((v_guide->>'section')::public.guide_section, 'other'),
        v_guide->>'title',
        nullif(v_guide->>'title_hi', ''),
        nullif(v_guide->>'body_md', ''),
        nullif(v_guide->>'body_md_hi', ''),
        coalesce((v_guide->>'sort_order')::integer, 0);
    end loop;
  end if;

  -- Insert dates
  if payload ? 'dates' then
    foreach v_date in array (payload->'dates')::jsonb[] loop
      insert into public.event_dates (event_id, label, label_hi, date, time, url, sort_order)
      select
        v_event_id,
        v_date->>'label',
        nullif(v_date->>'label_hi', ''),
        (v_date->>'date')::date,
        nullif(v_date->>'time', '')::time,
        nullif(v_date->>'url', ''),
        coalesce((v_date->>'sort_order')::integer, 0);
    end loop;
  end if;

  v_result := jsonb_build_object('event_id', v_event_id, 'status', 'created');
  return v_result;
end;
$$;

-- ============================================================
-- 11. Smoke test
-- ============================================================
select 'migration 002 complete' as status,
       (select count(*) from information_schema.tables where table_schema = 'public') as total_tables;
