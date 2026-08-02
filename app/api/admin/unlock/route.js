import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { player_id } = body;
  if (!player_id) return NextResponse.json({ error: 'Missing player_id.' }, { status: 400 });

  const supabase = supabaseServer();

  const { error } = await supabase
    .from('players')
    .update({ status: 'normal', balance: 0 })
    .eq('id', player_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Clean up any pending self-reported claims for this player, since the
  // admin just resolved it directly.
  await supabase.from('late_fee_payments').delete().eq('player_id', player_id).eq('approved', false);

  return NextResponse.json({ ok: true });
}
