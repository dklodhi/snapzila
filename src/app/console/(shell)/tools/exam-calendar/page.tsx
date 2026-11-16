import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { saveExamOverride, deleteExamOverride } from "@/lib/tools/actions";

export default async function ConsoleExamCalendarPage() {
  const supabase = await createClient();
  const { data: overrides } = await supabase
    .from("exam_calendar_overrides")
    .select("*")
    .order("date", { ascending: false })
    .limit(100);

  return (
    <div className="p-6">
      <h1 className="font-display text-2xl font-bold text-ink">Exam Calendar Overrides</h1>
      <p className="mt-1 text-sm text-muted">
        Manual additions for exams not in the standard event model (e.g. board exam timetables).
        The calendar auto-pulls from published events with exam_date.
      </p>

      <Card className="mt-4 p-4">
        <form action={saveExamOverride} className="space-y-3">
          <p className="text-xs font-medium uppercase text-muted">Add Override</p>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="exam_name" className="text-xs">Exam Name</Label>
              <Input id="exam_name" name="exam_name" required placeholder="e.g. CBSE Class 12 Board Exam" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="date" className="text-xs">Date</Label>
              <Input id="date" name="date" type="date" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="category" className="text-xs">Category</Label>
              <Input id="category" name="category" defaultValue="General" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="url" className="text-xs">URL (optional)</Label>
              <Input id="url" name="url" type="url" placeholder="https://..." />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="notes" className="text-xs">Notes (optional)</Label>
            <Input id="notes" name="notes" placeholder="e.g. Day 1 - Physics" />
          </div>
          <Button type="submit" size="sm"><Plus className="mr-1 h-4 w-4" /> Add Override</Button>
        </form>
      </Card>

      <Card className="mt-4 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-line bg-bg-subtle">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-muted">Exam</th>
              <th className="px-4 py-2 text-left font-medium text-muted">Date</th>
              <th className="px-4 py-2 text-left font-medium text-muted">Category</th>
              <th className="px-4 py-2 text-right font-medium text-muted">Action</th>
            </tr>
          </thead>
          <tbody>
            {(!overrides || overrides.length === 0) && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-muted">No overrides yet.</td></tr>
            )}
            {overrides?.map((o) => (
              <tr key={o.id} className="border-b border-line-soft hover:bg-bg-subtle">
                <td className="px-4 py-2.5 font-medium text-ink">{o.exam_name}</td>
                <td className="px-4 py-2.5 text-muted">
                  {new Date(o.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </td>
                <td className="px-4 py-2.5 text-muted">{o.category}</td>
                <td className="px-4 py-2.5 text-right">
                  <form action={deleteExamOverride.bind(null, o.id)} className="inline">
                    <button type="submit" className="rounded p-1.5 text-muted hover:bg-danger-subtle hover:text-danger">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
