"use server";

/**
 * Server actions for Exams + Courses.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireTeamMember } from "@/lib/auth/server";
import { writeAuditLog } from "@/lib/console/audit";
import { logError } from "@/lib/utils/log";

// ============================================================
// Exams
// ============================================================

export async function saveExam(formData: FormData): Promise<void> {
  const teamMember = await requireTeamMember();
  const supabase = await createClient();
  const id = formData.get("id") as string | null;
  const status = formData.get("status") as string;

  const data = {
    slug: (formData.get("slug") as string)?.trim(),
    name: (formData.get("name") as string)?.trim(),
    name_hi: (formData.get("name_hi") as string)?.trim() || null,
    full_name: (formData.get("full_name") as string)?.trim() || null,
    conducting_body: (formData.get("conducting_body") as string)?.trim() || null,
    exam_type: (formData.get("exam_type") as string) || "competitive",
    level: (formData.get("level") as string) || "national",
    frequency: (formData.get("frequency") as string) || "yearly",
    description: (formData.get("description") as string)?.trim() || null,
    description_hi: (formData.get("description_hi") as string)?.trim() || null,
    exam_mode: (formData.get("exam_mode") as string) || "online",
    duration_minutes: parseInt((formData.get("duration_minutes") as string) || "0", 10) || null,
    total_questions: parseInt((formData.get("total_questions") as string) || "0", 10) || null,
    total_marks: parseInt((formData.get("total_marks") as string) || "0", 10) || null,
    marking_scheme: (formData.get("marking_scheme") as string)?.trim() || null,
    official_website: (formData.get("official_website") as string)?.trim() || null,
    eligibility: JSON.parse((formData.get("eligibility") as string) || "{}"),
    status,
    published_at: status === "published" ? new Date().toISOString() : null,
    meta_title: (formData.get("meta_title") as string)?.trim() || null,
    meta_description: (formData.get("meta_description") as string)?.trim() || null,
  };

  if (!data.slug || !data.name) throw new Error("Slug and name are required.");

  if (id) {
    const { error } = await supabase.from("exams").update(data).eq("id", id);
    if (error) throw new Error(error.message);
    await writeAuditLog({ teamMember, action: "exam.update", entityType: "exam", entityId: id });
  } else {
    const { data: row, error } = await supabase.from("exams").insert({ ...data, created_by: teamMember.id }).select("id").single();
    if (error) throw new Error(error.message);
    await writeAuditLog({ teamMember, action: "exam.create", entityType: "exam", entityId: row.id });
    redirect(`/console/exams/${row.id}`);
  }
  revalidatePath("/console/exams");
  redirect("/console/exams");
}

export async function deleteExam(id: string): Promise<void> {
  const teamMember = await requireTeamMember();
  const supabase = await createClient();
  const { error } = await supabase.from("exams").update({ deleted_at: new Date().toISOString(), status: "unpublished" }).eq("id", id);
  if (error) throw new Error(error.message);
  await writeAuditLog({ teamMember, action: "exam.delete", entityType: "exam", entityId: id });
  revalidatePath("/console/exams");
  redirect("/console/exams");
}

// ============================================================
// Exam Sessions
// ============================================================

export async function saveExamSession(examId: string, formData: FormData): Promise<void> {
  const teamMember = await requireTeamMember();
  const supabase = await createClient();
  const year = parseInt((formData.get("year") as string) || "0", 10);
  const sessionSlug = (formData.get("session_slug") as string)?.trim() || `${year}`;
  const sessionLabel = (formData.get("session_label") as string)?.trim() || `${year} Session`;
  const status = formData.get("status") as string;

  const data = {
    exam_id: examId,
    year,
    session_slug: sessionSlug,
    session_label: sessionLabel,
    slug: `${year}-${sessionSlug}`,
    notification_date: (formData.get("notification_date") as string) || null,
    application_start: (formData.get("application_start") as string) || null,
    application_end: (formData.get("application_end") as string) || null,
    exam_date: (formData.get("exam_date") as string) || null,
    admit_card_url: (formData.get("admit_card_url") as string) || null,
    result_date: (formData.get("result_date") as string) || null,
    result_url: (formData.get("result_url") as string) || null,
    apply_link: (formData.get("apply_link") as string) || null,
    status,
    published_at: status === "published" ? new Date().toISOString() : null,
  };

  if (!year) throw new Error("Year is required.");

  const { data: row, error } = await supabase.from("exam_sessions").insert({ ...data, created_by: teamMember.id }).select("id").single();
  if (error) throw new Error(error.message);
  await writeAuditLog({ teamMember, action: "exam_session.create", entityType: "exam_session", entityId: row.id });
  revalidatePath(`/console/exams/${examId}`);
  redirect(`/console/exams/${examId}`);
}

export async function deleteExamSession(examId: string, sessionId: string): Promise<void> {
  const teamMember = await requireTeamMember();
  const supabase = await createClient();
  const { error } = await supabase.from("exam_sessions").delete().eq("id", sessionId);
  if (error) throw new Error(error.message);
  await writeAuditLog({ teamMember, action: "exam_session.delete", entityType: "exam_session", entityId: sessionId });
  revalidatePath(`/console/exams/${examId}`);
}

// ============================================================
// Exam Session child entities (live updates, guides)
// Reuses event_updates/event_guides with exam_session_id
// ============================================================

export async function addExamSessionUpdate(sessionId: string, formData: FormData): Promise<void> {
  const teamMember = await requireTeamMember();
  const supabase = await createClient();
  const { error } = await supabase.from("event_updates").insert({
    exam_session_id: sessionId,
    kind: (formData.get("kind") as string) || "info",
    title: formData.get("title") as string,
    body_md: (formData.get("body_md") as string) || null,
    doc_url: (formData.get("doc_url") as string) || null,
    created_by: teamMember.id,
  });
  if (error) throw new Error(error.message);
  await writeAuditLog({ teamMember, action: "exam_session_update.create", entityType: "exam_session", entityId: sessionId });
}

export async function deleteExamSessionUpdate(sessionId: string, updateId: string): Promise<void> {
  const teamMember = await requireTeamMember();
  const supabase = await createClient();
  const { error } = await supabase.from("event_updates").delete().eq("id", updateId);
  if (error) throw new Error(error.message);
}

export async function addExamSessionGuide(sessionId: string, formData: FormData): Promise<void> {
  const teamMember = await requireTeamMember();
  const supabase = await createClient();
  const { error } = await supabase.from("event_guides").insert({
    exam_session_id: sessionId,
    section: (formData.get("section") as string) || "other",
    title: formData.get("title") as string,
    body_md: (formData.get("body_md") as string) || null,
  });
  if (error) throw new Error(error.message);
}

export async function deleteExamSessionGuide(sessionId: string, guideId: string): Promise<void> {
  const teamMember = await requireTeamMember();
  const supabase = await createClient();
  const { error } = await supabase.from("event_guides").delete().eq("id", guideId);
  if (error) throw new Error(error.message);
}

// ============================================================
// Course Masters
// ============================================================

export async function saveCourseMaster(formData: FormData): Promise<void> {
  const teamMember = await requireTeamMember();
  const supabase = await createClient();
  const id = formData.get("id") as string | null;
  const status = formData.get("status") as string;

  const data = {
    slug: (formData.get("slug") as string)?.trim(),
    name: (formData.get("name") as string)?.trim(),
    name_hi: (formData.get("name_hi") as string)?.trim() || null,
    full_name: (formData.get("full_name") as string)?.trim() || null,
    level: (formData.get("level") as string) || "undergraduate",
    stream: (formData.get("stream") as string)?.trim() || null,
    description: (formData.get("description") as string)?.trim() || null,
    duration: (formData.get("duration") as string)?.trim() || null,
    eligibility: (formData.get("eligibility") as string)?.trim() || null,
    career_prospects: (formData.get("career_prospects") as string)?.trim() || null,
    specializations: ((formData.get("specializations") as string) || "").split(",").map(s => s.trim()).filter(Boolean),
    typical_entrance_exams: ((formData.get("typical_entrance_exams") as string) || "").split(",").map(s => s.trim()).filter(Boolean),
    fees_min_total: parseInt((formData.get("fees_min_total") as string) || "0", 10) || null,
    fees_max_total: parseInt((formData.get("fees_max_total") as string) || "0", 10) || null,
    status,
    published_at: status === "published" ? new Date().toISOString() : null,
  };

  if (!data.slug || !data.name) throw new Error("Slug and name are required.");

  if (id) {
    const { error } = await supabase.from("course_masters").update(data).eq("id", id);
    if (error) throw new Error(error.message);
    await writeAuditLog({ teamMember, action: "course_master.update", entityType: "course_master", entityId: id });
  } else {
    const { data: row, error } = await supabase.from("course_masters").insert({ ...data, created_by: teamMember.id }).select("id").single();
    if (error) throw new Error(error.message);
    await writeAuditLog({ teamMember, action: "course_master.create", entityType: "course_master", entityId: row.id });
  }
  revalidatePath("/console/courses");
  redirect("/console/courses");
}

export async function deleteCourseMaster(id: string): Promise<void> {
  const teamMember = await requireTeamMember();
  const supabase = await createClient();
  const { error } = await supabase.from("course_masters").update({ deleted_at: new Date().toISOString(), status: "unpublished" }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/console/courses");
  redirect("/console/courses");
}

// ============================================================
// Course Offerings
// ============================================================

export async function saveCourseOffering(courseMasterId: string, formData: FormData): Promise<void> {
  const teamMember = await requireTeamMember();
  const supabase = await createClient();

  const data = {
    course_master_id: courseMasterId,
    institution_id: formData.get("institution_id") as string,
    duration: (formData.get("duration") as string)?.trim() || null,
    fees_total: parseInt((formData.get("fees_total") as string) || "0", 10) || null,
    fees_per_year: parseInt((formData.get("fees_per_year") as string) || "0", 10) || null,
    eligibility: (formData.get("eligibility") as string)?.trim() || null,
    seats: parseInt((formData.get("seats") as string) || "0", 10) || null,
    apply_link: (formData.get("apply_link") as string)?.trim() || null,
    brochure_url: (formData.get("brochure_url") as string)?.trim() || null,
    batch_year: parseInt((formData.get("batch_year") as string) || "0", 10) || null,
    mode: (formData.get("mode") as string) || "regular",
    status: formData.get("status") as string,
    published_at: formData.get("status") === "published" ? new Date().toISOString() : null,
  };

  if (!data.institution_id) throw new Error("Institution is required.");

  const { data: row, error } = await supabase.from("course_offerings").insert({ ...data, created_by: teamMember.id }).select("id").single();
  if (error) throw new Error(error.message);
  await writeAuditLog({ teamMember, action: "course_offering.create", entityType: "course_offering", entityId: row.id });
  revalidatePath("/console/courses");
}

export async function deleteCourseOffering(courseMasterId: string, offeringId: string): Promise<void> {
  const teamMember = await requireTeamMember();
  const supabase = await createClient();
  const { error } = await supabase.from("course_offerings").delete().eq("id", offeringId);
  if (error) throw new Error(error.message);
  revalidatePath("/console/courses");
}
