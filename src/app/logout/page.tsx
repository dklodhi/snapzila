"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    async function signOut() {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    }
    signOut();
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg-subtle">
      <p className="text-muted">Logging out...</p>
    </main>
  );
}
