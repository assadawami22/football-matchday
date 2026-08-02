import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { registration_id } = body;
  if (!registration_id) {
    return NextResponse.json({ error: 'معرف التسجيل مفقود.' }, { status: 400 });
  }

  const supabase = supabaseServer();

  // Deleting (rather than flagging) frees the spot immediately — a main-list
  // withdrawal opens a slot the admin can promote a bench player into, and a
  // bench withdrawal just removes them from the queue. Either way the player
  // can register again fresh later if they want to.
  const { error } = await supabase.from('registrations').delete().eq('id', registration_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: 'تم سحب اسمك من المباراة.' });
}
