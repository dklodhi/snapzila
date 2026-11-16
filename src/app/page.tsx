import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, getTeamMember } from "@/lib/auth/server";
import { PublicShell } from "@/components/public/public-shell";
import { EventCard } from "@/components/public/event-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const TYPES = [
  { slug: "govt-jobs", label: "Govt Jobs" },
  { slug: "admissions", label: "Admissions" },
  { slug: "scholarships", label: "Scholarships" },
  { slug: "govt-schemes", label: "Govt Schemes" },
  { slug: "news", label: "News" },
  { slug: "articles", label: "Articles" },
];

export default async function HomePage() {
  const user = await getCurrentUser();
  const teamMember = await getTeamMember();
  const supabase = await createClient();

  const { data: latest } = await supabase
    .from("events")
    .select("id, type, slug, title, conducting_body, summary, apply_end_date, status, featured")
    .eq("status", "published")
    .is("deleted_at", null)
    .order("published_at", { ascending: false })
    .limit(9);

  return (
    <PublicShell>
      {/* Hero */}
      <section className="border-b border-line bg-bg-subtle">
        <div className="container-app py-12 text-center">
          <h1 className="mx-auto max-w-3xl font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Live updates for every career &amp; education opportunity
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-muted">
            Govt Jobs, Admissions, Scholarships, Govt Schemes, News, Articles — each event
            with a real-time live-update timeline, structured guide, and discussions.
          </p>
          <div className="mt-6 flex items-center justify-center gap-2">
            {TYPES.map((t) => (
              <Button key={t.slug} asChild variant="secondary" size="sm">
                <Link href={`/opportunities/${t.slug}`}>{t.label}</Link>
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Latest opportunities */}
      <section className="container-app py-8">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-ink">Latest Opportunities</h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/opportunities">View All →</Link>
          </Button>
        </div>
        {latest && latest.length > 0 ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {latest.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <Card className="mt-4">
            <CardContent className="p-8 text-center text-muted">
              No opportunities published yet.
              {teamMember && (
                <>
                  {" "}You can{" "}
                  <Link href="/console/posts/new-manual" className="text-brand hover:underline">
                    create one from the console
                  </Link>.
                </>
              )}
            </CardContent>
          </Card>
        )}
      </section>

      {/* Status banner */}
      {user && (
        <section className="container-app pb-8">
          <Card className="border-brand/20 bg-brand-subtle/30">
            <CardContent className="p-4 text-sm">
              <span className="text-brand">Signed in as {user.email}</span>
              {teamMember && (
                <span className="ml-2 text-muted">· Team: {teamMember.role.replace("_", " ")}</span>
              )}
              <Link href="/me" className="ml-3 text-brand hover:underline">Dashboard →</Link>
            </CardContent>
          </Card>
        </section>
      )}
    </PublicShell>
  );
}
