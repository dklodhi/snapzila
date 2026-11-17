"use client";

/**
 * Language switcher — toggles between English (root) and Hindi (/hi-in/).
 * Preserves the current path when switching.
 */
import { usePathname } from "next/navigation";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const pathname = usePathname();

  const isHindi = pathname.startsWith("/hi-in");
  const strippedPath = isHindi ? pathname.slice(6) || "/" : pathname;

  const targetHref = isHindi ? strippedPath : `/hi-in${strippedPath}`;

  return (
    <a
      href={targetHref}
      className="flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-muted hover:bg-bg-subtle hover:text-ink"
      title={isHindi ? "English" : "हिंदी"}
    >
      <Globe className="h-4 w-4" />
      <span className="hidden sm:inline">{isHindi ? "EN" : "हिं"}</span>
    </a>
  );
}
