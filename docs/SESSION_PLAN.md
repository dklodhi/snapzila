# SnapZila — Session Plan (Phase 1)

> 9 sessions (S0–S8). Each session = one focused working session that ends with: code pushed to `main`, DB migrations applied to Supabase, worklog updated.

The order is deliberate: **foundation → auth → console → public read → institutions → tools → user features → i18n/polish → launch prep.** Console before public site, because public site reads what console writes — you cannot test the public UI meaningfully until the console can produce content.

---

## Session 0 — Foundation

**Goal**: empty Next.js app wired to Supabase, brand applied, this plan committed.

### Tasks
1. Init Next.js 16 (App Router, TS, Tailwind 4, ESLint, shadcn/ui CLI).
2. Install Supabase JS client + `@supabase/ssr`.
3. Link Supabase project `mrnzidzwbomrntijrzrj` (CLI).
4. Configure env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server only).
5. Apply design tokens from `DESIGN_SYSTEM.md` to `tailwind.config.ts` + `app/globals.css`.
6. Load fonts via `next/font` (Plus Jakarta Sans, Inter, JetBrains Mono).
7. Build base app shell: header (logo, nav, language switcher placeholder, auth buttons), footer, container.
8. Build 3 skeleton pages: home, /opportunities, /console (just "coming soon" placeholder).
9. Set up GitHub Actions CI: `pnpm install`, `lint`, `typecheck`, `build`.
10. Commit this entire `docs/` folder + README + .gitignore.

### Deliverables
- `main` branch with running Next.js app.
- Vercel project connected, auto-deploys from `main`.
- `docs/` committed.

### Tables created
None.

### Worklog entry
"What we did", "what's deferred", "next session".

---

## Session 1 — Auth & RBAC

**Goal**: consumer signup/login at `/login` + `/signup`; team login at `/console/login`; role-based access enforced.

### Tasks
1. Create `team_members` table (migration file).
2. Seed one `super_admin` row mapping to your Supabase Auth user (sign up via Supabase dashboard first).
3. Build Supabase auth client wrapper (`lib/auth.ts`) — server + browser variants.
4. Build consumer auth pages: `/signup`, `/login`, `/logout`. Email + password. Redirect to `/me` on success.
5. Build console auth page: `/console/login` — separate UI, same Supabase Auth backend, but checks `team_members` row on success; redirect to `/console` or back to `/console/login` with error if not a team member.
6. Build route guards:
   - `middleware.ts` — redirects `/console/*` to `/console/login` if no session or not a team member.
   - Consumer pages redirect to `/login` if `requireUser`.
7. Build `useCurrentUser()` and `useTeamMember()` hooks.
8. RLS test: write a small script that signs in as a consumer user and as a team member, attempts reads on `team_members`, asserts consumer gets empty and team member gets rows. Run in CI.

### Deliverables
- Working consumer auth flow.
- Working console auth flow with role gate.
- RLS test passing.

### Tables created
`team_members`.

---

## Session 2 — Console Core (post management)

**Goal**: console can create, edit, publish, unpublish, soft-delete, schedule, feature all 6 opportunity types — via Manual editor AND JSON-paste editor with samples.

### Tasks
1. Create content tables: `events`, `event_updates`, `event_guides`, `event_dates`, `event_documents`, `tags`, `static_pages`, `site_settings`, `audit_logs` (one migration file per table OR one grouped file — your call, but RLS + indexes included).
2. Create Supabase Storage buckets: `event-documents`, `og-images`.
3. Build console shell: sidebar + topbar (DESIGN_SYSTEM.md §11).
4. Build post list view (`/console/posts?type=...`) with filters + bulk actions.
5. Build Manual editor (`/console/posts/new?type=...` and `/console/posts/[id]/edit`):
   - Details tab: all event core fields.
   - Live Updates tab: list editor with drag-reorder.
   - Guide tab: sections with drag-reorder.
   - Dates tab: date rows.
   - Documents tab: upload to Supabase Storage.
   - SEO tab.
   - Audit tab (read-only).
6. Build JSON-paste editor (`/console/posts/new-json?type=...`):
   - CodeMirror editor.
   - "Load sample" button → fills from `docs/json-samples/<type>.sample.json`.
   - "Validate" button → Zod schema for that type.
   - "Create" → calls Supabase RPC `create_event_from_json(payload)` (write the RPC in a migration).
