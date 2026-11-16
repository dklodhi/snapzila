import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileCode2 } from "lucide-react";

export default async function StaticPagesListPage() {
  const supabase = await createClient();
  const { data: pages } = await supabase
    .from("static_pages")
    .select("id, slug, title, status, show_in_header, show_in_footer, updated_at")
    .order("updated_at", { ascending: false });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Static Pages</h1>
          <p className="mt-1 text-sm text-muted">About Us, Contact Us, and other static content.</p>
        </div>
        <Button asChild size="sm">
          <Link href="/console/pages/new"><Plus className="mr-1 h-4 w-4" /> New Page</Link>
        </Button>
      </div>

      <Card className="mt-4 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-line bg-bg-subtle">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-muted">Title</th>
              <th className="px-4 py-2 text-left font-medium text-muted">Slug</th>
              <th className="px-4 py-2 text-left font-medium text-muted">Status</th>
              <th className="px-4 py-2 text-left font-medium text-muted">Updated</th>
              <th className="px-4 py-2 text-right font-medium text-muted">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(!pages || pages.length === 0) && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted">
                  <FileCode2 className="mx-auto mb-2 h-8 w-8 text-muted-soft" />
                  No static pages yet. Create About Us and Contact Us pages.
                </td>
              </tr>
            )}
            {pages?.map((p) => (
              <tr key={p.id} className="border-b border-line-soft hover:bg-bg-subtle">
                <td className="px-4 py-2.5">
                  <Link href={`/console/pages/${p.id}/edit`} className="font-medium text-ink hover:text-brand">
                    {p.title}
                  </Link>
                  {p.show_in_header && <span className="ml-2 text-[10px] uppercase text-muted">header</span>}
                  {p.show_in_footer && <span className="ml-1 text-[10px] uppercase text-muted">footer</span>}
                </td>
                <td className="px-4 py-2.5 font-mono text-xs text-muted">{p.slug}</td>
                <td className="px-4 py-2.5">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${p.status === "published" ? "bg-success-subtle text-success" : "bg-bg-muted text-muted"}`}>
                    {p.status}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-xs text-muted">
                  {new Date(p.updated_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/console/pages/${p.id}/edit`}>Edit</Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
