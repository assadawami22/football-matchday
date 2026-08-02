import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { claim_id } = body;
  if (!claim_id) return NextResponse.json({ error: 'Missing claim_id.' }, { status: 400 });

  const supabase = supabaseServer();
  const { error } = await supabase.from('late_fee_payments').delete().eq('id', claim_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
