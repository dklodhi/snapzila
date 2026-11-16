import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PublicShell } from "@/components/public/public-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Newspaper } from "lucide-react";
import { employmentNewsMetadata } from "@/lib/seo/metadata";


export const metadata: Metadata = employmentNewsMetadata();
export default async function EmploymentNewsPage() {
  const supabase = await createClient();

  // Fetch published issues
  const { data: issues } = await supabase
    .from("employment_news_issues")
    .select("*")
    .eq("status", "published")
    .order("week_start", { ascending: false });

  // For the latest issue, fetch the featured events
  let latestIssueEvents: Array<{
    id: string;
    type: string;
    slug: string;
    title: string;
    conducting_body: string | null;
    summary: string | null;
    apply_end_date: string | null;
  }> = [];

  if (issues && issues.length > 0) {
    const latest = issues[0];
    if (latest.featured_event_ids && latest.featured_event_ids.length > 0) {
      const { data: featured } = await supabase
        .from("events")
        .select("id, type, slug, title, conducting_body, summary, apply_end_date")
        .in("id", latest.featured_event_ids)
        .eq("status", "published")
        .is("deleted_at", null);
      latestIssueEvents = featured ?? [];
    }

    // If no featured events picked, auto-fetch govt-jobs from that week
    if (latestIssueEvents.length === 0) {
      const { data: weekJobs } = await supabase
        .from("events")
        .select("id, type, slug, title, conducting_body, summary, apply_end_date")
        .eq("type", "govt-jobs")
        .eq("status", "published")
        .is("deleted_at", null)
        .gte("published_at", latest.week_start)
        .lte("published_at", latest.week_end + "T23:59:59")
        .order("published_at", { ascending: false })
        .limit(10);
      latestIssueEvents = weekJobs ?? [];
    }
  }

  return (
    <PublicShell>
      <div className="container-app py-8">
        <div className="flex items-center gap-2">
          <Newspaper className="h-6 w-6 text-brand" />
          <h1 className="font-display text-3xl font-bold text-ink">Employment News</h1>
        </div>
        <p className="mt-1 text-muted">Weekly digest of government job notifications.</p>

        {issues && issues.length > 0 ? (
          <>
            {/* Latest issue */}
            <Card className="mt-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{issues[0].title}</CardTitle>
                  <span className="text-xs text-muted">
                    {new Date(issues[0].week_start).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    {" – "}
                    {new Date(issues[0].week_end).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                {issues[0].intro_md && (
                  <p className="mb-4 text-sm text-muted whitespace-pre-wrap">{issues[0].intro_md}</p>
                )}
                <div className="space-y-2">
                  {latestIssueEvents.length > 0 ? (
                    latestIssueEvents.map((event) => (
                      <Link
                        key={event.id}
                        href={`/opportunities/${event.type}/${event.slug}`}
                        className="block rounded-md border border-line-soft p-3 hover:border-brand"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-ink">{event.title}</p>
                            {event.conducting_body && (
                              <p className="mt-0.5 text-xs text-muted">{event.conducting_body}</p>
                            )}
                            {event.summary && (
                              <p className="mt-1 text-sm text-muted line-clamp-2">{event.summary}</p>
                            )}
                          </div>
                          {event.apply_end_date && (
                            <span className="ml-2 shrink-0 rounded-full bg-warning-subtle px-2 py-0.5 text-[10px] font-medium text-warning">
                              Apply by {new Date(event.apply_end_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                            </span>
                          )}
                        </div>
                      </Link>
                    ))
                  ) : (
                    <p className="text-sm text-muted">No jobs in this issue.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Previous issues */}
            {issues.length > 1 && (
              <div className="mt-8">
                <h2 className="font-display text-lg font-semibold text-ink">Previous Issues</h2>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {issues.slice(1).map((issue) => (
                    <Card key={issue.id}>
                      <CardContent className="p-4">
                        <p className="font-medium text-ink">{issue.title}</p>
                        <p className="mt-1 text-xs text-muted">
                          {new Date(issue.week_start).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          {" – "}
                          {new Date(issue.week_end).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <Card className="mt-6">
            <CardContent className="p-8 text-center text-muted">
              No employment news issues published yet.
            </CardContent>
          </Card>
        )}
      </div>
    </PublicShell>
  );
}
