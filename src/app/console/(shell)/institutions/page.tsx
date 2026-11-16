import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Inbox } from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-warning-subtle text-warning",
  approved: "bg-success-subtle text-success",
  rejected: "bg-danger-subtle text-danger",
  merged: "bg-brand-subtle text-brand",
};

const CATEGORY_LABELS: Record<string, string> = {
  exams: "Exams", courses: "Courses", universities: "Universities",
  iits: "IITs", nits: "NITs", iims: "IIMs", aiims: "AIIMS", iiits: "IIITs",
  nifts: "NIFTs", schools: "Schools", colleges: "Colleges", coaching: "Coaching",
  "training-skill-centres": "Training & Skill", iti: "ITI",
  "fake-universities": "Fake Universities", "law-universities": "Law Universities",
};

export default async function ConsoleInstitutionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("institution_submissions")
    .select("id, category, name, city, state, submitter_name, submitter_email, status, created_at, reviewed_at")
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);

  const { data: submissions } = await query;

  // Also fetch published institutions
  const { data: institutions } = await supabase
    .from("institutions")
    .select("id, category, name, slug, city, state, status, updated_at")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(50);

  return (
    <div className="p-6">
      <h1 className="font-display text-2xl font-bold text-ink">Institutions</h1>
      <p className="mt-1 text-sm text-muted">Review submissions and manage published institutions.</p>

      {/* Tabs */}
      <div className="mt-4 flex gap-2">
        <Link href="/console/institutions">
          <span className={`rounded-md px-3 py-1 text-xs font-medium ${!status ? "bg-brand text-white" : "bg-white border border-line text-muted"}`}>
            Submissions
          </span>
        </Link>
        {["pending", "approved", "rejected"].map((s) => (
          <Link key={s} href={`/console/institutions?status=${s}`}>
            <span className={`rounded-md px-3 py-1 text-xs font-medium ${status === s ? "bg-brand text-white" : "bg-white border border-line text-muted"}`}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </span>
          </Link>
        ))}
      </div>

      {/* Submissions table */}
      <h2 className="mt-6 font-display text-lg font-semibold text-ink">
        Submissions {submissions ? `(${submissions.length})` : ""}
      </h2>
      <Card className="mt-3 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-line bg-bg-subtle">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-muted">Name</th>
              <th className="px-4 py-2 text-left font-medium text-muted">Category</th>
              <th className="px-4 py-2 text-left font-medium text-muted">Submitter</th>
              <th className="px-4 py-2 text-left font-medium text-muted">Status</th>
              <th className="px-4 py-2 text-left font-medium text-muted">Submitted</th>
              <th className="px-4 py-2 text-right font-medium text-muted">Action</th>
            </tr>
          </thead>
          <tbody>
            {(!submissions || submissions.length === 0) && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted">
                  <Inbox className="mx-auto mb-2 h-8 w-8 text-muted-soft" />
                  No submissions {status ? `with status "${status}"` : ""}.
                </td>
              </tr>
            )}
            {submissions?.map((sub) => (
              <tr key={sub.id} className="border-b border-line-soft hover:bg-bg-subtle">
                <td className="px-4 py-2.5 font-medium text-ink">{sub.name}</td>
                <td className="px-4 py-2.5 text-muted">{CATEGORY_LABELS[sub.category] ?? sub.category}</td>
                <td className="px-4 py-2.5 text-xs text-muted">
                  {sub.submitter_name}<br />
                  <span className="text-muted-soft">{sub.submitter_email}</span>
                </td>
                <td className="px-4 py-2.5">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLES[sub.status] ?? ""}`}>
                    {sub.status}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-xs text-muted">
                  {new Date(sub.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/console/institutions/${sub.id}`}>Review</Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Published institutions */}
      <h2 className="mt-8 font-display text-lg font-semibold text-ink">
        Published Institutions {institutions ? `(${institutions.length})` : ""}
      </h2>
      <Card className="mt-3 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-line bg-bg-subtle">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-muted">Name</th>
              <th className="px-4 py-2 text-left font-medium text-muted">Category</th>
              <th className="px-4 py-2 text-left font-medium text-muted">Location</th>
              <th className="px-4 py-2 text-left font-medium text-muted">Status</th>
              <th className="px-4 py-2 text-left font-medium text-muted">Updated</th>
              <th className="px-4 py-2 text-right font-medium text-muted">Action</th>
            </tr>
          </thead>
          <tbody>
            {(!institutions || institutions.length === 0) && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted">
                  No published institutions yet. Approve a submission to get started.
                </td>
              </tr>
            )}
            {institutions?.map((inst) => (
              <tr key={inst.id} className="border-b border-line-soft hover:bg-bg-subtle">
                <td className="px-4 py-2.5 font-medium text-ink">{inst.name}</td>
                <td className="px-4 py-2.5 text-muted">{CATEGORY_LABELS[inst.category] ?? inst.category}</td>
                <td className="px-4 py-2.5 text-xs text-muted">
                  {[inst.city, inst.state].filter(Boolean).join(", ") || "—"}
                </td>
                <td className="px-4 py-2.5">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${inst.status === "published" ? "bg-success-subtle text-success" : "bg-bg-muted text-muted"}`}>
                    {inst.status}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-xs text-muted">
                  {new Date(inst.updated_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/console/institutions/${inst.id}`}>Edit</Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
