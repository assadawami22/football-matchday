import { NextResponse } from 'next/server';

// export const dynamic = 'force-dynamic' stops Next.js from statically
// caching a route, but on Vercel's edge network that alone has not been
// reliably preventing stale GET responses from being served. Setting these
// headers explicitly forces every layer (browser, Vercel edge, any proxy)
// to skip caching entirely.
export function noStoreJson(body, init) {
  const res = NextResponse.json(body, init);
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.headers.set('Pragma', 'no-cache');
  return res;
}
