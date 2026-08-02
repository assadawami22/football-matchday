import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { noStoreJson } from '@/lib/noStoreJson';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const player_id = searchParams.get('player_id');

  if (!player_id) {
    return noStoreJson({ error: 'معرف اللاعب مفقود.' }, { status: 400 });
  }

  const supabase = supabaseServer();

  const { data: player, error: playerErr } = await supabase
    .from('players')
    .select('id, name, status, balance')
    .eq('id', player_id)
    .single();

  if (playerErr || !player) {
    return noStoreJson({ error: 'اللاعب غير موجود.' }, { status: 404 });
  }

  const { data: regs } = await supabase
    .from('registrations')
    .select('id, type, paid, approved, rejected, match_id, matches(match_date, day_type, match_fee, status)')
    .eq('player_id', player_id)
    .order('created_at', { ascending: false });

  const { data: pendingLateFee } = await supabase
    .from('late_fee_payments')
    .select('id, amount, approved')
    .eq('player_id', player_id)
    .eq('approved', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return noStoreJson({
    player,
    registrations: regs || [],
    pendingLateFeeClaim: pendingLateFee || null,
  });
}
