import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { noStoreJson } from '@/lib/noStoreJson';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function GET() {
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from('late_fee_payments')
    .select('id, amount, approved, created_at, players(id, name, phone, balance)')
    .eq('approved', false)
    .order('created_at', { ascending: true });

  if (error) return noStoreJson({ error: error.message }, { status: 500 });
  return noStoreJson({ claims: data });
}
