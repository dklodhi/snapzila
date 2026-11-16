import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import { saveEmploymentNewsIssue, deleteEmploymentNewsIssue } from "@/lib/tools/actions";

export default async function ConsoleEmploymentNewsPage() {
  const supabase = await createClient();
  const { data: issues } = await supabase
    .from("employment_news_issues")
    .select("*")
    .order("week_start", { ascending: false });

  // Next issue number
  const nextIssue = (issues?.[0]?.issue_number ?? 0) + 1;

  // Default week = next Monday to Sunday
  const now = new Date();
  const day = now.getDay();
  const daysUntilMonday = day === 0 ? 1 : 8 - day;
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + daysUntilMonday);
  const nextSunday = new Date(nextMonday);
  nextSunday.setDate(nextMonday.getDate() + 6);
  const fmtDate = (d: Date) => d.toISOString().split("T")[0];

  return (
    <div className="p-6">
      <h1 className="font-display text-2xl font-bold text-ink">Employment News</h1>
      <p className="mt-1 text-sm text-muted">Weekly digest of government job notifications.</p>

      <Card className="mt-4 p-4">
        <form action={saveEmploymentNewsIssue} className="space-y-3">
          <p className="text-xs font-medium uppercase text-muted">Create New Issue</p>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor="issue_number" className="text-xs">Issue Number</Label>
              <Input id="issue_number" name="issue_number" type="number" defaultValue={String(nextIssue)} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="week_start" className="text-xs">Week Start (Monday)</Label>
              <Input id="week_start" name="week_start" type="date" defaultValue={fmtDate(nextMonday)} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="week_end" className="text-xs">Week End (Sunday)</Label>
              <Input id="week_end" name="week_end" type="date" defaultValue={fmtDate(nextSunday)} required />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="title" className="text-xs">Title</Label>
            <Input id="title" name="title" required placeholder={`Employment News — Week of ${nextMonday.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="intro_md" className="text-xs">Intro (Markdown, optional)</Label>
            <textarea id="intro_md" name="intro_md" rows={3} className="flex w-full rounded-md border border-line bg-white px-2 py-1.5 text-sm" placeholder="This week's top govt job notifications..." />
          </div>
          <div className="space-y-1">
            <Label htmlFor="featured_event_ids" className="text-xs">Featured Event IDs (comma-separated UUIDs, optional)</Label>
            <Input id="featured_event_ids" name="featured_event_ids" placeholder="uuid1, uuid2, ..." className="font-mono text-xs" />
            <p className="text-xs text-muted-soft">Leave empty to auto-pull govt-jobs published this week.</p>
          </div>
          <div className="space-y-1">
            <Label htmlFor="status" className="text-xs">Status</Label>
            <select name="status" defaultValue="published" className="flex h-10 w-full rounded-md border border-line bg-white px-3 text-sm">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
          <Button type="submit" size="sm">Create Issue</Button>
        </form>
      </Card>

      {/* Issues list */}
      <Card className="mt-4 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-line bg-bg-subtle">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-muted">#</th>
              <th className="px-4 py-2 text-left font-medium text-muted">Title</th>
              <th className="px-4 py-2 text-left font-medium text-muted">Week</th>
              <th className="px-4 py-2 text-left font-medium text-muted">Status</th>
              <th className="px-4 py-2 text-right font-medium text-muted">Action</th>
            </tr>
          </thead>
          <tbody>
            {(!issues || issues.length === 0) && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted">No issues yet.</td></tr>
            )}
            {issues?.map((issue) => (
              <tr key={issue.id} className="border-b border-line-soft hover:bg-bg-subtle">
                <td className="px-4 py-2.5 text-muted">#{issue.issue_number}</td>
                <td className="px-4 py-2.5 font-medium text-ink">{issue.title}</td>
                <td className="px-4 py-2.5 text-xs text-muted">
                  {new Date(issue.week_start).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  {" – "}
                  {new Date(issue.week_end).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </td>
                <td className="px-4 py-2.5">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${issue.status === "published" ? "bg-success-subtle text-success" : "bg-bg-muted text-muted"}`}>
                    {issue.status}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <form action={deleteEmploymentNewsIssue.bind(null, issue.id)} className="inline">
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
