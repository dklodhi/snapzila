/**
 * Event guide sections — accordion on mobile, simple stacked sections on desktop.
 */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface GuideData {
  id: string;
  section: string;
  title: string;
  body_md?: string | null;
  sort_order: number;
}

const SECTION_ORDER = ["eligibility", "apply_steps", "fees", "dates", "documents", "faq", "other"];

export function EventGuide({ guides }: { guides: GuideData[] }) {
  if (!guides || guides.length === 0) return null;

  // Sort by section order, then sort_order
  const sorted = [...guides].sort((a, b) => {
    const sa = SECTION_ORDER.indexOf(a.section);
    const sb = SECTION_ORDER.indexOf(b.section);
    if (sa !== sb) return sa - sb;
    return a.sort_order - b.sort_order;
  });

  return (
    <Card>
      <CardHeader className="border-b border-line bg-bg-subtle py-2.5">
        <CardTitle className="text-sm">Guide</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-line">
          {sorted.map((guide) => (
            <details key={guide.id} className="group" open>
              <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-medium text-ink hover:bg-bg-subtle">
                <span>{guide.title}</span>
                <span className="text-xs uppercase text-muted">{guide.section.replace("_", " ")}</span>
              </summary>
              <div className="px-4 pb-4">
                {guide.body_md && (
                  <pre className="whitespace-pre-wrap font-sans text-sm text-muted">{guide.body_md}</pre>
                )}
              </div>
            </details>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
