import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/public/notification-bell";
import { markAllNotificationsRead } from "@/lib/user/actions";

const KIND_LABELS: Record<string, string> = {
  "live-update": "Live Update",
  deadline: "Deadline",
  result: "Result",
  system: "System",
};

const KIND_COLORS: Record<string, string> = {
  "live-update": "bg-brand-subtle text-brand",
  deadline: "bg-warning-subtle text-warning",
  result: "bg-success-subtle text-success",
  system: "bg-bg-muted text-muted",
};

export default async function NotificationsPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: notifications, count: totalCount } = await supabase
    .from("user_notifications")
    .select("*", { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const { count: unreadCount } = await supabase
    .from("user_notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("read_at", null);

  return (
    <main className="min-h-screen">
      <header className="border-b border-line bg-bg-subtle">
        <div className="container-app flex h-14 items-center justify-between">
          <Link href="/me" className="font-display text-lg font-bold text-brand">
            ← Dashboard
          </Link>
          <nav className="flex items-center gap-2">
            <NotificationBell initialUnread={unreadCount ?? 0} />
          </nav>
        </div>
      </header>

      <div className="container-app py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-ink">Notifications</h1>
            <p className="mt-1 text-sm text-muted">
              {totalCount ?? 0} total · {unreadCount ?? 0} unread
            </p>
          </div>
          {(unreadCount ?? 0) > 0 && (
            <form action={markAllNotificationsRead}>
              <Button type="submit" variant="secondary" size="sm">
                Mark all read
              </Button>
            </form>
          )}
        </div>

        <div className="mt-6 space-y-2">
          {notifications && notifications.length > 0 ? (
            notifications.map((n) => (
              <Card key={n.id} className={!n.read_at ? "border-brand/30 bg-brand-subtle/20" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {!n.read_at && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-accent" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${KIND_COLORS[n.kind] ?? KIND_COLORS.system}`}>
                          {KIND_LABELS[n.kind] ?? n.kind}
                        </span>
                        <span className="text-[10px] text-muted-soft">
                          {new Date(n.created_at).toLocaleString("en-IN")}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-medium text-ink">{n.title}</p>
                      {n.body && (
                        <p className="mt-0.5 text-sm text-muted">{n.body}</p>
                      )}
                      {n.link && (
                        <Link href={n.link} className="mt-1 inline-block text-xs text-brand hover:underline">
                          View →
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted">
                No notifications yet. Follow events to get notified about live updates.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}
