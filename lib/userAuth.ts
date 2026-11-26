import crypto from 'crypto';
import { NextRequest } from 'next/server';

export const USER_COOKIE_NAME = 'hookai_user_session';

function getSigningSecret(): string {
  return (
    process.env.PADDLE_WEBHOOK_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.ADMIN_PASSWORD ||
    'hookai-local-user-secret'
  );
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, key] = storedHash.split(':');
  if (!salt || !key) return false;
  try {
    const derived = crypto.scryptSync(password, salt, 64);
    const keyBuf = Buffer.from(key, 'hex');
    if (derived.length !== keyBuf.length) return false;
    return crypto.timingSafeEqual(derived, keyBuf);
  } catch {
    return false;
  }
}

export function createUserSessionToken(email: string): string {
  const cleanEmail = email.toLowerCase().trim();
  const exp = Date.now() + 1000 * 60 * 60 * 24 * 30; // 30 days
  const payload = Buffer.from(JSON.stringify({ email: cleanEmail, exp })).toString('base64url');
  const sig = crypto.createHmac('sha256', getSigningSecret()).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

export function verifyUserSessionToken(token?: string | null): string | null {
  if (!token) return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;

  const expected = crypto.createHmac('sha256', getSigningSecret()).update(payload).digest('hex');
  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'))) {
      return null;
    }
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!parsed?.email || !parsed?.exp || Date.now() > parsed.exp) {
      return null;
    }
    return String(parsed.email).toLowerCase().trim();
  } catch {
    return null;
  }
}

export function getUserSessionEmail(req: NextRequest): string | null {
  const token = req.cookies.get(USER_COOKIE_NAME)?.value;
  return verifyUserSessionToken(token);
}
