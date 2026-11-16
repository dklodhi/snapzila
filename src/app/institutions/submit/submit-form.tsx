"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitInstitution } from "@/lib/public/institution-actions";

const CATEGORIES = [
  { value: "exams", label: "Exams" },
  { value: "courses", label: "Courses" },
  { value: "universities", label: "Universities" },
  { value: "iits", label: "IITs" },
  { value: "nits", label: "NITs" },
  { value: "iims", label: "IIMs" },
  { value: "aiims", label: "AIIMS" },
  { value: "iiits", label: "IIITs" },
  { value: "nifts", label: "NIFTs" },
  { value: "schools", label: "Schools" },
  { value: "colleges", label: "Colleges" },
  { value: "coaching", label: "Coaching" },
  { value: "training-skill-centres", label: "Training & Skill Centres" },
  { value: "iti", label: "ITI" },
  { value: "fake-universities", label: "Fake Universities" },
  { value: "law-universities", label: "Law Universities" },
];

export function SubmitForm({ submitted }: { submitted: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const formData = new FormData(e.target as HTMLFormElement);
    try {
      await submitInstitution(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
      setPending(false);
    }
  }

  if (submitted) {
    return (
      <Card className="mx-auto w-full max-w-lg">
        <CardHeader>
          <CardTitle>Thank you!</CardTitle>
          <CardDescription>
            Your institution submission has been received. Our team will review it
            and publish it if it meets our guidelines.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button asChild size="sm">
              <Link href="/institutions">Browse Institutions</Link>
            </Button>
            <Button asChild variant="secondary" size="sm">
              <Link href="/institutions/submit">Submit Another</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto w-full max-w-lg">
      <CardHeader>
        <CardTitle>Submit an Institution</CardTitle>
        <CardDescription>
          Know an institution that should be listed? Submit it here. Our team will
          review and publish it.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="category">Category</Label>
            <select id="category" name="category" required className="flex h-10 w-full rounded-md border border-line bg-white px-3 text-sm">
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="name">Institution Name</Label>
            <Input id="name" name="name" required placeholder="e.g. Indian Institute of Technology Delhi" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" placeholder="New Delhi" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="state">State</Label>
              <Input id="state" name="state" placeholder="Delhi" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="website">Website</Label>
            <Input id="website" name="website" type="url" placeholder="https://..." />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <textarea id="description" name="description" rows={4} className="flex w-full rounded-md border border-line bg-white px-3 py-2 text-sm" placeholder="Brief description..." />
          </div>
          <div className="border-t border-line pt-4">
            <p className="mb-3 text-xs font-medium uppercase text-muted">Your Details</p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="submitter_name">Your Name</Label>
                <Input id="submitter_name" name="submitter_name" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="submitter_email">Your Email</Label>
                <Input id="submitter_email" name="submitter_email" type="email" required />
              </div>
            </div>
          </div>
          {error && <div className="rounded-md bg-danger-subtle p-3 text-sm text-danger">{error}</div>}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Submitting..." : "Submit for Review"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
