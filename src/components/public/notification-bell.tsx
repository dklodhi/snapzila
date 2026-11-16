"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Bell, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { markAllNotificationsRead } from "@/lib/user/actions";

interface NotificationData {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

function fmtTime(s: string): string {
  const d = new Date(s);
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function NotificationBell({ initialUnread = 0 }: { initialUnread?: number }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unread, setUnread] = useState(initialUnread);
  const [loading, setLoading] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const supabase = createClient();

    // Subscribe to new notifications in realtime
    const channel = supabase
      .channel("user-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_notifications",
        },
        (payload) => {
          const newNotif = payload.new as NotificationData;
          setNotifications((prev) => [newNotif, ...prev].slice(0, 20));
          setUnread((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadNotifications() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("user_notifications")
      .select("id, kind, title, body, link, read_at, created_at")
      .order("created_at", { ascending: false })
      .limit(20);
    setNotifications(data ?? []);
    setLoading(false);
  }

  function handleOpen() {
    const next = !open;
    setOpen(next);
    if (next && notifications.length === 0) {
      loadNotifications();
    }
  }

  function handleMarkAllRead() {
    startTransition(async () => {
      try {
        await markAllNotificationsRead();
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, read_at: new Date().toISOString() }))
        );
        setUnread(0);
      } catch {
        // ignore
      }
    });
  }

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        className="relative rounded-md p-2 text-muted-soft hover:bg-white/10 hover:text-white"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand-accent px-1 text-[9px] font-bold text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-80 overflow-hidden rounded-md border border-line bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-line px-3 py-2">
            <span className="text-sm font-medium text-ink">Notifications</span>
            {unread > 0 && (
              <button
                onClick={handleMarkAllRead}
                onMouseDown={(e) => e.preventDefault()}
                disabled={pending}
                className="flex items-center gap-1 text-xs text-brand hover:underline"
              >
                <Check className="h-3 w-3" /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-sm text-muted">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted">
                No notifications yet.
              </div>
            ) : (
              notifications.map((n) => (
                <Link
                  key={n.id}
                  href={n.link ?? "/me/notifications"}
                  onMouseDown={(e) => e.preventDefault()}
                  className={`block border-b border-line-soft px-3 py-2 hover:bg-bg-subtle ${
                    !n.read_at ? "bg-brand-subtle/30" : ""
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!n.read_at && (
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-accent" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-ink">{n.title}</p>
                      {n.body && (
                        <p className="mt-0.5 text-xs text-muted line-clamp-2">{n.body}</p>
                      )}
                      <p className="mt-0.5 text-[10px] text-muted-soft">
                        {fmtTime(n.created_at)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
          <Link
            href="/me/notifications"
            onMouseDown={(e) => e.preventDefault()}
            className="block border-t border-line px-3 py-2 text-center text-xs text-brand hover:bg-bg-subtle"
          >
            View all →
          </Link>
        </div>
      )}
    </div>
  );
}
