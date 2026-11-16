import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen } from "lucide-react";
import { saveCourseMaster, deleteCourseMaster } from "@/lib/exams/actions";

const LEVELS = ["undergraduate", "postgraduate", "diploma", "certificate", "doctoral", "school"];

export default async function ConsoleCoursesPage() {
  const supabase = await createClient();
  const { data: courses } = await supabase
    .from("course_masters")
    .select("*")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  return (
    <div className="p-6">
      <h1 className="font-display text-2xl font-bold text-ink">Courses</h1>
      <p className="mt-1 text-sm text-muted">Course catalog (B.Tech, BCA, MBBS, etc.) with institution-specific offerings.</p>

      {/* Add form */}
      <Card className="mt-4 p-4">
        <form action={saveCourseMaster} className="space-y-3">
          <p className="text-xs font-medium uppercase text-muted">Add New Course</p>
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label className="text-xs text-muted">Name *</label>
              <input name="name" required placeholder="e.g. B.Tech Computer Science" className="flex h-9 w-full rounded-md border border-line bg-white px-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted">Slug *</label>
              <input name="slug" required pattern="[a-z0-9-]+" placeholder="btech-cse" className="flex h-9 w-full rounded-md border border-line bg-white px-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted">Level</label>
              <select name="level" className="flex h-9 w-full rounded-md border border-line bg-white px-2 text-sm">
                {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted">Stream</label>
              <input name="stream" placeholder="Engineering / Medical / Management" className="flex h-9 w-full rounded-md border border-line bg-white px-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted">Duration</label>
              <input name="duration" placeholder="3 years" className="flex h-9 w-full rounded-md border border-line bg-white px-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted">Status</label>
              <select name="status" defaultValue="draft" className="flex h-9 w-full rounded-md border border-line bg-white px-2 text-sm">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted">Description</label>
            <textarea name="description" rows={2} className="flex w-full rounded-md border border-line bg-white px-2 py-1.5 text-sm" />
          </div>
          <Button type="submit" size="sm"><Plus className="mr-1 h-4 w-4" /> Create Course</Button>
        </form>
      </Card>

      {/* List */}
      <Card className="mt-4 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-line bg-bg-subtle">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-muted">Name</th>
              <th className="px-4 py-2 text-left font-medium text-muted">Level</th>
              <th className="px-4 py-2 text-left font-medium text-muted">Stream</th>
              <th className="px-4 py-2 text-left font-medium text-muted">Status</th>
              <th className="px-4 py-2 text-right font-medium text-muted">Action</th>
            </tr>
          </thead>
          <tbody>
            {(!courses || courses.length === 0) && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted">
                <BookOpen className="mx-auto mb-2 h-8 w-8 text-muted-soft" />
                No courses yet.
              </td></tr>
            )}
            {courses?.map((c) => (
              <tr key={c.id} className="border-b border-line-soft hover:bg-bg-subtle">
                <td className="px-4 py-2.5">
                  <Link href={`/console/courses/${c.id}`} className="font-medium text-ink hover:text-brand">{c.name}</Link>
                  <span className="ml-2 text-xs text-muted-soft">{c.slug}</span>
                </td>
                <td className="px-4 py-2.5 text-muted">{c.level}</td>
                <td className="px-4 py-2.5 text-muted">{c.stream ?? "—"}</td>
                <td className="px-4 py-2.5">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${c.status === "published" ? "bg-success-subtle text-success" : "bg-bg-muted text-muted"}`}>{c.status}</span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <Button asChild variant="ghost" size="sm"><Link href={`/console/courses/${c.id}`}>Manage</Link></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
