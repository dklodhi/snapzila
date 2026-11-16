"use client";

/**
 * Discussion section — voice-type comments on an event page.
 * Features: sort toggle (Top/Recent), comment cards with voice badges,
 * one-level replies, upvote, post form, reply form.
 */
import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowBigUp, MessageSquareReply, Loader2 } from "lucide-react";
import { postDiscussion, postReply, toggleUpvote } from "@/lib/public/discussion-actions";

const VOICE_CONFIG: Record<string, { label: string; badgeClass: string }> = {
  aspirant: { label: "Aspirant", badgeClass: "bg-brand-subtle text-brand" },
  selected: { label: "Selected", badgeClass: "bg-success-subtle text-success" },
  mentor: { label: "Mentor", badgeClass: "bg-warning-subtle text-warning" },
  official: { label: "Official", badgeClass: "bg-brand-accent/10 text-brand-accent" },
  skeptic: { label: "Skeptic", badgeClass: "bg-danger-subtle text-danger" },
  general: { label: "General", badgeClass: "bg-bg-muted text-muted" },
};

const VOICES = Object.entries(VOICE_CONFIG);

interface DiscussionData {
  id: string;
  author_id: string;
  voice_type: string;
  body_md: string;
  upvote_count: number;
  reply_count: number;
  created_at: string;
  deleted_at: string | null;
  user_has_voted?: boolean;
  replies?: Array<Omit<DiscussionData, "reply_count" | "user_has_voted" | "replies">>;
}

function fmtTime(s: string): string {
  const d = new Date(s);
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)}d ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function authorHandle(authorId: string): string {
  // Pseudonymous handle derived from UUID — first 6 chars after the first dash
  const parts = authorId.split("-");
  return "user-" + (parts[1]?.slice(0, 4) ?? authorId.slice(0, 4));
}

function avatarInitials(authorId: string): string {
  const handle = authorHandle(authorId);
  return handle.slice(-2).toUpperCase();
}

