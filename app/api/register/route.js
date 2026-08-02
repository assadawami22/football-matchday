import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { attemptRegistration } from '@/lib/registration';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { player_id, match_id, phone, paid } = body;

  if (!player_id || !match_id) {
    return NextResponse.json({ error: 'بيانات المباراة أو اللاعب ناقصة.' }, { status: 400 });
  }

  const supabase = supabaseServer();

  const { data: player, error: playerErr } = await supabase
    .from('players')
    .select('id, name, status, balance')
    .eq('id', player_id)
    .single();

  if (playerErr || !player) {
    return NextResponse.json({ error: 'اللاعب غير موجود.' }, { status: 404 });
  }

  const result = await attemptRegistration(supabase, { player, match_id, phone, paid });
  return NextResponse.json(result.body, { status: result.status });
}
