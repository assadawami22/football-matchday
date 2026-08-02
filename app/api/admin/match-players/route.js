import { supabaseServer } from '@/lib/supabaseServer';
import { noStoreJson } from '@/lib/noStoreJson';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const match_id = searchParams.get('match_id');
  if (!match_id) return noStoreJson({ error: 'معرف المباراة مفقود.' }, { status: 400 });

  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from('registrations')
    .select('id, type, paid, approved, created_at, players(id, name, phone, status, balance)')
    .eq('match_id', match_id)
    .eq('rejected', false)
    .order('created_at', { ascending: true });

  if (error) return noStoreJson({ error: error.message }, { status: 500 });

  const main = (data || []).filter((r) => r.type === 'main');
  const bench = (data || []).filter((r) => r.type === 'bench');

  return noStoreJson({ main, bench });
}
