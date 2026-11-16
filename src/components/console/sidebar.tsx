"use client";

/**
 * Console sidebar navigation.
 * Highlights the active section via usePathname().
 * Items marked `available: false` are placeholders for later sessions.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Building2,
  LifeBuoy,
  Calendar,
  FileCode2,
  Users,
  Settings,
  ScrollText,
  BarChart3,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  available: boolean;
  session?: string;
}

const NAV_GROUPS: { group: string; items: NavItem[] }[] = [
  {
    group: "Main",
    items: [
      { label: "Dashboard", href: "/console", icon: LayoutDashboard, available: true },
      { label: "Posts", href: "/console/posts", icon: FileText, available: true },
    ],
  },
  {
    group: "Content",
    items: [
      { label: "Institutions", href: "/console/institutions", icon: Building2, available: false, session: "S4" },
      { label: "Helpline", href: "/console/helpline", icon: LifeBuoy, available: false, session: "S5" },
      { label: "Exam Calendar", href: "/console/tools/exam-calendar", icon: Calendar, available: false, session: "S5" },
      { label: "Static Pages", href: "/console/pages", icon: FileCode2, available: true },
    ],
  },
  {
    group: "System",
    items: [
      { label: "Team", href: "/console/team", icon: Users, available: false, session: "later" },
      { label: "Settings", href: "/console/settings", icon: Settings, available: true },
      { label: "Audit Log", href: "/console/audit-log", icon: ScrollText, available: true },
      { label: "Analytics", href: "/console/analytics", icon: BarChart3, available: false, session: "S7" },
    ],
  },
];

export function ConsoleSidebar() {
  const pathname = usePathname();

  function isActive(href: string): boolean {
    if (href === "/console") return pathname === "/console";
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <aside className="flex h-full w-60 flex-col bg-ink text-white">
      <div className="flex h-14 items-center gap-2 border-b border-white/10 px-4">
        <ShieldCheck className="h-5 w-5 text-brand-accent" />
        <span className="font-display font-bold">SnapZila</span>
        <span className="ml-auto rounded bg-white/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-soft">
          Console
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {NAV_GROUPS.map((group) => (
          <div key={group.group} className="mb-4">
            <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-soft/70">
              {group.group}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    {item.available ? (
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                          active
                            ? "bg-brand text-white"
                            : "text-muted-soft hover:bg-white/5 hover:text-white"
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    ) : (
                      <div
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-soft/40 cursor-not-allowed"
                        title={`Coming in ${item.session ?? "a later session"}`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span>{item.label}</span>
                        <span className="ml-auto text-[9px] uppercase">{item.session}</span>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 px-4 py-2 text-[10px] text-muted-soft/60">
        Phase 1 · S2 Console Core
      </div>
    </aside>
  );
}
