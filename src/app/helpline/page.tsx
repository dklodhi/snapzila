import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PublicShell } from "@/components/public/public-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, Mail, Globe, LifeBuoy } from "lucide-react";
import { helplineMetadata } from "@/lib/seo/metadata";


export const metadata: Metadata = helplineMetadata();
export default async function HelplinePage() {
  const supabase = await createClient();
  const { data: entries } = await supabase
    .from("helpline_entries")
    .select("*")
    .eq("status", "published")
    .order("sort_order")
    .order("title");

  // Group by category
  const byCategory = new Map<string, typeof entries>();
  for (const entry of entries ?? []) {
    const cat = entry.category || "General";
    const arr = byCategory.get(cat) ?? [];
    arr.push(entry);
    byCategory.set(cat, arr);
  }

  return (
    <PublicShell>
      <div className="container-app py-8">
        <div className="flex items-center gap-2">
          <LifeBuoy className="h-6 w-6 text-brand" />
          <h1 className="font-display text-3xl font-bold text-ink">Helpline</h1>
        </div>
        <p className="mt-1 text-muted">Official helpline numbers and contacts for exams, schemes, and admissions.</p>

        <div className="mt-6 space-y-8">
          {byCategory.size === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted">
                No helpline entries published yet.
              </CardContent>
            </Card>
          ) : (
            Array.from(byCategory.entries()).map(([category, items]) => (
              <div key={category}>
                <h2 className="mb-3 font-display text-lg font-semibold text-ink">{category}</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {items?.map((entry) => (
                    <Card key={entry.id}>
                      <CardContent className="p-4">
                        <h3 className="font-display text-base font-semibold text-ink">{entry.title}</h3>
                        {entry.body_md && (
                          <p className="mt-1 text-sm text-muted whitespace-pre-wrap">{entry.body_md}</p>
                        )}
                        <div className="mt-3 space-y-1.5">
                          {entry.phone && (
                            <a href={`tel:${entry.phone}`} className="flex items-center gap-2 text-sm text-ink hover:text-brand">
                              <Phone className="h-3.5 w-3.5 text-muted" /> {entry.phone}
                            </a>
                          )}
                          {entry.email && (
                            <a href={`mailto:${entry.email}`} className="flex items-center gap-2 text-sm text-ink hover:text-brand">
                              <Mail className="h-3.5 w-3.5 text-muted" /> {entry.email}
                            </a>
                          )}
                          {entry.website && (
                            <a href={entry.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-brand hover:underline">
                              <Globe className="h-3.5 w-3.5" /> Website ↗
                            </a>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-8 rounded-lg border border-dashed border-line bg-bg-subtle p-4 text-center">
          <p className="text-sm text-muted">
            Need to reach us?{" "}
            <Link href="/contact" className="text-brand hover:underline">Contact SnapZila →</Link>
          </p>
        </div>
      </div>
    </PublicShell>
  );
}
