"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { createEventFromJson } from "@/lib/console/actions";
import { eventJsonSchema } from "@/lib/console/schemas";

const TYPES = [
  { value: "govt-jobs", label: "Govt Jobs" },
  { value: "admissions", label: "Admissions" },
  { value: "scholarships", label: "Scholarships" },
  { value: "govt-schemes", label: "Govt Schemes" },
  { value: "news", label: "News" },
  { value: "articles", label: "Articles" },
];

export default function NewPostJsonPage() {
  const router = useRouter();
  const [jsonText, setJsonText] = useState("");
  const [validation, setValidation] = useState<{ ok: boolean; errors?: string[] } | null>(null);
  const [createResult, setCreateResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  function loadSample(type: string) {
    fetch(`/json-samples/${type}.sample.json`)
      .then((r) => r.text())
      .then((text) => {
        setJsonText(text);
        setValidation(null);
        setCreateResult(null);
      })
      .catch(() => setCreateResult({ ok: false, message: "Failed to load sample." }));
  }

  function validate() {
    setCreateResult(null);
    try {
      const parsed = JSON.parse(jsonText);
      const result = eventJsonSchema.safeParse(parsed);
      if (result.success) {
        setValidation({ ok: true });
      } else {
        const errors = result.error.issues.map(
          (i) => `${i.path.join(".") || "(root)"}: ${i.message}`
        );
        setValidation({ ok: false, errors });
      }
    } catch (e) {
      setValidation({ ok: false, errors: [`JSON parse error: ${(e as Error).message}`] });
    }
  }

  async function create() {
    setLoading(true);
    setCreateResult(null);
    const result = await createEventFromJson(jsonText);
    setLoading(false);
    if (result.success && result.eventId) {
      setCreateResult({ ok: true, message: `Created! Redirecting to edit page...` });
      setTimeout(() => router.push(`/console/posts/${result.eventId}/edit`), 1000);
    } else {
      setCreateResult({ ok: false, message: result.error ?? "Unknown error" });
    }
  }

  return (
    <div className="p-6">
      <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
        <Link href="/console/posts">← Back to Posts</Link>
      </Button>
      <h1 className="font-display text-2xl font-bold text-ink">New Post (JSON Paste)</h1>
      <p className="mt-1 text-sm text-muted">
        Paste a JSON blob conforming to the schema. Load a sample, validate, then create.
      </p>

      {/* Load sample buttons */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-sm">Load a sample</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <Button key={t.value} variant="secondary" size="sm" onClick={() => loadSample(t.value)}>
              {t.label}
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* JSON editor */}
      <Card className="mt-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm">JSON Payload</CardTitle>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={validate} disabled={!jsonText}>
              Validate
            </Button>
            <Button size="sm" onClick={create} disabled={!jsonText || loading}>
              {loading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
              Create Post
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <textarea
            value={jsonText}
            onChange={(e) => {
              setJsonText(e.target.value);
              setValidation(null);
              setCreateResult(null);
            }}
            rows={24}
            placeholder='{ "schema_version": 1, "type": "govt-jobs", ... }'
            className="w-full rounded-md border border-line bg-ink p-3 font-mono text-sm text-white"
            spellCheck={false}
          />

          {/* Validation result */}
          {validation && (
            <div className={`mt-3 rounded-md p-3 text-sm ${validation.ok ? "bg-success-subtle text-success" : "bg-danger-subtle text-danger"}`}>
              {validation.ok ? (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" /> JSON is valid. Click &ldquo;Create Post&rdquo; to proceed.
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 font-medium">
                    <AlertCircle className="h-4 w-4" /> Validation errors:
                  </div>
                  <ul className="mt-1 list-disc pl-6 text-xs">
                    {validation.errors?.map((err, i) => <li key={i}>{err}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Create result */}
          {createResult && (
            <div className={`mt-3 rounded-md p-3 text-sm ${createResult.ok ? "bg-success-subtle text-success" : "bg-danger-subtle text-danger"}`}>
              {createResult.message}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="mt-3 text-xs text-muted">
        See <code className="rounded bg-bg-muted px-1 py-0.5">docs/json-samples/</code> in the repo for the canonical sample shapes and <code className="rounded bg-bg-muted px-1 py-0.5">src/lib/console/schemas.ts</code> for the Zod validation schema.
      </p>
    </div>
  );
}
