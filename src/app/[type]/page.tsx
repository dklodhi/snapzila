import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PublicShell } from "@/components/public/public-shell";
import { EventCard } from "@/components/public/event-card";
import { Card, CardContent } from "@/components/ui/card";
import { typeListingMetadata } from "@/lib/seo/metadata";

const TYPE_INFO: Record<string, { label: string; desc: string }> = {
  "govt-jobs": { label: "Govt Jobs", desc: "SSC, UPSC, IBPS, Railway, Police, PSU" },
  admissions: { label: "Admissions", desc: "College admissions, entrance-based" },
  scholarships: { label: "Scholarships", desc: "National & state scholarships" },
  "govt-schemes": { label: "Govt Schemes", desc: "Welfare schemes, subsidies" },
  news: { label: "News", desc: "Career & education news" },
  articles: { label: "Articles", desc: "Guides, how-tos, analysis" },
};

export async function generateMetadata({ params }: { params: Promise<{ type: string }> }): Promise<Metadata> {
  const { type } = await params;
  const info = TYPE_INFO[type];
  if (!info) return {};
  return typeListingMetadata(type, info.label);
}

export default async function TypeListingPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  if (!TYPE_INFO[type]) notFound();

  const info = TYPE_INFO[type];
  const supabase = await createClient();

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
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted">
                No {info.label.toLowerCase()} published yet.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PublicShell>
  );
}
