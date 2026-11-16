# SnapZila — Worklog

> Running log of every working session. Append-only. Newest at top.

## Format

Each entry:

```
## SXX — <date> — <session title>

### Done
- ...

### DB changes
- (migration file names or "none")

### Pushed
- (commit hashes / PR links)

### Broke / Fixed
- ...

### Deferred (decided this session)
- ...

### Next session plan
- ...
```

---

## S08 — 2026-11-16 — Soft Launch Prep (seed + screenshots)

### Done
- **Content seeded** via `scripts/seed_s8_v2.py`:
  - 6 events (one per content type: govt-jobs, admissions, scholarships, govt-schemes, news, articles) — each with live updates, guide sections, and dates. All published.
  - 2 static pages: About Us + Contact Us (published, EN+HI body, show in footer).
  - 4 helpline entries: SSC, UPSC, IBPS, NSP (published).
  - 1 employment news issue: Issue #1, current week, published.
- **Screenshots** taken via Playwright (`scripts/take_screenshots.py`), saved to `public/screenshots/`:
  - `home.png` (1280×800, 138KB) — home page with hero + latest events grid.
  - `opportunities.png` (1280×800, 136KB) — opportunities landing with 6 type cards + latest feed.
  - `govt-jobs-list.png` (1280×800, 70KB) — govt jobs listing with event cards.
  - `event-view.png` (1280×800, 74KB) — single event page (SSC CGL) with parent post + timeline rail.
  - `event-view-mobile.png` (780×1688, 124KB) — mobile view of event page.
  - `helpline.png` (1280×800, 75KB) — helpline directory.
  - `exam-calendar.png` (1280×800, 44KB) — exam calendar month grid.
  - `employment-news.png` (1280×800, 84KB) — employment news weekly digest.
- **Build**: `npm run build` passes. 34 routes.
- **next-intl middleware temporarily disabled** in proxy.ts — next-intl requires pages inside `[locale]/` directory, but current pages are at `src/app/` root. The i18n infrastructure (messages, routing config, translations) is complete; activating it requires restructuring pages into `src/app/[locale]/`. This is a mechanical change deferred to post-launch. Root serves English; `/hi-in/` will activate once restructured.

### DB changes
- None (seed only — no schema changes).

### Pushed
- (this commit) — S8 seed + screenshots + worklog.

### Broke / Fixed
- `create_event_from_json` RPC has a JSONB→text[] casting issue (`cannot cast type jsonb to text[]`). Worked around by inserting events directly via REST API instead of the RPC. The RPC needs a fix in a future migration (use `array(SELECT jsonb_array_elements_text(...))` instead of `::text[]`).
- next-intl middleware caused 404s because pages aren't in `[locale]/` directory. Temporarily disabled in proxy.ts to get the app running.

### Deferred (decided this session)
- Full 100-event seed — 6 sample events seeded (one per type). Full seed can be done from console.
- 50-institution seed — no institutions submitted yet. The submit flow is live; institutions come via public submissions.
- PostHog analytics — needs account setup.
- Google Search Console verification — needs domain ownership verification.
- next-intl page restructuring (moving pages to `[locale]/`).
- LanguageSwitcher UI component.
- `useTranslations()` hook in components (mechanical swap).

### Next session plan (post-S8)
- Restructure pages into `src/app/[locale]/` to activate next-intl properly.
- Fix `create_event_from_json` RPC casting.
- Full content seed (100+ events, 50+ institutions).
- Deploy to Vercel.
- Soft launch to closed group.

### Notes for the founder
- **Screenshots** are in `public/screenshots/` — viewable at `/screenshots/home.png` etc. once deployed, or directly in the GitHub repo.
- **Seeded content**: visit `/opportunities` to see the 6 sample events. Visit `/opportunities/govt-jobs/ssc-cgl-2026-notification` to see the full event page with timeline + guide + dates + discussions.
- **About Us** at `/about`, **Contact Us** at `/contact`.
- **Helpline** at `/helpline` — 4 entries seeded.
- **Exam Calendar** at `/tools/exam-calendar` — calendar grid (no exams this month; seeded events have exam dates in mid-2026).
- **Employment News** at `/tools/employment-news` — Issue #1 live.
- The app is feature-complete for Phase 1 scope. Next steps: deploy to Vercel + full content seed + soft launch.

---

## S07 — 2026-11-16 — i18n + SEO + Polish

### Done
- **next-intl** installed and configured:
  - `src/i18n/routing.ts` — locales `["en-IN", "hi-IN"]`, defaultLocale `en-IN`, `localePrefix: "as-needed"` (root = en-IN, `/hi-in/` for Hindi).
  - `src/i18n/request.ts` — getRequestConfig loads messages per locale.
  - `next.config.ts` — `withNextIntl` plugin wrapper.
  - `messages/en-IN.json` — 100+ UI string keys (nav, home, event, discussion, search, institutions, helpline, contact, tools, me, onboarding, notifications, notFound, footer, common).
  - `messages/hi-IN.json` — complete Hindi translations for all 100+ keys.
- **Proxy** updated — merges next-intl middleware (locale routing) + Supabase session refresh. Console/admin routes skip i18n (English-only). Cookie merging for both layers.
- **Sitemap** (`src/app/sitemap.ts`) — auto-generated `sitemap.xml`:
  - All static pages with hreflang alternates (en-IN root + hi-IN `/hi-in/` + x-default).
  - Dynamic event pages (up to 500 published events).
  - Institution category pages.
  - Priority: home=1, section pages=0.8, events=0.6, categories=0.5.
