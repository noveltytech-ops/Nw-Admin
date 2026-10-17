import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Server-only Supabase client used by the Node runtime API routes.
 * - If SUPABASE_SERVICE_ROLE_KEY is set, uses the service role (bypasses RLS).
 * - Otherwise falls back to the publishable (anon) key — needs permissive RLS
 *   policies on every table or writes will fail.
 */
let _client: SupabaseClient | null = null;

export function createServiceClient(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error('Supabase env vars missing: NEXT_PUBLIC_SUPABASE_URL + a key');
  }
  _client = createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _client;
}
