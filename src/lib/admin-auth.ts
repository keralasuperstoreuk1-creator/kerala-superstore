export const ADMIN_AUTH_KEY = 'kss_admin_auth_token_2026';
export const ADMIN_CREDENTIALS_KEY = 'kss_admin_custom_credentials';

export interface AdminCredentials {
  username: string;
  passwordHash?: string;
  password?: string;
  updatedAt?: string;
}

// Default fallback credentials
export const DEFAULT_ADMIN_USERNAME = 'admin';
export const DEFAULT_ADMIN_PASSWORD = 'kerala2026@admin';

export function getAdminCredentials(): AdminCredentials {
  if (typeof window === 'undefined') {
    return {
      username: DEFAULT_ADMIN_USERNAME,
      password: DEFAULT_ADMIN_PASSWORD,
    };
  }

  try {
    const stored = localStorage.getItem(ADMIN_CREDENTIALS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.username && parsed.password) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading admin credentials:', e);
  }

  return {
    username: DEFAULT_ADMIN_USERNAME,
    password: DEFAULT_ADMIN_PASSWORD,
  };
}

export function saveAdminCredentials(username: string, password: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const creds: AdminCredentials = {
      username: username.trim(),
      password: password.trim(),
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(ADMIN_CREDENTIALS_KEY, JSON.stringify(creds));
    return true;
  } catch (e) {
    console.error('Error saving admin credentials:', e);
    return false;
  }
}

export function isUserAdminAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const token = localStorage.getItem(ADMIN_AUTH_KEY);
    if (!token) return false;
    const parsed = JSON.parse(token);
    // Token valid for 30 days
    if (parsed.expiresAt && new Date(parsed.expiresAt) > new Date()) {
      return true;
    }
    localStorage.removeItem(ADMIN_AUTH_KEY);
  } catch (e) {
    localStorage.removeItem(ADMIN_AUTH_KEY);
  }
  return false;
}

export function setAdminAuthenticatedSession(username: string): void {
  if (typeof window === 'undefined') return;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days session
  localStorage.setItem(
    ADMIN_AUTH_KEY,
    JSON.stringify({
      username,
      authenticated: true,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
    })
  );
}

export function clearAdminSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ADMIN_AUTH_KEY);
}
