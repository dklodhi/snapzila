/**
 * Supabase browser client.
 * Use in Client Components and client-side hooks.
 * Reads cookies set by the server client / middleware.
 */
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
