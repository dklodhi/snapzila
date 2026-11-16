import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PublicShell } from "@/components/public/public-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "lucide-react";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function getMonthDays(year: number, month: number): Array<{ date: Date | null; day: number | null }> {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startWeekday = firstDay.getDay();
  const totalDays = lastDay.getDate();

  const days: Array<{ date: Date | null; day: number | null }> = [];
  for (let i = 0; i < startWeekday; i++) {
    days.push({ date: null, day: null });
  }
  for (let d = 1; d <= totalDays; d++) {
    days.push({ date: new Date(year, month, d), day: d });
  }
  while (days.length % 7 !== 0) {
    days.push({ date: null, day: null });
  }
  return days;
}

export default async function ExamCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const sp = await searchParams;
  const now = new Date();
  const year = sp.year ? parseInt(sp.year, 10) : now.getFullYear();
  const month = sp.month !== undefined ? parseInt(sp.month, 10) : now.getMonth();

  const supabase = await createClient();

  // Fetch events with exam_date in this month
  const monthStart = new Date(year, month, 1).toISOString().split("T")[0];
  const monthEnd = new Date(year, month + 1, 0).toISOString().split("T")[0];

  const { data: events } = await supabase
    .from("events")
    .select("id, type, slug, title, exam_date, conducting_body")
    .eq("status", "published")
    .is("deleted_at", null)
    .not("exam_date", "is", null)
    .gte("exam_date", monthStart)
    .lte("exam_date", monthEnd)
    .order("exam_date");

  // Fetch overrides in this month
  const { data: overrides } = await supabase
    .from("exam_calendar_overrides")
    .select("id, exam_name, date, category, url, notes")
    .gte("date", monthStart)
    .lte("date", monthEnd)
    .order("date");

  // Build a map: date string → array of items
  const itemsByDate = new Map<string, Array<{ title: string; href?: string; type: string; conductingBody?: string | null }>>();

  for (const event of events ?? []) {
    const dateStr = event.exam_date;
    if (!dateStr) continue;
    const arr = itemsByDate.get(dateStr) ?? [];
    arr.push({
      title: event.title,
      href: `/opportunities/${event.type}/${event.slug}`,
      type: event.type,
      conductingBody: event.conducting_body,
    });
    itemsByDate.set(dateStr, arr);
  }

  for (const ov of overrides ?? []) {
    const dateStr = ov.date;
    const arr = itemsByDate.get(dateStr) ?? [];
    arr.push({
      title: ov.exam_name,
      href: ov.url ?? undefined,
      type: ov.category,
      conductingBody: null,
    });
    itemsByDate.set(dateStr, arr);
  }

  const days = getMonthDays(year, month);
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;

  const weekdayHeaders = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <PublicShell>
      <div className="container-app py-8">
        <div className="flex items-center gap-2">
          <Calendar className="h-6 w-6 text-brand" />
          <h1 className="font-display text-3xl font-bold text-ink">Exam Calendar</h1>
        </div>
        <p className="mt-1 text-muted">Upcoming exam dates across all opportunity types.</p>

        {/* Month navigation */}
        <div className="mt-6 flex items-center justify-between">
          <Link
            href={`/tools/exam-calendar?month=${prevMonth}&year=${prevYear}`}
            className="rounded-md border border-line px-3 py-1.5 text-sm hover:bg-bg-subtle"
          >
            ← {MONTH_NAMES[prevMonth]} {prevYear}
          </Link>
          <h2 className="font-display text-xl font-semibold text-ink">
            {MONTH_NAMES[month]} {year}
          </h2>
          <Link
            href={`/tools/exam-calendar?month=${nextMonth}&year=${nextYear}`}
            className="rounded-md border border-line px-3 py-1.5 text-sm hover:bg-bg-subtle"
          >
            {MONTH_NAMES[nextMonth]} {nextYear} →
          </Link>
        </div>

        {/* Calendar grid */}
        <Card className="mt-4 overflow-hidden">
          <div className="grid grid-cols-7 border-b border-line bg-bg-subtle">
            {weekdayHeaders.map((d) => (
              <div key={d} className="px-2 py-2 text-center text-xs font-medium uppercase text-muted">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((day, i) => {
              const dateStr = day.date ? day.date.toISOString().split("T")[0] : null;
              const dayItems = dateStr ? itemsByDate.get(dateStr) ?? [] : [];
              const isToday = day.date && day.date.toDateString() === now.toDateString();

              return (
                <div
                  key={i}
                  className={`min-h-[100px] border-b border-r border-line-soft p-1.5 ${
                    day.date ? "bg-white" : "bg-bg-subtle/50"
                  } ${(i + 1) % 7 === 0 ? "border-r-0" : ""}`}
                >
                  {day.day && (
                    <>
                      <div className={`mb-1 text-xs font-medium ${isToday ? "flex h-5 w-5 items-center justify-center rounded-full bg-brand text-white" : "text-muted"}`}>
                        {day.day}
                      </div>
                      <div className="space-y-1">
                        {dayItems.slice(0, 3).map((item, j) => (
                          <div key={j}>
                            {item.href ? (
                              <Link
                                href={item.href}
                                className="block rounded bg-brand-subtle px-1.5 py-0.5 text-[10px] text-brand hover:bg-brand hover:text-white"
                              >
                                <span className="line-clamp-1">{item.title}</span>
                              </Link>
                            ) : (
                              <div className="rounded bg-bg-muted px-1.5 py-0.5 text-[10px] text-muted">
                                <span className="line-clamp-1">{item.title}</span>
                              </div>
                            )}
                          </div>
                        ))}
                        {dayItems.length > 3 && (
                          <div className="text-[10px] text-muted">+{dayItems.length - 3} more</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* List view */}
        {itemsByDate.size > 0 && (
          <div className="mt-6">
            <h2 className="font-display text-lg font-semibold text-ink">All exams this month</h2>
            <div className="mt-3 space-y-2">
              {Array.from(itemsByDate.entries())
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([dateStr, items]) => (
                  <div key={dateStr} className="rounded-md border border-line-soft p-3">
                    <p className="text-xs font-medium uppercase text-muted">
                      {new Date(dateStr).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
                    </p>
                    <div className="mt-1.5 space-y-1">
                      {items.map((item, j) => (
                        <div key={j}>
                          {item.href ? (
                            <Link href={item.href} className="text-sm text-brand hover:underline">
                              {item.title}
                            </Link>
                          ) : (
                            <span className="text-sm text-ink">{item.title}</span>
                          )}
                          {item.conductingBody && (
                            <span className="ml-2 text-xs text-muted">· {item.conductingBody}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </PublicShell>
  );
}
