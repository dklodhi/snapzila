/**
 * Public shell — wraps header + main + footer.
 * Use in public-facing pages (home, opportunities, search, etc.).
 */
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";

export async function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
