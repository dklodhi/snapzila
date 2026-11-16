"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, Loader2, Check } from "lucide-react";
import { toggleFollow } from "@/lib/user/actions";

export function FollowButton({
  targetType,
  targetId,
  initialFollowing = false,
  label = "Follow",
}: {
  targetType: string;
  targetId: string;
  initialFollowing?: boolean;
  label?: string;
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    // Check if logged in by attempting the action — if it redirects, we go to login
    const wasFollowing = following;
    setFollowing(!wasFollowing);
    startTransition(async () => {
      try {
        const result = await toggleFollow(targetType, targetId);
        setFollowing(result.following);
      } catch {
        // Likely not logged in — redirect to login
        setFollowing(wasFollowing);
        router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      }
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
        following
          ? "bg-success-subtle text-success hover:bg-danger-subtle hover:text-danger"
          : "bg-brand text-white hover:bg-brand-hover"
      }`}
    >
      {pending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : following ? (
        <Check className="h-3.5 w-3.5" />
      ) : (
        <Bell className="h-3.5 w-3.5" />
      )}
      {following ? "Following" : label}
    </button>
  );
}
