import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { username, password, customCredentials } = await req.json();

    const envUser = process.env.ADMIN_USERNAME || 'admin';
    const envPass = process.env.ADMIN_PASSWORD || 'kerala2026@admin';

    const inputUser = username?.trim();
    const inputPass = password?.trim();

    // Check against custom credentials passed from client or env
    let isValid = false;

    if (customCredentials && customCredentials.username && customCredentials.password) {
      isValid =
        inputUser === customCredentials.username.trim() &&
        inputPass === customCredentials.password.trim();
    } else {
      isValid = inputUser === envUser && inputPass === envPass;
    }

    // Also accept default admin fallback
    if (!isValid && inputUser === 'admin' && inputPass === 'kerala2026@admin') {
      isValid = true;
    }

    if (isValid) {
      return NextResponse.json({
        success: true,
        user: { username: inputUser, role: 'owner' },
        message: 'Authentication successful',
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid Username or Password' },
      { status: 401 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Authentication failed' },
      { status: 500 }
    );
  }
}
