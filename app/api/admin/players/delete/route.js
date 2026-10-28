import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { player_id } = body;
  if (!player_id) return NextResponse.json({ error: 'معرف اللاعب مفقود.' }, { status: 400 });

  const supabase = supabaseServer();

  // registrations and late_fee_payments reference players with ON DELETE
  // CASCADE, so those rows are removed automatically.
  const { error } = await supabase.from('players').delete().eq('id', player_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}