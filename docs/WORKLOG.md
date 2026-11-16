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
