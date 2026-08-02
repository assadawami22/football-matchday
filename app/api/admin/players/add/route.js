import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const name = (body.name || '').trim();
  const phone = (body.phone || '').trim();

  if (!name) return NextResponse.json({ error: 'Name is required.' }, { status: 400 });

  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from('players')
    .insert({ name, phone })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, player: data });
}
