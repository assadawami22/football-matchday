import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { noStoreJson } from '@/lib/noStoreJson';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function GET() {
  const supabase = supabaseServer();

  const { data: players, error: playersErr } = await supabase
    .from('players')
    .select('id, name, phone, status, balance, created_at')
    .order('name', { ascending: true });

  if (playersErr) return noStoreJson({ error: playersErr.message }, { status: 500 });

  const { data: addRequests, error: reqErr } = await supabase
    .from('player_add_requests')
    .select('id, name, phone, status, created_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (reqErr) return noStoreJson({ error: reqErr.message }, { status: 500 });

  return noStoreJson({ players, addRequests });
}
