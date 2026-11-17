import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/server";
import { PublicShell } from "@/components/public/public-shell";
import { ParentPostPartial } from "@/components/public/parent-post-partial";
import { EventTimeline } from "@/components/public/event-timeline";
import { EventGuide } from "@/components/public/event-guide";
import { EventDates } from "@/components/public/event-dates";
import { DiscussionSection } from "@/components/public/discussion-section";
import { FollowButton } from "@/components/public/follow-button";
import { SaveButton } from "@/components/public/save-button";
import { eventMetadata } from "@/lib/seo/metadata";

const VALID_TYPES = ["govt-jobs", "admissions", "scholarships", "govt-schemes", "news", "articles"];

export async function generateMetadata({ params }: { params: Promise<{ type: string; slug: string; childSlug: string }> }): Promise<Metadata> {
  const { type, slug } = await params;
  if (!VALID_TYPES.includes(type)) return {};
  const supabase = await createClient();
  const { data: event } = await supabase
    .from("events")
    .select("title, summary, conducting_body, type, slug, meta_title, meta_description")
    .eq("type", type)
    .eq("slug", slug)
    .eq("status", "published")
    .is("deleted_at", null)
    .maybeSingle();
  if (!event) return {};
  return eventMetadata(event);
}

/**
 * /govt-jobs/[slug]/[childSlug] — Update or Guide direct link.
 * Renders the parent event page with auto-scroll to the matching child.
 * childSlug can be:
 *   - An update's title (slugified) → scrolls to that update in the timeline
 *   - A guide section (e.g., "syllabus", "eligibility") → opens that guide accordion
 */
export default async function ChildSlugPage({
  params,
}: {
  params: Promise<{ type: string; slug: string; childSlug: string }>;
}) {
  const { type, slug, childSlug } = await params;
  if (!VALID_TYPES.includes(type)) notFound();

  const supabase = await createClient();
  const user = await getCurrentUser();

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("type", type)
    .eq("slug", slug)
    .eq("status", "published")
    .is("deleted_at", null)
    .maybeSingle();

  if (!event) notFound();

  const [
    { data: updates },
    { data: guides },
    { data: dates },
    { data: topLevelDiscussions },
  ] = await Promise.all([
    supabase.from("event_updates").select("id, kind, title, body_md, doc_url, published_at").eq("event_id", event.id).order("published_at", { ascending: false }).limit(20),
    supabase.from("event_guides").select("id, section, title, body_md, sort_order").eq("event_id", event.id).order("sort_order"),
    supabase.from("event_dates").select("id, label, date, url, sort_order").eq("event_id", event.id).order("sort_order"),
    supabase.from("event_discussions").select("id, author_id, voice_type, body_md, upvote_count, reply_count, created_at, deleted_at").eq("event_id", event.id).is("parent_id", null).is("deleted_at", null).order("upvote_count", { ascending: false }).limit(20),
  ]);

  // Build discussions with replies
  let discussionsWithReplies: Array<Record<string, unknown>> = [];
  if (topLevelDiscussions && topLevelDiscussions.length > 0) {
    const topIds = topLevelDiscussions.map((d) => d.id);
    const { data: replyRows } = await supabase.from("event_discussions").select("id, parent_id, author_id, voice_type, body_md, upvote_count, created_at, deleted_at").in("parent_id", topIds).is("deleted_at", null).order("created_at", { ascending: true });
    let votedIds = new Set<string>();
    if (user) {
      const { data: votes } = await supabase.from("discussion_votes").select("discussion_id").in("discussion_id", topIds).eq("user_id", user.id);
      votedIds = new Set((votes ?? []).map((v) => v.discussion_id));
    }
    const repliesByParent = new Map<string, unknown[]>();
    for (const reply of replyRows ?? []) {
      const r = reply as Record<string, unknown>;
      const pid = r.parent_id as string;
      const arr = repliesByParent.get(pid) ?? [];
      arr.push(reply);
      repliesByParent.set(pid, arr);
    }
    discussionsWithReplies = (topLevelDiscussions as Record<string, unknown>[]).map((d) => ({
      ...d,
      user_has_voted: votedIds.has(d.id as string),
      replies: repliesByParent.get(d.id as string) ?? [],
    }));
  }

  // Check follow/save
  let initialFollowing = false;
  let initialSaved = false;
  if (user) {
    const [{ data: followRow }, { data: saveRow }] = await Promise.all([
      supabase.from("user_follows").select("id").eq("user_id", user.id).eq("target_type", "event").eq("target_id", event.id).maybeSingle(),
      supabase.from("user_saves").select("id").eq("user_id", user.id).eq("target_type", "event").eq("target_id", event.id).maybeSingle(),
    ]);
    initialFollowing = Boolean(followRow);
    initialSaved = Boolean(saveRow);
  }

  // Pass childSlug to client for auto-scroll (via data attribute)
  const childSlugAttr = childSlug;

  return (
    <PublicShell>
      <div className="container-app py-6" data-child-slug={childSlugAttr}>
        <div className="mb-4 flex items-center justify-end gap-2">
          <FollowButton targetType="event" targetId={event.id} initialFollowing={initialFollowing} />
          <SaveButton targetType="event" targetId={event.id} initialSaved={initialSaved} />
        </div>
        <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
          <div className="space-y-4">
            <ParentPostPartial event={event} />
            <EventGuide guides={guides ?? []} />
            <EventDates dates={dates ?? []} />
          </div>
          <div className="hidden lg:block">
            <div className="sticky top-20">
              <EventTimeline eventId={event.id} initialUpdates={updates ?? []} />
            </div>
          </div>
        </div>
        <div className="mt-6 lg:hidden">
          <EventTimeline eventId={event.id} initialUpdates={updates ?? []} />
        </div>
        <div className="mt-8">
          <DiscussionSection eventId={event.id} initialDiscussions={discussionsWithReplies as never} isLoggedIn={Boolean(user)} />
        </div>
      </div>
    </PublicShell>
  );
}
