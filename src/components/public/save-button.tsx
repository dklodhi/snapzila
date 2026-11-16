"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, Loader2 } from "lucide-react";
import { toggleSave } from "@/lib/user/actions";

export function SaveButton({
  targetType,
  targetId,
  initialSaved = false,
}: {
  targetType: string;
  targetId: string;
  initialSaved?: boolean;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    const wasSaved = saved;
    setSaved(!wasSaved);
    startTransition(async () => {
      try {
        const result = await toggleSave(targetType, targetId);
        setSaved(result.saved);
      } catch {
        setSaved(wasSaved);
        router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      }
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      title={saved ? "Remove from saved" : "Save for later"}
      className={`inline-flex items-center justify-center rounded-md p-2 transition-colors ${
        saved
          ? "bg-warning-subtle text-warning"
          : "text-muted hover:bg-bg-subtle hover:text-ink"
      }`}
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Bookmark className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
      )}
    </button>
  );
}
