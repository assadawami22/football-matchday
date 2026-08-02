const COOKIE_NAME = 'admin_session';

export function checkPassword(candidate) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;
  return candidate === password;
}

export function expectedToken() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error('Missing ADMIN_SESSION_SECRET environment variable.');
  return secret;
}

export { COOKIE_NAME };

export function isAuthedFromCookieHeader(cookieHeader) {
  if (!cookieHeader) return false;
  const match = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_NAME}=`));
  if (!match) return false;
  const value = decodeURIComponent(match.split('=')[1] || '');
  return value === expectedToken();
}