import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/server";
import { PublicShell } from "@/components/public/public-shell";
import { EventCard } from "@/components/public/event-card";
import { Card, CardContent } from "@/components/ui/card";
import { FollowButton } from "@/components/public/follow-button";
import { buildMetadata } from "@/lib/seo/metadata";

const KIND_LABELS: Record<string, string> = {
  sector: "Sector",
  state: "State / Jurisdiction",
  org: "Conducting Body",
  exam: "Exam",
  "central-govt": "Central Government",
  district: "District",
  city: "City",
  skill: "Skill",
  qualification: "Qualification",
  "target-group": "Target Group",
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: tag } = await supabase.from("tags").select("label, kind").eq("slug", slug).maybeSingle();
  if (!tag) return {};
  return buildMetadata({
    title: tag.label,
    description: `${tag.label} — ${KIND_LABELS[tag.kind] ?? "Tag"}. Latest opportunities, live updates, and guides.`,
    path: `/t/${slug}`,
  });
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const user = await getCurrentUser();

  const { data: tag } = await supabase
    .from("tags")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!tag) notFound();

  // Fetch events with this tag slug in their tags array
  const { data: events } = await supabase
    .from("events")
    .select("id, type, slug, title, conducting_body, summary, apply_end_date, status, featured")
    .eq("status", "published")
    .is("deleted_at", null)
    .contains("tags", [slug])
    .order("published_at", { ascending: false })
    .limit(24);

  // Fetch exams with this tag
  const { data: exams } = await supabase
    .from("exams")
    .select("id, slug, name, conducting_body, exam_type, level")
    .eq("status", "published")
    .is("deleted_at", null)
    .contains("tags", [slug])
    .order("name")
    .limit(12);

  // Check follow status
  let initialFollowing = false;
  if (user) {
    const { data: followRow } = await supabase
      .from("user_follows")
      .select("id")
      .eq("user_id", user.id)
      .eq("target_type", tag.kind === "state" ? "state" : tag.kind === "central-govt" ? "central-govt" : tag.kind === "district" ? "district" : tag.kind === "city" ? "city" : tag.kind === "sector" ? "sector" : tag.kind === "org" ? "org" : "tag")
      .eq("target_id", tag.id)
      .maybeSingle();
    initialFollowing = Boolean(followRow);
  }

  const followType = tag.kind === "state" ? "state" : tag.kind === "central-govt" ? "central-govt" : tag.kind === "district" ? "district" : tag.kind === "city" ? "city" : tag.kind === "sector" ? "sector" : tag.kind === "org" ? "org" : "tag";
  const kindLabel = KIND_LABELS[tag.kind] ?? "Tag";

  // Fetch child tags (for hierarchical tags like state → districts)
  const { data: children } = await supabase
    .from("tags")
    .select("id, slug, label, kind")
    .eq("parent_id", tag.id)
    .order("label")
    .limit(50);

  return (
    <PublicShell>
      <div className="container-app py-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-brand-subtle px-2.5 py-0.5 text-xs font-medium text-brand">
                {kindLabel}
              </span>
            </div>
            <h1 className="mt-2 font-display text-3xl font-bold text-ink">{tag.label}</h1>
            {tag.label_hi && <p className="mt-1 text-muted">{tag.label_hi}</p>}
          </div>
          <FollowButton targetType={followType} targetId={tag.id} initialFollowing={initialFollowing} label={`Follow ${tag.label}`} />
        </div>

        {/* Children (hierarchical) */}
        {children && children.length > 0 && (
          <div className="mt-6">
            <h2 className="font-display text-lg font-semibold text-ink">Sub-categories ({children.length})</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {children.map((child) => (
                <Link
                  key={child.id}
                  href={`/t/${child.slug}`}
                  className="rounded-md border border-line bg-white px-3 py-1.5 text-sm text-ink hover:border-brand"
                >
                  {child.label}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Events */}
        <h2 className="mt-8 font-display text-xl font-semibold text-ink">
          Related Opportunities ({events?.length ?? 0})
        </h2>
        {events && events.length > 0 ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <Card className="mt-4">
            <CardContent className="p-6 text-center text-muted">
              No opportunities tagged with {tag.label} yet.
            </CardContent>
          </Card>
        )}

        {/* Exams */}
        {exams && exams.length > 0 && (
          <>
            <h2 className="mt-8 font-display text-xl font-semibold text-ink">
              Related Exams ({exams.length})
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {exams.map((exam) => (
                <Link key={exam.id} href={`/exams/${exam.slug}`}>
                  <Card className="transition-colors hover:border-brand">
                    <CardContent className="p-4">
                      <h3 className="font-display text-base font-semibold text-ink">{exam.name}</h3>
                      {exam.conducting_body && <p className="mt-1 text-xs text-muted">{exam.conducting_body}</p>}
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
