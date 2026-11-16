# SnapZila Design System

> The visual + interaction contract for Phase 1. Binding for all sessions.

This is the single source of truth for brand, color, typography, spacing, components, and motion. Tailwind config and CSS variables are generated from this document.

---

## 1. Brand identity

| Field | Value |
| --- | --- |
| Product name | SnapZila |
| Tagline (EN) | Live updates for every career & education opportunity |
| Tagline (HI) | हर करियर और शिक्षा अवसर की लाइव अपडेट |
| Personality | Modern · Energetic · Trustworthy · Minimal · Live |
| Voice | Direct, scannable, no fluff, no marketing buzzwords |
| Anti-personality | NOT a bloated job portal; NOT ad-heavy; NOT corporate-stiff |

### Logo direction (to be finalized in S0)

- Wordmark "SnapZila" in Plus Jakarta Sans Bold, with the "Z" emphasized via accent color OR a small mark.
- Optional mark: a "snap" / lightning-bolt / capture glyph in brand indigo, with an accent-orange dot.
- Favicon: the mark on indigo background.
- Monochrome version for footers/prints.

Do NOT reuse the old SnapZila logo color. Treat the old brand color as deprecated.

---

## 2. Color system

### 2.1 Brand colors

| Token | Hex | Tailwind equiv | Role |
| --- | --- | --- | --- |
| `--brand` | `#4F46E5` | indigo-600 | Primary actions, links, brand marks |
| `--brand-hover` | `#4338CA` | indigo-700 | Hover state for primary |
| `--brand-subtle` | `#EEF2FF` | indigo-50 | Selected row, soft brand bg |
| `--brand-accent` | `#F97316` | orange-500 | Live badge, "new" pip, important-date highlight |
| `--brand-accent-hover` | `#EA580C` | orange-600 | Hover for accent CTAs |

### 2.2 Status colors

| Token | Hex | Role |
| --- | --- | --- |
| `--success` | `#10B981` | published / active / open |
| `--success-subtle` | `#ECFDF5` | success bg |
| `--warning` | `#F59E0B` | closing soon / caution / pending |
| `--warning-subtle` | `#FFFBEB` | warning bg |
| `--danger` | `#F43F5E` | closed / rejected / error |
| `--danger-subtle` | `#FFF1F2` | danger bg |
| `--info` | `#0EA5E9` | informational note |

### 2.3 Neutral scale (Slate)

| Token | Hex | Role |
| --- | --- | --- |
| `--ink` | `#0F172A` | slate-900 — primary text |
| `--ink-soft` | `#1E293B` | slate-800 — headings on subtle bg |
| `--muted` | `#64748B` | slate-500 — secondary text |
| `--muted-soft` | `#94A3B8` | slate-400 — placeholder, disabled |
| `--line` | `#E2E8F0` | slate-200 — borders, dividers |
| `--line-soft` | `#F1F5F9` | slate-100 — subtle dividers |
| `--bg` | `#FFFFFF` | page background |
| `--bg-subtle` | `#F8FAFC` | slate-50 — section bg, cards |
| `--bg-muted` | `#F1F5F9` | slate-100 — hover row bg |

### 2.4 Dark mode

Phase 1 ships **light only**. Dark mode is a Phase 2 concern. The tokens are structured so a dark theme can be added by swapping the neutral scale and adjusting brand-subtle.

### 2.5 Accessibility

- All text-on-bg combinations meet WCAG AA (4.5:1 for body, 3:1 for large text).
- Focus rings: `2px solid var(--brand)` with `2px` offset, always visible on keyboard nav.
- Status color is never the only signal — always paired with a label or icon.

---

## 3. Typography

