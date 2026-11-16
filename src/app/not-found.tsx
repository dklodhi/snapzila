import Link from "next/link";
import { PublicShell } from "@/components/public/public-shell";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <PublicShell>
      <div className="container-app flex min-h-[60vh] flex-col items-center justify-center text-center">
        <p className="font-display text-6xl font-bold text-brand">404</p>
        <h1 className="mt-2 font-display text-xl font-semibold text-ink">Page not found</h1>
        <p className="mt-1 text-sm text-muted">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="mt-6 flex gap-2">
          <Button asChild>
            <Link href="/">Go Home</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/opportunities">Browse Opportunities</Link>
          </Button>
        </div>
      </div>
    </PublicShell>
  );
}
