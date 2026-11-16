# SnapZila — Phase 1 Database Schema

> ~20 tables. Clean slate on Supabase project `mrnzidzwbomrntijrzrj`.
> Every table ships with RLS policies in the same migration file that creates it.

This document is the canonical column-level spec. The actual DDL lives under `supabase/migrations/` as numbered SQL files, added per session as tables are needed. **A table is created in the session that first needs it** — not all upfront.

---

## 0. Conventions

- All tables use `uuid` primary keys (`gen_random_uuid()`).
- All tables have `created_at` (`timestamptz`, default `now()`), `updated_at` (updated via trigger).
- Content tables have `deleted_at` (`timestamptz`, nullable) for soft delete.
- Status enum where applicable: `draft | scheduled | published | unpublished | rejected`.
- Money: store as integer paise in India (`fees_inr_paise`). Display as ₹ with Indian grouping.
- JSONB columns ending in `_multilang` have shape `{ "en": "...", "hi": "..." }`.
- All timestamps stored as `timestamptz` (UTC). Displayed in user locale (`en-IN` / `hi-IN`).
- Naming: `snake_case` for tables and columns. Table names are plural nouns.
- Foreign keys: `<singular>_id` (e.g. `event_id`, `user_id`).
- Indexes: every FK gets an index; every public listing filter gets a composite index.

---

## 1. Team & Auth

### 1.1 `team_members`

Console users. Identity lives in `auth.users`; this table is the RBAC layer.

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| user_id | uuid → auth.users.id | unique |
| email | text | denormalized for convenience; kept in sync |
| role | enum('super_admin','admin','content_writer') | |
| status | enum('active','invited','disabled') | default 'invited' |
| invited_by | uuid → team_members.id | nullable |
| added_at | timestamptz | default now() |
| updated_at | timestamptz | |

RLS: team only can read; super_admin only can write.

---

## 2. Content — Events (the 6 opportunity types)

### 2.1 `events`

One row per opportunity post (govt job / admission / scholarship / scheme / news / article).

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| type | enum('govt-jobs','admissions','scholarships','govt-schemes','news','articles') | |
| slug | text | unique per (type, deleted_at IS NULL) |
| title | text | EN |
| title_hi | text | HI, nullable |
| summary | text | EN, 1-line |
| summary_hi | text | HI, nullable |
| conducting_body | text | e.g. "Staff Selection Commission" |
| conducting_body_slug | text | for grouping |
| locations | text[] | states or "All India" |
| apply_mode | enum('online','offline','hybrid','na') | |
| apply_link | text | nullable |
| apply_start_date | date | nullable |
| apply_end_date | date | nullable |
| exam_date | date | nullable |
| result_date | date | nullable |
| status | enum('draft','scheduled','published','unpublished','rejected') | default 'draft' |
| published_at | timestamptz | nullable |
| scheduled_at | timestamptz | nullable |
| featured | boolean | default false |
| tags | text[] | tag slugs |
| eligibility | jsonb | structured: age, education, category relaxations, etc. |
| vacancy | jsonb | structured: total, category-wise breakdown |
| fees_inr_paise | integer | nullable; per-general category |
| fees_breakdown | jsonb | category-wise fees |
| selection_process | text[] | steps |
| apply_steps | jsonb | array of {title, body_md, body_md_hi?} |
| body_md | text | EN, full description (parent post "View All" reveals this) |
| body_md_hi | text | HI, nullable |
| meta_title | text | nullable |
| meta_description | text | nullable |
| meta_title_hi | text | nullable |
| meta_description_hi | text | nullable |
| og_image_url | text | nullable |
| canonical_url | text | nullable |
| search_vector | tsvector | generated from title, title_hi, conducting_body, summary, tags |
| created_by | uuid → team_members.id | |
| updated_by | uuid → team_members.id | |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | |
| deleted_at | timestamptz | nullable |

Indexes: `(type, status, published_at DESC)`, `(slug)`, `(conducting_body_slug)`, `(tags)`, `search_vector` (GIN).

