import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveStaticPage } from "@/lib/console/actions";

export default function NewStaticPagePage() {
  return (
    <div className="p-6">
      <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
        <Link href="/console/pages">← Back to Pages</Link>
      </Button>
      <h1 className="font-display text-2xl font-bold text-ink">New Static Page</h1>

      <form action={saveStaticPage} className="mt-6 space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Basic</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" name="slug" required pattern="[a-z0-9-]+" placeholder="about-us" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="title_hi">Title (Hindi)</Label>
              <Input id="title_hi" name="title_hi" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <select name="status" defaultValue="draft" className="flex h-10 w-full rounded-md border border-line bg-white px-3 text-sm">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Body</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="body_md">Body (English, Markdown)</Label>
              <textarea id="body_md" name="body_md" rows={12} className="flex w-full rounded-md border border-line bg-white px-3 py-2 font-mono text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="body_md_hi">Body (Hindi, Markdown)</Label>
              <textarea id="body_md_hi" name="body_md_hi" rows={12} className="flex w-full rounded-md border border-line bg-white px-3 py-2 font-mono text-sm" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">SEO &amp; Placement</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="meta_title">Meta Title</Label>
              <Input id="meta_title" name="meta_title" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="meta_description">Meta Description</Label>
              <Input id="meta_description" name="meta_description" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sort_order">Sort Order</Label>
              <Input id="sort_order" name="sort_order" type="number" defaultValue="0" />
            </div>
            <div className="flex items-center gap-6 pt-6">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="show_in_header" /> Show in header
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="show_in_footer" /> Show in footer
              </label>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" size="lg">Create Page</Button>
        </div>
      </form>
    </div>
  );
}
