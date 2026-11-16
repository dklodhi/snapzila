"use server";

/**
 * Server actions for helpline + contact + tools.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser, requireTeamMember } from "@/lib/auth/server";
import { writeAuditLog } from "@/lib/console/audit";
import { logError } from "@/lib/utils/log";

// ============================================================
// Contact form (public, auth required)
// ============================================================

export async function submitContact(formData: FormData): Promise<void> {
  const user = await requireUser();
  const supabase = await createClient();

  const data = {
    name: (formData.get("name") as string)?.trim(),
    email: (formData.get("email") as string)?.trim(),
    subject: (formData.get("subject") as string)?.trim(),
    body: (formData.get("body") as string)?.trim(),
    category: (formData.get("category") as string)?.trim() || null,
    user_id: user.id,
  };

  if (!data.name || !data.email || !data.subject || !data.body) {
    throw new Error("All fields are required.");
  }

  const { error } = await supabase.from("contact_messages").insert(data);
  if (error) {
    logError("[submitContact] failed", { error: error.message });
    throw new Error(`Failed: ${error.message}`);
  }

  redirect("/contact?submitted=1");
}

// ============================================================
// Helpline CRUD (team)
// ============================================================

export async function saveHelplineEntry(formData: FormData): Promise<void> {
  const teamMember = await requireTeamMember();
  const supabase = await createClient();
  const id = formData.get("id") as string | null;

  const data = {
    title: (formData.get("title") as string)?.trim(),
    title_hi: (formData.get("title_hi") as string)?.trim() || null,
    category: (formData.get("category") as string)?.trim() || "General",
    body_md: (formData.get("body_md") as string)?.trim() || null,
    body_md_hi: (formData.get("body_md_hi") as string)?.trim() || null,
    phone: (formData.get("phone") as string)?.trim() || null,
    email: (formData.get("email") as string)?.trim() || null,
    website: (formData.get("website") as string)?.trim() || null,
    sort_order: parseInt((formData.get("sort_order") as string) || "0", 10),
    status: formData.get("status") as string,
  };

  if (!data.title) throw new Error("Title is required.");

  if (id) {
    const { error } = await supabase.from("helpline_entries").update(data).eq("id", id);
    if (error) throw new Error(`Failed: ${error.message}`);
    await writeAuditLog({ teamMember, action: "helpline.update", entityType: "helpline", entityId: id });
  } else {
    const { data: newRow, error } = await supabase.from("helpline_entries").insert(data).select("id").single();
    if (error) throw new Error(`Failed: ${error.message}`);
    await writeAuditLog({ teamMember, action: "helpline.create", entityType: "helpline", entityId: newRow.id });
  }

  revalidatePath("/console/helpline");
  redirect("/console/helpline");
}

export async function deleteHelplineEntry(id: string): Promise<void> {
  const teamMember = await requireTeamMember();
  const supabase = await createClient();
  const { error } = await supabase.from("helpline_entries").delete().eq("id", id);
  if (error) throw new Error(`Failed: ${error.message}`);
  await writeAuditLog({ teamMember, action: "helpline.delete", entityType: "helpline", entityId: id });
  revalidatePath("/console/helpline");
}

// ============================================================
// Exam Calendar Override CRUD (team)
// ============================================================

export async function saveExamOverride(formData: FormData): Promise<void> {
  const teamMember = await requireTeamMember();
  const supabase = await createClient();

  const data = {
    exam_name: (formData.get("exam_name") as string)?.trim(),
    exam_name_hi: (formData.get("exam_name_hi") as string)?.trim() || null,
    date: formData.get("date") as string,
    category: (formData.get("category") as string)?.trim() || "General",
    url: (formData.get("url") as string)?.trim() || null,
    notes: (formData.get("notes") as string)?.trim() || null,
  };

  if (!data.exam_name || !data.date) throw new Error("Exam name and date are required.");

  const { error } = await supabase.from("exam_calendar_overrides").insert(data);
  if (error) throw new Error(`Failed: ${error.message}`);
  await writeAuditLog({ teamMember, action: "exam_override.create", entityType: "exam_override" });
  revalidatePath("/console/tools/exam-calendar");
  revalidatePath("/tools/exam-calendar");
}

export async function deleteExamOverride(id: string): Promise<void> {
  const teamMember = await requireTeamMember();
  const supabase = await createClient();
  const { error } = await supabase.from("exam_calendar_overrides").delete().eq("id", id);
  if (error) throw new Error(`Failed: ${error.message}`);
  await writeAuditLog({ teamMember, action: "exam_override.delete", entityType: "exam_override", entityId: id });
  revalidatePath("/console/tools/exam-calendar");
  revalidatePath("/tools/exam-calendar");
}

// ============================================================
// Employment News Issue CRUD (team)
// ============================================================

export async function saveEmploymentNewsIssue(formData: FormData): Promise<void> {
  const teamMember = await requireTeamMember();
  const supabase = await createClient();
  const id = formData.get("id") as string | null;

  const weekStart = formData.get("week_start") as string;
  const weekEnd = formData.get("week_end") as string;
  const featuredIds = ((formData.get("featured_event_ids") as string) || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const status = formData.get("status") as string;

  const data = {
    issue_number: parseInt((formData.get("issue_number") as string) || "0", 10),
    week_start: weekStart,
    week_end: weekEnd,
    title: (formData.get("title") as string)?.trim(),
    title_hi: (formData.get("title_hi") as string)?.trim() || null,
    intro_md: (formData.get("intro_md") as string)?.trim() || null,
    intro_md_hi: (formData.get("intro_md_hi") as string)?.trim() || null,
    featured_event_ids: featuredIds,
    status,
    published_at: status === "published" ? new Date().toISOString() : null,
  };

  if (!data.title || !data.week_start || !data.week_end) {
    throw new Error("Title, week start, and week end are required.");
  }

  if (id) {
    const { error } = await supabase.from("employment_news_issues").update(data).eq("id", id);
    if (error) throw new Error(`Failed: ${error.message}`);
    await writeAuditLog({ teamMember, action: "employment_news.update", entityType: "employment_news", entityId: id });
  } else {
    const { data: newRow, error } = await supabase.from("employment_news_issues").insert(data).select("id").single();
    if (error) throw new Error(`Failed: ${error.message}`);
    await writeAuditLog({ teamMember, action: "employment_news.create", entityType: "employment_news", entityId: newRow.id });
  }

  revalidatePath("/console/tools/employment-news");
  revalidatePath("/tools/employment-news");
  redirect("/console/tools/employment-news");
}

export async function deleteEmploymentNewsIssue(id: string): Promise<void> {
  const teamMember = await requireTeamMember();
  const supabase = await createClient();
  const { error } = await supabase.from("employment_news_issues").delete().eq("id", id);
  if (error) throw new Error(`Failed: ${error.message}`);
  await writeAuditLog({ teamMember, action: "employment_news.delete", entityType: "employment_news", entityId: id });
  revalidatePath("/console/tools/employment-news");
  redirect("/console/tools/employment-news");
}
