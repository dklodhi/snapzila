"use client";

/**
 * Live updates timeline with realtime subscription.
 * Receives initial updates as props, then subscribes to new inserts
 * via Supabase Realtime. New updates prepend with slide-in animation.
 */
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Radio } from "lucide-react";

const KIND_CONFIG: Record<string, { color: string; label: string }> = {
  info: { color: "bg-brand", label: "Info" },
  warning: { color: "bg-warning", label: "Warning" },
  result: { color: "bg-success", label: "Result" },
  "admit-card": { color: "bg-brand", label: "Admit Card" },
  corrigendum: { color: "bg-danger", label: "Corrigendum" },
  extension: { color: "bg-warning", label: "Extension" },
  deadline: { color: "bg-danger", label: "Deadline" },
};

interface UpdateData {
  id: string;
  kind: string;
  title: string;
  body_md?: string | null;
  doc_url?: string | null;
  published_at: string;
}

export function EventTimeline({ eventId, initialUpdates }: { eventId: string; initialUpdates: UpdateData[] }) {
  const [updates, setUpdates] = useState<UpdateData[]>(initialUpdates);
  const [newPulse, setNewPulse] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`event-updates-${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "event_updates",
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          const newUpdate = payload.new as UpdateData;
          setUpdates((prev) => [newUpdate, ...prev]);
          setNewPulse(true);
          setTimeout(() => setNewPulse(false), 1000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  function fmtTime(s: string): string {
    const d = new Date(s);
    const now = Date.now();
    const diff = now - d.getTime();
    if (diff < 60_000) return "just now";
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-2 border-b border-line bg-bg-subtle px-4 py-2.5">
        <Radio className={`h-4 w-4 text-brand ${newPulse ? "animate-pulse text-brand-accent" : ""}`} />
        <h2 className="font-display text-sm font-semibold text-ink">Live Updates</h2>
        <span className="ml-auto text-xs text-muted">{updates.length}</span>
      </div>

      <div className="max-h-[600px] overflow-y-auto">
        {updates.length === 0 ? (
          <p className="p-4 text-center text-sm text-muted">No live updates yet.</p>
        ) : (
          <div className="relative px-4 py-3">
            {/* Timeline line */}
            <div className="absolute left-[1.65rem] top-3 bottom-3 w-px bg-line" />

            <div className="space-y-4">
              {updates.map((update, i) => {
                const cfg = KIND_CONFIG[update.kind] ?? KIND_CONFIG.info;
                if (!cfg) return null;
                return (
                  <div
                    key={update.id}
                    className={`relative flex gap-3 ${i === 0 && newPulse ? "animate-[slideIn_0.3s_ease-out]" : ""}`}
                  >
                    {/* Dot */}
                    <div className="relative z-10 mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
                      <div className={`h-2.5 w-2.5 rounded-full ${cfg.color}`} />
                    </div>
                    {/* Content */}
                    <div className="flex-1 pb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase text-muted-soft">{cfg.label}</span>
                        <span className="text-[10px] text-muted-soft">{fmtTime(update.published_at)}</span>
                      </div>
                      <p className="text-sm font-medium text-ink">{update.title}</p>
                      {update.body_md && (
                        <p className="mt-0.5 text-xs text-muted whitespace-pre-wrap">{update.body_md}</p>
                      )}
                      {update.doc_url && (
                        <a
                          href={update.doc_url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-block text-xs text-brand hover:underline"
                        >
                          View document ↗
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
