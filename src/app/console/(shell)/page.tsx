import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Code2, FileCode2, Settings, ScrollText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function ConsoleDashboard() {
  const supabase = await createClient();

  // Quick stats
  const [{ count: totalPosts }, { count: publishedPosts }, { count: draftPosts }, { count: pages }] = await Promise.all([
    supabase.from("events").select("*", { count: "exact", head: true }),
    supabase.from("events").select("*", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("events").select("*", { count: "exact", head: true }).eq("status", "draft"),
    supabase.from("static_pages").select("*", { count: "exact", head: true }),
  ]);

  const stats = [
    { label: "Total Posts", value: totalPosts ?? 0, hint: "All opportunity types" },
    { label: "Published", value: publishedPosts ?? 0, hint: "Live on public site" },
    { label: "Drafts", value: draftPosts ?? 0, hint: "In progress" },
    { label: "Static Pages", value: pages ?? 0, hint: "About, Contact, etc." },
  ];

  const quickActions = [
    { title: "New Post (Manual)", href: "/console/posts/new-manual", icon: FileText, desc: "Structured form editor for all 6 content types." },
    { title: "New Post (JSON Paste)", href: "/console/posts/new-json", icon: Code2, desc: "Paste a JSON blob, validate, create with children." },
    { title: "Static Pages", href: "/console/pages", icon: FileCode2, desc: "Manage About Us, Contact Us, and other pages." },
    { title: "Site Settings", href: "/console/settings", icon: Settings, desc: "Brand name, tagline, feature flags." },
    { title: "Audit Log", href: "/console/audit-log", icon: ScrollText, desc: "Every console write, recorded." },
  ];

  return (
    <div className="p-6">
      <h1 className="font-display text-2xl font-bold text-ink">Dashboard</h1>
      <p className="mt-1 text-sm text-muted">Welcome back. Here&apos;s what&apos;s happening.</p>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted">{s.label}</p>
              <p className="mt-1 font-display text-3xl font-bold text-ink">{s.value}</p>
              <p className="mt-0.5 text-xs text-muted-soft">{s.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <h2 className="mt-8 font-display text-lg font-semibold text-ink">Quick Actions</h2>
      <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {quickActions.map((a) => {
          const Icon = a.icon;
          return (
            <Link key={a.href} href={a.href}>
              <Card className="transition-colors hover:border-brand">
                <CardHeader className="flex flex-row items-center gap-3 space-y-0 p-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-subtle">
                    <Icon className="h-5 w-5 text-brand" />
                  </div>
                  <CardTitle className="text-sm">{a.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-xs text-muted">{a.desc}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Coming soon */}
      <div className="mt-8 rounded-lg border border-dashed border-line bg-white p-4">
        <p className="text-sm font-medium text-ink">Coming in later sessions</p>
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-bg-muted px-2.5 py-0.5 text-muted">Institutions (S4)</span>
          <span className="rounded-full bg-bg-muted px-2.5 py-0.5 text-muted">Helpline (S5)</span>
          <span className="rounded-full bg-bg-muted px-2.5 py-0.5 text-muted">Exam Calendar (S5)</span>
          <span className="rounded-full bg-bg-muted px-2.5 py-0.5 text-muted">Employment News (S5)</span>
          <span className="rounded-full bg-bg-muted px-2.5 py-0.5 text-muted">Team Management (later)</span>
          <span className="rounded-full bg-bg-muted px-2.5 py-0.5 text-muted">Analytics (S7)</span>
        </div>
      </div>
    </div>
  );
}