### 2.2 `event_updates` (live-update timeline)

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| event_id | uuid → events.id | ON DELETE CASCADE |
| kind | enum('info','warning','result','admit-card','corrigendum','extension','deadline') | |
| title | text | EN |
| title_hi | text | nullable |
| body_md | text | EN |
| body_md_hi | text | nullable |
| doc_url | text | nullable |
| published_at | timestamptz | when shown to users (default now()) |
| sort_order | integer | default 0; tiebreak with published_at DESC |
| created_by | uuid → team_members.id | |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | |

Index: `(event_id, published_at DESC, sort_order DESC)`.

### 2.3 `event_guides` (structured guide sections)

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| event_id | uuid → events.id | ON DELETE CASCADE |
| section | enum('eligibility','apply_steps','fees','dates','documents','faq','other') | |
| title | text | EN |
| title_hi | text | nullable |
| body_md | text | EN |
| body_md_hi | text | nullable |
| sort_order | integer | default 0 |
| created_at | timestamptz | |
| updated_at | timestamptz | |

Index: `(event_id, sort_order)`.

### 2.4 `event_dates` (important dates)

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| event_id | uuid → events.id | ON DELETE CASCADE |
| label | text | e.g. "Application Start", "Admit Card", "Exam Date", "Result" |
| label_hi | text | nullable |
| date | date | |
| time | time | nullable |
| url | text | nullable (e.g. admit card download) |
| sort_order | integer | |
| created_at | timestamptz | |

Index: `(event_id, sort_order)`, `(date)` for exam calendar tool.

### 2.5 `event_documents` (PDFs / attachments)

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| event_id | uuid → events.id | ON DELETE CASCADE |
| title | text | |
| title_hi | text | nullable |
| doc_type | enum('notification','admit-card','result','syllabus','other') | |
| storage_path | text | Supabase Storage path |
| public_url | text | derived from storage_path |
| file_size_bytes | bigint | |
| mime_type | text | |
| sort_order | integer | |
| created_at | timestamptz | |

Index: `(event_id, sort_order)`.

---

## 3. Institutions

### 3.1 `institutions`

Educational institutions across the 15 categories. Submit-only for the public; published from console.

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| category | enum('exams','courses','universities','iits','nits','iims','aiims','iiits','nifts','schools','colleges','coaching','training-skill-centres','iti','fake-universities','law-universities') | |
| name | text | |
| name_hi | text | nullable |
| slug | text | unique per (category, deleted_at IS NULL) |
| city | text | nullable |
| state | text | nullable |
| established_year | integer | nullable |
| website | text | nullable |
| logo_url | text | nullable |
| description | text | nullable, EN |
| description_hi | text | nullable |
| contact_email | text | nullable |
| contact_phone | text | nullable |
| status | enum('draft','published','unpublished','rejected') | default 'draft' |
| published_at | timestamptz | nullable |
| tags | text[] | |
| meta_jsonb | jsonb | flexible: course count, fees range, accreditations — schema per category documented separately |
| search_vector | tsvector | generated from name, name_hi, city, state, description |
| created_by | uuid → team_members.id | nullable if originated from submission |
| submission_id | uuid → institution_submissions.id | nullable |
| created_at | timestamptz | |
| updated_at | timestamptz | |
| deleted_at | timestamptz | nullable |

Indexes: `(category, status, published_at DESC)`, `(slug)`, `(state)`, `search_vector` GIN.

### 3.2 `institution_submissions` (public submit queue)

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| category | enum (same as institutions) | |
| name | text | |
| city | text | nullable |
| state | text | nullable |
| website | text | nullable |
| description | text | nullable |
| submitter_name | text | |
| submitter_email | text | |
| submitter_phone | text | nullable |
| submitter_user_id | uuid → auth.users.id | nullable (anon allowed? Phase 1: requires login) |
| status | enum('pending','approved','rejected','merged') | default 'pending' |
| review_notes | text | nullable |
| reviewed_by | uuid → team_members.id | nullable |
| reviewed_at | timestamptz | nullable |
| resulting_institution_id | uuid → institutions.id | nullable; set on publish/merge |
| created_at | timestamptz | |
| updated_at | timestamptz | |

Index: `(status, created_at)`.

---

## 4. Taxonomy

### 4.1 `tags`

