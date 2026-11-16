"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

function ConsoleLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    errorParam === "not_team_member"
      ? "You are logged in, but your account is not a team member. Ask a super admin to add you."
      : errorParam === "forbidden"
      ? "You don't have permission to access that page."
      : null
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (!data.user) {
      setError("Login failed. Please try again.");
      setLoading(false);
      return;
    }

    // Check team_members via RLS (the user can read their own row)
    const { data: teamMember } = await supabase
      .from("team_members")
      .select("role, status")
      .eq("user_id", data.user.id)
      .eq("status", "active")
      .maybeSingle();

    if (!teamMember) {
      // Sign them out — they're not a team member.
      await supabase.auth.signOut();
      setError(
        "Your account is not a team member. Ask a super admin to add you to the team_members table."
      );
      setLoading(false);
      return;
    }

    router.push("/console");
    router.refresh();
  }

  return (
    <Card className="w-full max-w-md border-line-soft/20 bg-ink-soft text-white">
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl text-white">Console Login</CardTitle>
            <CardDescription className="text-muted-soft">
              Team access only — Super Admin / Admin / Content Writer
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@snapzila.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              className="border-line-soft/30 bg-white text-ink"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-white">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="border-line-soft/30 bg-white text-ink"
            />
          </div>
          {error && (
            <div className="rounded-md bg-danger/20 p-3 text-sm text-danger">
              {error}
            </div>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign in to Console"}
          </Button>
        </form>
        <div className="mt-4 text-center text-sm text-muted-soft">
          Not a team member?{" "}
          <Link href="/" className="text-brand-accent hover:underline">
            Go to public site
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ConsoleLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-ink px-4">
      <Suspense fallback={<div className="text-muted-soft">Loading...</div>}>
        <ConsoleLoginForm />
      </Suspense>
    </main>
  );
}
