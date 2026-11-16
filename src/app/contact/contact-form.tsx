"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitContact } from "@/lib/tools/actions";

const CATEGORIES = ["General", "Bug Report", "Feature Request", "Content Correction", "Partnership", "Other"];

export function ContactForm({ submitted }: { submitted: boolean }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const formData = new FormData(e.target as HTMLFormElement);
    try {
      await submitContact(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
      setPending(false);
    }
  }

  if (submitted) {
    return (
      <Card className="mx-auto w-full max-w-lg">
        <CardHeader>
          <CardTitle>Message sent!</CardTitle>
          <CardDescription>Thank you for reaching out. We&apos;ll get back to you soon.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="mx-auto w-full max-w-lg">
      <CardHeader>
        <CardTitle>Contact Us</CardTitle>
        <CardDescription>Have a question, feedback, or correction? Send us a message.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="category">Category</Label>
            <select id="category" name="category" className="flex h-10 w-full rounded-md border border-line bg-white px-3 text-sm">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" name="subject" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="body">Message</Label>
            <textarea id="body" name="body" rows={5} required className="flex w-full rounded-md border border-line bg-white px-3 py-2 text-sm" />
          </div>
          {error && <div className="rounded-md bg-danger-subtle p-3 text-sm text-danger">{error}</div>}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Sending..." : "Send Message"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
