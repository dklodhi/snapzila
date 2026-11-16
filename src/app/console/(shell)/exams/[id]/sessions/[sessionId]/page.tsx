import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import {
  addExamSessionUpdate,
  deleteExamSessionUpdate,
  addExamSessionGuide,
  deleteExamSessionGuide,
} from "@/lib/exams/actions";

const UPDATE_KINDS = ["info", "warning", "result", "admit-card", "corrigendum", "extension", "deadline"];
const GUIDE_SECTIONS = ["eligibility", "apply_steps", "fees", "dates", "documents", "faq", "other"];

export default async function ExamSessionEditPage({
  params,
}: {
  params: Promise<{ id: string; sessionId: string }>;
}) {
  const { id: examId, sessionId } = await params;
  const supabase = await createClient();

  const [{ data: exam }, { data: session }] = await Promise.all([
    supabase.from("exams").select("id, name, slug").eq("id", examId).maybeSingle(),
    supabase.from("exam_sessions").select("*").eq("id", sessionId).maybeSingle(),
  ]);

  if (!exam || !session) notFound();

  const [{ data: updates }, { data: guides }] = await Promise.all([
    supabase.from("event_updates").select("*").eq("exam_session_id", sessionId).order("published_at", { ascending: false }),
    supabase.from("event_guides").select("*").eq("exam_session_id", sessionId).order("sort_order"),
  ]);

  return (
    <div className="p-6">
      <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
        <Link href={`/console/exams/${examId}`}>← {exam.name}</Link>
      </Button>

      <h1 className="font-display text-2xl font-bold text-ink">{session.session_label}</h1>
      <p className="mt-1 text-sm text-muted">
        {exam.name} · {session.slug} ·
        <Link href={`/exams/${exam.slug}/${session.slug}`} className="ml-1 text-brand hover:underline" target="_blank">View public page ↗</Link>
      </p>

      {/* Live Updates */}
      <Card className="mt-6">
        <CardHeader><CardTitle className="text-base">Live Updates ({updates?.length ?? 0})</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {updates?.map((u) => (
            <div key={u.id} className="flex items-start justify-between rounded-md border border-line-soft bg-bg-subtle p-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-white px-1.5 py-0.5 text-[10px] uppercase text-muted">{u.kind}</span>
                  <span className="font-medium text-ink">{u.title}</span>
                </div>
                {u.body_md && <p className="mt-1 text-xs text-muted line-clamp-2">{u.body_md}</p>}
              </div>
              <form action={deleteExamSessionUpdate.bind(null, sessionId, u.id)}>
                <button type="submit" className="rounded p-1.5 text-muted hover:bg-danger-subtle hover:text-danger"><Trash2 className="h-4 w-4" /></button>
              </form>
            </div>
          ))}
          {(!updates || updates.length === 0) && <p className="text-sm text-muted">No live updates yet.</p>}

          <form action={addExamSessionUpdate.bind(null, sessionId)} className="rounded-md border border-line p-3 space-y-2">
            <p className="text-xs font-medium uppercase text-muted">Add Live Update</p>
            <div className="grid gap-2 md:grid-cols-2">
              <select name="kind" className="flex h-9 rounded-md border border-line bg-white px-2 text-sm">
                {UPDATE_KINDS.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
              <input name="title" required placeholder="Title" className="flex h-9 w-full rounded-md border border-line bg-white px-2 text-sm" />
            </div>
            <textarea name="body_md" rows={2} placeholder="Body (Markdown)" className="flex w-full rounded-md border border-line bg-white px-2 py-1.5 text-sm" />
            <input name="doc_url" placeholder="Doc URL (optional)" className="flex h-9 w-full rounded-md border border-line bg-white px-2 text-sm" />
            <Button type="submit" size="sm">Add Update</Button>
          </form>
        </CardContent>
      </Card>

      {/* Guide Sections */}
      <Card className="mt-4">
        <CardHeader><CardTitle className="text-base">Guide Sections ({guides?.length ?? 0})</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {guides?.map((g) => (
            <div key={g.id} className="flex items-start justify-between rounded-md border border-line-soft bg-bg-subtle p-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-white px-1.5 py-0.5 text-[10px] uppercase text-muted">{g.section}</span>
                  <span className="font-medium text-ink">{g.title}</span>
                </div>
                {g.body_md && <p className="mt-1 text-xs text-muted line-clamp-2">{g.body_md}</p>}
              </div>
              <form action={deleteExamSessionGuide.bind(null, sessionId, g.id)}>
                <button type="submit" className="rounded p-1.5 text-muted hover:bg-danger-subtle hover:text-danger"><Trash2 className="h-4 w-4" /></button>
              </form>
            </div>
          ))}
          {(!guides || guides.length === 0) && <p className="text-sm text-muted">No guide sections yet.</p>}

          <form action={addExamSessionGuide.bind(null, sessionId)} className="rounded-md border border-line p-3 space-y-2">
            <p className="text-xs font-medium uppercase text-muted">Add Guide Section</p>
            <div className="grid gap-2 md:grid-cols-2">
              <select name="section" className="flex h-9 rounded-md border border-line bg-white px-2 text-sm">
                {GUIDE_SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <input name="title" required placeholder="Title" className="flex h-9 w-full rounded-md border border-line bg-white px-2 text-sm" />
            </div>
            <textarea name="body_md" rows={3} placeholder="Body (Markdown)" className="flex w-full rounded-md border border-line bg-white px-2 py-1.5 text-sm" />
            <Button type="submit" size="sm">Add Section</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
