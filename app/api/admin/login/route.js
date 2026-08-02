import { NextResponse } from 'next/server';
import { checkPassword, expectedToken, COOKIE_NAME } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { password } = body;

  if (!checkPassword(password || '')) {
    return NextResponse.json({ error: 'Wrong password.' }, { status: 401 });
  }

  const token = expectedToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return res;
}
