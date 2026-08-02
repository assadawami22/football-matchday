import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { request_id } = body;
  if (!request_id) return NextResponse.json({ error: 'Missing request_id.' }, { status: 400 });

  const supabase = supabaseServer();

  const { data: reqRow, error: reqErr } = await supabase
    .from('player_add_requests')
    .select('id, name, phone')
    .eq('id', request_id)
    .single();

  if (reqErr || !reqRow) return NextResponse.json({ error: 'Request not found.' }, { status: 404 });

  const { error: insertErr } = await supabase
    .from('players')
    .insert({ name: reqRow.name, phone: reqRow.phone });

  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

  await supabase.from('player_add_requests').update({ status: 'approved' }).eq('id', request_id);

  return NextResponse.json({ ok: true });
}
