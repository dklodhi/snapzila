import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PublicShell } from "@/components/public/public-shell";
import { Card, CardContent } from "@/components/ui/card";

const CATEGORY_LABELS: Record<string, string> = {
  exams: "Exams",
  courses: "Courses",
  universities: "Universities",
  iits: "IITs",
  nits: "NITs",
  iims: "IIMs",
  aiims: "AIIMS",
  iiits: "IIITs",
  nifts: "NIFTs",
  schools: "Schools",
  colleges: "Colleges",
  coaching: "Coaching",
  "training-skill-centres": "Training & Skill Centres",
  iti: "ITI",
  "fake-universities": "Fake Universities",
  "law-universities": "Law Universities",
};

export default async function CategoryListingPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;

  if (!CATEGORY_LABELS[category]) notFound();

  const supabase = await createClient();
  const { data: institutions } = await supabase
    .from("institutions")
    .select("id, name, slug, city, state, description, website")
    .eq("category", category)
    .eq("status", "published")
    .is("deleted_at", null)
    .order("name", { ascending: true })
    .limit(100);

  return (
    <PublicShell>
      <div className="container-app py-8">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/institutions" className="text-sm text-muted hover:text-ink">
              ← All Categories
            </Link>
            <h1 className="mt-1 font-display text-3xl font-bold text-ink">
              {CATEGORY_LABELS[category]}
            </h1>
            <p className="mt-1 text-muted">
              {institutions?.length ?? 0} institution{(institutions?.length ?? 0) !== 1 ? "s" : ""} listed.
            </p>
          </div>
          <Link
            href="/institutions/submit"
            className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover"
          >
            Submit Institution
          </Link>
        </div>

        <div className="mt-6">
          {institutions && institutions.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {institutions.map((inst) => (
                <Card key={inst.id} className="transition-colors hover:border-brand">
                  <CardContent className="p-4">
                    <h2 className="font-display text-base font-semibold text-ink">{inst.name}</h2>
                    {(inst.city || inst.state) && (
                      <p className="mt-1 text-xs text-muted">
                        {[inst.city, inst.state].filter(Boolean).join(", ")}
                      </p>
                    )}
                    {inst.description && (
                      <p className="mt-1.5 text-sm text-muted line-clamp-2">{inst.description}</p>
                    )}
                    {inst.website && (
                      <a
                        href={inst.website}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-block text-xs text-brand hover:underline"
                      >
                        Website ↗
                      </a>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted">
                No institutions listed in this category yet.
                <div className="mt-3">
                  <Link href="/institutions/submit" className="text-brand hover:underline">
                    Submit the first one →
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PublicShell>
  );
}