Lightweight, flat (Phase 1). Hierarchical taxonomy deferred.

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| slug | text | unique |
| label | text | EN |
| label_hi | text | nullable |
| kind | enum('sector','state','exam','org','skill','qualification','target-group') | |
| created_at | timestamptz | |

Index: `(kind, slug)`.

---

## 5. Helpline

### 5.1 `helpline_entries`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| title | text | |
| title_hi | text | nullable |
| category | text | e.g. "Exam Body", "Scheme", "Admission", "Grievance" |
| body_md | text | |
| body_md_hi | text | nullable |
| phone | text | nullable |
| email | text | nullable |
| website | text | nullable |
| sort_order | integer | |
| status | enum('draft','published','unpublished') | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### 5.2 `contact_messages` (from contact form)

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| name | text | |
| email | text | |
| subject | text | |
| body | text | |
| category | text | nullable |
| user_id | uuid → auth.users.id | nullable |
| ip_hash | text | for rate-limit audit |
| status | enum('new','read','replied','archived') | default 'new' |
| created_at | timestamptz | |

Index: `(status, created_at)`.

---

## 6. Tools

### 6.1 `exam_calendar_overrides`

Manual additions/overrides for the exam calendar tool. The tool's primary data source is `events` (type filtering + `exam_date`); this table is for events that don't fit the standard event model (e.g. board exam timetables).

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| exam_name | text | |
| exam_name_hi | text | nullable |
| date | date | |
| category | text | |
| url | text | nullable |
| notes | text | nullable |
| sort_order | integer | |
| created_at | timestamptz | |

Index: `(date)`.

### 6.2 `employment_news_issues` (weekly digest meta)

The actual content of each weekly issue is a curated subset of `events` (type='govt-jobs' published that week). This table stores issue-level meta + the curated pick list.

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| issue_number | integer | sequential |
| week_start | date | Monday |
| week_end | date | Sunday |
| title | text | e.g. "Employment News — Week of 2026-11-16" |
| title_hi | text | nullable |
| intro_md | text | nullable |
| intro_md_hi | text | nullable |
| featured_event_ids | uuid[] | curated picks |
| status | enum('draft','published') | |
| published_at | timestamptz | nullable |
| created_at | timestamptz | |
| updated_at | timestamptz | |

Index: `(week_start DESC)`.

---

## 7. Static Pages & Site Settings

### 7.1 `static_pages`

For About Us, Contact Us content, and any future static page managed from console.

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| slug | text | unique |
| title | text | |
| title_hi | text | nullable |
| body_md | text | |
| body_md_hi | text | nullable |
| meta_title | text | nullable |
| meta_description | text | nullable |
| show_in_header | boolean | default false |
| show_in_footer | boolean | default false |
| sort_order | integer | default 0 |
| status | enum('draft','published') | |
| created_by | uuid → team_members.id | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### 7.2 `site_settings`

Key-value store for site-wide config. Single row conceptually; modeled as KV for flexibility.

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| key | text | unique |
| value | jsonb | |
| updated_by | uuid → team_members.id | |
| updated_at | timestamptz | |

Keys in Phase 1: `brand_name`, `brand_tagline_en`, `brand_tagline_hi`, `default_locale`, `feature_flags` (object), `social_links` (object), `footer_columns` (array), `search_console_verification_tag`.

---

## 8. User (consumer) tables

### 8.1 `user_profiles`

Extends `auth.users` with onboarding/personalization data.

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| user_id | uuid → auth.users.id | unique |
| full_name | text | nullable |
| avatar_url | text | nullable |
| target_group | enum('student','job-seeker','learner','other') | nullable |
| state | text | nullable |
| exam_interests | text[] | tag slugs |
| content_interests | text[] | event type slugs |
| preferred_locale | enum('en-IN','hi-IN') | default 'en-IN' |
| onboarded_at | timestamptz | nullable |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### 8.2 `user_follows`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| user_id | uuid → auth.users.id | |
| target_type | enum('event','institution','tag') | |
| target_id | uuid | polymorphic |
| created_at | timestamptz | |

Unique: `(user_id, target_type, target_id)`.

### 8.3 `user_saves`

Same shape as `user_follows`. Unique on `(user_id, target_type, target_id)`.

