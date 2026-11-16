"use client";

/**
 * Console top bar.
 * New Post dropdown (Manual / JSON paste) + user menu.
 */
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, FileText, Code2, LogOut, ExternalLink } from "lucide-react";
import type { TeamMember } from "@/lib/auth/types";

export function ConsoleTopbar({ teamMember }: { teamMember: TeamMember }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);

  return (
    <header className="flex h-14 items-center justify-between border-b border-line bg-white px-4">
      {/* Left: New Post dropdown */}
      <div className="relative">
        <button
          onClick={() => setNewOpen((v) => !v)}
          onBlur={() => setTimeout(() => setNewOpen(false), 150)}
          className="inline-flex items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-hover"
        >
          <FileText className="h-4 w-4" />
          New Post
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
        {newOpen && (
          <div className="absolute left-0 top-full z-50 mt-1 w-48 rounded-md border border-line bg-white py-1 shadow-md">
            <Link
              href="/console/posts/new-manual"
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-ink hover:bg-bg-subtle"
              onMouseDown={(e) => e.preventDefault()}
            >
              <FileText className="h-4 w-4 text-muted" />
              Manual Editor
            </Link>
            <Link
              href="/console/posts/new-json"
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-ink hover:bg-bg-subtle"
              onMouseDown={(e) => e.preventDefault()}
            >
              <Code2 className="h-4 w-4 text-muted" />
              JSON Paste
            </Link>
          </div>
        )}
      </div>

      {/* Right: user menu */}
      <div className="relative">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          onBlur={() => setTimeout(() => setMenuOpen(false), 150)}
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-bg-subtle"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-xs font-medium text-white">
            {(teamMember.email[0] ?? "?").toUpperCase()}
          </div>
          <div className="hidden text-left sm:block">
            <div className="text-xs font-medium text-ink">{teamMember.email}</div>
            <div className="text-[10px] uppercase text-muted">{teamMember.role.replace("_", " ")}</div>
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-muted" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-md border border-line bg-white py-1 shadow-md">
            <Link
              href="/"
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-ink hover:bg-bg-subtle"
              onMouseDown={(e) => e.preventDefault()}
            >
              <ExternalLink className="h-4 w-4 text-muted" />
              View Public Site
            </Link>
            <button
              onClick={() => router.push("/logout")}
              onMouseDown={(e) => e.preventDefault()}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-ink hover:bg-bg-subtle"
            >
              <LogOut className="h-4 w-4 text-muted" />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
