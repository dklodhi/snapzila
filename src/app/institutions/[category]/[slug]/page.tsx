import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/server";
import { PublicShell } from "@/components/public/public-shell";
import { Card, CardContent } from "@/components/ui/card";
import { FollowButton } from "@/components/public/follow-button";
import { buildMetadata } from "@/lib/seo/metadata";
import { Globe, MapPin, Mail, Phone, Calendar } from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
  exams: "Exams", courses: "Courses", universities: "Universities",
  iits: "IITs", nits: "NITs", iims: "IIMs", aiims: "AIIMS", iiits: "IIITs",
  nifts: "NIFTs", schools: "Schools", colleges: "Colleges", coaching: "Coaching",
  "training-skill-centres": "Training & Skill Centres", iti: "ITI",
  "fake-universities": "Fake Universities", "law-universities": "Law Universities",
};

export async function generateMetadata({ params }: { params: Promise<{ category: string; slug: string }> }): Promise<Metadata> {
  const { category, slug } = await params;
  const supabase = await createClient();
  const { data: inst } = await supabase
    .from("institutions")
    .select("name, description, city, state, category, slug")
    .eq("category", category)
    .eq("slug", slug)
    .eq("status", "published")
    .is("deleted_at", null)
    .maybeSingle();
  if (!inst) return {};
  return buildMetadata({
    title: inst.name,
    description: inst.description || `${inst.name} — ${CATEGORY_LABELS[inst.category] ?? inst.category} in ${[inst.city, inst.state].filter(Boolean).join(", ")}.`,
    path: `/institutions/${category}/${slug}`,
  });
}

export default async function InstitutionDetailPage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category, slug } = await params;
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!CATEGORY_LABELS[category]) notFound();

  const { data: institution } = await supabase
    .from("institutions")
    .select("*")
    .eq("category", category)
    .eq("slug", slug)
    .eq("status", "published")
    .is("deleted_at", null)
    .maybeSingle();

  if (!institution) notFound();

  // Fetch course offerings at this institution
  const { data: offerings } = await supabase
    .from("course_offerings")
    .select(`
      id, fees_total, fees_per_year, seats, batch_year, mode, status, apply_link, brochure_url,
      course:course_master_id(name, slug, level, stream, duration)
    `)
    .eq("institution_id", institution.id)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  // Check follow status
  let initialFollowing = false;
  if (user) {
    const { data: followRow } = await supabase
      .from("user_follows")
      .select("id")
      .eq("user_id", user.id)
      .eq("target_type", "institution")
      .eq("target_id", institution.id)
      .maybeSingle();
    initialFollowing = Boolean(followRow);
  }

  const catLabel = CATEGORY_LABELS[category] ?? category;

  return (
    <PublicShell>
      <div className="container-app py-8">
        {/* Breadcrumb */}
        <Link href={`/institutions/${category}`} className="text-sm text-muted hover:text-ink">
          ← {catLabel}
        </Link>

        {/* Header */}
        <div className="mt-2 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-brand-subtle px-2.5 py-0.5 text-xs font-medium text-brand">{catLabel}</span>
              {institution.featured && (
                <span className="rounded-full bg-brand-accent/10 px-2.5 py-0.5 text-xs font-medium text-brand-accent">Featured</span>
              )}
            </div>
            <h1 className="mt-2 font-display text-3xl font-bold text-ink">{institution.name}</h1>
            {institution.name_hi && <p className="mt-1 text-muted">{institution.name_hi}</p>}
          </div>
          <FollowButton targetType="institution" targetId={institution.id} initialFollowing={initialFollowing} label="Follow" />
        </div>

        {/* Location + Contact */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted">
          {(institution.city || institution.state) && (
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {[institution.city, institution.state].filter(Boolean).join(", ")}
            </span>
          )}
          {institution.established_year && (
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Established {institution.established_year}
            </span>
          )}
          {institution.website && (
            <a href={institution.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-brand hover:underline">
              <Globe className="h-4 w-4" /> Website ↗
            </a>
          )}
          {institution.contact_email && (
            <a href={`mailto:${institution.contact_email}`} className="flex items-center gap-1 text-brand hover:underline">
              <Mail className="h-4 w-4" /> {institution.contact_email}
            </a>
          )}
          {institution.contact_phone && (
            <span className="flex items-center gap-1">
              <Phone className="h-4 w-4" /> {institution.contact_phone}
            </span>
          )}
        </div>

        {/* Description */}
        {institution.description && (
          <Card className="mt-6">
            <CardContent className="p-5">
              <pre className="whitespace-pre-wrap font-sans text-sm text-ink-soft">{institution.description}</pre>
            </CardContent>
          </Card>
        )}

        {/* Course Offerings */}
        <h2 className="mt-8 font-display text-xl font-semibold text-ink">
          Courses Offered ({offerings?.length ?? 0})
        </h2>
        {offerings && offerings.length > 0 ? (
          <div className="mt-4 space-y-3">
            {offerings.map((o) => {
              const course = (o.course as unknown as { name: string; slug: string; level: string; stream: string | null; duration: string | null } | null);
              return (
                <Card key={o.id} className="transition-colors hover:border-brand">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <Link href={`/t/${course?.slug}`} className="font-display text-base font-semibold text-ink hover:text-brand">
                          {course?.name ?? "Unknown Course"}
                        </Link>
                        <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted">
                          {course?.level && <span className="capitalize">{course.level}</span>}
                          {course?.stream && <span>· {course.stream}</span>}
                          {course?.duration && <span>· {course.duration}</span>}
                          {o.fees_total && <span>· Fees: ₹{o.fees_total.toLocaleString("en-IN")}</span>}
                          {o.seats && <span>· Seats: {o.seats}</span>}
                          {o.batch_year && <span>· Batch: {o.batch_year}</span>}
                          <span>· {o.mode}</span>
                        </div>
                      </div>
                      {o.apply_link && (
                        <a href={o.apply_link} target="_blank" rel="noreferrer" className="shrink-0 rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-hover">
                          Apply →
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="mt-4">
            <CardContent className="p-6 text-center text-muted">
              No courses listed yet.
            </CardContent>
          </Card>
        )}
      </div>
    </PublicShell>
  );
}
