// Shared registration logic. Given an already-resolved player (existing or
// newly created), attempts to register them for a match — main list if a
// spot is open (requires paid=true), otherwise bench. Returns
// { status, body } so callers can just NextResponse.json(body, { status }).

export async function attemptRegistration(supabase, { player, match_id, phone, paid }) {
  if (player.status === 'locked') {
    return {
      status: 403,
      body: {
        error: 'locked',
        message: `عليك غرامة تأخير غير مدفوعة (${player.balance} ريال). ادفعها أولاً في صفحة الحالة قبل التسجيل.`,
      },
    };
  }

  const { data: match, error: matchErr } = await supabase
    .from('matches')
    .select('*')
    .eq('id', match_id)
    .single();

  if (matchErr || !match || match.status !== 'open') {
    return { status: 400, body: { error: 'هذه المباراة غير مفتوحة للتسجيل.' } };
  }

  const { data: existing } = await supabase
    .from('registrations')
    .select('id, type, paid, approved, rejected')
    .eq('player_id', player.id)
    .eq('match_id', match_id)
    .maybeSingle();

  if (existing && !existing.rejected) {
    if (existing.type === 'main' && !existing.paid) {
      return {
        status: 400,
        body: {
          error: 'تمت ترقيتك لهذه المباراة على القائمة الأساسية — اذهب لصفحة الحالة "حالتي" وأكّد الدفع من هناك.',
        },
      };
    }
    if (existing.type === 'main' && existing.paid && !existing.approved) {
      return { status: 400, body: { error: 'أنت مسجل بالفعل — بانتظار تأكيد المسؤول للدفع.' } };
    }
    return { status: 400, body: { error: 'أنت مسجل بالفعل في هذه المباراة.' } };
  }

  const { data: regs } = await supabase
    .from('registrations')
    .select('type')
    .eq('match_id', match_id)
    .eq('rejected', false);

  const mainCount = (regs || []).filter((r) => r.type === 'main').length;
  const benchCount = (regs || []).filter((r) => r.type === 'bench').length;

  let type;
  let payload;

  if (mainCount < match.main_capacity) {
    if (!paid) {
      return {
        status: 400,
        body: { error: 'يجب تأكيد الدفع عبر STC Pay للانضمام للقائمة الأساسية.' },
      };
    }
    type = 'main';
    payload = { player_id: player.id, match_id, type, paid: true, approved: false, rejected: false };
  } else if (benchCount < match.bench_capacity) {
    type = 'bench';
    payload = { player_id: player.id, match_id, type, paid: false, approved: true, rejected: false };
  } else {
    return {
      status: 400,
      body: { error: 'هذه المباراة مكتملة تماماً، بما في ذلك الاحتياط.' },
    };
  }

  const writeErr = existing
    ? (await supabase.from('registrations').update(payload).eq('id', existing.id)).error
    : (await supabase.from('registrations').insert(payload)).error;

  if (writeErr) {
    return { status: 500, body: { error: writeErr.message } };
  }

  if (phone) {
    await supabase.from('players').update({ phone }).eq('id', player.id);
  }

  return {
    status: 200,
    body: {
      ok: true,
      type,
      message:
        type === 'main'
          ? 'تم تسجيلك في القائمة الأساسية. بانتظار تأكيد المسؤول للدفع.'
          : 'أنت على قائمة الاحتياط. سيُطلب منك الدفع فقط إذا فتح مكان في القائمة الأساسية.',
    },
  };
}
