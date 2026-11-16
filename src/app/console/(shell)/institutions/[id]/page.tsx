import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  publishSubmission,
  rejectSubmission,
  saveInstitution,
} from "@/lib/public/institution-actions";

const CATEGORIES = [
  { value: "exams", label: "Exams" },
  { value: "courses", label: "Courses" },
  { value: "universities", label: "Universities" },
  { value: "iits", label: "IITs" },
  { value: "nits", label: "NITs" },
  { value: "iims", label: "IIMs" },
  { value: "aiims", label: "AIIMS" },
  { value: "iiits", label: "IIITs" },
  { value: "nifts", label: "NIFTs" },
  { value: "schools", label: "Schools" },
  { value: "colleges", label: "Colleges" },
  { value: "coaching", label: "Coaching" },
  { value: "training-skill-centres", label: "Training & Skill Centres" },
  { value: "iti", label: "ITI" },
  { value: "fake-universities", label: "Fake Universities" },
  { value: "law-universities", label: "Law Universities" },
];

export default async function InstitutionReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Try fetching as a submission first
  const { data: submission } = await supabase
    .from("institution_submissions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  // If not a submission, try as an institution
  const { data: institution } = !submission
    ? await supabase.from("institutions").select("*").eq("id", id).maybeSingle()
    : { data: null };

  if (!submission && !institution) notFound();

  return (
    <div className="p-6">
      <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
        <Link href="/console/institutions">← Back to Institutions</Link>
      </Button>

      {submission ? (
        <>
          <h1 className="font-display text-2xl font-bold text-ink">Review Submission</h1>
          <p className="mt-1 text-sm text-muted">
            Submitted by {submission.submitter_name} ({submission.submitter_email})
            {" on "}
            {new Date(submission.created_at).toLocaleString("en-IN")}
          </p>

          {/* Submitter info */}
          <Card className="mt-4">
            <CardHeader><CardTitle className="text-sm">Submission Details</CardTitle></CardHeader>
            <CardContent className="grid gap-3 text-sm md:grid-cols-2">
              <div><span className="text-muted">Category:</span> <strong>{submission.category}</strong></div>
              <div><span className="text-muted">Name:</span> <strong>{submission.name}</strong></div>
              <div><span className="text-muted">City:</span> {submission.city ?? "—"}</div>
              <div><span className="text-muted">State:</span> {submission.state ?? "—"}</div>
              <div><span className="text-muted">Website:</span> {submission.website ? <a href={submission.website} target="_blank" rel="noreferrer" className="text-brand hover:underline">{submission.website} ↗</a> : "—"}</div>
              <div><span className="text-muted">Phone:</span> {submission.submitter_phone ?? "—"}</div>
              {submission.description && (
                <div className="md:col-span-2">
                  <span className="text-muted">Description:</span>
                  <p className="mt-1 text-ink">{submission.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {submission.status === "pending" ? (
            <>
              {/* Publish form */}
              <Card className="mt-4">
                <CardHeader><CardTitle className="text-sm">Publish as Institution</CardTitle></CardHeader>
                <CardContent>
                  <form action={publishSubmission.bind(null, id)} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="name">Name (editable)</Label>
                        <Input id="name" name="name" defaultValue={submission.name} required />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="name_hi">Name (Hindi)</Label>
                        <Input id="name_hi" name="name_hi" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="city">City</Label>
                        <Input id="city" name="city" defaultValue={submission.city ?? ""} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="state">State</Label>
                        <Input id="state" name="state" defaultValue={submission.state ?? ""} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="website">Website</Label>
                        <Input id="website" name="website" defaultValue={submission.website ?? ""} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="contact_email">Contact Email</Label>
                        <Input id="contact_email" name="contact_email" type="email" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="description">Description (editable)</Label>
                      <textarea id="description" name="description" rows={4} defaultValue={submission.description ?? ""} className="flex w-full rounded-md border border-line bg-white px-3 py-2 text-sm" />
                    </div>
                    <Button type="submit">Publish Institution</Button>
                  </form>
                </CardContent>
              </Card>

              {/* Reject form */}
              <Card className="mt-4 border-danger/30">
                <CardHeader><CardTitle className="text-sm text-danger">Reject Submission</CardTitle></CardHeader>
                <CardContent>
                  <form action={rejectSubmission.bind(null, id)} className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="reason">Reason</Label>
                      <Input id="reason" name="reason" placeholder="e.g. Duplicate, insufficient info, not verifiable..." />
                    </div>
                    <Button type="submit" variant="danger" size="sm">Reject</Button>
                  </form>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="mt-4">
              <CardContent className="p-4 text-sm">
                <span className={`rounded-full px-2 py-0.5 text-xs ${submission.status === "approved" ? "bg-success-subtle text-success" : "bg-danger-subtle text-danger"}`}>
                  {submission.status}
                </span>
                {submission.review_notes && (
                  <p className="mt-2 text-muted">Review notes: {submission.review_notes}</p>
                )}
                {submission.resulting_institution_id && (
                  <Link href={`/console/institutions/${submission.resulting_institution_id}`} className="mt-2 inline-block text-brand hover:underline">
                    View published institution →
                  </Link>
                )}
              </CardContent>
            </Card>
          )}
        </>
      ) : institution ? (
        <>
          <h1 className="font-display text-2xl font-bold text-ink">Edit Institution</h1>
          <p className="mt-1 text-sm text-muted">{institution.name}</p>

          <form action={saveInstitution} className="mt-6 space-y-6">
            <input type="hidden" name="id" value={institution.id} />

            <Card>
              <CardHeader><CardTitle className="text-base">Basic</CardTitle></CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="category">Category</Label>
                  <select name="category" defaultValue={institution.category} className="flex h-10 w-full rounded-md border border-line bg-white px-3 text-sm">
                    {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="status">Status</Label>
                  <select name="status" defaultValue={institution.status} className="flex h-10 w-full rounded-md border border-line bg-white px-3 text-sm">
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="unpublished">Unpublished</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" defaultValue={institution.name} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="name_hi">Name (Hindi)</Label>
                  <Input id="name_hi" name="name_hi" defaultValue={institution.name_hi ?? ""} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="slug">Slug</Label>
                  <Input id="slug" name="slug" defaultValue={institution.slug} required pattern="[a-z0-9-]+" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="website">Website</Label>
                  <Input id="website" name="website" type="url" defaultValue={institution.website ?? ""} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" name="city" defaultValue={institution.city ?? ""} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="state">State</Label>
                  <Input id="state" name="state" defaultValue={institution.state ?? ""} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contact_email">Contact Email</Label>
                  <Input id="contact_email" name="contact_email" type="email" defaultValue={institution.contact_email ?? ""} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contact_phone">Contact Phone</Label>
                  <Input id="contact_phone" name="contact_phone" defaultValue={institution.contact_phone ?? ""} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Description</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="description">Description (English)</Label>
                  <textarea id="description" name="description" rows={4} defaultValue={institution.description ?? ""} className="flex w-full rounded-md border border-line bg-white px-3 py-2 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="description_hi">Description (Hindi)</Label>
                  <textarea id="description_hi" name="description_hi" rows={4} defaultValue={institution.description_hi ?? ""} className="flex w-full rounded-md border border-line bg-white px-3 py-2 text-sm" />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" size="lg">Save Changes</Button>
            </div>
          </form>
        </>
      ) : null}
    </div>
  );
}
