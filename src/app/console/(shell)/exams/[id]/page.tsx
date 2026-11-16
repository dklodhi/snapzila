import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import {
  saveExam,
  deleteExam,
  saveExamSession,
  deleteExamSession,
  addExamSessionUpdate,
  deleteExamSessionUpdate,
  addExamSessionGuide,
  deleteExamSessionGuide,
} from "@/lib/exams/actions";

const UPDATE_KINDS = ["info", "warning", "result", "admit-card", "corrigendum", "extension", "deadline"];
const GUIDE_SECTIONS = ["eligibility", "apply_steps", "fees", "dates", "documents", "faq", "other"];

export default async function ExamEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: exam } = await supabase.from("exams").select("*").eq("id", id).maybeSingle();
  if (!exam) notFound();

  const { data: sessions } = await supabase
    .from("exam_sessions")
    .select("*")
    .eq("exam_id", id)
    .order("year", { ascending: false });

  return (
    <div className="p-6">
      <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
        <Link href="/console/exams">← Back to Exams</Link>
      </Button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">{exam.name}</h1>
          <p className="mt-1 text-sm text-muted">{exam.slug} · {exam.exam_type} · {exam.level}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs ${exam.status === "published" ? "bg-success-subtle text-success" : "bg-bg-muted text-muted"}`}>{exam.status}</span>
      </div>

      {/* Edit form */}
      <Card className="mt-4">
        <CardHeader><CardTitle className="text-sm">Edit Exam Details</CardTitle></CardHeader>
        <CardContent>
          <form action={saveExam} className="space-y-4">
            <input type="hidden" name="id" value={exam.id} />
            <div className="grid gap-4 md:grid-cols-3">
              <div><Label className="text-xs">Name</Label><Input name="name" defaultValue={exam.name} required /></div>
              <div><Label className="text-xs">Slug</Label><Input name="slug" defaultValue={exam.slug} required pattern="[a-z0-9-]+" /></div>
              <div><Label className="text-xs">Full Name</Label><Input name="full_name" defaultValue={exam.full_name ?? ""} /></div>
              <div><Label className="text-xs">Conducting Body</Label><Input name="conducting_body" defaultValue={exam.conducting_body ?? ""} /></div>
              <div>
                <Label className="text-xs">Type</Label>
                <select name="exam_type" defaultValue={exam.exam_type} className="flex h-10 w-full rounded-md border border-line bg-white px-3 text-sm">
                  {["entrance","competitive","certification","recruitment","eligibility","board"].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs">Level</Label>
                <select name="level" defaultValue={exam.level} className="flex h-10 w-full rounded-md border border-line bg-white px-3 text-sm">
                  {["national","state","institutional"].map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div><Label className="text-xs">Exam Mode</Label><Input name="exam_mode" defaultValue={exam.exam_mode ?? "online"} /></div>
              <div><Label className="text-xs">Duration (min)</Label><Input name="duration_minutes" type="number" defaultValue={String(exam.duration_minutes ?? "")} /></div>
              <div><Label className="text-xs">Total Marks</Label><Input name="total_marks" type="number" defaultValue={String(exam.total_marks ?? "")} /></div>
              <div><Label className="text-xs">Marking Scheme</Label><Input name="marking_scheme" defaultValue={exam.marking_scheme ?? ""} /></div>
              <div><Label className="text-xs">Official Website</Label><Input name="official_website" defaultValue={exam.official_website ?? ""} /></div>
              <div>
                <Label className="text-xs">Status</Label>
                <select name="status" defaultValue={exam.status} className="flex h-10 w-full rounded-md border border-line bg-white px-3 text-sm">
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>
            <div><Label className="text-xs">Description</Label><textarea name="description" rows={3} defaultValue={exam.description ?? ""} className="flex w-full rounded-md border border-line bg-white px-3 py-2 text-sm" /></div>
            <div><Label className="text-xs">Eligibility (JSON)</Label><Input name="eligibility" defaultValue={JSON.stringify(exam.eligibility ?? {})} className="font-mono text-xs" /></div>
            <div className="flex gap-2">
              <Button type="submit" size="sm">Save Changes</Button>
              <form action={deleteExam.bind(null, exam.id)}><Button type="submit" variant="danger" size="sm">Delete</Button></form>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Sessions */}
      <h2 className="mt-8 font-display text-lg font-semibold text-ink">Sessions ({sessions?.length ?? 0})</h2>

      {/* Add session form */}
      <Card className="mt-3 p-4">
        <form action={saveExamSession.bind(null, exam.id)} className="space-y-3">
          <p className="text-xs font-medium uppercase text-muted">Add Session (e.g. 2026, 2026 March)</p>
          <div className="grid gap-3 md:grid-cols-4">
            <div><Label className="text-xs">Year *</Label><Input name="year" type="number" defaultValue="2026" required /></div>
            <div><Label className="text-xs">Session Slug</Label><Input name="session_slug" placeholder="2026 or march" defaultValue="2026" /></div>
            <div><Label className="text-xs">Session Label</Label><Input name="session_label" placeholder="2026 Session" /></div>
            <div>
              <Label className="text-xs">Status</Label>
              <select name="status" defaultValue="draft" className="flex h-10 w-full rounded-md border border-line bg-white px-3 text-sm">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            <div><Label className="text-xs">Notification Date</Label><Input name="notification_date" type="date" /></div>
            <div><Label className="text-xs">Apply Start</Label><Input name="application_start" type="date" /></div>
            <div><Label className="text-xs">Apply End</Label><Input name="application_end" type="date" /></div>
            <div><Label className="text-xs">Exam Date</Label><Input name="exam_date" type="date" /></div>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div><Label className="text-xs">Admit Card URL</Label><Input name="admit_card_url" /></div>
            <div><Label className="text-xs">Result Date</Label><Input name="result_date" type="date" /></div>
            <div><Label className="text-xs">Apply Link</Label><Input name="apply_link" /></div>
          </div>
          <Button type="submit" size="sm">Add Session</Button>
        </form>
      </Card>

      {/* Sessions list */}
      <div className="mt-4 space-y-3">
        {sessions?.map((s) => (
          <Card key={s.id} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <Link href={`/console/exams/${exam.id}/sessions/${s.id}`} className="font-medium text-ink hover:text-brand">
                  {s.session_label} ({s.slug})
                </Link>
                <div className="mt-1 flex gap-4 text-xs text-muted">
                  {s.exam_date && <span>Exam: {new Date(s.exam_date).toLocaleDateString("en-IN")}</span>}
                  {s.application_end && <span>Apply End: {new Date(s.application_end).toLocaleDateString("en-IN")}</span>}
                  {s.result_date && <span>Result: {new Date(s.result_date).toLocaleDateString("en-IN")}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs ${s.status === "published" ? "bg-success-subtle text-success" : "bg-bg-muted text-muted"}`}>{s.status}</span>
                <Button asChild variant="ghost" size="sm"><Link href={`/console/exams/${exam.id}/sessions/${s.id}`}>Manage</Link></Button>
                <form action={deleteExamSession.bind(null, exam.id, s.id)}>
                  <button type="submit" className="rounded p-1.5 text-muted hover:bg-danger-subtle hover:text-danger"><Trash2 className="h-4 w-4" /></button>
                </form>
              </div>
            </div>
          </Card>
        ))}
        {(!sessions || sessions.length === 0) && (
          <Card><CardContent className="p-6 text-center text-sm text-muted">No sessions yet. Add one above.</CardContent></Card>
        )}
      </div>
    </div>
  );
}
