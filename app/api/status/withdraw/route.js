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

  // Look up the registration before deleting it — we need to know if it was
  // a main-list spot (and which match) to decide whether to auto-promote.
  const { data: reg, error: fetchErr } = await supabase
    .from('registrations')
    .select('id, type, match_id')
    .eq('id', registration_id)
    .single();

  if (fetchErr || !reg) {
    return NextResponse.json({ error: 'التسجيل غير موجود.' }, { status: 404 });
  }

  const { error: deleteErr } = await supabase.from('registrations').delete().eq('id', registration_id);

  if (deleteErr) {
    return NextResponse.json({ error: deleteErr.message }, { status: 500 });
  }

  let promotedName = null;

  // Only a main-list withdrawal opens a real spot — a bench withdrawal just
  // removes them from the queue, nothing to fill.
  if (reg.type === 'main') {
    const { data: nextBench } = await supabase
      .from('registrations')
      .select('id, players(name)')
      .eq('match_id', reg.match_id)
      .eq('type', 'bench')
      .eq('rejected', false)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (nextBench) {
      const { error: promoteErr } = await supabase
        .from('registrations')
        .update({ type: 'main', paid: false, approved: false, rejected: false })
        .eq('id', nextBench.id);

      if (!promoteErr) {
        promotedName = nextBench.players?.name || null;
      }
    }
  }

  return NextResponse.json({
    ok: true,
    message: promotedName
      ? `تم سحب اسمك من المباراة. تمت ترقية ${promotedName} تلقائياً من الاحتياط لملء مكانك.`
      : 'تم سحب اسمك من المباراة.',
  });
}