function avatarColor(authorId: string): string {
  let hash = 0;
  for (let i = 0; i < authorId.length; i++) {
    hash = authorId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = ["bg-brand", "bg-success", "bg-warning", "bg-brand-accent", "bg-danger", "bg-info"];
  return colors[Math.abs(hash) % colors.length] ?? "bg-brand";
}

function DiscussionCard({
  discussion,
  eventId,
  isLoggedIn,
}: {
  discussion: DiscussionData;
  eventId: string;
  isLoggedIn: boolean;
}) {
  const [upvoted, setUpvoted] = useState(discussion.user_has_voted ?? false);
  const [count, setCount] = useState(discussion.upvote_count);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyVoice, setReplyVoice] = useState("general");
  const [pending, startTransition] = useTransition();
  const voice = VOICE_CONFIG[discussion.voice_type] ?? VOICE_CONFIG.general;
  if (!voice) return null;

  function handleUpvote() {
    if (!isLoggedIn) {
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    const wasUpvoted = upvoted;
    setUpvoted(!wasUpvoted);
    setCount(wasUpvoted ? count - 1 : count + 1);
    startTransition(async () => {
      try {
        await toggleUpvote(discussion.id);
      } catch {
        setUpvoted(wasUpvoted);
        setCount(wasUpvoted ? count + 1 : count - 1);
      }
    });
  }

  function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyText.trim()) return;
    const formData = new FormData();
    formData.set("body_md", replyText);
    formData.set("voice_type", replyVoice);
    startTransition(async () => {
      try {
        await postReply(discussion.id, formData);
        setReplyText("");
        setShowReplyForm(false);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to post reply");
      }
    });
  }

  return (
    <div className="rounded-lg border border-line p-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium text-white ${avatarColor(discussion.author_id)}`}>
          {avatarInitials(discussion.author_id)}
        </div>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${voice.badgeClass}`}>
          {voice.label}
        </span>
        <span className="text-xs text-muted-soft">· {fmtTime(discussion.created_at)}</span>
      </div>

      {/* Body */}
      {discussion.deleted_at ? (
        <p className="mt-2 text-sm italic text-muted-soft">[deleted]</p>
      ) : (
        <p className="mt-2 text-sm text-ink whitespace-pre-wrap">{discussion.body_md}</p>
      )}

      {/* Actions */}
      <div className="mt-2 flex items-center gap-4">
        <button
          onClick={handleUpvote}
          className={`flex items-center gap-1 text-xs ${upvoted ? "text-brand" : "text-muted hover:text-ink"}`}
        >
          <ArrowBigUp className="h-4 w-4" />
          <span className="font-medium">{count}</span>
        </button>
        {isLoggedIn && !discussion.deleted_at && (
          <button
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="flex items-center gap-1 text-xs text-muted hover:text-ink"
          >
            <MessageSquareReply className="h-3.5 w-3.5" />
            Reply
          </button>
        )}
      </div>

      {/* Reply form */}
      {showReplyForm && (
        <form onSubmit={handleReply} className="mt-3 space-y-2 rounded-md bg-bg-subtle p-3">
          <div className="flex gap-2">
            <select
              value={replyVoice}
              onChange={(e) => setReplyVoice(e.target.value)}
              className="h-8 rounded-md border border-line bg-white px-2 text-xs"
            >
              {VOICES.map(([value, cfg]) => (
                <option key={value} value={value}>{cfg.label}</option>
              ))}
            </select>
            <input
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write a reply..."
              className="flex-1 rounded-md border border-line bg-white px-2 py-1.5 text-sm"
              maxLength={2000}
            />
          </div>
          <Button type="submit" size="sm" disabled={pending || !replyText.trim()}>
            {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
            Post Reply
          </Button>
        </form>
      )}

      {/* Replies */}
      {discussion.replies && discussion.replies.length > 0 && (
        <div className="mt-3 ml-10 space-y-2 border-l-2 border-line pl-3">
          {discussion.replies.map((reply) => {
            const rVoice = VOICE_CONFIG[reply.voice_type] ?? VOICE_CONFIG.general;
            if (!rVoice) return null;
            return (
              <div key={reply.id} className="rounded-md bg-bg-subtle p-2.5">
                <div className="flex items-center gap-2">
                  <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-medium text-white ${avatarColor(reply.author_id)}`}>
                    {avatarInitials(reply.author_id)}
                  </div>
                  <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium ${rVoice.badgeClass}`}>
                    {rVoice.label}
                  </span>
                  <span className="text-[10px] text-muted-soft">· {fmtTime(reply.created_at)}</span>
                </div>
                {reply.deleted_at ? (
                  <p className="mt-1 text-xs italic text-muted-soft">[deleted]</p>
                ) : (
                  <p className="mt-1 text-xs text-ink whitespace-pre-wrap">{reply.body_md}</p>
                )}
                <div className="mt-1 flex items-center gap-1 text-[10px] text-muted">
                  <ArrowBigUp className="h-3 w-3" />
                  {reply.upvote_count}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function DiscussionSection({
  eventId,
  initialDiscussions,
  isLoggedIn,
}: {
  eventId: string;
  initialDiscussions: DiscussionData[];
  isLoggedIn: boolean;
}) {
  const [sort, setSort] = useState<"top" | "recent">("top");
  const [postText, setPostText] = useState("");
  const [postVoice, setPostVoice] = useState("general");
  const [pending, startTransition] = useTransition();

  const sorted = [...initialDiscussions].sort((a, b) => {
    if (sort === "top") {
      if (b.upvote_count !== a.upvote_count) return b.upvote_count - a.upvote_count;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  function handlePost(e: React.FormEvent) {
    e.preventDefault();
    if (!postText.trim()) return;
    const formData = new FormData();
    formData.set("body_md", postText);
    formData.set("voice_type", postVoice);
    startTransition(async () => {
      try {
        await postDiscussion(eventId, formData);
        setPostText("");
        // Page revalidates via server action, refreshing the list
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to post");
      }
    });
  }

  return (
    <Card id="discussions">
      <CardHeader className="border-b border-line bg-bg-subtle py-2.5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Discussions ({initialDiscussions.length})</CardTitle>
          <div className="flex gap-1 text-xs">
            <button
              onClick={() => setSort("top")}
              className={`rounded-md px-2 py-0.5 ${sort === "top" ? "bg-brand text-white" : "text-muted hover:bg-bg-muted"}`}
            >
              Top
            </button>
            <button
              onClick={() => setSort("recent")}
              className={`rounded-md px-2 py-0.5 ${sort === "recent" ? "bg-brand text-white" : "text-muted hover:bg-bg-muted"}`}
            >
              Recent
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 p-4">
        {/* Comment list */}
        {sorted.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">
            No discussions yet. Be the first to share your thoughts.
          </p>
        ) : (
          <div className="space-y-3">
            {sorted.map((d) => (
              <DiscussionCard key={d.id} discussion={d} eventId={eventId} isLoggedIn={isLoggedIn} />
            ))}
          </div>
        )}

        {/* Post form */}
        {isLoggedIn ? (
          <form onSubmit={handlePost} className="mt-4 space-y-3 rounded-lg border border-line p-3">
            <p className="text-xs font-medium uppercase text-muted">Join the discussion</p>
            <div className="flex gap-2">
              <select
                value={postVoice}
                onChange={(e) => setPostVoice(e.target.value)}
                className="h-9 w-32 rounded-md border border-line bg-white px-2 text-sm"
              >
                {VOICES.map(([value, cfg]) => (
                  <option key={value} value={value}>{cfg.label}</option>
                ))}
              </select>
              <textarea
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                placeholder="Share your thoughts... (markdown supported)"
                rows={3}
                maxLength={2000}
                className="flex-1 rounded-md border border-line bg-white px-2 py-1.5 text-sm"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-soft">{postText.length}/2000</span>
              <Button type="submit" size="sm" disabled={pending || !postText.trim()}>
                {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                Post Comment
              </Button>
            </div>
          </form>
        ) : (
          <div className="mt-4 rounded-lg border border-dashed border-line p-4 text-center">
            <p className="text-sm text-muted">
              <a href={`/login?next=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "/")}`} className="text-brand hover:underline">
                Login to join the discussion
              </a>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
