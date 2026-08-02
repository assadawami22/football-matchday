import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { claim_id } = body;
  if (!claim_id) return NextResponse.json({ error: 'Missing claim_id.' }, { status: 400 });

  const supabase = supabaseServer();

  const { data: claim, error: claimErr } = await supabase
    .from('late_fee_payments')
    .select('id, player_id, amount')
    .eq('id', claim_id)
    .single();

  if (claimErr || !claim) {
    return NextResponse.json({ error: 'Claim not found.' }, { status: 404 });
  }

  const { error: updateClaimErr } = await supabase
    .from('late_fee_payments')
    .update({ approved: true })
    .eq('id', claim_id);

  if (updateClaimErr) return NextResponse.json({ error: updateClaimErr.message }, { status: 500 });

  const { error: playerErr } = await supabase
    .from('players')
    .update({ status: 'normal', balance: 0 })
    .eq('id', claim.player_id);

  if (playerErr) return NextResponse.json({ error: playerErr.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
