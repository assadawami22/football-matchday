import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { registration_id } = body;
  if (!registration_id) return NextResponse.json({ error: 'Missing registration_id.' }, { status: 400 });

  const supabase = supabaseServer();

  const { data: reg, error: regErr } = await supabase
    .from('registrations')
    .select('id, type, match_id, players(id, name, phone), matches(match_fee, main_capacity)')
    .eq('id', registration_id)
    .single();

  if (regErr || !reg) return NextResponse.json({ error: 'Registration not found.' }, { status: 404 });
  if (reg.type !== 'bench') return NextResponse.json({ error: 'This player is not on the bench.' }, { status: 400 });

  const { count } = await supabase
    .from('registrations')
    .select('id', { count: 'exact', head: true })
    .eq('match_id', reg.match_id)
    .eq('type', 'main')
    .eq('rejected', false);

  if ((count || 0) >= reg.matches.main_capacity) {
    return NextResponse.json({ error: 'The main list is already full.' }, { status: 400 });
  }

  const { error } = await supabase
    .from('registrations')
    .update({ type: 'main', paid: false, approved: false })
    .eq('id', registration_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    ok: true,
    player: reg.players,
    match_fee: reg.matches.match_fee,
  });
}
