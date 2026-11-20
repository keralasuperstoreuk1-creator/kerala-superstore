/**
 * Server-side admin session (signed, HttpOnly cookie).
 *
 * Credentials come only from server environment variables:
 *   ADMIN_USERNAME        (optional, default "admin")
 *   ADMIN_PASSWORD        (required - admin login is disabled without it)
 *   ADMIN_SESSION_SECRET  (optional; falls back to SUPABASE_SERVICE_ROLE_KEY)
 *
 * The signing key includes the password, so changing ADMIN_PASSWORD logs out
 * every existing session. Uses Web Crypto so it works in the proxy and in routes.
 */

export const ADMIN_SESSION_COOKIE = 'kss_admin_session';
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days, in seconds

const enc = new TextEncoder();

function b64url(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64url(s: string): string {
  const pad = s.length % 4 ? '='.repeat(4 - (s.length % 4)) : '';
  return atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad);
}

export function getAdminEnvCredentials(): { username: string; password: string } | null {
  const password = process.env.ADMIN_PASSWORD?.trim();
  if (!password) return null;
  return { username: (process.env.ADMIN_USERNAME || 'admin').trim(), password };
}

async function signingKey(): Promise<CryptoKey | null> {
  const creds = getAdminEnvCredentials();
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!creds || !secret) return null;
  return crypto.subtle.importKey(
    'raw',
    enc.encode(`${secret}:${creds.password}`),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

/** Constant-time string comparison. */
export function safeEqual(a: string, b: string): boolean {
  const x = enc.encode(a);
  const y = enc.encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

export async function createAdminSessionToken(username: string): Promise<string | null> {
  const key = await signingKey();
  if (!key) return null;
  const payload = b64url(
    enc.encode(JSON.stringify({ u: username, exp: Math.floor(Date.now() / 1000) + ADMIN_SESSION_MAX_AGE }))
  );
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(payload)));
  return `${payload}.${b64url(sig)}`;
}

export async function verifyAdminSessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token || !token.includes('.')) return false;
  const key = await signingKey();
  if (!key) return false;
  const [payload, sig] = token.split('.');
  try {
    const sigBytes = Uint8Array.from(fromB64url(sig), (c) => c.charCodeAt(0));
    const ok = await crypto.subtle.verify('HMAC', key, sigBytes, enc.encode(payload));
    if (!ok) return false;
    const data = JSON.parse(fromB64url(payload));
    return typeof data.exp === 'number' && data.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}