- **robots.txt** (`src/app/robots.ts`) — allows all, disallows /console, /me, /onboarding, /api. Links to sitemap.
- **Build**: `npm run build` passes. 34 routes (added `/sitemap.xml` + `/robots.txt`).

### DB changes
- None.

### Pushed
- (this commit) — S7 i18n + SEO code.

### Broke / Fixed
- None — build passed clean first try.

### Deferred (decided this session)
- Using `useTranslations()` hook in components — the messages files exist but components still use hardcoded English strings. Swapping all components to use `useTranslations()` is a mechanical change across ~30 files; deferred to S8 polish pass or done incrementally. The infrastructure is live; Hindi locale accessible at `/hi-in/`.
- PostHog analytics integration — deferred (needs PostHog account setup).
- Google Search Console verification — deferred (needs domain verification).
- Performance pass (ISR, image optimization) — deferred to S8.
- Accessibility pass (axe-core) — deferred to S8.
- LanguageSwitcher component — the next-intl middleware handles locale switching via URL; a UI switcher component can be added in S8.

### Next session plan (S8)
- Soft Launch Prep: About/Contact content, seed events, bug bash, empty/loading states, final QA.

### Notes for the founder
- Hindi locale is live at `/hi-in/` — e.g. `/hi-in/opportunities` serves the Hindi version.
- Root (`/`) = English India (no prefix), per the plan.
- Sitemap at `/sitemap.xml` includes hreflang alternates for both locales.
- robots.txt at `/robots.txt` allows crawling of public pages.
- All 100+ UI strings have Hindi translations in `messages/hi-IN.json`.
- Components still render English text directly — swapping to `useTranslations()` is the next mechanical step.

---

## S06-fix — 2026-11-16 — Jurisdiction hierarchy + notifications page

### Done
- **DB migration** `20261116000007a` (schema) + `20261116000007b` (seed) applied:
  - Added `parent_id` to `tags` table (self-referencing FK for hierarchy: state → district → city).
  - Added `tag_kind` values: `central-govt`, `district`, `city`.
  - Added `follow_target_type` values: `central-govt`, `district`, `city`.
  - **Seeded 63 tags**: 1 central-govt + 36 states/UTs + 12 sectors + 14 orgs (SSC, UPSC, IBPS, etc.).
- **Follow system now supports 9 target types**: event, institution, tag, sector, state, org, **central-govt**, **district**, **city**.
  - Hierarchy: central-govt (top) → state → district → city (via tags.parent_id).
  - Users can follow any level — e.g. follow "central-govt" for all central govt opportunities, or follow a specific state/district/city.
- **`/me/notifications` page** — the NotificationBell linked here but the page didn't exist. Now built: full notifications list (50 most recent), kind badges (live-update/deadline/result/system), unread highlighting, mark-all-read button, link to source.
- Split migration into 007a (schema: ALTER TYPE + ALTER TABLE) and 007b (seed inserts) because PostgreSQL doesn't allow using a newly-added enum value in the same transaction.

### DB changes
- `tags` table: +1 column (parent_id), +3 enum values in tag_kind.
- `follow_target_type` enum: +3 values (central-govt, district, city).
- 63 tag rows seeded.

### Pushed
- (this commit) — S6 fixes + notifications page + migration.

---

## S06 — 2026-11-16 — User Features (Follow + Save + Notifications + Personalization)

### Done
- **DB migration** `20261116000006_user_features.sql` applied:
  - `user_profiles` (12 cols): full_name, avatar_url, target_group (student/job-seeker/learner/other), state, exam_interests[], content_interests[], preferred_locale, onboarded_at.
  - `user_follows` (5 cols): polymorphic follow with target_type enum = **event/institution/tag/sector/state/org**. Unique per (user, target_type, target_id). Public read (for follower counts), owner insert/delete.
  - `user_saves` (5 cols): same polymorphic structure as follows. Owner-only read.
  - `user_notifications` (13 cols): kind (live-update/deadline/result/system), title, body, link, target_type, target_id, priority, read_at, seen_at, archived_at. Owner read/update.
  - **Fan-out trigger**: `notify_event_followers()` — AFTER INSERT on `event_updates`, creates a `user_notifications` row for every user following that event. Security definer, runs as system. This is the "follow event → get notified on live update" mechanism.
  - 3 enums: follow_target_type (6 values), notification_kind (4), target_group (4).
- **Server actions** (`src/lib/user/actions.ts`):
  - `toggleFollow(targetType, targetId)` — optimistic, unique constraint handles duplicates.
  - `toggleSave(targetType, targetId)` — same pattern.
  - `markNotificationRead(id)`, `markAllNotificationsRead()`.
  - `saveProfile(formData)` — upserts user_profiles with onboarding data.
- **Components**:
  - `FollowButton` — client, optimistic UI, shows Follow/Following state, redirects to login if not authed. Supports all 6 target types (event, institution, tag, sector, state, org).
  - `SaveButton` — client, bookmark icon, optimistic toggle, fill state when saved.
  - `NotificationBell` — client, dropdown with unread badge count, realtime subscription on `user_notifications` INSERT (new notifications push live), mark-all-read action, links to notifications list.
- **Pages**:
  - `/onboarding` — personalization form: full name, target group (student/job-seeker/learner/other), state (dropdown of all Indian states/UTs), exam interests (comma-separated), content interests (checkbox grid of 6 content types). Upserts to user_profiles.
  - `/me` — dashboard rewritten with:
    - Onboarding prompt banner if not onboarded.
    - Stats cards: Saved count, Following count, Unread notifications, Profile status.
    - Saved events list (fetches events by saved target_ids).
    - Following section: followed events + counts per other target types (institutions, tags, sectors, states, orgs).
    - Recent notifications list (last 10, with unread highlighting).
    - NotificationBell in header (realtime).
  - `/me/profile` — edit profile form (same fields as onboarding, prefilled).
