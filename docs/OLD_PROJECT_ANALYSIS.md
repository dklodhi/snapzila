# Old Project Analysis (Postmortem)

> Reference repo: `DK9425/snapzila` (archived, read-only — DO NOT modify)
> Reference DB: Supabase project `hcpdzihpficogayzqrxg` (inspected via REST API, 2026-11-16)

This document is the honest postmortem of the previous SnapZila build. Its purpose is **not to criticise** — it is to extract every lesson worth carrying forward and to make sure Phase 1 does not repeat the same patterns.

---

## 1. Headline numbers

| Metric | Value |
| --- | --- |
| Database tables exposed | **129** |
| RPC functions | 1 |
| Tables with zero rows | **~115** (≈ 89% of all tables) |
| Tables with real data (>10 rows) | ~14 |
| Largest table (column count) | `events` — **72 columns** |
| Other overloaded tables | `exams` (49), `organisations` (48), `business_profiles` (28), `vault_documents` (25), `contact_messages` (33), `course_masters` (33), `hirezila_campus_drives` (36), `hirezila_employers` (34) |

The 129 tables break down into roughly **eight overlapping subsystems**, all built in parallel.

---

## 2. What was built (by subsystem)

### 2.1 SnapZila core (events, exams, institutions)
`events`, `exams`, `exam_sessions`, `exam_calendars`, `exam_calendar_entries`, `exam_cut_offs`, `exam_experiences`, `cut_offs`, `cutoff_predictions`, `organisations`, `organisation_profiles`, `org_branches`, `org_contact_details`, `org_exam_links`, `org_helpline_faqs`, `org_members`, `org_member_audit`, `org_working_hours`, `org_complaints`, `course_masters`, `course_offerings`, `course_exam_links`, `syllabi`, `syllabus_subjects`, `syllabus_nodes`, `syllabus_node_assignments`, `placements`, `faculty`, `infrastructure`, `gallery`, `university_rankings`, `selection_stories`, `timeline_entries`, `career_timelines`, `certificates`, `entity_relationships`, `event_index_dates`, `event_term_assignments`, `admission_process`, `keyword_pages`

→ **~40 tables** trying to model the full education graph (exam → course → org → syllabus → placements → rankings → faculty → infrastructure → gallery → timelines → certificates). Ambitious, but mostly empty.

### 2.2 HireZila (private jobs platform — OUT of Phase 1)
`hirezila_employers`, `hirezila_employer_members`, `hirezila_employer_reviews`, `hirezila_job_applications`, `hirezila_application_forms`, `hirezila_assessment_attempts`, `hirezila_skills_assessments`, `hirezila_interview_sessions`, `hirezila_campus_drives`, `hirezila_campus_drive_colleges`, `hirezila_campus_registrations`, `hirezila_multi_post_records`, `hirezila_local_job_leads`, `hirezila_widget_configs`, `hirezila_widget_events`, `hirezila_widget_tokens`, `hirezila_blocked_requests`, `business_profiles`, `job_applications`, `campus_applications`, `campus_drives`, `campus_student_batches`, `campus_tpo_profiles`, `saved_candidates`, `resumes`

→ **~25 tables** for an entire separate LinkedIn-lite/ATS product with widget embeds, multi-posting, campus drives, TPO workflows. None of this belongs in Phase 1.

### 2.3 AI Crawler / extraction pipeline (OUT of Phase 1)
`crawler_sources`, `crawler_jobs`, `crawler_raw_documents`, `crawler_extraction_queue`, `crawler_notifications`, `vault_documents`

→ **6 tables** for an AI-powered crawler that ingests source pages, extracts structured JSON, queues for human verification, and vaults documents. High cost, high complexity, needs content volume first. Not Phase 1.

### 2.4 API monetization (OUT of Phase 1)
`api_clients`, `api_keys`, `api_plans`, `api_subscriptions`, `api_request_logs`, `api_docs`

→ **6 tables** for a paid public API product (rate limits, plans, billing, request logs). Premature — there are no API consumers yet.

### 2.5 Notification channels (OUT of Phase 1)
`telegram_auth`, `telegram_message_queue`, `telegram_subscriptions`, `whatsapp_auth`, `whatsapp_message_queue`, `push_subscriptions`, `email_queue`, `message_templates`, `notification_channel_configs`, `notification_mutes`, `user_notification_preferences`, `user_notifications`, `news_alert_subscriptions`, `job_alert_subscriptions`, `admission_alert_subscriptions`, `alert_subscriptions`