7. Write JSON samples for all 6 types under `docs/json-samples/`.
8. Build audit log writer in `lib/console/data-access.ts` — every create/update/publish/unpublish/soft-delete records to `audit_logs`.
9. Build static pages editor (`/console/pages`) — About, Contact.
10. Build site settings editor (`/console/settings`).
11. Build audit log viewer (`/console/audit-log`).

### Deliverables
- Console can manage all 6 opportunity types end-to-end.
- Both editors (Manual + JSON) functional.
- 6 JSON samples committed.
- Audit log populated for every write.

### Tables created
9 content + meta tables (see DB_SCHEMA.md §12).

---

## Session 3 — Public Opportunities

**Goal**: public site lists events by type and shows the timeline + guide single-event view (per MASTER_PLAN.md §10). Realtime live updates working.

### Tasks
1. Build `/opportunities` landing (cards by type + latest feed).
2. Build `/opportunities/[type]` listing pages (filterable: status implicit=open, sort by published_at / apply_end_date / featured).
3. Build `<EventCard>` and `<EventListItem>` components.
4. Build single event page `/opportunities/[type]/[slug]`:
   - `<ParentPostPartial>` with "View All" AJAX expand (URL hash `#details`).
   - Mobile: single-column (parent partial → timeline → guide).
   - Desktop: 2-col (parent + guide | sticky timeline rail).
   - `<EventTimeline>` + `<TimelineItem>` with kind-colored dots.
   - `<EventGuide>` (accordion mobile / tabs desktop).
   - Follow + Save buttons (UI only — wiring in S6).
5. Wire Supabase Realtime subscription on `event_updates` for the current event — prepend new updates with slide-in animation.
6. Build `/search?q=` page using `search_vector` tsvector.
7. Build 404 / 500 pages.
8. SEO: per-page meta tags, OG, canonical.
9. Performance pass: ISR on listing pages (revalidate 60s), SSR/ISR on event pages, prefetch on hover.

### Deliverables
- All 6 opportunity listing pages live.
- Single event page with timeline + guide + realtime.
- Search working.
- 404/500 pages.

### Tables created
None.

---

## Session 4 — Institutions (submit-only)

**Goal**: public submit form + console moderation queue + category listing pages.

### Tasks
1. Create `institutions` and `institution_submissions` tables.
2. Build `/institutions` landing (15 category cards).
3. Build `/institutions/[category]` listing pages.
4. Build `<InstitutionCard>` component.
5. Build `/institutions/submit` form — requires login, validated, creates `institution_submissions` row with status `pending`.
6. Build console moderation queue `/console/institutions` (pending list).
7. Build console review page `/console/institutions/[id]` — edit fields, choose category, publish (creates `institutions` row + marks submission `approved`) or reject (marks `rejected` + reason).
8. Build "merge to existing" flow (optional in S4, can defer to S5 if time short).
9. Storage bucket `institution-logos`.

### Deliverables
- Public can submit institutions (15 categories).
- Console can moderate.
- Category listing pages live.

### Tables created
`institutions`, `institution_submissions`.

---

## Session 5 — Helpline + Tools

**Goal**: helpline page + contact form, exam calendar tool, employment news tool.

### Tasks
1. Create `helpline_entries`, `contact_messages`, `exam_calendar_overrides`, `employment_news_issues` tables.
2. Build `/helpline` page — directory by category.
3. Build `/contact` page — form → `contact_messages` (rate-limited).
4. Build console helpline CRUD `/console/helpline`.
5. Build `/tools/exam-calendar` — month grid view sourcing from `events` (type filter + `exam_date` not null) + `exam_calendar_overrides`. Filter by month + category. Export to iCal (stretch).
6. Build `/tools/employment-news` — list of published issues; click → issue view with curated pick list.
7. Build console `/console/tools/exam-calendar` (overrides CRUD) and `/console/tools/employment-news` (issue editor: pick events, write intro, publish).
8. Build a Supabase scheduled Edge Function that auto-drafts an `employment_news_issues` row every Sunday 23:00 IST with the week's govt-jobs events pre-selected (stretch — can defer to S8).

### Deliverables
- Helpline + contact live.
- Exam calendar tool live.
- Employment news tool live with at least one published issue.

### Tables created
4 tables.

---

## Session 6 — User Features

**Goal**: follow, save, notifications, personalization, home feed.

