import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { noStoreJson } from '@/lib/noStoreJson';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function GET() {
  const supabase = supabaseServer();

  const { data: matches, error } = await supabase
    .from('matches')
    .select('id, match_date, day_type, status, main_capacity, bench_capacity, match_fee')
    .eq('status', 'open')
    .order('match_date', { ascending: true });

  if (error) {
    return noStoreJson({ error: error.message }, { status: 500 });
  }

  // Attach live counts so the UI can show "12/18 confirmed, 3/5 bench"
  const withCounts = await Promise.all(
    matches.map(async (m) => {
      const { data: regs } = await supabase
        .from('registrations')
        .select('type, approved, rejected')
        .eq('match_id', m.id)
        .eq('rejected', false);

      const main = (regs || []).filter((r) => r.type === 'main').length;
      const bench = (regs || []).filter((r) => r.type === 'bench').length;

      return { ...m, main_count: main, bench_count: bench };
    })
  );

  return noStoreJson({ matches: withCounts });
}