| Role | Font | Weight | Size (desktop / mobile) | Line height |
| --- | --- | --- | --- | --- |
| Display (hero) | Plus Jakarta Sans | 700 | 40 / 28 | 1.1 |
| H1 | Plus Jakarta Sans | 700 | 30 / 24 | 1.2 |
| H2 | Plus Jakarta Sans | 600 | 24 / 20 | 1.25 |
| H3 | Plus Jakarta Sans | 600 | 20 / 18 | 1.3 |
| H4 | Plus Jakarta Sans | 600 | 18 / 16 | 1.4 |
| Body large | Inter | 400 | 18 / 16 | 1.6 |
| Body | Inter | 400 | 16 / 15 | 1.6 |
| Body small | Inter | 400 | 14 / 13 | 1.5 |
| Caption / meta | Inter | 500 | 12 / 12 | 1.4 |
| Code / mono | JetBrains Mono | 400 | 14 | 1.5 |

Loaded via `next/font/google` (self-hosted at build time, no runtime Google Fonts request).

```ts
// app/fonts.ts
import { Plus_Jakarta_Sans, Inter, JetBrains_Mono } from 'next/font/google';

export const display = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-display', weight: ['600', '700'] });
export const body = Inter({ subsets: ['latin'], variable: '--font-body', weight: ['400', '500', '600'] });
export const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', weight: ['400', '500'] });
```

For Hindi script rendering, Inter and Plus Jakarta Sans fall back to system Devanagari fonts. If rendering quality is unacceptable during S7, add `Noto Sans Devanagari` as a third font for `hi-IN` locale only.

---

## 4. Spacing & layout

### 4.1 Spacing scale (Tailwind default, no customization)

`0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24` (px: 0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96)

### 4.2 Container

- Max width: `1200px` (content), `1440px` (full app shell with side rails)
- Side padding: `16px` mobile, `24px` tablet, `32px` desktop

### 4.3 Section spacing

- Between page sections: `24px` mobile, `32px` desktop. NOT 80–120px.
- Card padding: `16px` (mobile), `20px` (desktop).
- List row height: `48px` (compact) / `56px` (default) / `72px` (with meta).

### 4.4 Grid

- Listing pages: 1 col mobile, 2 col tablet, 3 col desktop (cards) OR single-column dense list (events list).
- Event detail desktop: 2-col with `2fr 1fr` (content | live-updates rail).

### 4.5 Density principle

Default to **compact density**. The site should feel closer to Hacker News / Twitter than to Naukri / Indeed. No giant hero images on listing pages. No full-bleed banners between every 3 items.

---

## 5. Components (shadcn/ui base, customized)

### 5.1 Core set (install in S0)

`button`, `input`, `textarea`, `select`, `label`, `form`, `card`, `badge`, `avatar`, `separator`, `tabs`, `accordion`, `dialog`, `sheet` (drawer), `dropdown-menu`, `tooltip`, `toast` (sonner), `skeleton`, `switch`, `checkbox`, `radio-group`, `table`, `pagination`, `command` (cmdk), `calendar` (for date pickers).

### 5.2 Custom components (built in S2–S5)

| Component | Session | Notes |
| --- | --- | --- |
| `<EventCard>` | S3 | Compact card for listing: title, type pill, org, key date, status, follow/save buttons |
| `<EventListItem>` | S3 | Single-row dense list item |
| `<EventTimeline>` | S3, S10 | The live-updates rail — sticky on desktop, in-flow on mobile |
| `<TimelineItem>` | S3 | One update row: dot, time pill, kind icon, title, body |
| `<EventGuide>` | S3 | Accordion (mobile) / tabs (desktop) for guide sections |
| `<ParentPostPartial>` | S3 | Partial parent view + "View All" expand |
| `<KindBadge>` | S3 | Color-coded pill for update kind (info/warning/result/...) |
| `<StatusPill>` | S3 | open/closing-soon/closed |
| `<InstitutionCard>` | S4 | Institution list card |
| `<InstitutionSubmitForm>` | S4 | Public submit form |
| `<ExamCalendar>` | S5 | Month grid view |
| `<EmploymentNewsIssue>` | S5 | Weekly digest view |
| `<NotificationBell>` | S6 | Bell with unread count dropdown |
| `<FollowButton>`, `<SaveButton>` | S6 | Optimistic UI |
| `<JsonPasteEditor>` | S2 | CodeMirror + validate + sample loader |
| `<PostEditor>` | S2 | Manual editor with tabbed sections |
| `<ConsoleSidebar>`, `<ConsoleTopbar>` | S2 | Console shell |
| `<AuditLogTable>` | S2 | Read-only table with filters |
| `<LanguageSwitcher>` | S7 | EN / HI toggle |

