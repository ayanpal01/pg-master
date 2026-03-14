import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';

const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('SESSION_SECRET environment variable is not set. Set a strong random secret in .env.local');
}
const secretKey = SESSION_SECRET || 'pgmaster_dev_secret_min_32_chars_long_change_in_prod';
const key = new TextEncoder().encode(secretKey);

// Session duration: 24 hours
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;
const SESSION_DURATION_STR = '24h';

export async function encrypt(payload: Record<string, unknown>) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION_STR)
    .sign(key);
}

export async function decrypt(input: string): Promise<Record<string, unknown>> {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ['HS256'],
  });
  return payload as Record<string, unknown>;
}

export async function createSession(uid: string) {
  const expires = new Date(Date.now() + SESSION_DURATION_MS);
  const session = await encrypt({ uid, expires: expires.toISOString() });
  const isProduction = process.env.NODE_ENV === 'production';

  (await cookies()).set('session', session, {
    expires,
    httpOnly: true,                             // Not accessible via JS
    secure: isProduction,                       // HTTPS only in production
    sameSite: isProduction ? 'strict' : 'lax',  // Strict CSRF protection in production
    path: '/',
  });
}

export async function getSession() {
  const session = (await cookies()).get('session')?.value;
  if (!session) return null;
  try {
    return await decrypt(session);
  } catch {
    return null;
  }
}

export async function logout() {
  (await cookies()).set('session', '', {
    expires: new Date(0),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}

// For use in middleware (Edge runtime) — reads directly from cookie header
export async function decryptFromRequest(req: NextRequest) {
  const session = req.cookies.get('session')?.value;
  if (!session) return null;
  try {
    return await decrypt(session);
  } catch {
    return null;
  }
}
