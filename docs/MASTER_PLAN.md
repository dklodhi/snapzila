# SnapZila — Phase 1 Master Plan

> **One-line summary**: A minimal, modern, event-centric live-update platform for career & education opportunities in India — built and launched in 9 focused sessions, not 129 tables.

| Field | Value |
| --- | --- |
| Document | Phase 1 Master Plan |
| Status | Active — foundation complete, sessions in progress |
| Owner | Dinesh Lodhi (founder / solo CEO mode) |
| Started | 2026-11-16 |
| Repo | `dklodhi/snapzila` (new, public) |
| Reference repo | `DK9425/snapzila` (archived, read-only) |
| Backend | Supabase project `mrnzidzwbomrntijrzrj` (South Asia / Mumbai) |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Why We Restarted](#2-why-we-restarted)
3. [Phase 1 Scope — IN](#3-phase-1-scope--in)
4. [Phase 1 Scope — OUT](#4-phase-1-scope--out)
5. [Brand & Design System](#5-brand--design-system)
6. [Information Architecture](#6-information-architecture)
7. [Tech Stack](#7-tech-stack)
8. [Database Schema (Phase 1)](#8-database-schema-phase-1)
9. [Session-wise Plan](#9-session-wise-plan)
10. [Post View / Timeline Design](#10-post-view--timeline-design)
11. [Console Design](#11-console-design)
12. [Multi-language Strategy](#12-multi-language-strategy)
13. [Security & RLS](#13-security--rls)
14. [Search & Analytics](#14-search--analytics)
15. [Risks & Mitigations](#15-risks--mitigations)
16. [Success Metrics for Phase 1](#16-success-metrics-for-phase-1)
17. [Workflow Conventions](#17-workflow-conventions)

---

## 1. Executive Summary

SnapZila's core idea is sound and unique: **treat every opportunity (govt job, admission, scholarship, scheme, news, article) as an Event, and let each Event carry a live-update timeline + structured guide**, so a learner/job-seeker gets one source of truth that evolves in real time instead of scattered PDFs and stale blog posts.

The old project attempted this plus five other businesses at once and grew to 129 database tables. As a solo founder this cannot be launched in one shot. **Phase 1 is the smallest defensible version of SnapZila that ships value**: 6 opportunity types, ~15 institution types (submit-only), helpline, 2 tools, a complete content console, user accounts with follow/save/notify, English + Hindi, and a fresh modern design.

Everything else — private jobs, HireZila/Nexus sub-platforms, AI crawler, API monetization, bots, MOOC, campus drives, forums — is **explicitly deferred** to later phases and will NOT be built now, even if the old schema has tables for it.

Phase 1 is broken into **9 sessions (S0–S8)**. Each session ends with: code pushed to GitHub, DB changes applied to Supabase, and a worklog entry appended to `docs/WORKLOG.md`.

---

## 2. Why We Restarted

The old project (`DK9425/snapzila`) was technically rich but commercially unlaunchable for a solo founder. The repo was cloned and analyzed at both the DB level (via Supabase REST API) and the code level (via GitHub token) on 2026-11-16. See [`OLD_PROJECT_ANALYSIS.md`](OLD_PROJECT_ANALYSIS.md) §1–5 for DB findings and §6 for the full code-level findings. The headline numbers:

**DB-level (Supabase REST API inspection)**:
- **129 tables** in Supabase, of which **~115 were empty** (built, never used).
- The `events` table alone had **72 columns**; `exams` had 49; `organisations` had 48 — one table doing the job of ten, making queries and UI generation painful.
- Built five overlapping businesses: SnapZila (core), **HireZila** (private jobs + employer widgets), **MOOC aggregator**, **AI crawler**, **API monetization**, plus Telegram + WhatsApp + campus drives + discussion forums.
- Three overlapping auth/notification surfaces, two overlapping org tables (`organisations` vs `business_profiles`), unclear tech debt (`snap_ids`, `zilabiz_slug_redirects`, `wp_import_log`).

**Code-level (full repo clone)**:
- **1,517 files** (714 `.tsx`, 599 `.ts`), **95 top-level routes**, **129 Prisma models** (200 KB `schema.prisma`).
- **Custom auth** reinvented from scratch: Argon2id + 3 JWT secrets + PII encryption + OTP via Upstash Redis + 3 OAuth providers. ~2,000+ lines that Supabase Auth replaces natively.
- **Prisma + Neon → Supabase migration baggage**: a 200 KB Prisma schema AND a 146 KB `schema.sql` kept in sync manually; 20 migration SQL files; 60+ backfill/check scripts.
- **Event god-object**: 72+ fields with a self-referencing parent/update/guide hierarchy in ONE table, direct relations to HireZila tables, denormalized counters, 12 content types, private-job fields, news fields, WordPress-parity fields, eligibility fields — all in one model.
- **11 separate editor subdirectories** (`src/components/editor/{admission,certification,competition,conference,fellowship,govt-job,grant,internship,scheme,scholarship,common}`) — 11 bespoke forms for 11 content types.
- **~30 locales** for hreflang (723-line `locale-registry.ts`) but only 3 real translations (en/hi/ne) — SEO noise, not localization.
- **30 `src/lib/` subdirectories** representing 30 concerns (ai, b2b, billing, community, discuss, hirezila, local-jobs, etc.).
- **15 TODOs** for incomplete critical features (OTP, email, auth middleware), **190 console.error/warn** scattered in production code, **102 `any` type usages** compromising type safety.
- Two prior cleanup attempts (Jan 2025) removed dead tables and subdomains but did not cut features — the sprawl came back.

**The root cause**: no clear MVP boundary → no clear launch path → never launched.

**The restart keeps the idea and the data model concept, drops the scope.** The new Supabase project starts empty. Nothing is imported blindly; every table is re-justified against Phase 1 scope before being created. No code is reused from the old repo; the old i18n URL pattern is referenced as the approach to follow (simplified to EN+HI) but the code itself is rewritten.

---

## 3. Phase 1 Scope — IN

Everything below is in scope for Phase 1. Anything not listed here is out.

### 3.1 Opportunities (6 content types)

| Type | Slug | Examples |
| --- | --- | --- |
| Govt Jobs | `govt-jobs` | SSC, UPSC, IBPS, Railway, Police, PSU |
| Admissions | `admissions` | College admissions, entrance-based admissions |
| Scholarships | `scholarships` | National/State scholarships |
| Govt Schemes | `govt-schemes` | Welfare schemes, subsidies |
| News | `news` | Career/education news |
| Articles | `articles` | Evergreen guides, how-tos, analysis |

Each opportunity is modeled as an **Event** with:
- Parent post (partially shown, "View All" expands inline via AJAX)
- Live Updates timeline (Twitter-style)
- Structured Guide (eligibility, dates, fees, apply steps, links, docs)
- Important Dates, Documents (PDFs), Tags

### 3.2 Educational — Institutions (submit-only)

Institution categories supported (list page + submit form, no per-institution managed page yet):

`exams · courses · universities · iits · nits · iims · aiims · iiits · nifts · schools · colleges · coaching · training-skill-centres · iti · fake-universities · law-universities`

For Phase 1, institutions are **submit-only** from the root site (any logged-in user can submit) and **moderated/published** from the console by content writers. **No institution page control is given to the public in Phase 1** — only the console team can publish/edit institution records. Per-institution rich pages (courses, faculty, placements) come in a later phase.

### 3.3 Helpline

- A helpline landing page listing official helplines by category (exam body, scheme, admission helpline) — managed from console.
- A contact form that creates a `contact_messages` row.

### 3.4 Tools & Features

1. **Exam Calendar** — a year-view calendar of upcoming exams (data sourced from `events` of type exam + their dates), filterable by month/category, exportable.
2. **Employment News** — a curated weekly digest of govt job notifications, pulled from `events` of type `govt-jobs` published that week, with a downloadable PDF view.

### 3.5 Console (company-internal)

The console is the team's WordPress-style back-office. Phase 1 console features:

- **Roles**: `super_admin`, `admin`, `content_writer` (editor variants per content type added later if needed).
- **Post management** for all 6 opportunity types: create / edit / publish / unpublish / delete / schedule / feature.
- **Two editing modes**:
  - **Manual editor** — structured form per content type (fields, dates, docs, tags, live updates, guide).
  - **JSON paste editor** — paste a JSON blob that conforms to a published sample; console validates against a JSON schema and creates the post. **Every content type ships with a published JSON sample** so writers can copy-paste-fill.
- **Live updates editor** — add/edit/reorder live updates on an event (each update = title, body, timestamp, type, optional link/doc).
- **Guide editor** — structured guide sections with drag-reorder.
- **Institution moderation queue** — review submissions, publish/reject, edit before publish.
- **Helpline management** — CRUD for helpline entries.
- **Tools management** — manage exam calendar overrides, employment news weekly picks.
- **Static pages** — About Us, Contact Us (and any future static page) managed from console.
- **Search Console / Analytics** — a page to plug in Google Search Console verification + sitemap submission, plus a PostHog analytics dashboard embed.
- **Audit log** — every console write recorded with actor, action, entity, before/after.
- **Site settings** — brand, default language, feature flags.

### 3.6 User Services (root site)

- **Login / SignUp** — email + password (Supabase Auth). Email magic-link optional later.
- **Notifications** — in-app bell with read/unread, mark-all-read. (No push/email in Phase 1.)
- **Follow** — follow an Event or Institution → get in-app notification on new live update.
- **Save** — bookmark any Event/Institution to a personal saved list.
- **Personalization** — on signup/onboarding, pick: target groups (student/job-seeker/learner), interests (content types), state, exam interests. Feeds the home feed + notifications filter.

### 3.7 Languages & UI

- **English (India)** at root — no `/en-in/` prefix.
- **Hindi (India)** at `/hi-in/...` prefix.
- Both languages fully supported for UI strings AND content (every Event/Institution/StaticPage stores `title`, `title_hi`, `body`, `body_hi`, etc. via a `content_multilang` JSONB column pattern — see schema).

### 3.8 Design

- Fresh **brand color** (decided below). Old brand color is NOT reused.
- Modern, energetic, but minimalistic and high-density (not the airy, ad-heavy job-portal look).
- Mobile-first responsive.
- Post view uses a **timeline/twitter-style live-update layout** (see §10).

---

## 4. Phase 1 Scope — OUT

Explicitly deferred. **Do not build, do not create tables for, do not add UI for** any of these in Phase 1, even if the old project had them:

| Deferred item | Why deferred | Target phase |
| --- | --- | --- |
| Private jobs | Not core to event-centric career/education idea | Phase 3+ |
| HireZila (jobs platform, employer widgets, applications, interviews) | Entirely separate business | Phase 3+ (or kill) |
| Nexus (or any other sub-platform) | Out of scope | — |
| AI crawler / extraction pipeline | High cost, complex, needs content volume first | Phase 2 |
| API monetization (api_clients, api_keys, api_plans) | Premature; need consumers first | Phase 3 |
| Telegram bot / WhatsApp bot | Channel expansion, not core | Phase 2 |
| Push notifications (web push, FCM) | In-app is enough for v1 | Phase 2 |
| Email notifications | Nice-to-have, not launch-blocking | Phase 2 |
| MOOC integration | Different business | Phase 3+ (or kill) |
| Campus drives / TPO | B2B feature, needs institutional partnerships | Phase 3+ |
| Discussion forums | Heavy moderation, community scaling issue | Phase 3+ |
| Career timelines | Nice but not core | Phase 3+ |
| Certificates | Not core | Phase 3+ |
| Resume builder | Not core | Phase 3+ |
| Chat / chatbot | Not core | Phase 2+ |
| AI features (summaries, predictions) | Need data first | Phase 2+ |
| Languages beyond EN + HI | Need EN+HI polished first | Phase 2 |
| Multi-tenant org dashboards | Not core to consumer product | — |
| Vault / document storage as a product | Use Supabase Storage simply | — |

If during a session you feel tempted to add any of these, **stop and log it in `docs/WORKLOG.md` under "Deferred"**, do not implement.

---

## 5. Brand & Design System

Detailed spec lives in [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md). Summary:

### 5.1 Brand color (new — do not reuse old)

A two-color system that reads as **modern tech + live energy**:

| Token | Hex | Use |
| --- | --- | --- |
| `--brand` (primary) | `#4F46E5` (Indigo-600) | Buttons, links, primary CTAs, brand marks |
| `--brand-accent` | `#F97316` (Orange-500) | Live badges, "new" pips, important-date highlights, brand energy |
| `--success` | `#10B981` | Emerald — open/active status, confirmations |
| `--warning` | `#F59E0B` | Amber — closing-soon, caution |
| `--danger` | `#F43F5E` | Rose — closed, rejected, errors |
| `--ink` | `#0F172A` | Slate-900 — primary text |
| `--muted` | `#64748B` | Slate-500 — secondary text |
| `--bg` | `#FFFFFF` | Page background |
| `--bg-subtle` | `#F8FAFC` | Slate-50 — section backgrounds, cards |

**Why this palette**:
- Indigo is the modern SaaS signal (Stripe, Linear, Notion-adjacent) — trustworthy, focused, not corporate-blue-boring.
- Orange carries "live / urgent / opportunity" energy and is a subtle India-rooted nod without being clichéd. It also contrasts cleanly with indigo for status pips.
- The slate neutral scale keeps the UI calm and information-dense rather than airy.
- Both colors meet WCAG AA on white and on slate-50.

### 5.2 Typography

- **Headings**: `Plus Jakarta Sans` (modern, geometric, distinctive)
- **Body**: `Inter` (best-in-class screen legibility)
- **Mono / JSON editor**: `JetBrains Mono`

Loaded via `next/font` (self-hosted, no Google Fonts request).

### 5.3 Design principles (binding for all sessions)

1. **Information density over airiness** — do NOT copy the Naukri/Indeed/SarkariResult airy-ad-heavy look. Cards are compact, lists are scannable.
2. **No excess whitespace** — section padding max `24px` on desktop, `16px` on mobile. Card padding `16px`. List row height `48–56px`.
3. **Minimalistic chrome** — thin borders (`1px solid #E2E8F0`), no heavy shadows. One subtle shadow level for floating elements only.
4. **Live-first** — anything with a live-update timeline puts the timeline in the user's primary scanning path, not buried below.
5. **Mobile-first responsive** — every page designed at 360px first, then scaled up. Desktop gets a wider timeline + side rail (see §10).
6. **Color is meaning, not decoration** — brand indigo for primary actions only; accent orange for "live/new/urgent"; status colors strictly for status.
7. **Accessible by default** — AA contrast, focus rings, keyboard nav, semantic HTML.
8. **No emojis in the product UI** (console may use icons from `lucide-react`).

---

## 6. Information Architecture

### 6.1 URL structure

Root domain (e.g. `snapzila.com`) serves English-India. Hindi-India is prefixed.

**Public (root site)**

| Path | Purpose |
| --- | --- |
| `/` | Home — live feed + featured + personalized |
| `/opportunities` | All opportunities landing |
| `/opportunities/govt-jobs` | Govt Jobs listing |
| `/opportunities/admissions` | Admissions listing |
| `/opportunities/scholarships` | Scholarships listing |
| `/opportunities/govt-schemes` | Govt Schemes listing |
| `/opportunities/news` | News listing |
| `/opportunities/articles` | Articles listing |
| `/opportunities/govt-jobs/[slug]` | Single event view (timeline + guide) |
| `/institutions` | All institutions landing |
| `/institutions/[category]` | Category listing (e.g. `/institutions/iits`) |
| `/institutions/submit` | Public submit form |
| `/helpline` | Helpline page + contact form |
| `/tools/exam-calendar` | Exam calendar tool |
| `/tools/employment-news` | Employment news weekly digest |
| `/about` | About Us (static page from console) |
| `/contact` | Contact Us (static page from console) |
| `/login`, `/signup` | Auth pages |
| `/me` | Logged-in user dashboard (saved, follows, notifications, prefs) |
| `/hi-in/...` | Mirror of every public route above, for Hindi |

**Console (team only)**

| Path | Purpose |
| --- | --- |
| `/console` | Console dashboard |
| `/console/login` | Team login (separate from consumer `/login`) |
| `/console/posts` | Post management list (filter by type) |
| `/console/posts/new?type=` | New post editor (manual) |
| `/console/posts/new-json?type=` | New post editor (JSON paste) |
| `/console/posts/[id]/edit` | Edit post |
| `/console/posts/[id]/live-updates` | Manage live updates |
| `/console/posts/[id]/guide` | Manage guide |
| `/console/institutions` | Institution moderation queue |
| `/console/institutions/[id]` | Review/edit/publish institution |
| `/console/helpline` | Helpline CRUD |
| `/console/tools/exam-calendar` | Exam calendar overrides |
| `/console/tools/employment-news` | Weekly picks |
| `/console/pages` | Static pages CRUD |
| `/console/settings` | Site settings |
| `/console/audit-log` | Audit log viewer |
| `/console/analytics` | Search Console + PostHog embed |
| `/console/team` | Team members + roles (super_admin only) |

### 6.2 Language routing rules

- Default (English India): NO prefix in URL. `Accept-Language` is ignored — root = English always.
- Hindi: every public route is mirrored at `/hi-in/...`. Console is English-only (team tool).
- `hreflang` tags emitted: `en-IN` (root) and `hi-IN` (`/hi-in/`).
- Language switcher in header persists choice via cookie + URL.
- Sitemap includes both locales.

### 6.3 Routing implementation

- Next.js App Router with `[locale]` segment, but locale is **optional** for the default (en-IN):
  - Strategy: use a middleware that rewrites `/hi-in/...` to `/[locale=hi-in]/...` internally, while leaving root paths serving the en-IN app.
  - `next-intl` configured with `defaultLocale = 'en-IN'`, `localePrefix = 'as-needed'` so the default locale has no prefix.

---

## 7. Tech Stack

| Layer | Choice | Rationale |
| --- | --- | --- |
| Framework | **Next.js 16** (App Router) | Modern, RSC, i18n-friendly, edge-ready |
| Language | **TypeScript** (strict) | Safety on a solo project is non-negotiable |
| Styling | **Tailwind CSS 4** | Speed + consistency with the design tokens above |
| UI components | **shadcn/ui** | Owned, customizable, not a black-box dep |
| Icons | **lucide-react** | Clean, consistent, tree-shakeable |
| Forms | **react-hook-form** + **zod** | Type-safe schemas reused for JSON-paste validation |
| Rich text | **Tiptap** (lightweight, extensible) | For article/event body + live update bodies |
| Date handling | **date-fns** + **Intl.DateTimeFormat** (`en-IN`, `hi-IN`) | Locale-aware formatting |
| State (server) | **TanStack Query v5** | Caching, invalidation, mutations |
| State (client) | **zustand** (minimal) | UI-only state (filters, drawer open) |
| Backend | **Supabase** (Postgres + Auth + Realtime + Storage) | Already provisioned; one platform for DB/auth/realtime/files |
| Realtime | **Supabase Realtime** (Postgres Changes) | Powers live-update push without a separate socket server |
| i18n | **next-intl** | Best-in-class for App Router + locale prefix as-needed |
| Auth | **Supabase Auth** (email+password Phase 1) | One auth system, role-based via `team_members.role` |
| Search | **Postgres FTS** (`tsvector`) | Phase 1 volume is low; defer Meilisearch to Phase 2 |
| Media storage | **Supabase Storage** (bucket per content type) | Phase 1; Cloudflare R2 already provisioned for Phase 2 migration |
| Analytics | **PostHog** (cloud free tier) | Product + funnel analytics in one |
| Search Console | Google Search Console (verification meta) | Standard SEO plumbing |
| Email | **Resend** (free tier) | Only if/when email notifications are added in Phase 2; Phase 1 may skip |
| Deployment | **Vercel** (Next.js native) | Simplest for solo founder |
| CI | GitHub Actions (lint + typecheck + build on PR) | Catch breaks before merge |

**Not chosen** (and why — with reference to the old project's mistakes, see `OLD_PROJECT_ANALYSIS.md` §6.2):
- Not Next.js Pages Router — App Router is the future and i18n is cleaner there.
- Not **Prisma** — the old project used Prisma 6.11 with a 200 KB `schema.prisma` + a parallel 146 KB `supabase-setup/schema.sql` kept in sync manually. Supabase exposes Postgres directly via JS client + RLS; an ORM adds friction with RLS and double-schema maintenance.
- Not **custom JWT auth** — the old project reinvented auth (Argon2id + 3 JWT secrets + PII encryption + OTP via Upstash Redis + 3 OAuth providers, ~2,000+ lines). Supabase Auth handles all of this natively with RLS-compatible sessions.
- Not **socket.io** — the old project used `socket.io-client` for realtime. Supabase Realtime (Postgres Changes) integrates with RLS and removes a moving part.
- Not **Bun** — the old project used Bun (lockfile quirks noted in worklog). Node + npm/pnpm is safer for a solo founder.
- Not **Upstash Redis** — the old project needed Redis only for custom OTP/rate-limit. Supabase Auth + Edge Functions remove that need.
- Not **Groq/Gemini AI** — the old project integrated both for AI features. Phase 1 has no AI features; defer until content volume justifies it.
- Not **leaflet/maps** — the old project used maps for private-job geo-search. Private jobs are out of Phase 1.
- Not **cheerio/puppeteer-core/pdf-parse/mammoth** — the old project's crawler/AI-extraction stack. Crawler is out of Phase 1.
- Not Redux — overkill; TanStack Query + zustand covers all needs.
- Not a separate Node backend — Supabase Edge Functions cover the few server-side needs (e.g. JSON-paste validation, scheduled digest).

**Code quality bar** (binding for all Phase 1 sessions):
- TypeScript `"strict": true`; ESLint rule `no-explicit-any` errors. Zero `any` allowed. (Old project had 102.)
- No `console.error/warn` in committed code; use a thin `lib/log.ts` wrapper that ships errors to PostHog. (Old project had 190 scattered.)
- No `TODO/FIXME/HACK` in committed code on `main`; if work is incomplete, it stays on a branch with a tracking issue. (Old project had 15 in production.)

---

## 8. Database Schema (Phase 1)

Full DDL is in [`DB_SCHEMA.md`](DB_SCHEMA.md). Headline: **~20 tables instead of 129.** Design principles:

1. **One Event table** for all 6 opportunity types (`type` discriminator). NOT 6 separate tables. The old project's 72-column `events` table is split into `events` (core) + `event_updates` (timeline) + `event_guides` (guide) + `event_dates` (dates) + `event_documents` (PDFs).
2. **JSONB for flexible fields** instead of 30+ sparse columns (e.g. `apply_steps`, `eligibility`, `fees` live in JSONB columns with documented shapes).
3. **i18n via `*_multilang` JSONB columns** (`{ "en": "...", "hi": "..." }`) on user-facing text, NOT a separate translations table for content (UI strings use next-intl message catalogs; only content needs bilingual storage).
4. **Separate `team_members` table** for console roles (Supabase Auth handles identity; team role is a separate RBAC table so consumer users and team members are cleanly separated).
5. **RLS on every table from day 1.**
6. **Audit log** for every console write.
7. **Soft delete** (`deleted_at`) on content tables, not hard delete.

### 8.1 Core tables (Phase 1)

| # | Table | Purpose | Approx rows (launch) |
| --- | --- | --- | --- |
| 1 | `team_members` | Console users + role (`super_admin`/`admin`/`content_writer`) | 1–5 |
| 2 | `events` | Parent posts for all 6 opportunity types | 100–500 |
| 3 | `event_updates` | Live-update timeline entries | 500–2000 |
| 4 | `event_guides` | Structured guide sections per event | 300–1500 |
| 5 | `event_dates` | Important dates per event (apply start/end, exam, result) | 300–1500 |
| 6 | `event_documents` | PDF attachments per event | 200–1000 |
| 7 | `institutions` | Educational institutions (all 15 categories) | 100–500 |
| 8 | `institution_submissions` | Public submit-form queue | grows |
| 9 | `tags` | Lightweight taxonomy (sector, state, exam, org) | 50–200 |
| 10 | `helpline_entries` | Helpline directory items | 20–100 |
| 11 | `exam_calendar_overrides` | Manual overrides for exam calendar tool | 0–50 |
| 12 | `employment_news_issues` | Weekly employment news issue meta | 4–12 |
| 13 | `static_pages` | About Us, Contact Us content | 2–5 |
| 14 | `contact_messages` | Contact form submissions | grows |
| 15 | `user_profiles` | Consumer user profile + personalization | grows |
| 16 | `user_follows` | Follow events/institutions | grows |
| 17 | `user_saves` | Saved events/institutions | grows |
| 18 | `user_notifications` | In-app notifications | grows |
| 19 | `audit_logs` | Console activity log | grows |
| 20 | `site_settings` | Brand, default lang, feature flags (KV) | 1 row |

**Supabase Auth** manages `auth.users` for both consumer and team logins. `team_members.email` matches `auth.users.email`; role checked at row level.

Full column-level spec: [`DB_SCHEMA.md`](DB_SCHEMA.md).

---

## 9. Session-wise Plan

Detailed in [`SESSION_PLAN.md`](SESSION_PLAN.md). Summary:

| Session | Goal | Ends with |
| --- | --- | --- |
| **S0 — Foundation** | Repo, env, design tokens, empty Next.js app, Supabase client, base layout, brand applied | Pushed skeleton + this plan committed |
| **S1 — Auth & RBAC** | Consumer auth (signup/login), console auth (separate route), `team_members` + RLS, role guards | Both logins working, roles enforced |
| **S2 — Console Core** | Post editor (manual + JSON paste with samples), list view, publish/schedule, audit log, static pages | Console can manage all 6 opportunity types end-to-end |
| **S3 — Public Opportunities** | Listing pages, single event view with timeline + guide + AJAX "View All", realtime subscription to live updates | Public site reads what console writes |
| **S4 — Institutions** | Public submit form, console moderation queue, category listing pages | Submit-only institutions flow live |
| **S5 — Helpline + Tools** | Helpline page + contact form, Exam Calendar tool, Employment News weekly digest | Tools shipped |
| **S6 — User Features** | Follow, Save, Notifications (in-app bell), Personalization prefs, home feed | Consumer account features live |
| **S7 — i18n + SEO + Polish** | Hindi mirror (`/hi-in/`), sitemap, hreflang, meta tags, Search Console verification, PostHog, performance pass, accessibility pass | Bilingual + SEO-ready |
| **S8 — Soft Launch Prep** | About/Contact content, bug bash, error pages, 404/500, loading states, empty states, final QA, soft launch to a closed group | Ready to soft-launch |

Each session has its own file under `docs/sessions/SXX.md` once executed, and a running entry in `docs/WORKLOG.md`.

**Rule**: a session is not "done" until (a) code is pushed to `main`, (b) any DB migration is applied to Supabase, (c) worklog updated, (d) `docs/sessions/SXX.md` written.

---

## 10. Post View / Timeline Design

This is the most important UX decision in Phase 1 and replaces the old design that the founder rejected.

### 10.1 Layout (single event page, e.g. `/opportunities/govt-jobs/[slug]`)

**Mobile (< 1024px) — single column**

```
[Header: breadcrumb, title, status pill, follow button, save button, share]
[Parent post — partial view]
   • Org / conducting body, type, locations
   • 1-line summary
   • Apply window (start → end), key date
   • "View All ↓" button (AJAX expand inline — no page jump)
[Live Updates timeline]
   • Vertical line with dots, newest at top
   • Each update: timestamp pill, type icon, title, body (markdown), optional doc link
   • "Load older updates" button
[Guide]
   • Tabbed or accordion sections (Eligibility, Apply Steps, Fees, Important Dates, Documents, FAQ)
   • Each section anchor-linkable
[Related events strip]
[Footer]
```

**Desktop (≥ 1024px) — two-column**

```
[Header full-width]
┌────────────────────────────┬───────────────────────┐
│  Parent post (partial)     │  Live Updates         │
│  + View All expand inline  │  (twitter-style rail, │
│                            │   newest at top,      │
│                            │   sticky, scrolls     │
│  Guide (below parent)      │   independently)      │
│  - Eligibility             │                       │
│  - Apply Steps             │                       │
│  - Fees                    │                       │
│  - Important Dates         │                       │
│  - Documents               │                       │
│  - FAQ                     │                       │
└────────────────────────────┴───────────────────────┘
[Related events strip full-width]
```

The live-updates rail on desktop is the signature element — it stays visible while the user reads the guide, so any new update pushes in via Supabase Realtime and the user sees it without scrolling.

### 10.2 Parent post "View All" behavior

- Parent post shows: title, conducting body, type, 1-line summary, apply window, key date, primary tag. ~4–6 lines.
- "View All" expands inline via AJAX (no route change), revealing: full description, eligibility summary, salary/scale, vacancy breakdown, category-wise breakdown, application fee, selection process summary, apply link.
- Expanded state is persisted in URL hash (`#details`) so deep-linking works.
- "Collapse" button returns to partial view.

### 10.3 Live updates — data + UX

- Each `event_updates` row: `id, event_id, kind (info/warning/result/admit-card/corrigendum/extension/deadline), title, body_md, published_at, doc_url, created_by, sort_order`.
- `kind` controls the timeline dot color + icon:
  - `info` → brand indigo
  - `warning` → amber
  - `result` → emerald
  - `admit-card` → brand indigo (with download icon)
  - `corrigendum` → rose
  - `extension` → amber
  - `deadline` → rose (closing today/tomorrow)
- Newest first. Initial render shows latest 10; "Load older" paginates.
- Supabase Realtime subscription on `event_updates` where `event_id = current`; on INSERT, prepend the new update with a subtle slide-in animation + a "New" pulse on the timeline header.
- Each update is anchor-linkable (`#update-[id]`).

### 10.4 Guide

- `event_guides` rows: `id, event_id, section (eligibility|apply_steps|fees|dates|documents|faq), title, body_md, sort_order, body_multilang`.
- Rendered as accordion on mobile, sticky tabbed nav on desktop.
- "Important Dates" section auto-populated from `event_dates` rows but can be manually overridden in the guide body.

### 10.5 Anti-patterns to avoid

- NO full-width hero image on event pages (wastes vertical space).
- NO ad slots in the timeline rail.
- NO auto-play video.
- NO "related jobs from HireZila" widgets (HireZila is out of scope).
- NO social share drawer that covers content.
- NO comment section (forums deferred).

---

## 11. Console Design

### 11.1 Layout

- Left sidebar (collapsible) with sections: Dashboard, Posts, Institutions, Helpline, Tools, Pages, Team, Settings, Audit Log, Analytics.
- Top bar: search (posts), new-post dropdown (Manual / JSON paste), locale switch (EN only — console is English), user menu (profile, sign out).
- Main content area: list views + editors.

### 11.2 Post editor (manual mode)

- Top: type selector (locked once saved), title (EN + HI side-by-side), slug (auto from EN title, editable), status (draft/scheduled/published), published_at, featured toggle.
- Tabs: **Details · Live Updates · Guide · Dates · Documents · SEO · Audit**
  - **Details**: conducting body, locations, vacancy, salary, application fee, apply link, apply mode, eligibility summary, tags.
  - **Live Updates**: list editor — add/update/reorder (drag), each row = kind picker + title + body (markdown editor) + optional doc + timestamp.
  - **Guide**: sections with drag-reorder, markdown body, per-section.
  - **Dates**: date picker rows (label, date, type, optional URL).
  - **Documents**: upload (Supabase Storage), title, type (notification/admit-card/result/other), sort.
  - **SEO**: meta title/description (EN+HI), OG image, canonical.
  - **Audit**: read-only history for this post.

### 11.3 Post editor (JSON paste mode)

- A monaco-style editor (CodeMirror or `@uiw/react-codemirror`) with JSON syntax highlighting.
- A "Load sample" button that fills the editor with the canonical JSON sample for the selected content type (samples live in `docs/json-samples/<type>.json` and are versioned).
- "Validate" button runs the JSON against the Zod schema for that type and shows errors inline.
- "Create" inserts the post + all child rows (live updates, guide sections, dates, documents refs) in a single Supabase RPC `create_event_from_json(payload)` that runs in a transaction.
- This is the founder's "Editors" requirement: paste a JSON, validate, publish.

### 11.4 List views

- Filterable by type, status, author, tags, date range.
- Columns: title, type, status, updated, author, actions.
- Bulk actions: publish, unpublish, delete (soft), feature.
- Inline quick-edit for title/slug/status.

### 11.5 Institution moderation queue

- List of `institution_submissions` with status `pending`.
- Click → review form: edit fields, choose category, attach to existing institution (merge) or create new, publish or reject with reason.
- On publish: row in `institution_submissions` marked `published`; new row in `institutions` created (or merged).

### 11.6 Static pages editor

- Title (EN+HI), slug, body markdown (Tiptap), SEO meta, header/footer visibility toggles, sort order.

### 11.7 Site settings

- Brand name, tagline, default locale, feature flags (e.g. `enable_hindi`, `enable_follow`, `enable_save`), social links, footer columns.

### 11.8 Audit log viewer

- Filter by actor, action, entity type, date range. Read-only. Export CSV.

### 11.9 Analytics page

- PostHog dashboard embed (iframe or PostHog's React embed).
- Google Search Console verification meta tag configured from here.
- Sitemap URL exposed for copy-paste into Search Console.

---

## 12. Multi-language Strategy

### 12.1 UI strings

- Managed by `next-intl` message catalogs at `messages/en-IN.json` and `messages/hi-IN.json`.
- Every UI string is keyed; no hardcoded user-facing English in components.

### 12.2 Content

- Every content row that has user-facing text stores `title` (EN), `title_hi` (HI), `body_md` (EN), `body_md_hi` (HI) — OR a single `title_multilang JSONB {en, hi}` (decision per table in `DB_SCHEMA.md`; prefer the JSONB pattern for new tables).
- Console editor has EN+HI side-by-side fields; HI can be left empty (renders fallback to EN with a "Hindi translation pending" note).
- A content row is "fully bilingual" only when both EN+HI non-empty. The Hindi listing pages filter to rows where HI is non-empty, with a fallback to "show EN-only with a translation-pending badge" toggle.

### 12.3 Locale-aware formatting

- Dates: `Intl.DateTimeFormat('en-IN', ...)`, `Intl.DateTimeFormat('hi-IN', ...)`.
- Numbers: `Intl.NumberFormat('en-IN')` (lakh/crore grouping).
- Currency: ₹ symbol always, formatted with Indian grouping.

### 12.4 SEO per locale

- `hreflang` tags: `en-IN` (root), `hi-IN` (`/hi-in/`).
- Sitemap split per locale.
- OG meta per locale.

---

## 13. Security & RLS

### 13.1 Auth model

- Supabase Auth manages identity for everyone.
- Two role tables:
  - `team_members` — `(user_id, role, status)`, role ∈ `super_admin|admin|content_writer`. Required for console access.
  - Consumer users have NO row in `team_members`; they get default consumer access.
- A Supabase function `is_team_member(role_prefix)` checks membership.

### 13.2 RLS policy skeleton

| Table | Read | Write |
| --- | --- | --- |
| `events` | public where `status='published' AND deleted_at IS NULL` | team only (writer+ for own, admin+ for others) |
| `event_updates` | public where parent event is published | team only |
| `event_guides` | public where parent event is published | team only |
| `event_dates` | public where parent event is published | team only |
| `event_documents` | public where parent event is published | team only |
| `institutions` | public where `status='published'` | team only |
| `institution_submissions` | submitter sees own; team sees all | any auth user can INSERT; team can UPDATE status |
| `tags` | public read | team only |
| `helpline_entries` | public where published | team only |
| `static_pages` | public where published | team only |
| `contact_messages` | submitter sees own; team sees all | any auth user can INSERT |
| `user_profiles` | owner only | owner only |
| `user_follows` | owner only (or public if user opts in later) | owner only |
| `user_saves` | owner only | owner only |
| `user_notifications` | owner only | owner only |
| `team_members` | team only | super_admin only |
| `audit_logs` | team only | system only (no direct user writes) |
| `site_settings` | public read of non-secret keys | super_admin only |

### 13.3 Secrets

- No secrets in the repo. `.env.local` for dev; Vercel env vars for prod.
- `.env.keys` (the analysis env file) is gitignored at the workspace level and never committed.
- Supabase service_role key used ONLY in server routes / Edge Functions, never in client bundles.
- Anon key is the only key in client code.

### 13.4 Rate limiting & abuse

- Contact form: rate-limited by IP (Supabase Edge Function with a simple KV counter) — 5/hour/IP.
- Institution submission: 10/day/auth user.
- Signup: standard Supabase Auth rate limits.

---

## 14. Search & Analytics

### 14.1 Search (Phase 1)

- Postgres full-text search on `events` using a `tsvector` generated column over `(title, title_hi, conducting_body, summary, tags_text)`.
- `/search?q=...` page with results grouped by type.
- Autocomplete via a Supabase RPC `search_autocomplete(q)` returning top 8 matches.
- Defer Meilisearch/Typesense to Phase 2 when volume justifies it.

### 14.2 Analytics

- **PostHog** for product analytics (events tracked: page_view, event_view, follow, save, search, signup, login, console_post_create, console_post_publish).
- **Google Search Console** for search performance — verification meta tag configurable from console settings.
- **Sitemap** auto-generated at `/sitemap.xml` (root) and `/hi-in/sitemap.xml`, submitted to Search Console.
- **robots.txt** at root, allows all (Phase 1).

---

## 15. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Scope creep (most dangerous) | High | Critical | This doc + explicit OUT list; any addition requires a written decision in worklog |
| Solo founder burnout | Medium | High | 9 sessions, each shippable; no session >1 working day; S8 explicitly a polish/QA session |
| Realtime cost (Supabase concurrent connections) | Low | Medium | Use Postgres Changes with filter `event_id=eq.X` so each page subscribes narrowly; free tier supports 200 concurrent |
| Content volume at launch | Medium | High | Seed console with 50–100 quality events before public soft launch; partner with 1–2 existing content sources (manual) |
| Hindi translation bottleneck | High | Medium | Console allows EN-only publish with HI-pending badge; do not block launch on HI completeness |
| Supabase free-tier limits (DB size 500MB, storage 1GB) | Low | Medium | Phase 1 volume fits comfortably; monitor; upgrade to Pro before crossing 70% |
| RLS bugs leaking data | Medium | High | RLS tested in S1 with a fixture suite; every new table gets an RLS test before merge |
| SEO of JS-rendered content | Medium | High | Next.js SSG/ISR for all event pages, listing pages; dynamic only where needed; sitemap + hreflang |
| Brand color drift across sessions | Medium | Low | Design tokens in `tailwind.config.ts` + CSS vars; no hardcoded hex in components |
| JSON-paste schema breaking changes | Medium | Medium | Samples versioned; schema validated by Zod; migration RPC handles version field |

---

## 16. Success Metrics for Phase 1

Phase 1 is successful if, by end of S8:

1. **Shipped**: all 6 opportunity types publishable from console, all 15 institution categories submittable + moderatable, helpline live, exam calendar + employment news tools live, About + Contact live, EN + HI mirrors live, follow/save/notifications/personalization live.
2. **Content seeded**: ≥ 100 published events across the 6 types, ≥ 50 published institutions, ≥ 1 employment news issue, exam calendar populated for next 3 months.
3. **Performance**: LCP < 2.5s on 3G-fast for the home page and a sample event page (Vercel + Lighthouse).
4. **Accessibility**: AA contrast on all primary surfaces, keyboard-navigable console.
5. **SEO**: sitemap valid, hreflang valid, Search Console verified, ≥ 1 page indexed.
6. **Stability**: no P0 bugs open; RLS test suite green.
7. **Soft launch**: shared with a closed group of 10–20 target users for feedback; feedback logged for Phase 2.

---

## 17. Workflow Conventions

### 17.1 Branches

- `main` — shippable. Protected (require PR + green CI).
- `sXX-<short-desc>` — per session work branch. Merged into `main` at session end.

### 17.2 Commit messages

Format: `sXX: <verb> <what>` (e.g. `s0: add design tokens and tailwind config`).

### 17.3 Per-session checklist

End of every session:

1. Code committed + pushed to session branch.
2. PR merged to `main`.
3. Any DB migration SQL applied to Supabase prod (file saved under `supabase/migrations/`).
4. `docs/WORKLOG.md` entry appended (what, what broke, what's deferred, next session plan).
5. `docs/sessions/SXX.md` written with session-specific notes + screenshots if useful.
6. TODO for next session listed at top of next session's plan.

### 17.4 DB migration convention

- Every schema change is a numbered SQL file under `supabase/migrations/`: `YYYYMMDDHHMM_<short>.sql`.
- Migrations are forward-only; never edit a merged migration.
- RLS policies + tests included in the same migration file.

### 17.5 JSON samples convention

- One sample per content type under `docs/json-samples/<type>.sample.json`.
- Versioned: `{ "schema_version": 1, "type": "govt-jobs", "data": {...} }`.
- Used both as console "Load sample" source and as the canonical example in docs.

---

*End of Master Plan. Next: read [`SESSION_PLAN.md`](SESSION_PLAN.md) for the detailed session breakdown, or [`WORKLOG.md`](WORKLOG.md) for the running log.*
