/**
 * Event important dates list.
 */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";

interface DateData {
  id: string;
  label: string;
  date: string;
  url?: string | null;
  sort_order: number;
}

export function EventDates({ dates }: { dates: DateData[] }) {
  if (!dates || dates.length === 0) return null;

  const sorted = [...dates].sort((a, b) => a.sort_order - b.sort_order || new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <Card>
      <CardHeader className="border-b border-line bg-bg-subtle py-2.5">
        <CardTitle className="flex items-center gap-1.5 text-sm">
          <Calendar className="h-3.5 w-3.5 text-muted" />
          Important Dates
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-line-soft">
          {sorted.map((d) => (
            <div key={d.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <span className="text-ink">{d.label}</span>
              <div className="flex items-center gap-3">
                <span className="text-muted">
                  {new Date(d.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </span>
                {d.url && (
                  <a href={d.url} target="_blank" rel="noreferrer" className="text-xs text-brand hover:underline">
                    Link ↗
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
