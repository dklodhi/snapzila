import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bookmark, Bell, User, Settings } from "lucide-react";
import { NotificationBell } from "@/components/public/notification-bell";

const TYPE_LABELS: Record<string, string> = {
  "govt-jobs": "Govt Jobs",
  admissions: "Admissions",
  scholarships: "Scholarships",
  "govt-schemes": "Govt Schemes",
  news: "News",
  articles: "Articles",
};

const TARGET_LABELS: Record<string, string> = {
  student: "Student",
  "job-seeker": "Job Seeker",
  learner: "Learner",
  other: "Other",
};

export default async function MePage() {
  const user = await requireUser();
  const supabase = await createClient();

  // Fetch profile
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  // Fetch saved events
  const { data: savedEventIds } = await supabase
    .from("user_saves")
    .select("target_id")
    .eq("target_type", "event");

  const savedEventIdList = (savedEventIds ?? []).map((s) => s.target_id);
  let savedEvents: Array<{
    id: string;
    type: string;
    slug: string;
    title: string;
    conducting_body: string | null;
  }> = [];
  if (savedEventIdList.length > 0) {
    const { data: events } = await supabase
      .from("events")
      .select("id, type, slug, title, conducting_body")
      .in("id", savedEventIdList)
      .eq("status", "published")
      .is("deleted_at", null);
    savedEvents = events ?? [];
  }

  // Fetch followed events
  const { data: followedEventIds } = await supabase
    .from("user_follows")
    .select("target_id")
    .eq("target_type", "event");

  const followedEventIdList = (followedEventIds ?? []).map((f) => f.target_id);
  let followedEvents: Array<{
    id: string;
    type: string;
    slug: string;
    title: string;
    conducting_body: string | null;
  }> = [];
  if (followedEventIdList.length > 0) {
    const { data: events } = await supabase
      .from("events")
      .select("id, type, slug, title, conducting_body")
      .in("id", followedEventIdList)
      .eq("status", "published")
      .is("deleted_at", null);
    followedEvents = events ?? [];
  }

  // Count follows by type
  const followCounts: Record<string, number> = {};
  const { data: allFollows } = await supabase
    .from("user_follows")
    .select("target_type");
  for (const f of allFollows ?? []) {
    followCounts[f.target_type] = (followCounts[f.target_type] ?? 0) + 1;
  }

  // Unread notifications count
  const { count: unreadCount } = await supabase
    .from("user_notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("read_at", null);

  const onboardingNeeded = !profile || !profile.onboarded_at;

  return (
    <main className="min-h-screen">
      <header className="border-b border-line bg-bg-subtle">
        <div className="container-app flex h-14 items-center justify-between">
          <Link href="/" className="font-display text-lg font-bold text-brand">
            SnapZila
          </Link>
          <nav className="flex items-center gap-2">
            <NotificationBell initialUnread={unreadCount ?? 0} />
            <Button asChild variant="ghost" size="sm">
              <Link href="/">Home</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/logout">Logout</Link>
            </Button>
          </nav>
        </div>
      </header>

      <div className="container-app py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-ink">My Dashboard</h1>
            <p className="mt-1 text-sm text-muted">
              Welcome back, {profile?.full_name || user.email}
            </p>
          </div>
          <Button asChild variant="secondary" size="sm">
            <Link href="/me/profile">
              <Settings className="mr-1 h-4 w-4" /> Edit Profile
            </Link>
          </Button>
        </div>

        {onboardingNeeded && (
          <Card className="mt-4 border-brand/30 bg-brand-subtle/30">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium text-brand">
                  Complete your profile for a personalized experience
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  Tell us your interests so we can show relevant opportunities.
                </p>
              </div>
              <Button asChild size="sm">
                <Link href="/onboarding">Get Started →</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Bookmark className="h-4 w-4 text-muted" />
                <p className="text-xs font-medium uppercase tracking-wider text-muted">Saved</p>
              </div>
              <p className="mt-1 font-display text-3xl font-bold text-ink">{savedEvents.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted" />
                <p className="text-xs font-medium uppercase tracking-wider text-muted">Following</p>
              </div>
              <p className="mt-1 font-display text-3xl font-bold text-ink">
                {Object.values(followCounts).reduce((a, b) => a + b, 0)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted" />
                <p className="text-xs font-medium uppercase tracking-wider text-muted">Unread</p>
              </div>
              <p className="mt-1 font-display text-3xl font-bold text-ink">{unreadCount ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted" />
                <p className="text-xs font-medium uppercase tracking-wider text-muted">Profile</p>
              </div>
              <p className="mt-1 font-display text-sm font-bold text-ink">
                {profile?.target_group ? TARGET_LABELS[profile.target_group] ?? profile.target_group : "Not set"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Saved events */}
        <h2 className="mt-8 font-display text-lg font-semibold text-ink">
          Saved ({savedEvents.length})
        </h2>
        <div className="mt-3 space-y-2">
          {savedEvents.length > 0 ? (
            savedEvents.map((event) => (
              <Link
                key={event.id}
                href={`/opportunities/${event.type}/${event.slug}`}
                className="block rounded-md border border-line-soft p-3 hover:border-brand"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-ink">{event.title}</p>
                    {event.conducting_body && (
                      <p className="mt-0.5 text-xs text-muted">{event.conducting_body}</p>
                    )}
                  </div>
                  <span className="rounded-full bg-brand-subtle px-2 py-0.5 text-[10px] text-brand">
                    {TYPE_LABELS[event.type] ?? event.type}
                  </span>
                </div>
              </Link>
            ))
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-sm text-muted">
                No saved events yet.{" "}
                <Link href="/opportunities" className="text-brand hover:underline">
                  Browse opportunities →
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Following */}
        <h2 className="mt-8 font-display text-lg font-semibold text-ink">
          Following ({Object.values(followCounts).reduce((a, b) => a + b, 0)})
        </h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm">
                <span>Followed Events</span>
                <span className="rounded-full bg-brand-subtle px-2 py-0.5 text-xs text-brand">
                  {followCounts.event ?? 0}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {followedEvents.length > 0 ? (
                followedEvents.slice(0, 5).map((event) => (
                  <Link
                    key={event.id}
                    href={`/opportunities/${event.type}/${event.slug}`}
                    className="block text-sm text-ink hover:text-brand"
                  >
                    {event.title}
                  </Link>
                ))
              ) : (
                <p className="text-xs text-muted">None yet.</p>
              )}
            </CardContent>
          </Card>

          {Object.entries(followCounts)
            .filter(([type]) => type !== "event")
            .map(([type, count]) => (
              <Card key={type}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-sm">
                    <span className="capitalize">{type}s</span>
                    <span className="rounded-full bg-brand-subtle px-2 py-0.5 text-xs text-brand">
                      {count}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted">Followed {type}s</p>
                </CardContent>
              </Card>
            ))}
        </div>

        {/* Recent notifications */}
        <h2 className="mt-8 font-display text-lg font-semibold text-ink">
          Recent Notifications
        </h2>
        <div className="mt-3">
          <NotificationsList userId={user.id} />
        </div>
      </div>
    </main>
  );
}

async function NotificationsList({ userId }: { userId: string }) {
  const supabase = await createClient();
  const { data: notifications } = await supabase
    .from("user_notifications")
    .select("id, kind, title, body, link, read_at, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (!notifications || notifications.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-sm text-muted">
          No notifications yet. Follow events to get notified about live updates.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="divide-y divide-line-soft">
        {notifications.map((n) => (
          <Link
            key={n.id}
            href={n.link ?? "#"}
            className={`block px-4 py-3 hover:bg-bg-subtle ${!n.read_at ? "bg-brand-subtle/20" : ""}`}
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
                  {new Date(n.created_at).toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}
