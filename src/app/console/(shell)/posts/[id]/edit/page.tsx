import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EventCoreForm } from "../../EventCoreForm";
import { LiveUpdateAddForm } from "@/components/console/live-update-add-form";
import {
  addLiveUpdate,
  deleteLiveUpdate,
  addGuideSection,
  deleteGuideSection,
  addDate,
  deleteDate,
} from "@/lib/console/actions";
import { UPDATE_TYPES, CORRIGENDUM_FIELDS, GUIDE_SECTIONS, getGuidesForType, getUpdateTypesForType } from "@/lib/constants/editor";
import { Trash2 } from "lucide-react";

// Use canonical constants from editor.ts (old project parity — 8 update types + 20 guide sections)
const UPDATE_KINDS = UPDATE_TYPES;

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: event }, { data: updates }, { data: guides }, { data: dates }] = await Promise.all([
    supabase.from("events").select("*").eq("id", id).maybeSingle(),
    supabase.from("event_updates").select("*").eq("event_id", id).order("published_at", { ascending: false }),
    supabase.from("event_guides").select("*").eq("event_id", id).order("sort_order"),
    supabase.from("event_dates").select("*").eq("event_id", id).order("sort_order"),
  ]);

  if (!event) notFound();

  // Bind the child actions with the event ID
  const addUpdateAction = addLiveUpdate.bind(null, id);
  const deleteUpdateAction = deleteLiveUpdate.bind(null, id);
  const addGuideAction = addGuideSection.bind(null, id);
  const deleteGuideAction = deleteGuideSection.bind(null, id);
  const addDateAction = addDate.bind(null, id);
  const deleteDateAction = deleteDate.bind(null, id);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
          <Link href="/console/posts">← Back to Posts</Link>
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-ink">Edit Post</h1>
            <p className="mt-1 text-sm text-muted">{event.title}</p>
          </div>
          <div className="flex gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${
              event.status === "published" ? "bg-success-subtle text-success" :
              event.status === "draft" ? "bg-bg-muted text-muted" :
              "bg-bg-muted text-muted"
            }`}>
              {event.status}
            </span>
          </div>
        </div>
      </div>

      {/* Core form */}
      <EventCoreForm event={event} />

      {/* Divider */}
      <div className="my-8 border-t border-line" />

      {/* Live Updates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Live Updates ({updates?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing updates */}
          <div className="space-y-2">
            {updates?.map((u) => (
              <div key={u.id} className="flex items-start justify-between rounded-md border border-line-soft bg-bg-subtle p-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-white px-1.5 py-0.5 text-[10px] uppercase text-muted">{u.kind}</span>
                    <span className="font-medium text-ink">{u.title}</span>
                  </div>
                  {u.body_md && <p className="mt-1 text-xs text-muted line-clamp-2">{u.body_md}</p>}
                  <p className="mt-1 text-[10px] text-muted-soft">
                    {new Date(u.published_at).toLocaleString("en-IN")}
                  </p>
                </div>
                <form action={deleteUpdateAction.bind(null, u.id)}>
                  <button type="submit" className="rounded p-1.5 text-muted hover:bg-danger-subtle hover:text-danger">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </form>
              </div>
            ))}
            {(!updates || updates.length === 0) && (
              <p className="text-sm text-muted">No live updates yet.</p>
            )}
          </div>

          {/* Add form — client component with corrigendum_fields conditional UI */}
          <LiveUpdateAddForm action={addUpdateAction} />
        </CardContent>
      </Card>

      {/* Guide Sections */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">Guide Sections ({guides?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {guides?.map((g) => (
              <div key={g.id} className="flex items-start justify-between rounded-md border border-line-soft bg-bg-subtle p-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-white px-1.5 py-0.5 text-[10px] uppercase text-muted">{g.section}</span>
                    <span className="font-medium text-ink">{g.title}</span>
                  </div>
                  {g.body_md && <p className="mt-1 text-xs text-muted line-clamp-2">{g.body_md}</p>}
                </div>
                <form action={deleteGuideAction.bind(null, g.id)}>
                  <button type="submit" className="rounded p-1.5 text-muted hover:bg-danger-subtle hover:text-danger">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </form>
              </div>
            ))}
            {(!guides || guides.length === 0) && <p className="text-sm text-muted">No guide sections yet.</p>}
          </div>
          <form action={addGuideAction} className="rounded-md border border-line p-3 space-y-3">
            <p className="text-xs font-medium uppercase text-muted">Add Guide Section</p>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs text-muted">Section</label>
                <select name="section" className="flex h-9 w-full rounded-md border border-line bg-white px-2 text-sm">
                  {getGuidesForType(event.type).map((s) => <option key={s.value} value={s.value}>{s.icon} {s.label}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted">Title</label>
                <input name="title" required className="flex h-9 w-full rounded-md border border-line bg-white px-2 text-sm" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted">Body (Markdown)</label>
              <textarea name="body_md" rows={4} className="flex w-full rounded-md border border-line bg-white px-2 py-1.5 font-mono text-sm" />
            </div>
            <Button type="submit" size="sm">Add Section</Button>
          </form>
        </CardContent>
      </Card>

      {/* Important Dates */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">Important Dates ({dates?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {dates?.map((d) => (
              <div key={d.id} className="flex items-center justify-between rounded-md border border-line-soft bg-bg-subtle p-3">
                <div>
                  <span className="font-medium text-ink">{d.label}</span>
                  <span className="ml-3 text-sm text-muted">{new Date(d.date).toLocaleDateString("en-IN")}</span>
                  {d.url && <a href={d.url} target="_blank" rel="noreferrer" className="ml-3 text-xs text-brand hover:underline">Link ↗</a>}
                </div>
                <form action={deleteDateAction.bind(null, d.id)}>
                  <button type="submit" className="rounded p-1.5 text-muted hover:bg-danger-subtle hover:text-danger">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </form>
              </div>
            ))}
            {(!dates || dates.length === 0) && <p className="text-sm text-muted">No dates yet.</p>}
          </div>
          <form action={addDateAction} className="rounded-md border border-line p-3 space-y-3">
            <p className="text-xs font-medium uppercase text-muted">Add Date</p>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1">
                <label className="text-xs text-muted">Label</label>
                <input name="label" required placeholder="e.g. Application Start" className="flex h-9 w-full rounded-md border border-line bg-white px-2 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted">Date</label>
                <input name="date" required type="date" className="flex h-9 w-full rounded-md border border-line bg-white px-2 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted">URL (optional)</label>
                <input name="url" type="url" className="flex h-9 w-full rounded-md border border-line bg-white px-2 text-sm" />
              </div>
            </div>
            <Button type="submit" size="sm">Add Date</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
