import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PublicShell } from "@/components/public/public-shell";
import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap, Globe, Clock } from "lucide-react";
import { FollowButton } from "@/components/public/follow-button";
import { examMetadata } from "@/lib/seo/metadata";


export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: exam } = await supabase.from("exams").select("name, slug, description, meta_description").eq("slug", slug).eq("status", "published").is("deleted_at", null).maybeSingle();
  if (!exam) return {};
  return examMetadata(exam);
}
const TYPE_LABELS: Record<string, string> = {
  entrance: "Entrance Exam", competitive: "Competitive Exam", certification: "Certification",
  recruitment: "Recruitment Exam", eligibility: "Eligibility Test", board: "Board Exam",
};

export default async function ExamPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: exam } = await supabase
    .from("exams")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .is("deleted_at", null)
    .maybeSingle();

  if (!exam) notFound();

  const { data: sessions } = await supabase
    .from("exam_sessions")
    .select("*")
    .eq("exam_id", exam.id)
    .eq("status", "published")
    .order("year", { ascending: false })
    .limit(20);

  return (
    <PublicShell>
      <div className="container-app py-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-subtle">
              <GraduationCap className="h-6 w-6 text-brand" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold text-ink">{exam.name}</h1>
              {exam.full_name && <p className="mt-1 text-muted">{exam.full_name}</p>}
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="rounded-full bg-brand-subtle px-2.5 py-0.5 text-xs font-medium text-brand">
                  {TYPE_LABELS[exam.exam_type] ?? exam.exam_type}
                </span>
                <span className="rounded-full bg-bg-muted px-2.5 py-0.5 text-xs text-muted capitalize">{exam.level}</span>
                {exam.conducting_body && (
                  <span className="rounded-full bg-bg-muted px-2.5 py-0.5 text-xs text-muted">{exam.conducting_body}</span>
                )}
              </div>
            </div>
          </div>
          <FollowButton targetType="exam" targetId={exam.id} label="Follow Exam" />
        </div>

        {/* Description */}
        {exam.description && (
          <Card className="mt-6">
            <CardContent className="p-5">
              <pre className="whitespace-pre-wrap font-sans text-sm text-ink-soft">{exam.description}</pre>
            </CardContent>
          </Card>
        )}

        {/* Exam Pattern */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {exam.exam_mode && (
            <Card><CardContent className="p-4">
              <p className="text-xs uppercase text-muted">Mode</p>
              <p className="mt-1 text-sm font-medium text-ink capitalize">{exam.exam_mode}</p>
            </CardContent></Card>
          )}
          {exam.duration_minutes && (
            <Card><CardContent className="p-4">
              <div className="flex items-center gap-1"><Clock className="h-3 w-3 text-muted" /><p className="text-xs uppercase text-muted">Duration</p></div>
              <p className="mt-1 text-sm font-medium text-ink">{exam.duration_minutes} min</p>
            </CardContent></Card>
          )}
          {exam.total_questions && (
            <Card><CardContent className="p-4">
              <p className="text-xs uppercase text-muted">Questions</p>
              <p className="mt-1 text-sm font-medium text-ink">{exam.total_questions}</p>
            </CardContent></Card>
          )}
          {exam.total_marks && (
            <Card><CardContent className="p-4">
              <p className="text-xs uppercase text-muted">Total Marks</p>
              <p className="mt-1 text-sm font-medium text-ink">{exam.total_marks}</p>
            </CardContent></Card>
          )}
        </div>

        {/* Marking scheme + eligibility */}
        {(exam.marking_scheme || exam.eligibility) && (
          <Card className="mt-4">
            <CardContent className="p-5 space-y-3">
              {exam.marking_scheme && (
                <div>
                  <h2 className="text-sm font-semibold text-ink">Marking Scheme</h2>
                  <p className="mt-1 text-sm text-muted">{exam.marking_scheme}</p>
                </div>
              )}
              {exam.eligibility && Object.keys(exam.eligibility).length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-ink">Eligibility</h2>
                  <pre className="mt-1 whitespace-pre-wrap font-sans text-xs text-muted">{JSON.stringify(exam.eligibility, null, 2)}</pre>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Official website */}
        {exam.official_website && (
          <div className="mt-4">
            <a href={exam.official_website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover">
              <Globe className="h-4 w-4" /> Official Website ↗
            </a>
          </div>
        )}

        {/* Sessions */}
        <h2 className="mt-8 font-display text-xl font-semibold text-ink">
          Exam Sessions ({sessions?.length ?? 0})
        </h2>
        <p className="mt-1 text-sm text-muted">Year-wise instances with live updates, guides, and dates.</p>

        <div className="mt-4 space-y-3">
          {sessions && sessions.length > 0 ? (
            sessions.map((s) => (
              <Link key={s.id} href={`/exams/${exam.slug}/${s.slug}`}>
                <Card className="transition-colors hover:border-brand">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-display text-base font-semibold text-ink">{s.session_label}</h3>
                        <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted">
                          {s.notification_date && <span>Notification: {new Date(s.notification_date).toLocaleDateString("en-IN")}</span>}
                          {s.application_end && <span>Apply End: {new Date(s.application_end).toLocaleDateString("en-IN")}</span>}
                          {s.exam_date && <span>Exam: {new Date(s.exam_date).toLocaleDateString("en-IN")}</span>}
                          {s.result_date && <span>Result: {new Date(s.result_date).toLocaleDateString("en-IN")}</span>}
                        </div>
                      </div>
                      <div className="text-right">
                        {s.apply_link && (
                          <span className="rounded bg-brand-subtle px-2 py-0.5 text-xs text-brand">Apply Open</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          ) : (
            <Card><CardContent className="p-6 text-center text-muted">No sessions published yet.</CardContent></Card>
          )}
        </div>
      </div>
    </PublicShell>
  );
}