### Tasks
1. Create `user_profiles`, `user_follows`, `user_saves`, `user_notifications` tables.
2. Build onboarding flow on first login: pick target group, state, exam interests, content interests → writes `user_profiles`.
3. Wire Follow + Save buttons on event + institution pages (optimistic UI, TanStack Query mutation).
4. Build `/me` dashboard: tabs for Saved, Following, Notifications, Preferences.
5. Build `<NotificationBell>` in header — dropdown with unread list, mark-all-read, link to `/me/notifications`.
6. Wire Supabase Realtime on `user_notifications` for the bell.
7. Build a Supabase trigger: on `event_updates` INSERT, fan-out `user_notifications` rows to all users following that event (use a security-definer function + bulk insert).
8. Build home feed (`/`) — personalized: mix of followed-event updates + recommended-by-interest events + featured.

### Deliverables
- Consumer accounts fully functional: follow, save, notifications, personalization.
- Home feed personalized.

### Tables created
4 tables.

---

## Session 7 — i18n + SEO + Polish

**Goal**: Hindi mirror live, SEO solid, performance + accessibility pass.

### Tasks
1. Configure `next-intl` with `defaultLocale='en-IN'`, `locales=['en-IN','hi-IN']`, `localePrefix='as-needed'`.
2. Extract all UI strings into `messages/en-IN.json` + `messages/hi-IN.json`. Translate to Hindi.
3. Wire locale-aware date/number/currency formatting (`Intl.DateTimeFormat('hi-IN')`).
4. Build `<LanguageSwitcher>` in header.
5. Mirror all public routes at `/hi-in/...`.
6. Console stays English-only.
7. Sitemap: `/sitemap.xml` + `/hi-in/sitemap.xml` (auto-generated).
8. `robots.txt`.
9. `hreflang` tags on every page.
10. PostHog integration (`usePostHog` + identify on login).
11. Google Search Console verification meta tag (configurable from console settings).
12. Lighthouse pass on home + a sample event page; fix LCP/CLS issues.
13. Accessibility pass: axe-core scan, keyboard nav, focus rings, aria labels.
14. Performance: image optimization (`next/image`), font-display swap, prefetch hover.

### Deliverables
- Both locales live.
- Sitemap + robots + hreflang valid.
- Search Console verified.
- PostHog capturing events.
- Lighthouse ≥ 90 on key pages.

### Tables created
None.

---

## Session 8 — Soft Launch Prep

**Goal**: ready to soft-launch to a closed group.

### Tasks
1. Write About Us content (English + Hindi) from console → `static_pages`.
2. Write Contact Us content.
3. Seed at least 100 events across the 6 types (mix of manual + JSON paste).
4. Seed at least 50 institutions across categories.
5. Publish at least 1 employment news issue.
6. Populate exam calendar for next 3 months.
7. Bug bash: walk through every flow as a consumer (anon + signed up) and as each team role; log bugs; fix P0s.
8. Empty states for every list (no events, no follows, no saves, no notifications).
9. Loading skeletons for every async list.
10. Error boundaries + sentry-style error capture (PostHog errors).
11. Final QA checklist (write it; run it).
12. Soft-launch to 10–20 target users; collect feedback in a structured form.
13. Plan Phase 2 based on feedback (separate doc, not this one).

### Deliverables
- 100+ events, 50+ institutions, 1+ employment news issue, 3-month exam calendar.
- All empty/loading/error states polished.
- All P0 bugs fixed.
- Soft-launched; feedback collected.

### Tables created
None.

---

## Cross-session rules

- **No session skips a worklog entry.** Even a half-finished session writes what it did + what's deferred.
- **No session creates tables not in `DB_SCHEMA.md`.** If a session needs a new table, it updates `DB_SCHEMA.md` first, with a written justification in the worklog.
- **No session adds features in the Phase 1 OUT list.** If tempted, log it under "Deferred" in the worklog and move on.
- **No session merges to `main` without CI green.**
- **No session leaves RLS untested.** Any new table gets an RLS test in the same migration.

---

## After Phase 1 (preview only — not committed)

Likely Phase 2 candidates, based on what we'll learn in soft launch:
- Email + web push notifications (on top of in-app).
- Meilisearch for full-text search.
- Cloudflare R2 migration for media.
- More languages (Tamil, Telugu, Bengali, Marathi — based on user base).
- Phase 2 scope doc to be written separately after soft-launch feedback.

Likely Phase 3 candidates (gated on traction):
- Re-evaluate HireZila / private jobs as a separate product decision.
- Re-evaluate API monetization (only if there's organic demand).
- Re-evaluate crawler/AI extraction (only if content volume demands it).

These are explicitly NOT planned in this document.
