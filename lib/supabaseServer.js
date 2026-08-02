import { createClient } from '@supabase/supabase-js';

// SERVER-ONLY. Never import this file from a client component.
// Uses the service role key, which bypasses Row Level Security.
// That's intentional here — this app has no client-side Supabase calls,
// everything goes through our own API routes which apply their own checks.
let cached = null;

export function supabaseServer() {
  if (cached) return cached;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.'
    );
  }

  cached = createClient(url, key, {
    auth: { persistSession: false },
  });

  return cached;
}
