import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { player_id } = body;
  if (!player_id) return NextResponse.json({ error: 'Missing player_id.' }, { status: 400 });

  const supabase = supabaseServer();

  const { data: settingsRows } = await supabase.from('settings').select('key, value').eq('key', 'late_fee');
  const lateFee = Number(settingsRows?.[0]?.value || 10);

  const { data: player, error: playerErr } = await supabase
    .from('players')
    .select('id, balance')
    .eq('id', player_id)
    .single();

  if (playerErr || !player) return NextResponse.json({ error: 'Player not found.' }, { status: 404 });

  const { error } = await supabase
    .from('players')
    .update({ status: 'locked', balance: Number(player.balance) + lateFee })
    .eq('id', player_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, lateFee });
}
