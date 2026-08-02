import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { noStoreJson } from '@/lib/noStoreJson';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function GET() {
  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from('registrations')
    .select('id, type, paid, approved, created_at, players(id, name, phone), matches(match_date, day_type)')
    .eq('type', 'main')
    .eq('paid', true)
    .eq('approved', false)
    .eq('rejected', false)
    .order('created_at', { ascending: true });

  if (error) return noStoreJson({ error: error.message }, { status: 500 });
  return noStoreJson({ pending: data });
}
