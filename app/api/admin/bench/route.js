import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { noStoreJson } from '@/lib/noStoreJson';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const match_id = searchParams.get('match_id');
  if (!match_id) return noStoreJson({ error: 'Missing match_id.' }, { status: 400 });

  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from('registrations')
    .select('id, created_at, players(id, name, phone)')
    .eq('match_id', match_id)
    .eq('type', 'bench')
    .eq('rejected', false)
    .order('created_at', { ascending: true });

  if (error) return noStoreJson({ error: error.message }, { status: 500 });
  return noStoreJson({ bench: data });
}