### 8.4 `user_notifications`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| user_id | uuid → auth.users.id | |
| kind | enum('live-update','deadline','result','system') | |
| title | text | |
| body | text | nullable |
| link | text | nullable |
| target_type | text | nullable |
| target_id | uuid | nullable |
| priority | enum('low','normal','high') | default 'normal' |
| read_at | timestamptz | nullable |
| seen_at | timestamptz | nullable |
| archived_at | timestamptz | nullable |
| created_at | timestamptz | |

Index: `(user_id, read_at NULLS FIRST, created_at DESC)`.

---

## 9. Audit

### 9.1 `audit_logs`

Every console write records a row. Written by the data-access layer (a thin wrapper around Supabase calls in `lib/console/`), NOT by ad-hoc UI code.

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| actor_id | uuid → team_members.id | |
| action | text | e.g. 'event.create', 'event.publish', 'institution.publish' |
| entity_type | text | |
| entity_id | uuid | |
| before_data | jsonb | nullable |
| after_data | jsonb | nullable |
| ip_address | text | nullable |
| user_agent | text | nullable |
| created_at | timestamptz | default now() |

Index: `(actor_id, created_at DESC)`, `(entity_type, entity_id)`, `(created_at DESC)`.

---

## 10. Supabase Storage buckets

| Bucket | Public | Use |
| --- | --- | --- |
| `event-documents` | read public, write team only | PDFs for events |
| `institution-logos` | read public, write team only | Institution logos |
| `og-images` | read public, write team only | Social share images |
| `user-avatars` | read public, write owner only | Consumer avatars |
| `employment-news` | read public, write team only | Weekly digest PDF |

RLS on storage: team can write to team buckets; consumer can write only to their own avatar path (`user-avatars/{user_id}/...`).

---

## 11. Realtime

Supabase Realtime Postgres Changes subscriptions used in Phase 1:

| Channel | Filter | Use |
| --- | --- | --- |
| `event_updates` | `event_id=eq.<current>` | Live-update timeline on event page |
| `user_notifications` | `user_id=eq.<current>` | Notification bell live update |

Both use the anon key (RLS applies); no service_role in client.

---

## 12. Migration order (per session)

| Session | Tables created |
| --- | --- |
| S0 | (none — Supabase client + project linking only) |
| S1 | `team_members` |
| S2 | `events`, `event_updates`, `event_guides`, `event_dates`, `event_documents`, `tags`, `static_pages`, `site_settings`, `audit_logs` |
| S3 | (no new tables — reads S2 tables) |
| S4 | `institutions`, `institution_submissions` |
| S5 | `helpline_entries`, `contact_messages`, `exam_calendar_overrides`, `employment_news_issues` |
| S6 | `user_profiles`, `user_follows`, `user_saves`, `user_notifications` |
| S7 | (no new tables — i18n + SEO only) |
| S8 | (no new tables — polish only) |

Total: **20 tables**. Down from 129.

---

## 13. RLS policy template

Every table migration file follows this structure:

```sql
-- ========== table ==========
create table public.events ( ... );

-- indexes
create index ... ;

-- RLS
alter table public.events enable row level security;

-- public read of published content
create policy "events: public read published"
  on public.events for select
  using (status = 'published' and deleted_at is null);

-- team can read all
create policy "events: team read all"
  on public.events for select
  to authenticated
  using (exists (select 1 from public.team_members tm
                 where tm.user_id = auth.uid() and tm.status = 'active'));

-- team can write (writer: own only; admin+: any)
create policy "events: team insert"
  on public.events for insert
  to authenticated
  with check (exists (select 1 from public.team_members tm
                      where tm.user_id = auth.uid()
                        and tm.status = 'active'
                        and tm.role in ('super_admin','admin','content_writer')));

create policy "events: team update"
  on public.events for update
  to authenticated
  using (exists (select 1 from public.team_members tm
                 where tm.user_id = auth.uid() and tm.status = 'active'));

-- soft delete only; no hard delete policy = no hard delete from client
```

Every migration also includes a `\d+ <table>` echo at the end as a smoke test, and a `select * from <table> limit 0;` to confirm exposure.

---

*Schema is locked for Phase 1. Any addition requires a written decision in `docs/WORKLOG.md` and an update to this document.*
