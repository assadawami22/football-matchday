import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { player_id } = body;

  if (!player_id) {
    return NextResponse.json({ error: 'معرف اللاعب مفقود.' }, { status: 400 });
  }

  const supabase = supabaseServer();

  const { data: player, error: playerErr } = await supabase
    .from('players')
    .select('id, status, balance')
    .eq('id', player_id)
    .single();

  if (playerErr || !player) {
    return NextResponse.json({ error: 'اللاعب غير موجود.' }, { status: 404 });
  }

  if (player.status !== 'locked') {
    return NextResponse.json({ error: 'هذا اللاعب غير محظور.' }, { status: 400 });
  }

  const { data: existingClaim } = await supabase
    .from('late_fee_payments')
    .select('id')
    .eq('player_id', player_id)
    .eq('approved', false)
    .maybeSingle();

  if (existingClaim) {
    return NextResponse.json({ ok: true, message: 'تم الإرسال مسبقاً، بانتظار موافقة المسؤول.' });
  }

  const { error } = await supabase
    .from('late_fee_payments')
    .insert({ player_id, amount: player.balance });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: 'تم إرسال طلب الدفع. بانتظار موافقة المسؤول.' });
}
