import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { registration_id } = body;
  if (!registration_id) return NextResponse.json({ error: 'Missing registration_id.' }, { status: 400 });

  const supabase = supabaseServer();
  const { error } = await supabase
    .from('registrations')
    .update({ approved: true })
    .eq('id', registration_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
