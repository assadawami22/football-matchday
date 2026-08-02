import crypto from 'crypto';

const COOKIE_NAME = 'admin_session';

function secret() {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s) throw new Error('Missing ADMIN_SESSION_SECRET environment variable.');
  return s;
}

// A stable token derived from the admin password + a server-only secret.
// It never changes for a given password, so we just compare against it
// on every request — no session storage/database needed for this small app.
export function expectedToken() {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) throw new Error('Missing ADMIN_PASSWORD environment variable.');
  return crypto.createHmac('sha256', secret()).update(password).digest('hex');
}

export function checkPassword(candidate) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;
  // timing-safe compare
  const a = Buffer.from(candidate || '');
  const b = Buffer.from(password);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
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
