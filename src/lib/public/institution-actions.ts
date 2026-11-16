"use server";

/**
 * Server actions for institutions.
 * Public submit + console review/publish/reject + edit.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser, requireTeamMember } from "@/lib/auth/server";
import { writeAuditLog } from "@/lib/console/audit";
import { logError } from "@/lib/utils/log";

// ============================================================
// Public submit (any auth user)
// ============================================================

export async function submitInstitution(formData: FormData): Promise<void> {
  const user = await requireUser();
  const supabase = await createClient();

  const data = {
    category: formData.get("category") as string,
    name: (formData.get("name") as string)?.trim(),
    city: (formData.get("city") as string)?.trim() || null,
    state: (formData.get("state") as string)?.trim() || null,
    website: (formData.get("website") as string)?.trim() || null,
    description: (formData.get("description") as string)?.trim() || null,
    submitter_name: (formData.get("submitter_name") as string)?.trim(),
    submitter_email: (formData.get("submitter_email") as string)?.trim(),
    submitter_phone: (formData.get("submitter_phone") as string)?.trim() || null,
    submitter_user_id: user.id,
  };

  if (!data.name || !data.submitter_name || !data.submitter_email) {
    throw new Error("Name, submitter name, and submitter email are required.");
  }

  const { error } = await supabase.from("institution_submissions").insert(data);
  if (error) {
    logError("[submitInstitution] failed", { error: error.message });
    throw new Error(`Failed to submit: ${error.message}`);
  }

  revalidatePath("/institutions/submit");
  redirect("/institutions/submit?submitted=1");
}

// ============================================================
// Console: publish a submission → creates an institution
// ============================================================

export async function publishSubmission(submissionId: string, formData: FormData): Promise<void> {
  const teamMember = await requireTeamMember();
  const supabase = await createClient();

  // Fetch the submission
  const { data: submission, error: fetchErr } = await supabase
    .from("institution_submissions")
    .select("*")
    .eq("id", submissionId)
    .maybeSingle();

  if (fetchErr || !submission) {
    throw new Error("Submission not found.");
  }

  // Generate slug from name
  const slugBase = (formData.get("name") as string || submission.name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  // Check slug uniqueness within category
  const { data: existing } = await supabase
    .from("institutions")
    .select("id")
    .eq("category", submission.category)
    .eq("slug", slugBase)
    .is("deleted_at", null)
    .maybeSingle();

  const slug = existing ? `${slugBase}-${Date.now().toString(36)}` : slugBase;

  // Create the institution from submission + form overrides
  const institutionData = {
    category: submission.category,
    name: (formData.get("name") as string) || submission.name,
    name_hi: (formData.get("name_hi") as string) || null,
    slug,
    city: (formData.get("city") as string) || submission.city,
    state: (formData.get("state") as string) || submission.state,
    website: (formData.get("website") as string) || submission.website,
    description: (formData.get("description") as string) || submission.description,
    contact_email: (formData.get("contact_email") as string) || null,
    contact_phone: (formData.get("contact_phone") as string) || null,
    status: "published" as const,
    published_at: new Date().toISOString(),
    created_by: teamMember.id,
    submission_id: submissionId,
  };

  const { data: newInstitution, error: insertErr } = await supabase
    .from("institutions")
    .insert(institutionData)
    .select("id")
    .single();

  if (insertErr || !newInstitution) {
    logError("[publishSubmission] insert failed", { error: insertErr?.message });
    throw new Error(`Failed to publish: ${insertErr?.message}`);
  }

  // Update submission status
  const { error: updateErr } = await supabase
    .from("institution_submissions")
    .update({
      status: "approved",
      reviewed_by: teamMember.id,
      reviewed_at: new Date().toISOString(),
      resulting_institution_id: newInstitution.id,
    })
    .eq("id", submissionId);

  if (updateErr) {
    logError("[publishSubmission] submission update failed", { error: updateErr.message });
  }

  await writeAuditLog({
    teamMember,
    action: "institution.publish_submission",
    entityType: "institution",
    entityId: newInstitution.id,
    afterData: { ...institutionData, submission_id: submissionId } as unknown as Record<string, unknown>,
  });

  revalidatePath("/console/institutions");
  redirect("/console/institutions");
}

// ============================================================
// Console: reject a submission
// ============================================================

export async function rejectSubmission(submissionId: string, formData: FormData): Promise<void> {
  const teamMember = await requireTeamMember();
  const supabase = await createClient();

  const reason = (formData.get("reason") as string)?.trim() || "Rejected by reviewer.";

  const { error } = await supabase
    .from("institution_submissions")
    .update({
      status: "rejected",
      review_notes: reason,
      reviewed_by: teamMember.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", submissionId);

  if (error) throw new Error(`Failed: ${error.message}`);

  await writeAuditLog({
    teamMember,
    action: "institution.reject_submission",
    entityType: "institution_submission",
    entityId: submissionId,
    afterData: { reason } as unknown as Record<string, unknown>,
  });

  revalidatePath("/console/institutions");
  redirect("/console/institutions");
}

// ============================================================
// Console: edit an existing institution
// ============================================================

export async function saveInstitution(formData: FormData): Promise<void> {
  const teamMember = await requireTeamMember();
  const supabase = await createClient();

  const id = formData.get("id") as string;
  const data = {
    category: formData.get("category") as string,
    name: (formData.get("name") as string)?.trim(),
    name_hi: (formData.get("name_hi") as string)?.trim() || null,
    slug: (formData.get("slug") as string)?.trim(),
    city: (formData.get("city") as string)?.trim() || null,
    state: (formData.get("state") as string)?.trim() || null,
    website: (formData.get("website") as string)?.trim() || null,
    description: (formData.get("description") as string)?.trim() || null,
    description_hi: (formData.get("description_hi") as string)?.trim() || null,
    contact_email: (formData.get("contact_email") as string)?.trim() || null,
    contact_phone: (formData.get("contact_phone") as string)?.trim() || null,
    status: formData.get("status") as string,
    published_at: formData.get("status") === "published" ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  };

  if (!data.name || !data.slug) {
    throw new Error("Name and slug are required.");
  }

  const { error } = await supabase.from("institutions").update(data).eq("id", id);
  if (error) {
    logError("[saveInstitution] failed", { id, error: error.message });
    throw new Error(`Failed: ${error.message}`);
  }

  await writeAuditLog({
    teamMember,
    action: "institution.update",
    entityType: "institution",
    entityId: id,
    afterData: data as unknown as Record<string, unknown>,
  });

  revalidatePath("/console/institutions");
  revalidatePath(`/console/institutions/${id}`);
  redirect("/console/institutions");
}

// ============================================================
// Console: soft-delete an institution
// ============================================================

export async function deleteInstitution(id: string): Promise<void> {
  const teamMember = await requireTeamMember();
  const supabase = await createClient();

  const { error } = await supabase
    .from("institutions")
    .update({ deleted_at: new Date().toISOString(), status: "unpublished" })
    .eq("id", id);

  if (error) throw new Error(`Failed: ${error.message}`);

  await writeAuditLog({
    teamMember,
    action: "institution.soft_delete",
    entityType: "institution",
    entityId: id,
  });

  revalidatePath("/console/institutions");
  redirect("/console/institutions");
}
