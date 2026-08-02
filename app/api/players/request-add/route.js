import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { attemptRegistration } from '@/lib/registration';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const name = (body.name || '').trim();
  const phone = (body.phone || '').trim();
  const match_id = body.match_id || null;
  const paid = !!body.paid;

  if (!name) {
    return NextResponse.json({ error: 'الاسم مطلوب.' }, { status: 400 });
  }

  const supabase = supabaseServer();

  // Avoid creating a duplicate if this exact name already exists on the
  // roster (e.g. two people submitting the same missing name at once).
  const { data: existingPlayer } = await supabase
    .from('players')
    .select('id, name, status, balance')
    .ilike('name', name)
    .maybeSingle();

  let player = existingPlayer;

  if (!player) {
    const { data: created, error: createErr } = await supabase
      .from('players')
      .insert({ name, phone })
      .select('id, name, status, balance')
      .single();

    if (createErr) {
      return NextResponse.json({ error: createErr.message }, { status: 500 });
    }
    player = created;
  }

  if (!match_id) {
    return NextResponse.json({
      ok: true,
      message: 'تمت إضافتك للقائمة. يمكنك التسجيل الآن.',
    });
  }

  const result = await attemptRegistration(supabase, { player, match_id, phone, paid });

  if (result.status === 200) {
    return NextResponse.json({
      ok: true,
      type: result.body.type,
      message: `تمت إضافتك للقائمة، و${result.body.message}`,
    });
  }

  // Roster addition still succeeded even if the registration step didn't
  // (e.g. match already full) — say so clearly rather than showing a
  // generic error, since the person is not left stuck as "not found" anymore.
  return NextResponse.json({
    ok: true,
    message: `تمت إضافتك للقائمة، لكن لم يتم تسجيلك لهذه المباراة: ${result.body.error || result.body.message}`,
  });
}
