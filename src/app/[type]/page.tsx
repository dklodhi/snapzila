import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/server";
import { PublicShell } from "@/components/public/public-shell";
import { EventCard } from "@/components/public/event-card";
import { Card, CardContent } from "@/components/ui/card";
import { FollowButton } from "@/components/public/follow-button";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo/metadata";
import { Globe, Building2 } from "lucide-react";

const CONTENT_TYPES: Record<string, { label: string; desc: string }> = {
  "govt-jobs": { label: "Govt Jobs", desc: "SSC, UPSC, IBPS, Railway, Police, PSU" },
  admissions: { label: "Admissions", desc: "College admissions, entrance-based" },
  scholarships: { label: "Scholarships", desc: "National & state scholarships" },
  "govt-schemes": { label: "Govt Schemes", desc: "Welfare schemes, subsidies" },
  news: { label: "News", desc: "Career & education news" },
  articles: { label: "Articles", desc: "Guides, how-tos, analysis" },
};

const TAG_KIND_LABELS: Record<string, string> = {
  sector: "Sector",
  state: "State / Jurisdiction",
  org: "Organization",
  "central-govt": "Central Government",
  district: "District",
  city: "City",
  exam: "Exam",
  skill: "Skill",
  qualification: "Qualification",
  "target-group": "Target Group",
};

export async function generateMetadata({ params }: { params: Promise<{ type: string }> }): Promise<Metadata> {
  const { type } = await params;
  const supabase = await createClient();

  // Content type?
  if (CONTENT_TYPES[type]) {
    return buildMetadata({ title: CONTENT_TYPES[type].label, description: CONTENT_TYPES[type].desc, path: `/${type}` });
  }

  // Org?
  const { data: org } = await supabase.from("orgs").select("name, slug, description, type").eq("slug", type).eq("status", "published").is("deleted_at", null).maybeSingle();
  if (org) {
    return buildMetadata({ title: org.name, description: org.description || `${org.name} — organization profile, related opportunities, exams, and live updates.`, path: `/${type}` });
  }

  // Tag?
  const { data: tag } = await supabase.from("tags").select("label, kind").eq("slug", type).maybeSingle();
  if (tag) {
    return buildMetadata({ title: tag.label, description: `${tag.label} — ${TAG_KIND_LABELS[tag.kind] ?? "Tag"}. Latest opportunities and live updates.`, path: `/${type}` });
  }

  return {};
}

