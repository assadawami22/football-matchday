import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { request_id } = body;
  if (!request_id) return NextResponse.json({ error: 'Missing request_id.' }, { status: 400 });

  const supabase = supabaseServer();
  const { error } = await supabase
    .from('player_add_requests')
    .update({ status: 'rejected' })
    .eq('id', request_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