→ **~16 tables** for Telegram bot, WhatsApp bot, web push, email queue, and four different alert-subscription shapes (news/job/admission/generic). Phase 1 only needs in-app notifications.

### 2.6 MOOC integration (OUT of Phase 1)
`mooc_providers`, `mooc_courses`, `mooc_enrollments`

→ 3 tables for aggregating third-party online courses with affiliate enrollment. Different business.

### 2.7 Discussion / community (OUT of Phase 1)
`discuss_forums`, `discuss_posts`, `discuss_replies`, `discuss_reactions`, `discuss_entity_tags`, `user_discussion_preferences`, `reviews`, `chat_sessions`

→ Forum + review + chat. Heavy moderation burden; needs community scale first.

### 2.8 Taxonomy / i18n / infra / auth
`taxonomies`, `taxonomy_terms`, `languages`, `translation_keys`, `translations`, `language_translations`, `user_profiles`, `user_prefs`, `user_follows`, `user_saves`, `user_shares`, `user_oauth_links`, `user_sessions`, `users`, `static_pages`, `redirects`, `site_config`, `audit_log`, `contact_messages`, `page_views`, `integration_configs`, `api_docs` (overlap), `snap_ids`, `zilabiz_slug_redirects`, `wp_import_log`

→ **~26 tables** of foundational + cross-cutting concerns. Some of this is genuinely useful (taxonomies, languages, audit_log, static_pages, user_follows, user_saves) and reappears in Phase 1 in a leaner form. Some is tech debt (`snap_ids`, `zilabiz_slug_redirects`, `wp_import_log`).

---

## 3. What went wrong — root causes

### 3.1 Built five businesses in parallel

SnapZila core, HireZila, MOOC aggregator, AI crawler, and API monetization are five different go-to-markets with five different customer types. A solo founder cannot launch five businesses at once. **Phase 1 picks exactly one**: the event-centric career/education live-update platform.

### 3.2 Overloaded tables instead of normalized design

The `events` table had **72 columns** because it tried to describe every field that any event type might ever need (vacancy breakdown, category-wise cutoffs, selection process, application fee by category, counseling, admit card URL, result URL, apply mode, age relaxation, etc.).

This caused:
- Sparse columns (most NULL for any given event)
- Painful INSERT/UPDATE (every form had 72 fields)
- Impossible to reason about "what an event is"
- The founder's frustration with the post view design

**Phase 1 fix**: `events` has ~15 core columns; everything flexible goes into JSONB (`apply_steps JSONB`, `eligibility JSONB`, `fees JSONB`, `vacancy JSONB`). Live updates, guide sections, dates, documents each get their own child table.

### 3.3 No MVP boundary

There was no documented "this is what we ship first" list. Every feature felt equally important. The result: 89% of tables were empty — features built but never used because no user ever saw them.