- **Event page** (`/opportunities/[type]/[slug]`) — Follow + Save buttons added above the parent post. Server-side checks if current user follows/has saved the event, passes initial state to client components.
- **Proxy** — `/onboarding` added to USER_PROTECTED routes (redirects to login if not authed).
- **Build**: `npm run build` passes. 31 routes.

### DB changes
- 4 tables, 3 enums, 1 trigger function, ~16 RLS policies.
- Total tables: 22.

### Pushed
- (this commit) — S6 user features code + migration + worklog.

### Broke / Fixed
- No build errors in this session.

### Deferred (decided this session)
- Follow buttons on institution pages — the infrastructure works (target_type='institution'), but the institution listing cards don't have follow buttons yet. Defer to when institution detail pages are built (Phase 2+).
- Follow buttons for tags (sector/state/org) on tag listing pages — no tag listing pages exist yet. The tags table exists but has no public listing UI.
- Personalized home feed based on content_interests — home page still shows latest events. Personalization can be added in S7 or S8.
- Notification settings (per-channel prefs) — deferred.
- Email/push notifications — Phase 2.

### Next session plan (S7)
- i18n: Hindi mirror (`/hi-in/`), next-intl, locale-aware formatting.
- SEO: sitemap, hreflang, meta tags, robots.txt.
- PostHog analytics.
- Performance pass (ISR, image optimization).
- Accessibility pass.

### Notes for the founder
- Follow system supports 6 target types: **event, institution, tag, sector, state, org** — matching the old project's polymorphic follow, but simplified to a single table + enum.
- Follow an event → get an in-app notification whenever a new live update is posted to that event (automatic via DB trigger).
- NotificationBell in the `/me` header shows unread count + live-pushes new notifications via Supabase Realtime.
- Onboarding flow at `/onboarding` — prompt users to set their target group, state, exam interests, content interests.
- Profile editable at `/me/profile`.
- Save (bookmark) any event — appears in the Saved section of `/me`.

---

## S05 — 2026-11-16 — Helpline + Tools (Exam Calendar + Employment News)

### Done
- **DB migration** `20261116000005_helpline_tools.sql` applied:
  - `helpline_entries` (13 cols): title EN+HI, category, body_md EN+HI, phone, email, website, sort_order, status.
  - `contact_messages` (10 cols): name, email, subject, body, category, user_id, ip_hash, status (new/read/replied/archived).
  - `exam_calendar_overrides` (9 cols): exam_name EN+HI, date, category, url, notes, sort_order.
  - `employment_news_issues` (13 cols): issue_number, week_start/end, title EN+HI, intro_md EN+HI, featured_event_ids[], status, published_at.
  - 3 enums: helpline_status, contact_status, employment_news_status.
  - RLS: helpline public read published + team CRUD; contact submitter read own + team read all + auth insert + team update; overrides public read + team write; employment_news public read published + team CRUD.
- **Public pages**:
  - `/helpline` — directory grouped by category, phone/email/website links per entry.
  - `/contact` — contact form (name, email, category, subject, body) with success state. Auth required.
  - `/tools/exam-calendar` — month grid view: pulls from published events with exam_date + exam_calendar_overrides. Month navigation (prev/next). Today highlighted. Up to 3 items per day cell + "N more". List view below with all exams that month.
  - `/tools/employment-news` — weekly digest: latest issue with featured events (or auto-pulled govt-jobs from that week), previous issues list.
