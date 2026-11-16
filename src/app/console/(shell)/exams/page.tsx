import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, GraduationCap } from "lucide-react";
import { saveExam, deleteExam } from "@/lib/exams/actions";

const TYPE_LABELS: Record<string, string> = {
  entrance: "Entrance", competitive: "Competitive", certification: "Certification",
  recruitment: "Recruitment", eligibility: "Eligibility", board: "Board Exam",
};

export default async function ConsoleExamsPage() {
  const supabase = await createClient();
  const { data: exams } = await supabase
    .from("exams")
    .select("*")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Exams</h1>
          <p className="mt-1 text-sm text-muted">Catalog of exams (JEE Main, MP Board 10th, etc.) with sessions.</p>
        </div>
      </div>

      {/* Add form */}
      <Card className="mt-4 p-4">
        <form action={saveExam} className="space-y-3">
          <p className="text-xs font-medium uppercase text-muted">Add New Exam</p>
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label className="text-xs text-muted">Name *</label>
              <input name="name" required placeholder="e.g. MP Board 10th" className="flex h-9 w-full rounded-md border border-line bg-white px-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted">Slug *</label>
              <input name="slug" required pattern="[a-z0-9-]+" placeholder="mp-board-10th" className="flex h-9 w-full rounded-md border border-line bg-white px-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted">Full Name</label>
              <input name="full_name" placeholder="Madhya Pradesh Board 10th Exam" className="flex h-9 w-full rounded-md border border-line bg-white px-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted">Type</label>
              <select name="exam_type" className="flex h-9 w-full rounded-md border border-line bg-white px-2 text-sm">
                {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted">Level</label>
              <select name="level" className="flex h-9 w-full rounded-md border border-line bg-white px-2 text-sm">
                <option value="national">National</option>
                <option value="state">State</option>
                <option value="institutional">Institutional</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted">Conducting Body</label>
              <input name="conducting_body" placeholder="e.g. MPBSE" className="flex h-9 w-full rounded-md border border-line bg-white px-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted">Description</label>
            <textarea name="description" rows={2} className="flex w-full rounded-md border border-line bg-white px-2 py-1.5 text-sm" />
          </div>
          <div className="flex items-center gap-3">
            <select name="status" defaultValue="draft" className="flex h-9 rounded-md border border-line bg-white px-2 text-sm">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
            <Button type="submit" size="sm"><Plus className="mr-1 h-4 w-4" /> Create Exam</Button>
          </div>
        </form>
      </Card>

      {/* List */}
      <Card className="mt-4 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-line bg-bg-subtle">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-muted">Name</th>
              <th className="px-4 py-2 text-left font-medium text-muted">Type</th>
              <th className="px-4 py-2 text-left font-medium text-muted">Level</th>
              <th className="px-4 py-2 text-left font-medium text-muted">Status</th>
              <th className="px-4 py-2 text-right font-medium text-muted">Action</th>
            </tr>
          </thead>
          <tbody>
            {(!exams || exams.length === 0) && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted">
                <GraduationCap className="mx-auto mb-2 h-8 w-8 text-muted-soft" />
                No exams yet. Create one above.
              </td></tr>
            )}
            {exams?.map((e) => (
              <tr key={e.id} className="border-b border-line-soft hover:bg-bg-subtle">
                <td className="px-4 py-2.5">
                  <Link href={`/console/exams/${e.id}`} className="font-medium text-ink hover:text-brand">{e.name}</Link>
                  <span className="ml-2 text-xs text-muted-soft">{e.slug}</span>
                </td>
                <td className="px-4 py-2.5 text-muted">{TYPE_LABELS[e.exam_type] ?? e.exam_type}</td>
                <td className="px-4 py-2.5 text-muted capitalize">{e.level}</td>
                <td className="px-4 py-2.5">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${e.status === "published" ? "bg-success-subtle text-success" : "bg-bg-muted text-muted"}`}>{e.status}</span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <Button asChild variant="ghost" size="sm"><Link href={`/console/exams/${e.id}`}>Manage</Link></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
