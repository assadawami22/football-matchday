import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { noStoreJson } from '@/lib/noStoreJson';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim();

  const supabase = supabaseServer();

  let query = supabase
    .from('players')
    .select('id, name, status')
    .order('name', { ascending: true });

  if (q.length > 0) {
    query = query.ilike('name', `%${q}%`).limit(15);
  } else {
    // No query yet — show the roster alphabetically so the field behaves
    // like a real dropdown, not just a typeahead search.
    query = query.limit(50);
  }

  const { data, error } = await query;

  if (error) {
    return noStoreJson({ error: error.message }, { status: 500 });
  }

  return noStoreJson({ players: data });
}
