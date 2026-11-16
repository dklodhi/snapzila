/**
 * SEO metadata helper.
 * Centralizes title/description/OG/canonical generation for all public pages.
 */
import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://snapzila.com";
const SITE_NAME = "SnapZila";
const DEFAULT_DESCRIPTION =
  "Live updates for career & education opportunities — Govt Jobs, Admissions, Scholarships, Exams, Govt Schemes, News, Articles with real-time timeline.";

export function buildMetadata(params: {
  title: string;
  description?: string;
  path?: string;
  ogType?: "website" | "article";
  noIndex?: boolean;
}): Metadata {
  const { title, description, path, ogType, noIndex } = params;
  const url = path ? `${SITE_URL}${path}` : SITE_URL;
  const desc = description || DEFAULT_DESCRIPTION;
  const fullTitle = title === SITE_NAME ? title : `${title} — ${SITE_NAME}`;

  return {
    title: fullTitle,
    description: desc,
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: url,
      languages: {
        "en-IN": url,
        "hi-IN": `${SITE_URL}/hi-in${path ?? ""}`,
        "x-default": url,
      },
    },
    openGraph: {
      title: fullTitle,
      description: desc,
      url,
      siteName: SITE_NAME,
      type: ogType || "website",
      locale: "en_IN",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: desc,
    },
    robots: noIndex ? { index: false, follow: false } : { index: true, follow: true },
  };
}

export function homeMetadata(): Metadata {
  return buildMetadata({ title: SITE_NAME, description: DEFAULT_DESCRIPTION, path: "" });
}

export function opportunitiesMetadata(): Metadata {
  return buildMetadata({
    title: "Opportunities",
    description: "All career & education opportunities in one place — Govt Jobs, Admissions, Scholarships, Govt Schemes, News, Articles.",
    path: "/opportunities",
  });
}

export function typeListingMetadata(type: string, label: string): Metadata {
  return buildMetadata({
    title: label,
    description: `Latest ${label} across India. Apply online with real-time updates, eligibility, important dates, and live notifications.`,
    path: `/opportunities/${type}`,
  });
}

export function eventMetadata(event: {
  title: string; summary?: string | null; conducting_body?: string | null;
  type: string; slug: string; meta_title?: string | null; meta_description?: string | null;
}): Metadata {
  const path = `/opportunities/${event.type}/${event.slug}`;
  const title = event.meta_title || event.title;
  const description = event.meta_description || event.summary || `${event.title}${event.conducting_body ? ` — ${event.conducting_body}` : ""}`;
  return buildMetadata({ title, description, path, ogType: "article" });
}

export function examMetadata(exam: {
  name: string; slug: string; description?: string | null; meta_description?: string | null;
}): Metadata {
  return buildMetadata({
    title: exam.name,
    description: exam.meta_description || exam.description || `${exam.name} — exam pattern, eligibility, syllabus, important dates, and live updates.`,
    path: `/exams/${exam.slug}`,
  });
}

export function examSessionMetadata(exam: { name: string; slug: string }, session: { session_label: string; slug: string }): Metadata {
  return buildMetadata({
    title: `${exam.name} ${session.session_label}`,
    description: `${exam.name} ${session.session_label} — notification, application dates, exam date, admit card, result, and live updates.`,
    path: `/exams/${exam.slug}/${session.slug}`,
    ogType: "article",
  });
}

export function institutionsMetadata(): Metadata {
  return buildMetadata({
    title: "Institutions",
    description: "Browse educational institutions across India — Universities, IITs, NITs, IIMs, AIIMS, Schools, Colleges, Coaching, ITI.",
    path: "/institutions",
  });
}

export function institutionCategoryMetadata(category: string, label: string): Metadata {
  return buildMetadata({ title: label, description: `Browse ${label} across India.`, path: `/institutions/${category}` });
}

export function helplineMetadata(): Metadata {
  return buildMetadata({ title: "Helpline", description: "Official helpline numbers and contacts for exams, schemes, and admissions.", path: "/helpline" });
}

export function contactMetadata(): Metadata {
  return buildMetadata({ title: "Contact Us", description: "Contact SnapZila for questions, feedback, or corrections.", path: "/contact" });
}

export function searchMetadata(q?: string): Metadata {
  return buildMetadata({ title: q ? `Search: ${q}` : "Search", description: "Search career & education opportunities.", path: q ? `/search?q=${encodeURIComponent(q)}` : "/search", noIndex: true });
}

export function examCalendarMetadata(): Metadata {
  return buildMetadata({ title: "Exam Calendar", description: "Upcoming exam dates across all opportunity types.", path: "/tools/exam-calendar" });
}

export function employmentNewsMetadata(): Metadata {
  return buildMetadata({ title: "Employment News", description: "Weekly digest of government job notifications.", path: "/tools/employment-news" });
}

export function authMetadata(page: "login" | "signup"): Metadata {
  return buildMetadata({
    title: page === "login" ? "Login" : "Sign Up",
    description: page === "login" ? "Login to your SnapZila account." : "Create a SnapZila account to follow opportunities and get live updates.",
    path: `/${page}`, noIndex: true,
  });
}
