import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/server";
import { PublicShell } from "@/components/public/public-shell";
import { Card, CardContent } from "@/components/ui/card";
import { EventTimeline } from "@/components/public/event-timeline";
import { EventGuide } from "@/components/public/event-guide";
import { FollowButton } from "@/components/public/follow-button";
import { examSessionMetadata } from "@/lib/seo/metadata";

function fmtDate(s?: string | null): string {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}


export async function generateMetadata({ params }: { params: Promise<{ slug: string; session: string }> }): Promise<Metadata> {
  const { slug, session: sessionSlug } = await params;
  const supabase = await createClient();
  const { data: exam } = await supabase.from("exams").select("id, name, slug").eq("slug", slug).eq("status", "published").is("deleted_at", null).maybeSingle();
  if (!exam) return {};
  const { data: session } = await supabase.from("exam_sessions").select("session_label, slug").eq("exam_id", exam.id).eq("slug", sessionSlug).eq("status", "published").maybeSingle();
  if (!session) return {};
  return examSessionMetadata(exam, session);
}
export default async function ExamSessionPage({
  params,
}: {
  params: Promise<{ slug: string; session: string }>;
}) {
  const { slug, session: sessionSlug } = await params;
  const user = await getCurrentUser();
  const supabase = await createClient();

  // Fetch exam
  const { data: exam } = await supabase
    .from("exams")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .is("deleted_at", null)
    .maybeSingle();

  if (!exam) notFound();

  // Fetch session
  const { data: session } = await supabase
    .from("exam_sessions")
    .select("*")
    .eq("exam_id", exam.id)
    .eq("slug", sessionSlug)
    .eq("status", "published")
    .maybeSingle();

  if (!session) notFound();

  // Fetch updates + guides (using exam_session_id)
  const [{ data: updates }, { data: guides }] = await Promise.all([
    supabase
      .from("event_updates")
      .select("id, kind, title, body_md, doc_url, published_at")
      .eq("exam_session_id", session.id)
      .order("published_at", { ascending: false })
      .limit(20),
    supabase
      .from("event_guides")
      .select("id, section, title, body_md, sort_order")
      .eq("exam_session_id", session.id)
      .order("sort_order"),
  ]);

  // Check follow status
  let initialFollowing = false;
  if (user) {
    const { data: followRow } = await supabase
      .from("user_follows")
      .select("id")
      .eq("user_id", user.id)
      .eq("target_type", "exam-session")
      .eq("target_id", session.id)
      .maybeSingle();
    initialFollowing = Boolean(followRow);
  }

  return (
    <PublicShell>
      <div className="container-app py-6">
        {/* Breadcrumb + Follow */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <Link href={`/exams/${exam.slug}`} className="text-sm text-muted hover:text-ink">
              ← {exam.name}
            </Link>
            <h1 className="mt-1 font-display text-2xl font-bold text-ink">{session.session_label}</h1>
          </div>
          <FollowButton targetType="exam-session" targetId={session.id} initialFollowing={initialFollowing} label="Follow Session" />
        </div>

        {/* Session info card */}
        <Card className="mb-4">
          <CardContent className="p-5">
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div><p className="text-xs text-muted-soft">Notification</p><p className="font-medium text-ink">{fmtDate(session.notification_date)}</p></div>
              <div><p className="text-xs text-muted-soft">Apply Start</p><p className="font-medium text-ink">{fmtDate(session.application_start)}</p></div>
              <div><p className="text-xs text-muted-soft">Apply End</p><p className="font-medium text-ink">{fmtDate(session.application_end)}</p></div>
              <div><p className="text-xs text-muted-soft">Exam Date</p><p className="font-medium text-ink">{fmtDate(session.exam_date)}</p></div>
              <div><p className="text-xs text-muted-soft">Result Date</p><p className="font-medium text-ink">{fmtDate(session.result_date)}</p></div>
              {session.admit_card_url && (
                <div><p className="text-xs text-muted-soft">Admit Card</p><a href={session.admit_card_url} target="_blank" rel="noreferrer" className="font-medium text-brand hover:underline">Download ↗</a></div>
              )}
              {session.result_url && (
                <div><p className="text-xs text-muted-soft">Result</p><a href={session.result_url} target="_blank" rel="noreferrer" className="font-medium text-brand hover:underline">Check ↗</a></div>
              )}
            </div>
            {session.apply_link && (
              <a href={session.apply_link} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover">
                Apply Now →
              </a>
            )}
          </CardContent>
        </Card>

        {/* Desktop: 2-col (guide | timeline) */}
        <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
          <div className="space-y-4">
            <EventGuide guides={guides ?? []} />
          </div>
          <div className="hidden lg:block">
            <div className="sticky top-20">
              <EventTimeline eventId="" examSessionId={session.id} initialUpdates={updates ?? []} />
            </div>
          </div>
        </div>

        {/* Mobile: timeline in-flow */}
        <div className="mt-6 lg:hidden">
          <EventTimeline eventId="" examSessionId={session.id} initialUpdates={updates ?? []} />
        </div>
      </div>
    </PublicShell>
  );
}
