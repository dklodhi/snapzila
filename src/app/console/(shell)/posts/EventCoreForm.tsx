/**
 * Event core form (shared by new + edit pages).
 * Server component — uses server action via form action prop.
 */
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { saveEvent } from "@/lib/console/actions";
import { APPLY_MODES as FORM_APPLY_MODES } from "@/lib/constants/editor";

const TYPES = [
  { value: "govt-jobs", label: "Govt Jobs" },
  { value: "admissions", label: "Admissions" },
  { value: "scholarships", label: "Scholarships" },
  { value: "govt-schemes", label: "Govt Schemes" },
  { value: "news", label: "News" },
  { value: "articles", label: "Articles" },
];

const STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "unpublished", label: "Unpublished" },
];

interface EventData {
  id?: string;
  type?: string;
  slug?: string;
  title?: string;
  title_hi?: string;
  summary?: string;
  summary_hi?: string;
  conducting_body?: string;
  conducting_body_slug?: string;
  apply_mode?: string;
  apply_link?: string;
  apply_start_date?: string;
  apply_end_date?: string;
  exam_date?: string;
  result_date?: string;
  status?: string;
  body_md?: string;
  body_md_hi?: string;
  meta_title?: string;
  meta_description?: string;
  tags?: string[];
}

function toDateInput(s?: string | null): string {
  if (!s) return "";
  // Convert ISO/date to yyyy-mm-dd
  return s.slice(0, 10);
}

export async function EventCoreForm({ event }: { event?: EventData }) {
  const isEdit = Boolean(event?.id);
  const tagsStr = (event?.tags ?? []).join(", ");

  // Fetch orgs for the org selector
  const supabase = await createClient();
  const { data: orgs } = await supabase
    .from("orgs")
    .select("id, slug, name")
    .eq("status", "published")
    .is("deleted_at", null)
    .order("name");

  return (
    <form action={saveEvent} className="space-y-6">
      {isEdit && <input type="hidden" name="id" value={event?.id} />}

      {/* Section: Basic */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Basic</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="type">Type</Label>
            <select
              id="type"
              name="type"
              defaultValue={event?.type ?? "govt-jobs"}
              className="flex h-10 w-full rounded-md border border-line bg-white px-3 text-sm"
              required
              disabled={isEdit}
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            {isEdit && (
              <p className="text-xs text-muted-soft">Type is locked after creation.</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              name="status"
              defaultValue={event?.status ?? "draft"}
              className="flex h-10 w-full rounded-md border border-line bg-white px-3 text-sm"
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="title">Title (English)</Label>
            <Input id="title" name="title" defaultValue={event?.title ?? ""} required maxLength={300} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="title_hi">Title (Hindi)</Label>
            <Input id="title_hi" name="title_hi" defaultValue={event?.title_hi ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" name="slug" defaultValue={event?.slug ?? ""} required pattern="[a-z0-9-]+" placeholder="e.g. ssc-cgl-2026-notification" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input id="tags" name="tags" defaultValue={tagsStr} placeholder="ssc, govt-jobs, graduate" />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="summary">Summary (English)</Label>
            <Input id="summary" name="summary" defaultValue={event?.summary ?? ""} maxLength={500} placeholder="One-line summary" />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="summary_hi">Summary (Hindi)</Label>
            <Input id="summary_hi" name="summary_hi" defaultValue={event?.summary_hi ?? ""} maxLength={500} />
          </div>
        </CardContent>
      </Card>

      {/* Section: Organization & Apply */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Organization &amp; Apply</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="conducting_body">Conducting Body (Org)</Label>
            <select
              id="conducting_body"
              name="conducting_body"
              defaultValue={event?.conducting_body ?? ""}
              className="flex h-10 w-full rounded-md border border-line bg-white px-3 text-sm"
            >
              <option value="">— Select Org —</option>
              {orgs?.map((org) => (
                <option key={org.id} value={org.name}>{org.name}</option>
              ))}
            </select>
            {event?.conducting_body && !orgs?.some(o => o.name === event.conducting_body) && (
              <p className="text-xs text-muted-soft">Current: {event.conducting_body} (not in orgs table)</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="conducting_body_slug">Conducting Body Slug</Label>
            <Input id="conducting_body_slug" name="conducting_body_slug" defaultValue={event?.conducting_body_slug ?? ""} placeholder="auto-filled from org" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="apply_mode">Apply Mode</Label>
            <select id="apply_mode" name="apply_mode" defaultValue={event?.apply_mode ?? "na"} className="flex h-10 w-full rounded-md border border-line bg-white px-3 text-sm">
              {FORM_APPLY_MODES.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="apply_link">Apply Link</Label>
            <Input id="apply_link" name="apply_link" type="url" defaultValue={event?.apply_link ?? ""} placeholder="https://..." />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="apply_start_date">Apply Start</Label>
            <Input id="apply_start_date" name="apply_start_date" type="date" defaultValue={toDateInput(event?.apply_start_date)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="apply_end_date">Apply End</Label>
            <Input id="apply_end_date" name="apply_end_date" type="date" defaultValue={toDateInput(event?.apply_end_date)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="exam_date">Exam Date</Label>
            <Input id="exam_date" name="exam_date" type="date" defaultValue={toDateInput(event?.exam_date)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="result_date">Result Date</Label>
            <Input id="result_date" name="result_date" type="date" defaultValue={toDateInput(event?.result_date)} />
          </div>
        </CardContent>
      </Card>

      {/* Section: Body */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Full Description (Body)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="body_md">Body (English, Markdown)</Label>
            <textarea
              id="body_md"
              name="body_md"
              rows={10}
              defaultValue={event?.body_md ?? ""}
              className="flex w-full rounded-md border border-line bg-white px-3 py-2 font-mono text-sm"
              placeholder="Full description in Markdown..."
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="body_md_hi">Body (Hindi, Markdown)</Label>
            <textarea
              id="body_md_hi"
              name="body_md_hi"
              rows={10}
              defaultValue={event?.body_md_hi ?? ""}
              className="flex w-full rounded-md border border-line bg-white px-3 py-2 font-mono text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Section: SEO */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">SEO</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="meta_title">Meta Title</Label>
            <Input id="meta_title" name="meta_title" defaultValue={event?.meta_title ?? ""} maxLength={200} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="meta_description">Meta Description</Label>
            <Input id="meta_description" name="meta_description" defaultValue={event?.meta_description ?? ""} maxLength={500} />
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end gap-2">
        <Button type="submit" size="lg">
          {isEdit ? "Save Changes" : "Create Post"}
        </Button>
      </div>
    </form>
  );
}
