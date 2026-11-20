import { NextRequest, NextResponse } from 'next/server';
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE,
  createAdminSessionToken,
  getAdminEnvCredentials,
  safeEqual,
} from '@/lib/admin-session';

// Simple in-memory brute-force limit: 10 failed attempts per IP per 15 minutes.
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS = 10;
const failures = new Map<string, { count: number; first: number }>();

function clientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown';
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const now = Date.now();
  const rec = failures.get(ip);
  if (rec && now - rec.first < WINDOW_MS && rec.count >= MAX_FAILS) {
    return NextResponse.json(
      { success: false, error: 'Too many failed attempts. Please try again in 15 minutes.' },
      { status: 429 }
    );
  }

  const creds = getAdminEnvCredentials();
  if (!creds) {
    return NextResponse.json(
      { success: false, error: 'Admin login is not configured on the server (ADMIN_PASSWORD missing).' },
      { status: 503 }
    );
  }

  let username = '';
  let password = '';
  try {
    const body = await req.json();
    username = String(body?.username ?? '').trim();
    password = String(body?.password ?? '').trim();
  } catch {
    // fall through as invalid
  }

  const valid = safeEqual(username, creds.username) && safeEqual(password, creds.password);
  if (!valid) {
    if (!rec || now - rec.first >= WINDOW_MS) failures.set(ip, { count: 1, first: now });
    else rec.count++;
    return NextResponse.json({ success: false, error: 'Invalid Username or Password' }, { status: 401 });
  }

  failures.delete(ip);
  const token = await createAdminSessionToken(creds.username);
  if (!token) {
    return NextResponse.json({ success: false, error: 'Session secret not configured.' }, { status: 503 });
  }

  const res = NextResponse.json({
    success: true,
    user: { username: creds.username, role: 'owner' },
    message: 'Authentication successful',
  });
  res.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: ADMIN_SESSION_MAX_AGE,
  });
  return res;
}

/** Logout: clear the session cookie. */
export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(ADMIN_SESSION_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
  return res;
}
