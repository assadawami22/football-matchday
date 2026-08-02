import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { match_id } = body;
  if (!match_id) return NextResponse.json({ error: 'Missing match_id.' }, { status: 400 });

  const supabase = supabaseServer();

  // registrations reference matches with ON DELETE CASCADE, so deleting
  // the match also removes its registrations automatically.
  const { error } = await supabase.from('matches').delete().eq('id', match_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
