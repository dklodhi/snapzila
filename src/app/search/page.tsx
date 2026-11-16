import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PublicShell } from "@/components/public/public-shell";
import { EventCard } from "@/components/public/event-card";
import { Card, CardContent } from "@/components/ui/card";
import { searchMetadata } from "@/lib/seo/metadata";


export async function generateMetadata({ searchParams }: { searchParams: Promise<{ q?: string }> }): Promise<Metadata> {
  const { q } = await searchParams;
  return searchMetadata(q);
}
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  let results: Array<{
    id: string;
    type: string;
    slug: string;
    title: string;
    conducting_body: string | null;
    summary: string | null;
    apply_end_date: string | null;
    status: string;
    featured: boolean;
  }> = [];

  if (q && q.trim().length > 0) {
    // Use text search via PostgREST's or/ilike filters
    // (Phase 1: simple ILIKE; full tsvector search comes with a search RPC later)
    const { data } = await supabase
      .from("events")
      .select("id, type, slug, title, conducting_body, summary, apply_end_date, status, featured")
      .eq("status", "published")
      .is("deleted_at", null)
      .or(`title.ilike.%${q}%,conducting_body.ilike.%${q}%,summary.ilike.%${q}%`)
      .order("published_at", { ascending: false })
      .limit(20);
    results = data ?? [];
  }

  return (
    <PublicShell>
      <div className="container-app py-8">
        <h1 className="font-display text-2xl font-bold text-ink">Search</h1>

        <form className="mt-4 flex gap-2" action="/search" method="get">
          <input
            type="text"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search opportunities..."
            className="flex h-10 flex-1 rounded-md border border-line bg-white px-3 text-sm"
            autoFocus
          />
          <button
            type="submit"
            className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover"
          >
            Search
          </button>
        </form>

        <div className="mt-6">
          {q && q.trim().length > 0 ? (
            <>
              <p className="text-sm text-muted">
                {results.length} result{results.length !== 1 ? "s" : ""} for &ldquo;{q}&rdquo;
              </p>
              {results.length > 0 ? (
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {results.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              ) : (
                <Card className="mt-4">
                  <CardContent className="p-8 text-center text-muted">
                    No results found. Try different keywords.
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted">
                Type something above to search.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PublicShell>
  );
}
