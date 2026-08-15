import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Bypasses RLS. Server-only — never import this from a "use client" file
// or anything reachable from the browser (portal_tokens has zero RLS
// policies for anon/authenticated by design; this is the only client
// allowed to touch it, per CLAUDE.md's Portal security rule).
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
