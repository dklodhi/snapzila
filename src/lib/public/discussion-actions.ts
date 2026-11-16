"use server";

/**
 * Server actions for public discussions.
 * Post, reply, upvote, remove upvote.
 */
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/server";
import { logError } from "@/lib/utils/log";

export async function postDiscussion(eventId: string, formData: FormData): Promise<void> {
  const user = await requireUser();
  const supabase = await createClient();

  const body = (formData.get("body_md") as string)?.trim();
  const voiceType = (formData.get("voice_type") as string) || "general";

  if (!body || body.length === 0) {
    throw new Error("Comment body is required.");
  }
  if (body.length > 2000) {
    throw new Error("Comment is too long (max 2000 characters).");
  }

  const { error } = await supabase.from("event_discussions").insert({
    event_id: eventId,
    author_id: user.id,
    voice_type: voiceType,
    body_md: body,
  });

  if (error) {
    logError("[postDiscussion] insert failed", { eventId, error: error.message });
    throw new Error(`Failed to post: ${error.message}`);
  }
}

export async function postReply(parentId: string, formData: FormData): Promise<void> {
  const user = await requireUser();
  const supabase = await createClient();

  const body = (formData.get("body_md") as string)?.trim();
  const voiceType = (formData.get("voice_type") as string) || "general";

  if (!body) throw new Error("Reply body is required.");
  if (body.length > 2000) throw new Error("Reply is too long (max 2000 characters).");

  const { data: parent } = await supabase
    .from("event_discussions")
    .select("event_id, institution_id")
    .eq("id", parentId)
    .maybeSingle();

  if (!parent) throw new Error("Parent comment not found.");

  const { error } = await supabase.from("event_discussions").insert({
    event_id: parent.event_id,
    institution_id: parent.institution_id,
    author_id: user.id,
    voice_type: voiceType,
    body_md: body,
    parent_id: parentId,
  });

  if (error) {
    logError("[postReply] insert failed", { parentId, error: error.message });
    throw new Error(`Failed to reply: ${error.message}`);
  }
}

export async function toggleUpvote(discussionId: string): Promise<{ upvoted: boolean }> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("discussion_votes")
    .select("id")
    .eq("discussion_id", discussionId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("discussion_votes")
      .delete()
      .eq("discussion_id", discussionId)
      .eq("user_id", user.id);
    if (error) throw new Error(`Failed: ${error.message}`);
    return { upvoted: false };
  }

  const { error } = await supabase
    .from("discussion_votes")
    .insert({ discussion_id: discussionId, user_id: user.id });
  if (error) {
    if (error.code === "23505") return { upvoted: true };
    throw new Error(`Failed: ${error.message}`);
  }
  return { upvoted: true };
}
