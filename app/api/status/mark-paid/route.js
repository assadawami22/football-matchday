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

  const { data: reg, error: regErr } = await supabase
    .from('registrations')
    .select('id, type, paid')
    .eq('id', registration_id)
    .single();

  if (regErr || !reg) {
    return NextResponse.json({ error: 'التسجيل غير موجود.' }, { status: 404 });
  }

  if (reg.type !== 'main') {
    return NextResponse.json({ error: 'فقط أماكن القائمة الأساسية تتطلب تأكيد الدفع.' }, { status: 400 });
  }

  const { error } = await supabase
    .from('registrations')
    .update({ paid: true })
    .eq('id', registration_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: 'تم التأكيد كمدفوع. بانتظار موافقة المسؤول.' });
}
