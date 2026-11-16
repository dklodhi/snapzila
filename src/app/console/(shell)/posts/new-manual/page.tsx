import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EventCoreForm } from "../EventCoreForm";

export default function NewPostManualPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
          <Link href="/console/posts">← Back to Posts</Link>
        </Button>
        <h1 className="font-display text-2xl font-bold text-ink">New Post (Manual)</h1>
        <p className="mt-1 text-sm text-muted">
          Fill the form below. After creating, you can add live updates, guide sections, and dates.
        </p>
      </div>
      <EventCoreForm />
    </div>
  );
}
