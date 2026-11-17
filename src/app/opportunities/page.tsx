import { createClient } from "@/lib/supabase/server";
import { PublicShell } from "@/components/public/public-shell";
import { EventCard } from "@/components/public/event-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

const TYPE_INFO = [
  { slug: "govt-jobs", label: "Govt Jobs", desc: "SSC, UPSC, IBPS, Railway, Police, PSU" },
  { slug: "admissions", label: "Admissions", desc: "College admissions, entrance-based" },
  { slug: "scholarships", label: "Scholarships", desc: "National & state scholarships" },
  { slug: "govt-schemes", label: "Govt Schemes", desc: "Welfare schemes, subsidies" },
  { slug: "news", label: "News", desc: "Career & education news" },
  { slug: "articles", label: "Articles", desc: "Guides, how-tos, analysis" },
];

export default async function OpportunitiesPage() {
  const supabase = await createClient();

  // Get latest published events across all types
  const { data: latest } = await supabase
    .from("events")
    .select("id, type, slug, title, conducting_body, summary, apply_end_date, status, featured")
    .eq("status", "published")
    .is("deleted_at", null)
    .order("published_at", { ascending: false })
    .limit(12);

  // Count per type
  const typeCounts: Record<string, number> = {};
  for (const t of TYPE_INFO) {
    const { count } = await supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .eq("type", t.slug)
      .eq("status", "published")
      .is("deleted_at", null);
    typeCounts[t.slug] = count ?? 0;
  }

  return (
    <PublicShell>
      <div className="container-app py-8">
        <h1 className="font-display text-3xl font-bold text-ink">Opportunities</h1>
        <p className="mt-1 text-muted">All career &amp; education opportunities in one place.</p>

        {/* Type grid */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TYPE_INFO.map((t) => (
            <Link key={t.slug} href={`/${t.slug}`}>
              <Card className="transition-colors hover:border-brand">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-lg font-semibold text-ink">{t.label}</h2>
                    <span className="rounded-full bg-brand-subtle px-2 py-0.5 text-xs font-medium text-brand">
                      {typeCounts[t.slug]}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted">{t.desc}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Latest */}
        <div className="mt-10">
          <h2 className="font-display text-xl font-semibold text-ink">Latest Opportunities</h2>
          {latest && latest.length > 0 ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {latest.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <Card className="mt-4">
              <CardContent className="p-8 text-center text-muted">
                No opportunities published yet. Check back soon.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PublicShell>
  );
}
