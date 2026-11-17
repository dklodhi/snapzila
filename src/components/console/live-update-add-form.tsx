"use client";

/**
 * Live Update Add Form — client component.
 * Shows corrigendum_fields checkboxes conditionally when kind=corrigendum.
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UPDATE_TYPES, CORRIGENDUM_FIELDS } from "@/lib/constants/editor";

export function LiveUpdateAddForm({ action }: { action: (formData: FormData) => Promise<void> }) {
  const [kind, setKind] = useState("new");
  const [corrigendumFields, setCorrigendumFields] = useState<string[]>([]);
  const [pending, setPending] = useState(false);

  function toggleField(field: string) {
    setCorrigendumFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const formData = new FormData(e.target as HTMLFormElement);
    // Add corrigendum fields as multiple entries
    corrigendumFields.forEach((f) => formData.append("corrigendum_fields", f));
    try {
      await action(formData);
    } catch {
      // Error handled by form
    }
    setPending(false);
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-md border border-line p-3 space-y-3">
      <p className="text-xs font-medium uppercase text-muted">Add Live Update</p>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs text-muted">Update Type</label>
          <select
            name="kind"
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            className="flex h-9 w-full rounded-md border border-line bg-white px-2 text-sm"
          >
            {UPDATE_TYPES.map((k) => (
              <option key={k.value} value={k.value}>{k.icon} {k.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted">Title</label>
          <input name="title" required className="flex h-9 w-full rounded-md border border-line bg-white px-2 text-sm" />
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-xs text-muted">Body (Markdown)</label>
        <textarea name="body_md" rows={3} className="flex w-full rounded-md border border-line bg-white px-2 py-1.5 font-mono text-sm" />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-muted">Doc URL (optional)</label>
        <input name="doc_url" type="url" className="flex h-9 w-full rounded-md border border-line bg-white px-2 text-sm" />
      </div>

      {/* Corrigendum fields — shown only when kind=corrigendum */}
      {kind === "corrigendum" && (
        <div className="rounded-md bg-warning-subtle/30 border border-warning/20 p-3 space-y-2">
          <p className="text-xs font-medium text-warning">What does this corrigendum affect?</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
            {CORRIGENDUM_FIELDS.map((cf) => {
              const checked = corrigendumFields.includes(cf.value);
              return (
                <label
                  key={cf.value}
                  className={`cursor-pointer rounded-md border px-2 py-1.5 text-xs ${
                    checked ? "border-warning bg-warning-subtle text-warning" : "border-line text-muted hover:bg-bg-subtle"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleField(cf.value)}
                    className="mr-1.5"
                  />
                  {cf.label}
                </label>
              );
            })}
          </div>
        </div>
      )}

      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Adding..." : "Add Update"}
      </Button>
    </form>
  );
}
