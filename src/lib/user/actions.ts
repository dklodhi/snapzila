"use server";

/**
 * Server actions for user features: follow, save, notifications, profile.
 */
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/server";
import { logError } from "@/lib/utils/log";

// ============================================================
// Follow / Unfollow
// ============================================================

export async function toggleFollow(
  targetType: string,
  targetId: string
): Promise<{ following: boolean }> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("user_follows")
    .select("id")
    .eq("user_id", user.id)
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("user_follows")
      .delete()
      .eq("id", existing.id);
    if (error) throw new Error(`Failed: ${error.message}`);
    return { following: false };
  }

  const { error } = await supabase.from("user_follows").insert({
    user_id: user.id,
    target_type: targetType,
    target_id: targetId,
  });
  if (error) {
    if (error.code === "23505") return { following: true };
    throw new Error(`Failed: ${error.message}`);
  }
  return { following: true };
}

// ============================================================
// Save / Unsave
// ============================================================

export async function toggleSave(
  targetType: string,
  targetId: string
): Promise<{ saved: boolean }> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("user_saves")
    .select("id")
    .eq("user_id", user.id)
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("user_saves")
      .delete()
      .eq("id", existing.id);
    if (error) throw new Error(`Failed: ${error.message}`);
    return { saved: false };
  }

  const { error } = await supabase.from("user_saves").insert({
    user_id: user.id,
    target_type: targetType,
    target_id: targetId,
  });
  if (error) {
    if (error.code === "23505") return { saved: true };
    throw new Error(`Failed: ${error.message}`);
  }
  return { saved: true };
}

// ============================================================
// Notifications
// ============================================================

export async function markNotificationRead(id: string): Promise<void> {
  const user = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("user_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(`Failed: ${error.message}`);
}

export async function markAllNotificationsRead(): Promise<void> {
  const user = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("user_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);
  if (error) throw new Error(`Failed: ${error.message}`);
  revalidatePath("/me");
}

// ============================================================
// Profile / Onboarding
// ============================================================

export async function saveProfile(formData: FormData): Promise<void> {
  const user = await requireUser();
  const supabase = await createClient();

  const targetGroup = formData.get("target_group") as string;
  const state = (formData.get("state") as string)?.trim() || null;
  const examInterests = ((formData.get("exam_interests") as string) || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const contentInterests = ((formData.getAll("content_interests") as string[]) || []);
  const fullName = (formData.get("full_name") as string)?.trim() || null;

  const data = {
    user_id: user.id,
    full_name: fullName,
    target_group: targetGroup || null,
    state,
    exam_interests: examInterests,
    content_interests: contentInterests,
    onboarded_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("user_profiles")
    .upsert(data, { onConflict: "user_id" });

  if (error) {
    logError("[saveProfile] failed", { error: error.message });
    throw new Error(`Failed: ${error.message}`);
  }

  revalidatePath("/me");
  revalidatePath("/");
}
