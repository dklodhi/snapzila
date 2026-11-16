"use server";

/**
 * Server actions for post management.
 * Each action performs the mutation + writes an audit log entry.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireTeamMember } from "@/lib/auth/server";
import { writeAuditLog } from "@/lib/console/audit";
import { logError } from "@/lib/utils/log";

// ============================================================
// Event core CRUD
// ============================================================

export async function saveEvent(formData: FormData): Promise<void> {
  const teamMember = await requireTeamMember();
  const supabase = await createClient();

  const id = formData.get("id") as string | null;
  const type = formData.get("type") as string;
  const slug = formData.get("slug") as string;
  const title = formData.get("title") as string;
  const status = formData.get("status") as string;

  const data = {
    type,
    slug,
    title,
    title_hi: (formData.get("title_hi") as string) || null,
    summary: (formData.get("summary") as string) || null,
    summary_hi: (formData.get("summary_hi") as string) || null,
    conducting_body: (formData.get("conducting_body") as string) || null,
    conducting_body_slug: (formData.get("conducting_body_slug") as string) || null,
    apply_mode: (formData.get("apply_mode") as string) || "na",
    apply_link: (formData.get("apply_link") as string) || null,
    apply_start_date: (formData.get("apply_start_date") as string) || null,
    apply_end_date: (formData.get("apply_end_date") as string) || null,
    exam_date: (formData.get("exam_date") as string) || null,
    result_date: (formData.get("result_date") as string) || null,
    status,
    published_at: status === "published" ? new Date().toISOString() : null,
    body_md: (formData.get("body_md") as string) || null,
    body_md_hi: (formData.get("body_md_hi") as string) || null,
    meta_title: (formData.get("meta_title") as string) || null,
    meta_description: (formData.get("meta_description") as string) || null,
    tags: ((formData.get("tags") as string) || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    updated_by: teamMember.id,
  };

  if (id) {
    // Update
    const { error } = await supabase.from("events").update(data).eq("id", id);
    if (error) {
      logError("[saveEvent] update failed", { id, error: error.message });
      throw new Error(`Failed to update: ${error.message}`);
    }
    await writeAuditLog({
      teamMember,
      action: "event.update",
      entityType: "event",
      entityId: id,
      afterData: data as unknown as Record<string, unknown>,
    });
    revalidatePath("/console/posts");
    revalidatePath(`/console/posts/${id}/edit`);
    revalidatePath("/console");
  } else {
    // Create
    const insertData = { ...data, created_by: teamMember.id };
    const { data: newEvent, error } = await supabase
      .from("events")
      .insert(insertData)
      .select("id")
      .single();
    if (error) {
      logError("[saveEvent] insert failed", { error: error.message });
      throw new Error(`Failed to create: ${error.message}`);
    }
    await writeAuditLog({
      teamMember,
      action: "event.create",
      entityType: "event",
      entityId: newEvent.id,
      afterData: insertData as unknown as Record<string, unknown>,
    });
    revalidatePath("/console/posts");
    revalidatePath("/console");
    redirect(`/console/posts/${newEvent.id}/edit`);
  }
}

export async function setEventStatus(id: string, status: string): Promise<void> {
  const teamMember = await requireTeamMember();
  const supabase = await createClient();
  const update: Record<string, unknown> = { status, updated_by: teamMember.id };
  if (status === "published") update.published_at = new Date().toISOString();

  const { error } = await supabase.from("events").update(update).eq("id", id);
  if (error) throw new Error(`Failed: ${error.message}`);

  await writeAuditLog({
    teamMember,
    action: `event.${status}`,
    entityType: "event",
    entityId: id,
  });
  revalidatePath("/console/posts");
  revalidatePath(`/console/posts/${id}/edit`);
  revalidatePath("/console");
}

export async function softDeleteEvent(id: string): Promise<void> {
  const teamMember = await requireTeamMember();
  const supabase = await createClient();
  const { error } = await supabase
    .from("events")
    .update({ deleted_at: new Date().toISOString(), status: "unpublished", updated_by: teamMember.id })
    .eq("id", id);
  if (error) throw new Error(`Failed: ${error.message}`);

  await writeAuditLog({
    teamMember,
    action: "event.soft_delete",
    entityType: "event",
    entityId: id,
  });
  revalidatePath("/console/posts");
  revalidatePath("/console");
  redirect("/console/posts");
}

// ============================================================
// Live updates CRUD
// ============================================================

export async function addLiveUpdate(eventId: string, formData: FormData): Promise<void> {
  const teamMember = await requireTeamMember();
  const supabase = await createClient();
  const { error } = await supabase.from("event_updates").insert({
    event_id: eventId,
    kind: (formData.get("kind") as string) || "info",
    title: formData.get("title") as string,
    title_hi: (formData.get("title_hi") as string) || null,
    body_md: (formData.get("body_md") as string) || null,
    body_md_hi: (formData.get("body_md_hi") as string) || null,
    doc_url: (formData.get("doc_url") as string) || null,
    created_by: teamMember.id,
  });
  if (error) throw new Error(`Failed: ${error.message}`);
  await writeAuditLog({
    teamMember,
    action: "event_update.create",
    entityType: "event_update",
    entityId: eventId,
  });
  revalidatePath(`/console/posts/${eventId}/edit`);
}

export async function deleteLiveUpdate(eventId: string, updateId: string): Promise<void> {
  const teamMember = await requireTeamMember();
  const supabase = await createClient();
  const { error } = await supabase.from("event_updates").delete().eq("id", updateId);
  if (error) throw new Error(`Failed: ${error.message}`);
  await writeAuditLog({
    teamMember,
    action: "event_update.delete",
    entityType: "event_update",
    entityId: updateId,
  });
  revalidatePath(`/console/posts/${eventId}/edit`);
}

// ============================================================
// Guide sections CRUD
// ============================================================

export async function addGuideSection(eventId: string, formData: FormData): Promise<void> {
  const teamMember = await requireTeamMember();
  const supabase = await createClient();
  const { error } = await supabase.from("event_guides").insert({
    event_id: eventId,
    section: (formData.get("section") as string) || "other",
    title: formData.get("title") as string,
    title_hi: (formData.get("title_hi") as string) || null,
    body_md: (formData.get("body_md") as string) || null,
    body_md_hi: (formData.get("body_md_hi") as string) || null,
  });
  if (error) throw new Error(`Failed: ${error.message}`);
  await writeAuditLog({
    teamMember,
    action: "event_guide.create",
    entityType: "event_guide",
    entityId: eventId,
  });
  revalidatePath(`/console/posts/${eventId}/edit`);
}

export async function deleteGuideSection(eventId: string, sectionId: string): Promise<void> {
  const teamMember = await requireTeamMember();
  const supabase = await createClient();
  const { error } = await supabase.from("event_guides").delete().eq("id", sectionId);
  if (error) throw new Error(`Failed: ${error.message}`);
  await writeAuditLog({
    teamMember,
    action: "event_guide.delete",
    entityType: "event_guide",
    entityId: sectionId,
  });
  revalidatePath(`/console/posts/${eventId}/edit`);
}

// ============================================================
// Dates CRUD
// ============================================================

export async function addDate(eventId: string, formData: FormData): Promise<void> {
  const teamMember = await requireTeamMember();
  const supabase = await createClient();
  const { error } = await supabase.from("event_dates").insert({
    event_id: eventId,
    label: formData.get("label") as string,
    label_hi: (formData.get("label_hi") as string) || null,
    date: formData.get("date") as string,
    time: (formData.get("time") as string) || null,
    url: (formData.get("url") as string) || null,
  });
  if (error) throw new Error(`Failed: ${error.message}`);
  await writeAuditLog({
    teamMember,
    action: "event_date.create",
    entityType: "event_date",
    entityId: eventId,
  });
  revalidatePath(`/console/posts/${eventId}/edit`);
}

export async function deleteDate(eventId: string, dateId: string): Promise<void> {
  const teamMember = await requireTeamMember();
  const supabase = await createClient();
  const { error } = await supabase.from("event_dates").delete().eq("id", dateId);
  if (error) throw new Error(`Failed: ${error.message}`);
  await writeAuditLog({
    teamMember,
    action: "event_date.delete",
    entityType: "event_date",
    entityId: dateId,
  });
  revalidatePath(`/console/posts/${eventId}/edit`);
}

// ============================================================
// JSON paste — calls create_event_from_json RPC
// ============================================================

export async function createEventFromJson(jsonStr: string): Promise<{ success: boolean; error?: string; eventId?: string }> {
  const teamMember = await requireTeamMember();
  const supabase = await createClient();

  let payload: unknown;
  try {
    payload = JSON.parse(jsonStr);
  } catch {
    return { success: false, error: "Invalid JSON syntax." };
  }

  // Call the RPC
  const { data, error } = await supabase.rpc("create_event_from_json", { payload });
  if (error) {
    logError("[createEventFromJson] RPC failed", { error: error.message });
    return { success: false, error: error.message };
  }

  const eventId = (data as { event_id?: string })?.event_id;
  await writeAuditLog({
    teamMember,
    action: "event.create_from_json",
    entityType: "event",
    entityId: eventId,
    afterData: { json_length: jsonStr.length },
  });
  revalidatePath("/console/posts");
  revalidatePath("/console");
  return { success: true, eventId };
}

// ============================================================
// Static pages CRUD
// ============================================================

export async function saveStaticPage(formData: FormData): Promise<void> {
  const teamMember = await requireTeamMember();
  const supabase = await createClient();
  const id = formData.get("id") as string | null;
  const data = {
    slug: formData.get("slug") as string,
    title: formData.get("title") as string,
    title_hi: (formData.get("title_hi") as string) || null,
    body_md: (formData.get("body_md") as string) || null,
    body_md_hi: (formData.get("body_md_hi") as string) || null,
    meta_title: (formData.get("meta_title") as string) || null,
    meta_description: (formData.get("meta_description") as string) || null,
    show_in_header: formData.get("show_in_header") === "on",
    show_in_footer: formData.get("show_in_footer") === "on",
    sort_order: parseInt((formData.get("sort_order") as string) || "0", 10),
    status: formData.get("status") as string,
  };

  if (id) {
    const { error } = await supabase.from("static_pages").update(data).eq("id", id);
    if (error) throw new Error(`Failed: ${error.message}`);
    await writeAuditLog({ teamMember, action: "static_page.update", entityType: "static_page", entityId: id });
    revalidatePath("/console/pages");
    redirect("/console/pages");
  } else {
    const insertData = { ...data, created_by: teamMember.id };
    const { data: newPage, error } = await supabase.from("static_pages").insert(insertData).select("id").single();
    if (error) throw new Error(`Failed: ${error.message}`);
    await writeAuditLog({ teamMember, action: "static_page.create", entityType: "static_page", entityId: newPage.id });
    revalidatePath("/console/pages");
    redirect("/console/pages");
  }
}

export async function deleteStaticPage(id: string): Promise<void> {
  const teamMember = await requireTeamMember();
  const supabase = await createClient();
  const { error } = await supabase.from("static_pages").delete().eq("id", id);
  if (error) throw new Error(`Failed: ${error.message}`);
  await writeAuditLog({ teamMember, action: "static_page.delete", entityType: "static_page", entityId: id });
  revalidatePath("/console/pages");
}

// ============================================================
// Site settings
// ============================================================

export async function saveSiteSetting(key: string, formData: FormData): Promise<void> {
  const teamMember = await requireTeamMember();
  const supabase = await createClient();
  const value = (formData.get("value") as string) ?? "";
  // Try to parse value as JSON, fall back to string
  let parsed: unknown = value;
  try {
    parsed = JSON.parse(value);
  } catch {
    parsed = value;
  }
  const { error } = await supabase
    .from("site_settings")
    .upsert({ key, value: parsed, updated_by: teamMember.id })
    .eq("key", key);
  if (error) throw new Error(`Failed: ${error.message}`);
  await writeAuditLog({ teamMember, action: "site_setting.update", entityType: "site_setting", entityId: key, afterData: { key, value: parsed } as unknown as Record<string, unknown> });
  revalidatePath("/console/settings");
}