export default async function SmartRoutePage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  const supabase = await createClient();
  const user = await getCurrentUser();

  // ── 1. Content type listing ──
  if (CONTENT_TYPES[type]) {
    const info = CONTENT_TYPES[type];
    const { data: events } = await supabase
      .from("events")
      .select("id, type, slug, title, conducting_body, summary, apply_end_date, status, featured")
      .eq("type", type)
      .eq("status", "published")
      .is("deleted_at", null)
      .order("featured", { ascending: false })
      .order("published_at", { ascending: false })
      .limit(50);

    return (
      <PublicShell>
        <div className="container-app py-8">
          <h1 className="font-display text-3xl font-bold text-ink">{info.label}</h1>
          <p className="mt-1 text-muted">{info.desc}</p>
          <div className="mt-6">
            {events && events.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {events.map((event) => <EventCard key={event.id} event={event} />)}
              </div>
            ) : (
              <Card><CardContent className="p-8 text-center text-muted">No {info.label.toLowerCase()} published yet.</CardContent></Card>
            )}
          </div>
        </div>
      </PublicShell>
    );
  }

  // ── 2. Org page ──
  const { data: org } = await supabase
    .from("orgs")
    .select("*")
    .eq("slug", type)
    .eq("status", "published")
    .is("deleted_at", null)
    .maybeSingle();

  if (org) {
    // Fetch events by this org (conducting_body_slug or org_id or tags containing org slug)
    const { data: events } = await supabase
      .from("events")
      .select("id, type, slug, title, conducting_body, summary, apply_end_date, status, featured")
      .eq("status", "published")
      .is("deleted_at", null)
      .or(`conducting_body_slug.eq.${org.slug},tags.cs.{${org.slug}}`)
      .order("published_at", { ascending: false })
      .limit(24);

    // Fetch exams by this org
    const { data: exams } = await supabase
      .from("exams")
      .select("id, slug, name, conducting_body, exam_type, level")
      .eq("status", "published")
      .is("deleted_at", null)
      .or(`conducting_body.ilike.%${org.name}%,tags.cs.{${org.slug}}`)
      .order("name")
      .limit(12);

    // Check follow status
    let initialFollowing = false;
    if (user) {
      const { data: followRow } = await supabase
        .from("user_follows")
        .select("id")
        .eq("user_id", user.id)
        .eq("target_type", "org")
        .eq("target_id", org.id)
        .maybeSingle();
      initialFollowing = Boolean(followRow);
    }

    return (
      <PublicShell>
        <div className="container-app py-8">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-subtle">
                <Building2 className="h-6 w-6 text-brand" />
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold text-ink">{org.name}</h1>
                {org.full_name && <p className="mt-1 text-muted">{org.full_name}</p>}
                <div className="mt-2 flex gap-2">
                  <span className="rounded-full bg-brand-subtle px-2.5 py-0.5 text-xs font-medium text-brand capitalize">{org.type}</span>
                  {org.website && (
                    <a href={org.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-brand hover:underline">
                      <Globe className="h-3 w-3" /> Website ↗
                    </a>
                  )}
                </div>
              </div>
            </div>
            <FollowButton targetType="org" targetId={org.id} initialFollowing={initialFollowing} label="Follow" />
          </div>

          {org.description && (
            <Card className="mt-6"><CardContent className="p-5">
              <pre className="whitespace-pre-wrap font-sans text-sm text-ink-soft">{org.description}</pre>
            </CardContent></Card>
          )}

          {/* Events */}
          <h2 className="mt-8 font-display text-xl font-semibold text-ink">Opportunities ({events?.length ?? 0})</h2>
          {events && events.length > 0 ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => <EventCard key={event.id} event={event} />)}
            </div>
          ) : (
            <Card className="mt-4"><CardContent className="p-6 text-center text-muted">No opportunities from {org.name} yet.</CardContent></Card>
          )}

          {/* Exams */}
          {exams && exams.length > 0 && (
            <>
              <h2 className="mt-8 font-display text-xl font-semibold text-ink">Exams ({exams.length})</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {exams.map((exam) => (
                  <Link key={exam.id} href={`/exams/${exam.slug}`}>
                    <Card className="transition-colors hover:border-brand">
                      <CardContent className="p-4">
                        <h3 className="font-display text-base font-semibold text-ink">{exam.name}</h3>
                        <div className="mt-2 flex gap-2">
                          <span className="rounded-full bg-brand-subtle px-2 py-0.5 text-[10px] text-brand capitalize">{exam.exam_type}</span>
                          <span className="rounded-full bg-bg-muted px-2 py-0.5 text-[10px] text-muted capitalize">{exam.level}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </PublicShell>
    );
  }

  // ── 3. Tag page (sector, state, jurisdiction, etc.) ──
  const { data: tag } = await supabase
    .from("tags")
    .select("*")
    .eq("slug", type)
    .maybeSingle();

  if (tag) {
    const kindLabel = TAG_KIND_LABELS[tag.kind] ?? "Tag";
    const { data: events } = await supabase
      .from("events")
      .select("id, type, slug, title, conducting_body, summary, apply_end_date, status, featured")
      .eq("status", "published")
      .is("deleted_at", null)
      .contains("tags", [tag.slug])
      .order("published_at", { ascending: false })
      .limit(24);

    const { data: exams } = await supabase
      .from("exams")
      .select("id, slug, name, conducting_body, exam_type, level")
      .eq("status", "published")
      .is("deleted_at", null)
      .contains("tags", [tag.slug])
      .order("name")
      .limit(12);

    let initialFollowing = false;
    if (user) {
      const followType = tag.kind === "state" ? "state" : tag.kind === "central-govt" ? "central-govt" : tag.kind === "district" ? "district" : tag.kind === "city" ? "city" : tag.kind === "sector" ? "sector" : "tag";
      const { data: followRow } = await supabase
        .from("user_follows")
        .select("id")
        .eq("user_id", user.id)
        .eq("target_type", followType)
        .eq("target_id", tag.id)
        .maybeSingle();
      initialFollowing = Boolean(followRow);
    }

    const followType = tag.kind === "state" ? "state" : tag.kind === "central-govt" ? "central-govt" : tag.kind === "district" ? "district" : tag.kind === "city" ? "city" : tag.kind === "sector" ? "sector" : "tag";

    const { data: children } = await supabase
      .from("tags")
      .select("id, slug, label, kind")
      .eq("parent_id", tag.id)
      .order("label")
      .limit(50);

    return (
      <PublicShell>
        <div className="container-app py-8">
          <div className="flex items-start justify-between">
            <div>
              <span className="rounded-full bg-brand-subtle px-2.5 py-0.5 text-xs font-medium text-brand">{kindLabel}</span>
              <h1 className="mt-2 font-display text-3xl font-bold text-ink">{tag.label}</h1>
              {tag.label_hi && <p className="mt-1 text-muted">{tag.label_hi}</p>}
            </div>
            <FollowButton targetType={followType} targetId={tag.id} initialFollowing={initialFollowing} label={`Follow ${tag.label}`} />
          </div>

          {children && children.length > 0 && (
            <div className="mt-6">
              <h2 className="font-display text-lg font-semibold text-ink">Sub-categories ({children.length})</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {children.map((child) => (
                  <Link key={child.id} href={`/${child.slug}`} className="rounded-md border border-line bg-white px-3 py-1.5 text-sm text-ink hover:border-brand">{child.label}</Link>
                ))}
              </div>
            </div>
          )}

          <h2 className="mt-8 font-display text-xl font-semibold text-ink">Related Opportunities ({events?.length ?? 0})</h2>
          {events && events.length > 0 ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => <EventCard key={event.id} event={event} />)}
            </div>
          ) : (
            <Card className="mt-4"><CardContent className="p-6 text-center text-muted">No opportunities tagged with {tag.label} yet.</CardContent></Card>
          )}

          {exams && exams.length > 0 && (
            <>
              <h2 className="mt-8 font-display text-xl font-semibold text-ink">Related Exams ({exams.length})</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {exams.map((exam) => (
                  <Link key={exam.id} href={`/exams/${exam.slug}`}>
                    <Card className="transition-colors hover:border-brand">
                      <CardContent className="p-4">
                        <h3 className="font-display text-base font-semibold text-ink">{exam.name}</h3>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </PublicShell>
    );
  }

  // ── 4. Not found ──
  notFound();
}
