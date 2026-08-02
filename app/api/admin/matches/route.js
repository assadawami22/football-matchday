import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .order('match_date', { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ matches: data });
}

// Open a new match for registration
export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { match_date, day_type, main_capacity, bench_capacity, match_fee } = body;

  if (!match_date || !day_type) {
    return NextResponse.json({ error: 'match_date and day_type are required.' }, { status: 400 });
  }

  const supabase = supabaseServer();
  const { data: settingsRows } = await supabase.from('settings').select('key, value');
  const settings = Object.fromEntries((settingsRows || []).map((r) => [r.key, r.value]));

  const { data, error } = await supabase
    .from('matches')
    .insert({
      match_date,
      day_type,
      status: 'open',
      main_capacity: main_capacity || 18,
      bench_capacity: bench_capacity || 5,
      match_fee: match_fee || Number(settings.match_fee || 15),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, match: data });
}
