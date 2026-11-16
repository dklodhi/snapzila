import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { saveHelplineEntry, deleteHelplineEntry } from "@/lib/tools/actions";

export default async function ConsoleHelplinePage() {
  const supabase = await createClient();
  const { data: entries } = await supabase
    .from("helpline_entries")
    .select("*")
    .order("sort_order")
    .order("title");

  return (
    <div className="p-6">
      <h1 className="font-display text-2xl font-bold text-ink">Helpline</h1>
      <p className="mt-1 text-sm text-muted">Manage helpline directory entries.</p>

      <Card className="mt-4 p-4">
        <form action={saveHelplineEntry} className="space-y-3">
          <p className="text-xs font-medium uppercase text-muted">Add New Entry</p>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor="title" className="text-xs">Title</Label>
              <Input id="title" name="title" required placeholder="e.g. SSC Helpline" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="category" className="text-xs">Category</Label>
              <Input id="category" name="category" placeholder="Exam Body / Scheme" defaultValue="General" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="status" className="text-xs">Status</Label>
              <select name="status" defaultValue="published" className="flex h-10 w-full rounded-md border border-line bg-white px-3 text-sm">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-1">
              <Label htmlFor="phone" className="text-xs">Phone</Label>
              <Input id="phone" name="phone" placeholder="1800-XXX-XXXX" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email" className="text-xs">Email</Label>
              <Input id="email" name="email" type="email" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="website" className="text-xs">Website</Label>
              <Input id="website" name="website" type="url" placeholder="https://..." />
            </div>
            <div className="space-y-1">
              <Label htmlFor="sort_order" className="text-xs">Sort Order</Label>
              <Input id="sort_order" name="sort_order" type="number" defaultValue="0" />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="body_md" className="text-xs">Description</Label>
            <textarea id="body_md" name="body_md" rows={2} className="flex w-full rounded-md border border-line bg-white px-2 py-1.5 text-sm" />
          </div>
          <Button type="submit" size="sm"><Plus className="mr-1 h-4 w-4" /> Add Entry</Button>
        </form>
      </Card>

      <Card className="mt-4 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-line bg-bg-subtle">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-muted">Title</th>
              <th className="px-4 py-2 text-left font-medium text-muted">Category</th>
              <th className="px-4 py-2 text-left font-medium text-muted">Contact</th>
              <th className="px-4 py-2 text-left font-medium text-muted">Status</th>
              <th className="px-4 py-2 text-right font-medium text-muted">Action</th>
            </tr>
          </thead>
          <tbody>
            {(!entries || entries.length === 0) && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted">No entries yet.</td></tr>
            )}
            {entries?.map((e) => (
              <tr key={e.id} className="border-b border-line-soft hover:bg-bg-subtle">
                <td className="px-4 py-2.5 font-medium text-ink">{e.title}</td>
                <td className="px-4 py-2.5 text-muted">{e.category}</td>
                <td className="px-4 py-2.5 text-xs text-muted">
                  {e.phone && <div>{e.phone}</div>}
                  {e.email && <div>{e.email}</div>}
                </td>
                <td className="px-4 py-2.5">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${e.status === "published" ? "bg-success-subtle text-success" : "bg-bg-muted text-muted"}`}>
                    {e.status}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <form action={deleteHelplineEntry.bind(null, e.id)} className="inline">
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
