# SnapZila

> **Data Driven Event Centric Live Update System for Career & Education**

A modern, minimal, real-time platform that tracks opportunities (Govt Jobs, Admissions, Scholarships, Govt Schemes, News, Articles) and educational institutions across India — built around an **event-centric live-update timeline** (think Twitter-for-career-events, not a bloated job portal).

This repository is the **Phase 1 rebuild**. The old monolithic project (`DK9425/snapzila`) is archived for reference only and is NOT modified.

---

## Why a rebuild?

The previous project grew to **129 database tables** trying to be five startups at once (HireZila jobs platform, MOOC aggregator, AI crawler, API monetization, Telegram/WhatsApp bots, campus drives, discussion forums). It was technically impressive but impossible to launch as a solo founder. This repo strips it back to one focused MVP.

See [`docs/MASTER_PLAN.md`](docs/MASTER_PLAN.md) for the full plan, [`docs/OLD_PROJECT_ANALYSIS.md`](docs/OLD_PROJECT_ANALYSIS.md) for the postmortem of the old project, and [`docs/WORKLOG.md`](docs/WORKLOG.md) for the running session log.

---

## Phase 1 Scope (locked)

1. **Opportunities** — Govt Jobs, Admissions, Scholarships, Govt Schemes, News, Articles
2. **Educational** — Exams, Courses, Universities, IITs, NITs, IIMs, AIIMS, IIITs, NIFTs, Schools, Colleges, Coaching, Training & Skill Centres, ITI, Fake Universities, Law Universities *(institutions: submit-only for now)*
3. **Helpline**
4. **Tools** — Exam Calendar, Employment News
5. **Console** — Super Admin / Admin / Content Writers roles, manual + JSON-paste editor, JSON samples, About Us, Contact Us, Search/Analytics integration, WordPress-style post management
6. **User services** — Login, SignUp, Notifications, Follow, Save, Personalization (root site for students/job-seekers; console for team only)
7. **Languages** — English (India) at root, Hindi at `/hi-in/`
8. **Design** — Modern, energetic, minimalistic, high information density

## Out of scope for Phase 1

Private jobs · HireZila platform · Nexus or any sub-platform · Crawler/AI extraction · API monetization · Telegram/WhatsApp bots · MOOC integration · Campus drives/TPO · Discussion forums · Career timelines · Resume builder · Certificates · Push notifications (in-app only) · Live chat · AI features · Languages beyond EN/HI.

---

## Documents

| Document | Purpose |
| --- | --- |
| [`docs/MASTER_PLAN.md`](docs/MASTER_PLAN.md) | The full Phase 1 plan — scope, architecture, schema, sessions, risks |
| [`docs/OLD_PROJECT_ANALYSIS.md`](docs/OLD_PROJECT_ANALYSIS.md) | Postmortem of the old 129-table project |
| [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) | Brand identity, colors, typography, UI principles |
| [`docs/DB_SCHEMA.md`](docs/DB_SCHEMA.md) | Phase 1 database schema (minimal, ~20 tables) |
| [`docs/SESSION_PLAN.md`](docs/SESSION_PLAN.md) | Session-by-session execution plan (S0–S8) |
| [`docs/WORKLOG.md`](docs/WORKLOG.md) | Running worklog — updated every session |

---

## Stack

- **Frontend**: Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · shadcn/ui
- **Backend**: Supabase (Postgres + Auth + Realtime + Storage)
- **i18n**: next-intl (en-IN root, hi-IN prefixed)
- **Search**: Postgres FTS (Phase 1) → Meilisearch later
- **Analytics**: PostHog

## Repo status

Phase 1 — Session 0 (foundation) complete. See [`docs/WORKLOG.md`](docs/WORKLOG.md).