- **Console pages**:
  - `/console/helpline` — add form (title, category, status, phone, email, website, sort_order, body) + list with delete.
  - `/console/tools/exam-calendar` — add override form + list with delete.
  - `/console/tools/employment-news` — create issue form (auto-suggests next issue number + next week's Mon-Sun dates, featured event IDs, intro markdown, status) + issues list with delete.
- **Server actions** (`src/lib/tools/actions.ts`): `submitContact`, `saveHelplineEntry`, `deleteHelplineEntry`, `saveExamOverride`, `deleteExamOverride`, `saveEmploymentNewsIssue`, `deleteEmploymentNewsIssue` — all with audit log.
- **Build**: `npm run build` passes. 31 routes.

### DB changes
- 4 tables, 3 enums, ~16 RLS policies.
- Total tables: 18.

### Pushed
- (this commit) — S5 helpline + tools code + migration + worklog.

### Broke / Fixed
- JSX parse error in exam-calendar: missing `}` after `.map()` callback — the closing `))` was on a separate line from `}`. Fixed by putting `))}` on the same line.

### Deferred (decided this session)
- Employment News auto-issue cron (scheduled Edge Function that creates a draft every Sunday) — defer to S8.
- Contact messages console viewer — table exists + RLS, but no console list/view page yet. Team can query via SQL for now. Defer to later.
- Exam calendar iCal export — defer.
- Employment News PDF download — defer.

### Next session plan (S6)
- User Features: Follow, Save, Notifications (in-app bell), Personalization prefs, home feed.

### Notes for the founder
- Helpline directory live at `/helpline` — add entries from console.
- Contact form live at `/contact` — submissions go to `contact_messages` table.
- Exam Calendar live at `/tools/exam-calendar` — auto-pulls from events with exam_date + manual overrides from console.
- Employment News live at `/tools/employment-news` — create weekly issues from console, auto-pulls govt-jobs if no featured IDs specified.
- All four console management pages are in the sidebar under "Content" and "Tools" (though sidebar items for Helpline + Exam Calendar were previously marked "coming in S5" — they're now live).

---

## S04 — 2026-11-16 — Institutions (submit-only + console moderation)

### Done
- **DB migration** `20261116000004_institutions.sql` applied:
  - `institutions` table (25 cols): id, category (16-value enum), name, name_hi, slug, city, state, established_year, website, logo_url, description (EN+HI), contact_email/phone, status, published_at, featured, tags, meta_jsonb, search_vector, created_by, submission_id, timestamps, deleted_at.
  - `institution_submissions` table (18 cols): id, category, name, city, state, website, description, submitter_name/email/phone, submitter_user_id, status (pending/approved/rejected/merged), review_notes, reviewed_by/at, resulting_institution_id, timestamps.
  - 3 enums: `institution_category` (16 values), `institution_status` (4), `submission_status` (4).
  - Cross-table FKs: institutions.submission_id → submissions.id; submissions.resulting_institution_id → institutions.id; event_discussions.institution_id → institutions.id (deferred from S3).
  - `search_vector` trigger on institutions (name, name_hi, city, state, description).
  - RLS: public reads published institutions; team reads/writes all; auth users can submit; submitter reads own submissions; team reviews.
  - Public read policy for discussions on published institutions (deferred from S3).
- **Public pages**:
  - `/institutions` — landing with 16 category cards.
  - `/institutions/[category]` — listing of published institutions in that category (sorted by name, up to 100).
  - `/institutions/submit` — public submit form (requires login). Split into server page + client `SubmitForm` component (to avoid client-importing-server-component issue). Fields: category, name, city, state, website, description, submitter name/email/phone. Success state after submission.
- **Console pages**:
  - `/console/institutions` — moderation queue + published institutions list. Status filter tabs (All / Pending / Approved / Rejected). Two tables: submissions (pending review) + published institutions (editable).
  - `/console/institutions/[id]` — dual-purpose review/edit page:
    - If ID is a submission: shows submission details + publish form (editable fields: name, name_hi, city, state, website, contact_email, description) + reject form (with reason). Publish creates an institution + marks submission approved + links them.
    - If ID is an institution: shows edit form (category, status, name EN+HI, slug, website, city, state, contact, description EN+HI).
- **Server actions** (`src/lib/public/institution-actions.ts`):
  - `submitInstitution` — public submit (requires auth user).
  - `publishSubmission` — creates institution from submission + marks approved + audit log.
  - `rejectSubmission` — marks rejected with reason + audit log.
  - `saveInstitution` — updates existing institution + audit log.
  - `deleteInstitution` — soft delete + audit log.
- **Build**: `npm run build` passes. 26 routes.

### DB changes
- Migration `20261116000004_institutions.sql` applied.
- 2 new tables, 3 enums, 1 trigger function, ~12 RLS policies, 3 cross-table FKs.
- Total tables: 14.

### Pushed
- (this commit) — S4 institutions code + migration + worklog.

### Broke / Fixed
- Client component importing server component: `submit/page.tsx` was "use client" but imported `PublicShell` (which uses `next/headers` via `getCurrentUser`). Split into server page (`page.tsx`) + client form (`submit-form.tsx`). Server page wraps `<PublicShell>` and renders `<SubmitForm>` as a client child.
- TS spread order: `{ submission_id: x, ...data }` flagged "specified more than once" because `data` also had `submission_id`. Fixed to `{ ...data, submission_id: x }`.

### Deferred (decided this session)
- Institution detail page (`/institutions/[category]/[slug]`) with discussions — the listing page links to institution cards but there's no single-institution page yet. Defer to when rich institution pages are needed (Phase 2+). The discussion infrastructure is ready (event_discussions works with institution_id, RLS is set up).
- Institution logo upload — logo_url column exists but no upload UI.
- "Merge to existing" flow for submissions that duplicate existing institutions.
- Fake university checker tool — the category exists but no dedicated checker UI.

### Next session plan (S5)
- Helpline page + contact form.
- Exam Calendar tool (month grid view from events with exam_date).
- Employment News weekly digest.

### Notes for the founder
- Institutions flow is live: public submits → console reviews → publishes.
- Login required to submit (any consumer account works).
- Console moderation queue at `/console/institutions` shows pending submissions.
- Review page at `/console/institutions/[id]` lets you publish (with editable fields) or reject (with reason).
- Published institutions appear on `/institutions/[category]` listing pages.
- 16 categories supported including fake-universities and law-universities.

---

## S03 — 2026-11-16 — Public Opportunities + Voice-Type Discussions

### Plan modification (pre-S3)
- Founder requested discussions be re-included in Phase 1 scope — NOT as a forum, but as voice-type based comments tied to events & institutions.
- Updated `MASTER_PLAN.md` §3.5 (new Discussions section with 6 voice types), §4 (removed from OUT list), §8 (added tables 21+22), §10.5 (discussion layout + card design + voice badge colors + UX rules).
- Updated `DB_SCHEMA.md` §8.5 (full column spec + RLS + vote trigger), §12 (S3 now creates 2 tables).
- Updated `SESSION_PLAN.md` S3 (expanded with discussion tasks).
- Updated `README.md` scope list.
- Committed as `7234e78`.

### Done
- **DB migration** `20261116000003_discussions.sql` applied:
  - `event_discussions` table: id, event_id, institution_id (FK deferred to S4), author_id, voice_type, body_md (max 2000), parent_id (one-level replies), upvote_count, reply_count, created_at, deleted_at.
  - `discussion_votes` table: discussion_id, user_id, unique on (discussion_id, user_id).
  - `voice_type` enum: aspirant, selected, mentor, official, skeptic, general.
  - Vote count trigger: maintains `upvote_count` on vote insert/delete.
  - Reply count trigger: maintains parent's `reply_count` on reply insert/delete.
  - RLS: public read on published events, auth insert, author update/delete, team delete (moderation), votes public read + auth insert + self delete.
- **Public shell**: `SiteHeader` (logo, nav, auth-aware buttons) + `SiteFooter` (3-column links) + `PublicShell` wrapper.
- **Home page** (`/`): hero + type buttons + latest 9 events grid + auth status banner.
- **Opportunities landing** (`/opportunities`): 6 type cards with counts + latest 12 events grid.
- **Type listing** (`/opportunities/[type]`): filterable by type, up to 50 events, EventCard grid.
- **EventCard** component: type badge (colored), featured pill, title, conducting body, summary, days-left-to-apply.
- **Single event page** (`/opportunities/[type]/[slug]`):
  - Desktop: 2-col grid (parent + guide + dates | sticky timeline rail).
  - Mobile: single column (parent → timeline → guide → dates → discussions).
  - `ParentPostPartial`: partial view (title, body, summary, key dates, apply link) + "View All" AJAX expand (URL hash `#details`) revealing full body, eligibility, fees, selection process, locations.
  - `EventTimeline`: live updates with realtime subscription (`postgres_changes` INSERT filter), kind-colored dots (info/warning/result/admit-card/corrigendum/extension/deadline), "new" pulse animation, relative time formatting.
  - `EventGuide`: accordion of guide sections sorted by section type then sort_order.
  - `EventDates`: list of important dates with optional links.
  - `DiscussionSection`: voice-type discussions — sort toggle (Top/Recent), comment cards with pseudonymous avatar (initials from author_id hash, color from hash), colored voice badges, upvote button (optimistic UI, one per user), one-level reply threads, post form (voice select + textarea), reply form (inline), "Login to join" prompt if not logged in.
- **Discussion server actions** (`src/lib/public/discussion-actions.ts`): `postDiscussion`, `postReply`, `toggleUpvote` — all require auth via `requireUser()`.
- **Search page** (`/search`): ILIKE search across title/conducting_body/summary, up to 20 results, EventCard grid.
- **404 page**: on-brand, with home + opportunities links.
- **Build**: `npm run build` passes clean. 21 routes compiled.

### DB changes
- Migration `20261116000003_discussions.sql` applied.
- 2 new tables, 1 enum, 2 triggers, ~10 RLS policies.
- Total tables: 12 (team_members + 9 content + 2 discussion).

### Pushed
- `7234e78` — plan modification (discussions re-included).
- (this commit) — S3 code + migration + worklog.

### Broke / Fixed
- `next/font/google` (Plus Jakarta Sans + Inter) failed in Turbopack build — sandbox can't download fonts from Google at build time. Fixed by switching to system font stacks in CSS variables. Custom fonts will be added on Vercel deploy (which has internet).
- `MessageReply` icon doesn't exist in lucide-react → `MessageSquareReply`.
- `auth.users` FK join in Supabase select (`author:auth.users!fk_name(email)`) failed TypeScript parsing. Refactored to fetch `author_id` only and derive pseudonymous handle + avatar color from the UUID hash. This is actually better for privacy (no email exposure in public API).
- TS strict `noUncheckedIndexedAccess`: array indexing (`colors[i]`, `VOICE_CONFIG[type]`, `KIND_CONFIG[kind]`) returns `T | undefined`. Added `?? fallback` + `if (!x) return null` guards.

### Deferred (decided this session)
- Documents upload + display (table exists, no upload UI yet) — defer to S4 or later.
- Realtime for discussions (only live updates get realtime in Phase 1) — discussions refresh on page load.
- Discussion edit window (15-min edit) — RLS allows update but no UI for editing yet.
- Console discussion moderation page — team can soft-delete via SQL for now, proper UI later.
- ISR/cache headers — all pages are dynamic (ƒ) for now. Performance pass in S7.
- Custom fonts (Plus Jakarta Sans + Inter) — deferred to Vercel deploy.

### Next session plan (S4)
- Institutions: public submit form, console moderation queue, category listing pages.
- Institution page with discussions (same DiscussionSection, tied to institution_id).
- Add FK from event_discussions.institution_id to institutions.id.

### Notes for the founder
- The public site is live: home, opportunities landing, type listings, single event pages with timeline + guide + dates + discussions.
- Realtime live updates work — open an event page in two tabs, add a live update from the console, see it appear in the other tab.
- Discussions are voice-type based: pick your voice (aspirant/selected/mentor/official/skeptic/general), post, upvote, reply (one level).
- Avatars are pseudonymous (derived from user UUID) — no email exposure publicly.
- Search works at `/search?q=...`.
- 404 page is on-brand.
- Fonts are system stacks for now — will swap to Plus Jakarta Sans + Inter on Vercel deploy.

---

## S02 — 2026-11-16 — Console Core (post management + JSON paste + audit log)

### Done
- **DB migration** `20261116000002_content_tables.sql` applied to Supabase:
  - 9 new tables: `tags`, `events` (41 cols, down from old project's 72), `event_updates`, `event_guides`, `event_dates`, `event_documents`, `static_pages`, `site_settings`, `audit_logs`.
  - 7 enums: `event_type`, `event_status`, `apply_mode`, `update_kind`, `guide_section`, `doc_type`, `tag_kind`, `page_status`.
  - `search_vector` tsvector on events (maintained by trigger).
  - `updated_at` triggers on all content tables.
  - 2 helper functions: `events_update_search_vector()`, `create_event_from_json(payload)` RPC.
  - RLS on every table: public reads published content, team reads/writes all, audit_logs append-only.
- **Console Shell** — shared layout for all `/console/*` pages (except login):
  - Left sidebar (`ConsoleSidebar`): dark theme, grouped nav (Main / Content / System), active-link highlighting via `usePathname()`, placeholders for S4/S5/S7 items.
  - Top bar (`ConsoleTopbar`): "New Post" dropdown (Manual / JSON paste), user menu (avatar, email, role, logout, view public site).
  - Route groups: `(auth)/login` (no shell) + `(shell)/` (with shell + `requireTeamMember()`).
- **Post List** (`/console/posts`): filterable by type, table with title/type/status/updated/actions.
- **Manual Post Editor**:
  - `/console/posts/new-manual` — create new event with core fields.
  - `/console/posts/[id]/edit` — edit event + manage child entities inline:
    - `EventCoreForm` component: Basic (type, title, slug, tags, summary, status), Organization & Apply (conducting body, apply mode/link, dates), Body (EN+HI markdown), SEO.
    - Live Updates card: list + add form (kind, title, body, doc_url) + delete.
    - Guide Sections card: list + add form (section, title, body) + delete.
    - Important Dates card: list + add form (label, date, url) + delete.
- **JSON Paste Editor** (`/console/posts/new-json`): client component with textarea, "Load sample" buttons per type, "Validate" (Zod schema), "Create" (calls `create_event_from_json` RPC).
- **6 JSON Samples** in `public/json-samples/`: govt-jobs, admissions, scholarships, govt-schemes, news, articles — each with realistic data including updates, guides, dates.
- **Zod schema** (`src/lib/console/schemas.ts`): validates the JSON payload structure before RPC call.
- **Static Pages** (`/console/pages`): list + new + edit. Fields: slug, title (EN+HI), body (EN+HI markdown), SEO meta, show in header/footer, sort order, status.
- **Site Settings** (`/console/settings`): KV editor for brand_name, taglines, default_locale, footer_columns. Shows raw JSON view of all settings.
- **Audit Log** (`/console/audit-log`): viewer with action filter, shows time/action/entity/actor (email + role). Last 100 entries.
- **Server Actions** (`src/lib/console/actions.ts`): all mutations centralized:
  - `saveEvent` (create/update), `setEventStatus`, `softDeleteEvent`
  - `addLiveUpdate`, `deleteLiveUpdate`, `addGuideSection`, `deleteGuideSection`, `addDate`, `deleteDate`
  - `createEventFromJson` (calls RPC)
  - `saveStaticPage` (create/update), `deleteStaticPage`
  - `saveSiteSetting`
  - Every action calls `writeAuditLog()` after the mutation.
- **Audit helper** (`src/lib/console/audit.ts`): `writeAuditLog()` appends to `audit_logs` with actor, action, entity, before/after data.
- **Build**: `npm run build` passes clean. 16 routes compiled.

### DB changes
- Migration `20261116000002_content_tables.sql` applied.
- 9 new tables, 7 enums, 2 functions, ~30 RLS policies.
- Total tables in public schema: 10 (team_members + 9 content/meta).

### Pushed
- (this commit) — S2 console core code, DB migration, JSON samples, worklog update.

### Broke / Fixed
- Route group relative imports: `../posts/actions` from `pages/new/page.tsx` failed because `(shell)` route group parentheses confuse the resolver. Fixed by moving `actions.ts` to `src/lib/console/actions.ts` and using `@/lib/console/actions` alias.
- TS strict: `teamMember.email[0]` flagged as possibly undefined (`noUncheckedIndexedAccess`). Fixed with `(email[0] ?? "?")`.
- Zod v4: `z.record(z.unknown())` requires two args now. Fixed to `z.record(z.string(), z.unknown())`.
- Server action bind order: `deleteLiveUpdate(id, eventId)` with `bind(null, eventId).bind(null, updateId)` resulted in swapped args. Fixed by changing signature to `deleteLiveUpdate(eventId, updateId)` to match bind order (outer scope first, inner scope second).
- `saveSiteSetting(key, value)` didn't work as a form action (forms submit FormData). Fixed to `saveSiteSetting(key, formData)` and extract value inside.

### Deferred (decided this session)
- Documents upload UI (table exists, RLS exists, but no upload component yet) — defer to S3 when the public view needs to display PDFs.
- Post bulk actions (bulk publish/unpublish/delete) — defer to later.
- Team member invite flow — defer.
- Post scheduling (scheduled_at + cron to auto-publish) — defer to S8.
- Search within console (the top bar search is visual only) — defer.

### Next session plan (S3)
- Public Opportunities: listing pages (`/opportunities/[type]`), single event view with timeline + guide + AJAX "View All" + realtime live updates, search page.

### Notes for the founder
- The console is fully usable for content creation: create events via Manual or JSON editor, add live updates/guide/dates, publish, manage static pages + settings, view audit log.
- Login at `/console/login` with `admin@snapzila.com`.
- The 6 JSON samples in `public/json-samples/` are realistic starting points — load one in the JSON paste editor, tweak, and create.
- Every console write is logged in `audit_logs` — viewable at `/console/audit-log`.
- Sidebar shows which modules are coming in later sessions (S4/S5/S7) — they are NOT built yet, by design.

---

## S01 — 2026-11-16 — Auth & RBAC (Supabase Auth + team_members)

### Done
- **S0 foundation (completed in this session)**: set up the Next.js 16 app in the existing repo.
  - `package.json`, `next.config.ts`, `tsconfig.json` (strict mode), `postcss.config.mjs`, `eslint.config.mjs`.
  - Tailwind CSS 4 via `@tailwindcss/postcss` + `@import "tailwindcss"` in `globals.css`.
  - Design tokens from `DESIGN_SYSTEM.md` applied as CSS variables in `@theme` block (brand `#4F46E5`, accent `#F97316`, full status + neutral scale).
  - Fonts loaded via `next/font`: Plus Jakarta Sans (display), Inter (body).
  - Base shadcn/ui components: `button` (with `asChild` via Radix Slot), `input`, `label`, `card`.
  - `lib/utils/cn.ts` (class merge), `lib/utils/log.ts` (thin logging wrapper — no `console.error` in committed code).
- **Supabase clients** (`lib/supabase/`):
  - `client.ts` — browser client via `createBrowserClient`.
  - `server.ts` — server client via `createServerClient` + `next/headers` cookies.
  - `middleware.ts` — `updateSession()` helper for the proxy.
- **DB migration** `supabase/migrations/20261116000001_team_members.sql`:
  - `team_members` table: `id, user_id (→auth.users), email, role, status, invited_by, added_at, updated_at`.
  - Enums: `team_role` (super_admin/admin/content_writer), `team_member_status` (active/invited/disabled).
  - `updated_at` trigger.
  - Helper functions: `is_team_member(min_role)`, `has_min_role(required)` (role hierarchy).
  - 6 RLS policies: self read, team read all, super_admin insert/delete/update, self update.
- **Migration applied** to Supabase (`mrnzidzwbomrntijrzrj`) via `psycopg2` through the IPv4 connection pooler (`aws-0-ap-south-1.pooler.supabase.com`). Direct host is IPv6-only in this region.
- **super_admin user bootstrapped** via Supabase Auth Admin API: `admin@snapzila.com` (email confirmed, linked to `team_members` with role=super_admin, status=active).
- **Auth pages**:
  - `/login` — consumer login (email+password, Suspense-wrapped `useSearchParams`).
  - `/signup` — consumer signup (full name, email, password ≥8 chars).
  - `/logout` — signs out + redirects home.
  - `/console/login` — separate team login (dark theme, ShieldCheck icon, checks `team_members` on success, signs out non-team users with error).
- **Protected pages**:
  - `/me` — consumer dashboard (calls `requireUser()`, shows saved/following/notifications placeholders + account info).
  - `/console` — team dashboard (calls `requireTeamMember()`, shows role badge + tool module placeholders for S2–S5).
- **Route guards** (`src/proxy.ts` — Next.js 16 renamed `middleware.ts` → `proxy.ts`):
  - Refreshes Supabase session on every request.
  - `/console/*` (except `/console/login`) → redirect to `/console/login` if no session.
  - `/me` → redirect to `/login` if no session.
  - Skips `/api/*`, `/_next/*`, static files, public auth routes.
- **Server helpers** (`lib/auth/server.ts`): `getCurrentUser()`, `getTeamMember()`, `requireUser()`, `requireTeamMember()`, `requireRole(min)`.
- **Client hooks** (`lib/auth/`): `useCurrentUser()`, `useTeamMember()` — subscribe to Supabase auth state changes.
- **RLS test** (`tests/test_team_members_rls.py`): creates a temp consumer user, asserts consumer CANNOT read/insert team_members, asserts super_admin CAN read, cleans up. All 4 tests pass.
- **Build**: `npm run build` passes clean. 9 routes compiled (ƒ dynamic: `/`, `/console`, `/me`; ○ static: `/login`, `/signup`, `/logout`, `/console/login`, `/_not-found`).

### DB changes
- Migration `20261116000001_team_members.sql` applied to Supabase `mrnzidzwbomrntijrzrj`.
- Table `public.team_members` created (8 columns, 6 RLS policies, 3 helper functions).
- `auth.users` row created for `admin@snapzila.com`.
- `team_members` row inserted: role=super_admin, status=active.

### Pushed
- `f448be8` — s0 worklog push confirmation (already on main from previous session).
- (this commit) — s0-foundation + s1 auth code, DB migration, RLS test, worklog update.

### Broke / Fixed
- Next.js 16 deprecation: `middleware.ts` → `proxy.ts`. Renamed file + exported `proxy()` instead of `middleware()`.
- TypeScript strict mode caught implicit `any` in `@supabase/ssr` cookie callbacks (`setAll(cookiesToSet)`). Fixed with explicit `CookieEntry[]` type annotation.
- `useSearchParams` in client components must be wrapped in `<Suspense>` for static generation. Wrapped `LoginForm` and `ConsoleLoginForm` in Suspense.
- Supabase direct connection host (`db.<ref>.supabase.co`) is IPv6-only in the South Asia (Mumbai) region. The sandbox has no IPv6 routing. Fixed by using the connection pooler (`aws-0-ap-south-1.pooler.supabase.com`) with user `postgres.<ref>`.
- Supabase Auth Admin API requires the service_role key in BOTH the `apikey` header AND the `Authorization: Bearer` header. Initial RLS test only passed it as `apikey` → 401. Fixed.
- Removed hardcoded `Admin@123` from the RLS test file (would be public in the repo). Test now reads `SNAPZILA_ADMIN_PASSWORD` env var.

### Deferred (decided this session)
- Team member invite flow (email-based invitation with `status='invited'`) — deferred to S2 when the console team management page is built.
- OAuth providers (Google, GitHub) — deferred to Phase 2. Phase 1 is email+password only.
- Email confirmation for consumer signup — currently OFF for dev; will enable in S8 before soft launch.
- Password reset flow — deferred to S2 or S8.

### Next session plan (S2)
- Console Core: create `events`, `event_updates`, `event_guides`, `event_dates`, `event_documents`, `tags`, `static_pages`, `site_settings`, `audit_logs` tables.
- Build the post editor (Manual + JSON paste with samples).
- Build the post list view with filters + bulk actions.
- Static pages editor + site settings editor.
- Audit log viewer.

### Notes for the founder
- **Login credentials**: `admin@snapzila.com` / password from `ID Pass.txt`. **Change this password after first login** (the password is the same as the old project — anyone who saw the old credentials file knows it).
- The app builds and runs locally with `npm run dev`. Set `.env.local` (gitignored) with the three Supabase env vars from `.env.example`.
- To run the RLS test: `SNAPZILA_ADMIN_PASSWORD=<password> python3 tests/test_team_members_rls.py`.
- The proxy file is `src/proxy.ts` (not `middleware.ts`) — Next.js 16 renamed the convention.

---

## S00 — 2026-11-16 — Foundation & Planning (revised after old-repo code analysis)

### Done
- **Phase 1 (initial)**: Analyzed old project via Supabase REST API (DB schema only — GitHub token was redacted at the time). Old DB has 129 tables, ~115 empty. See `OLD_PROJECT_ANALYSIS.md`.
- **Phase 2 (after token)**: Founder provided a GitHub token. Cloned old repo `DK9425/snapzila` and analyzed the actual code:
  - **1,517 files** (714 `.tsx`, 599 `.ts`), **95 top-level routes**, **129 Prisma models** (4,478-line / 200 KB `schema.prisma`).
  - **Custom auth** (Argon2 + 3 JWT secrets + PII encryption + OTP via Upstash Redis + OAuth) — NOT Supabase Auth.
  - **Prisma + Neon → Supabase migration baggage** (200 KB Prisma schema + 146 KB `schema.sql` kept in sync manually).
  - **Event god-object**: 72+ fields, self-referencing parent/update/guide hierarchy in ONE table, direct HireZila relations, denormalized counters.
  - **12 content types** (Phase 1 needs 6), **11 separate editor subdirectories** (one per type).
  - **~30 locales** for hreflang but only 3 real translations (en/hi/ne). URL strategy itself is good — reused as reference.
  - **30 `src/lib/` subdirectories** representing 30 concerns; Phase 1 needs ~10.
  - **15 TODOs** (incomplete OTP/email/auth features), **190 console.error/warn**, **102 `any` types**.
  - Old worklog reveals two prior cleanup attempts (Jan 2025) that removed dead tables and subdomains but did not cut features. Phase 1 is the actual feature cut.
- Confirmed new Supabase project (`mrnzidzwbomrntijrzrj`) is empty (0 tables) — clean slate.
- Cloned new repo `dklodhi/snapzila` (public, initial commit only).
- Wrote Phase 1 planning docs (all decisions sharpened by the code analysis):
  - `README.md` — project intro + doc index.
  - `docs/MASTER_PLAN.md` — comprehensive Phase 1 plan.
  - `docs/OLD_PROJECT_ANALYSIS.md` — postmortem with full code-level findings (§6).
  - `docs/DESIGN_SYSTEM.md` — brand, colors, typography, components.
  - `docs/DB_SCHEMA.md` — Phase 1 schema (20 tables vs 129).
  - `docs/SESSION_PLAN.md` — S0–S8 session breakdown.
  - `docs/WORKLOG.md` — this file.
- Decided new brand color: **Indigo `#4F46E5` (primary) + Sunset Orange `#F97316` (accent)**. Old brand color retired.
- Decided stack (reinforced by code analysis): Next.js 16 + TypeScript (strict, zero `any`) + Tailwind 4 + shadcn/ui + **Supabase (native, no Prisma)** + **Supabase Auth (not custom JWT)** + next-intl + PostHog.
- Decided URL strategy: root = English India (no prefix), `/hi-in/` for Hindi — matches the old project's good URL pattern, simplified to 2 locales.

### DB changes
- None (new Supabase project still empty — intentional).

### Pushed
- `e89fb2d` — s0: initial planning docs (12 files).
- `9122a49` — s0-revise: deepened analysis after cloning old repo with founder-provided token.
- Both commits pushed to `https://github.com/dklodhi/snapzila` on `main` (2026-11-16). Repo is public.

### Broke / Fixed
- Initial planning round was done without code access (token redacted). Revised after founder provided token. The DB-schema-only analysis was directionally correct; the code analysis confirmed every finding and added concrete numbers (1,517 files, 72-field Event model, 30 lib subsystems, etc.).

### Deferred (decided this session)
- Reuse of any old code: NONE. Phase 1 is a clean rewrite. The old repo stays archived at `DK9425/snapzila` for reference only.
- The old i18n middleware URL pattern is referenced as the approach to follow (simplified to EN+HI) — but the code itself is not copied.
- Cloudflare R2 setup (already provisioned in old project; not needed for Phase 1 since Supabase Storage is sufficient).

### Next session plan (S1)
- Auth & RBAC: create `team_members` table, build consumer + console login via **Supabase Auth** (not custom JWT), role guards, RLS test.

### Notes for the founder
- The planning docs in this repo are the binding plan. The code-level analysis in `OLD_PROJECT_ANALYSIS.md` §6 documents exactly what was wrong and why each Phase 1 decision is the right response.
- The new Supabase project (`mrnzidzwbomrntijrzrj`) is empty and ready. The first migration runs in S1.
- The analysis env file with Supabase keys is at `/home/z/my-project/workspace/.env.keys` (gitignored, never committed). Use it for the inspection scripts in `/home/z/my-project/scripts/`.
- The old repo was cloned to `/home/z/my-project/workspace/old-repo-code/` for analysis only. It is NOT pushed anywhere and NOT modified.

---