**Phase 1 fix**: [`MASTER_PLAN.md` §3](MASTER_PLAN.md#3-phase-1-scope--in) and §4 (IN/OUT lists) are binding. Any addition requires a written worklog entry.

### 3.4 Multiple overlapping auth + notification surfaces

Telegram auth, WhatsApp auth, OAuth links, sessions, push subs, email queue, three alert subscription shapes — every channel needed its own auth model, queue, retry logic, and template. Massive surface area for zero Phase 1 value.

**Phase 1 fix**: one auth (Supabase email+password), one notification channel (in-app), one follow/save model.

### 3.5 Two overlapping org models

`organisations` (48 cols) and `business_profiles` (28 cols) both modeled "an organisation" but for different subsystems (education org vs HireZila employer). Confusing, hard to query across, hard to migrate.

**Phase 1 fix**: one `institutions` table for all 15 educational categories. Employers don't exist in Phase 1 (HireZila is out).

### 3.6 WordPress migration baggage

`wp_import_log` and `zilabiz_slug_redirects` suggest an attempted WordPress import or co-existence. Migration glue should not live in the production schema permanently.

**Phase 1 fix**: clean slate. No migration tables. If WP content needs to be imported later, it's a one-off script that writes into the new `events` table.

### 3.7 Untested RLS

Most tables had zero rows, which means RLS policies were never exercised in production. RLS bugs typically only surface with real users and real data — a serious risk if launched as-is.

**Phase 1 fix**: every table ships with RLS policies AND a test in the same migration. RLS test suite runs in CI.

### 3.8 Tech debt tables with unclear purpose

`snap_ids`, `zilabiz_slug_redirects`, `wp_import_log` — three tables whose purpose is not obvious from their name alone. Without docs, these become permanent clutter.

**Phase 1 fix**: every table in the new schema has a clear one-line purpose documented in `DB_SCHEMA.md`. No mystery tables.

---

## 4. What was good — keep these ideas

| Idea | Where it lived | Verdict |
| --- | --- | --- |
| **Event as the central entity** | `events` (even if overloaded) | KEEP — central to the unique value prop |
| **Live updates as child rows of event** | `timeline_entries` (underused) | KEEP — promoted to first-class `event_updates` |
| **Multi-language support** | `languages` (9 rows), `translation_keys` (550), `translations` | KEEP concept, simplify — use `*_multilang JSONB` for content, next-intl for UI |
| **Taxonomy system** | `taxonomies`, `taxonomy_terms` (385 terms) | KEEP in simplified form as `tags` |
| **Audit log** | `audit_log` (11 cols, 126 rows) | KEEP — every console write logged |
| **Static pages via DB** | `static_pages` (14 cols) | KEEP — About/Contact from console |
| **Institution submissions queue** | `institution_submissions` (23 cols) | KEEP — submit-only model for institutions |
| **Site config as KV** | `site_config` | KEEP — `site_settings` |
| **Important dates as separate rows** | `event_index_dates` | KEEP — `event_dates` |
| **Documents as separate rows** | `vault_documents` (overloaded) | KEEP simplified — `event_documents` with Supabase Storage |
| **Search via keyword pages** | `keyword_pages` | DEFER — Phase 2 SEO play |
| **Following + saving** | `user_follows`, `user_saves` | KEEP — core to personalization |
| **Personalization prefs** | `user_prefs` (12 cols) | KEEP simplified |
| **Exam calendar concept** | `exam_calendars`, `exam_calendar_entries` | KEEP — collapsed into one tool view sourced from `events` |
| **Employment news concept** | (implicit in `events` of type news) | KEEP — a weekly digest view, no separate table needed beyond `employment_news_issues` for issue meta |

---

## 5. Bugs & issues observed in the old schema

These are concrete issues spotted in the old schema that must NOT carry forward:

1. **`page_views` and `translations` returned `?` row count** — likely because the tables are not properly exposed via PostgREST or have RLS blocking even service_role reads. Signals inconsistent exposure config.
2. **Inconsistent naming**: `organisations` (British) vs `business_profiles` (no org prefix) vs `org_*` (abbreviated). Pick one convention — Phase 1 uses `institutions` and `institution_*`.
3. **`contact_messages` with 33 columns** including `leadStatus`, `assignedTo`, `courseInterested` — a contact form masquerading as a CRM. Phase 1 keeps it as a simple contact form (10 cols max).
4. **`audit_log` only 126 rows** despite the project existing for months → audit logging was either broken or not wired into all writes. Phase 1 makes audit logging mandatory in the data-access layer, not optional.
5. **`user_sessions` with 300 rows** while most content tables are empty → the auth/session machinery worked but the content machinery didn't. Auth is necessary but not sufficient.
6. **`organisation_profiles` vs `organisations` split** — separating "the org" from "the org's profile" makes sense for big orgs with multiple branches, but for Phase 1 institutions it's premature. One table.
7. **No clear "status" convention**: some tables use `status`, some use `isPublished`, some use both. Phase 1 standardizes on `status` enum + `published_at` timestamp + `deleted_at` for soft delete.
8. **`admission_process` as a separate table linked to `orgId`** — a process fragment with no clear parent. Phase 1 collapses admission process into the event's `apply_steps` JSONB.

---

## 6. Lessons → binding rules for Phase 1

1. **One table per concept.** No `organisations` + `business_profiles` duplication.
2. **JSONB for sparse/flexible fields.** No 72-column tables.
3. **Child tables for repeated structure** (live updates, guide sections, dates, documents) — not crammed into the parent.
4. **RLS on every table, tested in the same migration.**
5. **No subsystem without a clear Phase 1 user.** HireZila/MOOC/crawler/API all fail this test.
6. **One auth, one notification channel, one follow/save model.**
7. **Every table documented in `DB_SCHEMA.md` with a one-line purpose.**
8. **Soft delete (`deleted_at`), never hard delete on content.**
9. **Audit log writes from the data layer, not from ad-hoc UI code.**
10. **No migration glue in the production schema.**

---

*This document is a snapshot. If we discover new issues during Phase 1 sessions, append them here with the session ID.*