### 5.3 Button variants

| Variant | Use |
| --- | --- |
| `primary` (brand bg, white text) | Main CTA — publish, save, submit |
| `accent` (accent-orange bg, white text) | Live / new / urgent CTA |
| `secondary` (white bg, brand border, brand text) | Secondary CTA |
| `ghost` (transparent, muted text) | Tertiary, toolbar |
| `danger` (danger bg, white text) | Destructive |
| `link` (brand text, underline on hover) | Inline links |

### 5.4 Badge variants

Map directly to status colors: `default`, `brand`, `accent`, `success`, `warning`, `danger`, `info`. Used for status pills, kind pills, type pills.

---

## 6. Iconography

- Library: `lucide-react` only. No mixed icon sets.
- Default size: `16px` (inline), `20px` (buttons), `24px` (nav).
- Color: inherit from text color unless the icon carries status meaning (then use the status color).

---

## 7. Motion

- **Page transitions**: none (Next.js default).
- **Component enter**: `150ms ease-out` opacity + translateY(4px → 0). Used for toasts, dropdowns, expanded "View All" content.
- **Live update prepend**: `200ms ease-out` slide-in from top + a `600ms` "new" pulse on the timeline header dot.
- **Button press**: `100ms` scale(0.98).
- **Loading skeletons**: `1.5s` shimmer.
- **No autoplay, no parallax, no scroll-jacking.**

---

## 8. Empty / loading / error states

Every list and detail view must ship with all three states in the same session that ships the happy path.

### 8.1 Empty states

- Illustration (simple SVG, single color) + 1-line headline + 1-line subtext + primary CTA.
- Examples:
  - No saved events: "You haven't saved anything yet. Browse opportunities →"
  - No live updates: "No live updates yet. Follow this event to get notified when there are."

### 8.2 Loading states

- List: skeleton rows matching the row height.
- Detail: skeleton parent post + skeleton timeline (3 placeholder items).
- Buttons: keep label visible, swap right icon for a `Loader2` spin.

### 8.3 Error states

- Inline form errors: red border + red caption below field.
- Page-level error: centered "Something went wrong" + retry button + error ID (logged).
- 404: clean, on-brand, with a search box and "go home" CTA.
- 500: same shape as 404 but with error ID.

---

## 9. Tailwind configuration

```ts
// tailwind.config.ts (sketch — finalized in S0)
import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: 'var(--brand)',
          hover: 'var(--brand-hover)',
          subtle: 'var(--brand-subtle)',
          accent: 'var(--brand-accent)',
          'accent-hover': 'var(--brand-accent-hover)',
        },
        // status + neutral tokens mapped similarly
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        // shadcn/ui defaults — keep lg: 0.5rem, md: 0.375rem
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
```

CSS variables for the tokens live in `app/globals.css` under `:root` so they can be overridden for dark mode later.

---

## 10. Do / Don't

### Do
- Use design tokens, not raw hex.
- Default to compact density.
- Mobile-first every page.
- Show status with color + label + icon (never color alone).
- Ship empty/loading/error states alongside happy path.
- Keep timeline visible on desktop event pages.

### Don't
- Don't reuse the old brand color.
- Don't add giant hero images to listing pages.
- Don't add ad slots in content rails.
- Don't use emojis in product UI.
- Don't justify text (left-align everything per the writing rules).
- Don't add a comment section (deferred).
- Don't add "related jobs from HireZila" widgets (HireZila is out of scope).

---

*This document evolves with the design tokens. If a session needs a new component or token, add it here first, then implement.*
