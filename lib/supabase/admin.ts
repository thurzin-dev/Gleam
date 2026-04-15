// SECURITY: This module uses the SUPABASE_SERVICE_ROLE_KEY, which BYPASSES Row Level Security.
// It must NEVER be imported by client-side code or any module reachable from the browser.
// The `server-only` import will cause a build-time error if this file is accidentally
// included in a client bundle.
import "server-only";

import { createClient } from "@supabase/supabase-js";

// Only call this for operations that legitimately need to bypass RLS:
//   - Creating a user account + profile in a single transaction (no session yet)
//   - Admin invite flows where the caller's session must not be replaced
// Document the reason at every call site.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set"
    );
  }

  return createClient(url, serviceKey, {
    auth: {
      // Disable auto-refresh and session persistence — this is a short-lived
      // server-side admin client, not a user session.
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
