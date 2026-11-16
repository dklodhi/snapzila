import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import {
  saveCourseMaster,
  deleteCourseMaster,
  saveCourseOffering,
  deleteCourseOffering,
} from "@/lib/exams/actions";

export default async function CourseEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: course } = await supabase.from("course_masters").select("*").eq("id", id).maybeSingle();
  if (!course) notFound();

  const [{ data: offerings }, { data: institutions }] = await Promise.all([
    supabase.from("course_offerings").select("*, institutions:institution_id(name, slug)").eq("course_master_id", id).order("created_at", { ascending: false }),
    supabase.from("institutions").select("id, name").eq("status", "published").is("deleted_at", null).order("name"),
  ]);

  return (
    <div className="p-6">
      <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
        <Link href="/console/courses">← Back to Courses</Link>
      </Button>

      <h1 className="font-display text-2xl font-bold text-ink">{course.name}</h1>
      <p className="mt-1 text-sm text-muted">{course.slug} · {course.level} · {course.stream ?? "—"}</p>

      {/* Edit form */}
      <Card className="mt-4">
        <CardHeader><CardTitle className="text-sm">Edit Course</CardTitle></CardHeader>
        <CardContent>
          <form action={saveCourseMaster} className="space-y-4">
            <input type="hidden" name="id" value={course.id} />
            <div className="grid gap-4 md:grid-cols-3">
              <div><Label className="text-xs">Name</Label><Input name="name" defaultValue={course.name} required /></div>
              <div><Label className="text-xs">Slug</Label><Input name="slug" defaultValue={course.slug} required pattern="[a-z0-9-]+" /></div>
              <div><Label className="text-xs">Full Name</Label><Input name="full_name" defaultValue={course.full_name ?? ""} /></div>
              <div>
                <Label className="text-xs">Level</Label>
                <select name="level" defaultValue={course.level} className="flex h-10 w-full rounded-md border border-line bg-white px-3 text-sm">
                  {["undergraduate","postgraduate","diploma","certificate","doctoral","school"].map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div><Label className="text-xs">Stream</Label><Input name="stream" defaultValue={course.stream ?? ""} /></div>
              <div><Label className="text-xs">Duration</Label><Input name="duration" defaultValue={course.duration ?? ""} /></div>
              <div><Label className="text-xs">Eligibility</Label><Input name="eligibility" defaultValue={course.eligibility ?? ""} /></div>
              <div><Label className="text-xs">Specializations (comma-sep)</Label><Input name="specializations" defaultValue={(course.specializations ?? []).join(", ")} /></div>
              <div>
                <Label className="text-xs">Status</Label>
                <select name="status" defaultValue={course.status} className="flex h-10 w-full rounded-md border border-line bg-white px-3 text-sm">
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>
            <div><Label className="text-xs">Description</Label><textarea name="description" rows={3} defaultValue={course.description ?? ""} className="flex w-full rounded-md border border-line bg-white px-3 py-2 text-sm" /></div>
            <div><Label className="text-xs">Career Prospects</Label><textarea name="career_prospects" rows={2} defaultValue={course.career_prospects ?? ""} className="flex w-full rounded-md border border-line bg-white px-3 py-2 text-sm" /></div>
            <div className="flex gap-2">
              <Button type="submit" size="sm">Save Changes</Button>
              <form action={deleteCourseMaster.bind(null, course.id)}><Button type="submit" variant="danger" size="sm">Delete</Button></form>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Offerings */}
      <h2 className="mt-8 font-display text-lg font-semibold text-ink">Institution Offerings ({offerings?.length ?? 0})</h2>

      <Card className="mt-3 p-4">
        <form action={saveCourseOffering.bind(null, course.id)} className="space-y-3">
          <p className="text-xs font-medium uppercase text-muted">Add Offering (this course at a specific institution)</p>
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <Label className="text-xs">Institution *</Label>
              <select name="institution_id" required className="flex h-9 w-full rounded-md border border-line bg-white px-2 text-sm">
                <option value="">— Select —</option>
                {institutions?.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </div>
            <div><Label className="text-xs">Fees Total (INR)</Label><Input name="fees_total" type="number" /></div>
            <div><Label className="text-xs">Seats</Label><Input name="seats" type="number" /></div>
            <div><Label className="text-xs">Batch Year</Label><Input name="batch_year" type="number" defaultValue="2026" /></div>
            <div><Label className="text-xs">Apply Link</Label><Input name="apply_link" /></div>
            <div>
              <Label className="text-xs">Status</Label>
              <select name="status" defaultValue="draft" className="flex h-9 w-full rounded-md border border-line bg-white px-2 text-sm">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>
          <Button type="submit" size="sm">Add Offering</Button>
        </form>
      </Card>

      {/* Offerings list */}
      <div className="mt-4 space-y-2">
        {offerings?.map((o) => {
          const inst = o.institutions as { name: string; slug: string } | null;
          return (
            <Card key={o.id} className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-ink">{inst?.name ?? "Unknown institution"}</span>
                  <div className="mt-0.5 flex gap-3 text-xs text-muted">
                    {o.fees_total && <span>Fees: ₹{o.fees_total.toLocaleString("en-IN")}</span>}
                    {o.seats && <span>Seats: {o.seats}</span>}
                    {o.batch_year && <span>Batch: {o.batch_year}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${o.status === "published" ? "bg-success-subtle text-success" : "bg-bg-muted text-muted"}`}>{o.status}</span>
                  <form action={deleteCourseOffering.bind(null, course.id, o.id)}>
                    <button type="submit" className="rounded p-1.5 text-muted hover:bg-danger-subtle hover:text-danger"><Trash2 className="h-4 w-4" /></button>
                  </form>
                </div>
              </div>
            </Card>
          );
        })}
        {(!offerings || offerings.length === 0) && (
          <Card><CardContent className="p-6 text-center text-sm text-muted">No offerings yet. Add one above.</CardContent></Card>
        )}
      </div>
    </div>
  );
}
