import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { noStoreJson } from '@/lib/noStoreJson';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const match_id = searchParams.get('match_id');

  const supabase = supabaseServer();

  let match = null;

  if (match_id) {
    const { data } = await supabase.from('matches').select('*').eq('id', match_id).single();
    match = data;
  } else {
    const { data } = await supabase
      .from('matches')
      .select('*')
      .eq('status', 'open')
      .order('match_date', { ascending: true })
      .limit(1)
      .maybeSingle();
    match = data;
  }

  if (!match) {
    const { data: lockedPlayers } = await supabase
      .from('players')
      .select('id, name, balance')
      .eq('status', 'locked')
      .order('name');
    return noStoreJson({ match: null, main: [], bench: [], locked: lockedPlayers || [] });
  }

  const { data: regs } = await supabase
    .from('registrations')
    .select('id, type, paid, approved, rejected, created_at, players(id, name)')
    .eq('match_id', match.id)
    .eq('rejected', false)
    .order('created_at', { ascending: true });

  const main = (regs || []).filter((r) => r.type === 'main');
  const bench = (regs || []).filter((r) => r.type === 'bench');

  const { data: lockedPlayers } = await supabase
    .from('players')
    .select('id, name, balance')
    .eq('status', 'locked')
    .order('name');

  return noStoreJson({
    match,
    main,
    bench,
    locked: lockedPlayers || [],
  });
}
