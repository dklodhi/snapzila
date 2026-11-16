import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Code2, FileText } from "lucide-react";

const TYPE_LABELS: Record<string, string> = {
  "govt-jobs": "Govt Jobs",
  admissions: "Admissions",
  scholarships: "Scholarships",
  "govt-schemes": "Govt Schemes",
  news: "News",
  articles: "Articles",
};

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-bg-muted text-muted",
  published: "bg-success-subtle text-success",
  scheduled: "bg-warning-subtle text-warning",
  unpublished: "bg-bg-muted text-muted",
  rejected: "bg-danger-subtle text-danger",
};

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; status?: string }>;
}) {
  const { type, status } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("events")
    .select("id, type, slug, title, status, published_at, updated_at, deleted_at")
    .order("updated_at", { ascending: false });

  if (type) query = query.eq("type", type);
  if (status) query = query.eq("status", status);

  const { data: posts, error } = await query;

  const types = Object.keys(TYPE_LABELS);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Posts</h1>
          <p className="mt-1 text-sm text-muted">Manage all opportunity posts.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="secondary" size="sm">
            <Link href="/console/posts/new-json">
              <Code2 className="mr-1 h-4 w-4" /> JSON Paste
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/console/posts/new-manual">
              <Plus className="mr-1 h-4 w-4" /> New Post
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/console/posts">
          <span className={`rounded-md px-2.5 py-1 text-xs font-medium ${!type ? "bg-brand text-white" : "bg-white border border-line text-muted"}`}>
            All types
          </span>
        </Link>
        {types.map((t) => (
          <Link key={t} href={`/console/posts?type=${t}`}>
            <span className={`rounded-md px-2.5 py-1 text-xs font-medium ${type === t ? "bg-brand text-white" : "bg-white border border-line text-muted"}`}>
              {TYPE_LABELS[t]}
            </span>
          </Link>
        ))}
      </div>

      {/* List */}
      <Card className="mt-4 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-line bg-bg-subtle">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-muted">Title</th>
              <th className="px-4 py-2 text-left font-medium text-muted">Type</th>
              <th className="px-4 py-2 text-left font-medium text-muted">Status</th>
              <th className="px-4 py-2 text-left font-medium text-muted">Updated</th>
              <th className="px-4 py-2 text-right font-medium text-muted">Actions</th>
            </tr>
          </thead>
          <tbody>
            {error && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-danger">
                  Error loading posts: {error.message}
                </td>
              </tr>
            )}
            {!error && (!posts || posts.length === 0) && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted">
                  <FileText className="mx-auto mb-2 h-8 w-8 text-muted-soft" />
                  No posts yet. Create your first post to get started.
                </td>
              </tr>
            )}
            {posts?.map((post) => (
              <tr key={post.id} className="border-b border-line-soft hover:bg-bg-subtle">
                <td className="px-4 py-2.5">
                  <Link href={`/console/posts/${post.id}/edit`} className="font-medium text-ink hover:text-brand">
                    {post.title}
                  </Link>
                  {post.deleted_at && (
                    <span className="ml-2 text-xs text-danger">(deleted)</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-muted">{TYPE_LABELS[post.type] ?? post.type}</td>
                <td className="px-4 py-2.5">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[post.status] ?? ""}`}>
                    {post.status}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-xs text-muted">
                  {new Date(post.updated_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/console/posts/${post.id}/edit`}>Edit</Link>
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
