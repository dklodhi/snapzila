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
- (this commit) — all docs + README + .gitignore + revised analysis.

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
