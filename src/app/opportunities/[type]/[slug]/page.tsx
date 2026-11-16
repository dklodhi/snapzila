import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/server";
import { PublicShell } from "@/components/public/public-shell";
import { ParentPostPartial } from "@/components/public/parent-post-partial";
import { EventTimeline } from "@/components/public/event-timeline";
import { EventGuide } from "@/components/public/event-guide";
import { EventDates } from "@/components/public/event-dates";
import { DiscussionSection } from "@/components/public/discussion-section";

const VALID_TYPES = ["govt-jobs", "admissions", "scholarships", "govt-schemes", "news", "articles"];

interface DiscussionRow {
  id: string;
  author_id: string;
  voice_type: string;
  body_md: string;
  upvote_count: number;
  reply_count: number;
  created_at: string;
  deleted_at: string | null;
}

interface DiscussionWithReplies extends DiscussionRow {
  user_has_voted: boolean;
  replies: Array<{
    id: string;
    author_id: string;
    voice_type: string;
    body_md: string;
    upvote_count: number;
    created_at: string;
    deleted_at: string | null;
  }>;
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ type: string; slug: string }>;
}) {
  const { type, slug } = await params;

  if (!VALID_TYPES.includes(type)) notFound();

  const supabase = await createClient();
  const user = await getCurrentUser();

  // Load event
  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("type", type)
    .eq("slug", slug)
    .eq("status", "published")
    .is("deleted_at", null)
    .maybeSingle();

  if (!event) notFound();

  // Load children in parallel
  const [
    { data: updates },
    { data: guides },
    { data: dates },
    { data: topLevelDiscussions },
  ] = await Promise.all([
    supabase
      .from("event_updates")
      .select("id, kind, title, body_md, doc_url, published_at")
      .eq("event_id", event.id)
      .order("published_at", { ascending: false })
      .limit(20),
    supabase
      .from("event_guides")
      .select("id, section, title, body_md, sort_order")
      .eq("event_id", event.id)
      .order("sort_order"),
    supabase
      .from("event_dates")
      .select("id, label, date, url, sort_order")
      .eq("event_id", event.id)
      .order("sort_order"),
    supabase
      .from("event_discussions")
      .select("id, author_id, voice_type, body_md, upvote_count, reply_count, created_at, deleted_at")
      .eq("event_id", event.id)
      .is("parent_id", null)
      .is("deleted_at", null)
      .order("upvote_count", { ascending: false })
      .limit(20),
  ]);

  // Build discussions with replies + vote status
  let discussionsWithReplies: DiscussionWithReplies[] = [];

  if (topLevelDiscussions && topLevelDiscussions.length > 0) {
    const topIds = topLevelDiscussions.map((d) => (d as DiscussionRow).id);

    // Fetch replies for all top-level discussions
    const { data: replyRows } = await supabase
      .from("event_discussions")
      .select("id, parent_id, author_id, voice_type, body_md, upvote_count, created_at, deleted_at")
      .in("parent_id", topIds)
      .is("deleted_at", null)
      .order("created_at", { ascending: true });

    // Fetch current user's votes on top-level discussions
    let votedIds = new Set<string>();
    if (user) {
      const { data: votes } = await supabase
        .from("discussion_votes")
        .select("discussion_id")
        .in("discussion_id", topIds)
        .eq("user_id", user.id);
      votedIds = new Set((votes ?? []).map((v) => v.discussion_id));
    }

    // Group replies by parent
    const repliesByParent = new Map<string, NonNullable<typeof replyRows>>();
    for (const reply of replyRows ?? []) {
      const r = reply as { id: string; parent_id: string } & Omit<DiscussionRow, "reply_count">;
      const arr = repliesByParent.get(r.parent_id) ?? [];
      arr.push(reply);
      repliesByParent.set(r.parent_id, arr);
    }

    discussionsWithReplies = (topLevelDiscussions as DiscussionRow[]).map((d) => {
      const parentReplies = (repliesByParent.get(d.id) ?? []).map((r) => {
        const rr = r as DiscussionRow & { parent_id: string };
        return {
          id: rr.id,
          author_id: rr.author_id,
          voice_type: rr.voice_type,
          body_md: rr.body_md,
          upvote_count: rr.upvote_count,
          created_at: rr.created_at,
          deleted_at: rr.deleted_at,
        };
      });
      return {
        ...d,
        user_has_voted: votedIds.has(d.id),
        replies: parentReplies,
      };
    });
  }

  return (
    <PublicShell>
      <div className="container-app py-6">
        {/* Desktop: 2-col (content | timeline rail) */}
        <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
          {/* Left: parent post + guide + dates */}
          <div className="space-y-4">
            <ParentPostPartial event={event} />
            <EventGuide guides={guides ?? []} />
            <EventDates dates={dates ?? []} />
          </div>

          {/* Right: sticky timeline rail (desktop only) */}
          <div className="hidden lg:block">
            <div className="sticky top-20">
              <EventTimeline eventId={event.id} initialUpdates={updates ?? []} />
            </div>
          </div>
        </div>

        {/* Mobile: timeline in-flow */}
        <div className="mt-6 lg:hidden">
          <EventTimeline eventId={event.id} initialUpdates={updates ?? []} />
        </div>

        {/* Discussions — full width below */}
        <div className="mt-8">
          <DiscussionSection
            eventId={event.id}
            initialDiscussions={discussionsWithReplies}
            isLoggedIn={Boolean(user)}
          />
        </div>
      </div>
    </PublicShell>
  );
}
