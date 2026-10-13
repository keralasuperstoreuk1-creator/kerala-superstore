export const ADMIN_AUTH_KEY = 'kss_admin_auth_token_2026';
export const ADMIN_CREDENTIALS_KEY = 'kss_admin_custom_credentials';
export const POS_ADMIN_PIN_KEY = 'kss_pos_admin_manager_pin';
export const POS_USERS_KEY = 'kss_pos_users_v2';
export const POS_ACTIVE_USER_KEY = 'kss_pos_active_user_v2';

export const DEFAULT_ADMIN_USERNAME = 'admin';
export const DEFAULT_ADMIN_PASSWORD = 'kerala2026@admin';
export const DEFAULT_POS_ADMIN_PIN = '2026';

export interface AdminCredentials {
  username: string;
  passwordHash?: string;
  password?: string;
  updatedAt?: string;
}

export type UserRole = 'admin' | 'manager' | 'cashier';

export interface PosUser {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  pin: string;
  password?: string;
  createdAt: string;
  active: boolean;
}

export const DEFAULT_USERS: PosUser[] = [
  {
    id: 'user-admin-main',
    username: 'admin',
    name: 'Store Administrator',
    role: 'admin',
    pin: '2026',
    password: 'kerala2026@admin',
    createdAt: new Date().toISOString(),
    active: true,
  },
  {
    id: 'user-cashier-1',
    username: 'cashier1',
    name: 'Counter Cashier 1',
    role: 'cashier',
    pin: '1111',
    password: 'cashier123',
    createdAt: new Date().toISOString(),
    active: true,
  },
  {
    id: 'user-manager-1',
    username: 'manager1',
    name: 'Shift Floor Manager',
    role: 'manager',
    pin: '5555',
    password: 'manager2026',
    createdAt: new Date().toISOString(),
    active: true,
  },
];

// Admin Credentials
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
    const cleanUser = username.trim();
    const cleanPass = password.trim();
    const creds: AdminCredentials = {
      username: cleanUser,
      password: cleanPass,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(ADMIN_CREDENTIALS_KEY, JSON.stringify(creds));

    // Also sync with admin user record in user management
    const users = getPosUsers();
    const adminIdx = users.findIndex((u) => u.role === 'admin' || u.id === 'user-admin-main');
    if (adminIdx !== -1) {
      users[adminIdx].username = cleanUser;
      users[adminIdx].password = cleanPass;
      savePosUsers(users);
    }

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
  expiresAt.setDate(expiresAt.getDate() + 30);
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

// POS PIN Support
export function getPosAdminPin(): string {
  if (typeof window === 'undefined') return DEFAULT_POS_ADMIN_PIN;
  try {
    return localStorage.getItem(POS_ADMIN_PIN_KEY) || DEFAULT_POS_ADMIN_PIN;
  } catch {
    return DEFAULT_POS_ADMIN_PIN;
  }
}

export function savePosAdminPin(pin: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const cleanPin = pin.trim();
    if (!cleanPin || cleanPin.length < 3) return false;
    localStorage.setItem(POS_ADMIN_PIN_KEY, cleanPin);

    // Sync admin PIN in user management
    const users = getPosUsers();
    const adminIdx = users.findIndex((u) => u.role === 'admin' || u.id === 'user-admin-main');
    if (adminIdx !== -1) {
      users[adminIdx].pin = cleanPin;
      savePosUsers(users);
    }
    return true;
  } catch {
    return false;
  }
}

export function verifyPosAdminPin(enteredPin: string): boolean {
  const cleanEntered = enteredPin.trim();
  if (!cleanEntered) return false;

  const currentPin = getPosAdminPin();
  const creds = getAdminCredentials();

  if (
    cleanEntered === currentPin ||
    cleanEntered === creds.password ||
    cleanEntered === DEFAULT_ADMIN_PASSWORD ||
    cleanEntered === DEFAULT_POS_ADMIN_PIN
  ) {
    return true;
  }

  // Also check if any admin or manager's password or PIN matches
  const users = getPosUsers();
  return users.some(
    (u) =>
      u.active &&
      (u.role === 'admin' || u.role === 'manager') &&
      (u.pin === cleanEntered || u.password === cleanEntered)
  );
}

// -------------------------------------------------------------
// POS USER MANAGEMENT & ACCESS CONTROL
// -------------------------------------------------------------

export function getPosUsers(): PosUser[] {
  if (typeof window === 'undefined') return DEFAULT_USERS;
  try {
    const raw = localStorage.getItem(POS_USERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading POS users:', e);
  }

  // First time initialization
  try {
    localStorage.setItem(POS_USERS_KEY, JSON.stringify(DEFAULT_USERS));
  } catch {}
  return DEFAULT_USERS;
}

export function savePosUsers(users: PosUser[]): boolean {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(POS_USERS_KEY, JSON.stringify(users));
    return true;
  } catch (e) {
    console.error('Error saving POS users:', e);
    return false;
  }
}

export function addPosUser(data: {
  username: string;
  name: string;
  role: UserRole;
  pin: string;
  password?: string;
}): PosUser {
  const users = getPosUsers();
  const cleanUsername = data.username.trim().toLowerCase();

  const existing = users.find((u) => u.username.toLowerCase() === cleanUsername);
  if (existing) {
    throw new Error(`Username "${data.username}" already exists. Please choose a unique username.`);
  }

  const newUser: PosUser = {
    id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    username: cleanUsername,
    name: data.name.trim() || cleanUsername,
    role: data.role || 'cashier',
    pin: data.pin.trim() || '1234',
    password: data.password?.trim() || data.pin.trim() || '1234',
    createdAt: new Date().toISOString(),
    active: true,
  };

  users.push(newUser);
  savePosUsers(users);
  return newUser;
}

export function updatePosUser(id: string, updates: Partial<PosUser>): boolean {
  const users = getPosUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return false;

  if (updates.username) {
    const cleanUser = updates.username.trim().toLowerCase();
    const collision = users.find((u) => u.id !== id && u.username.toLowerCase() === cleanUser);
    if (collision) {
      throw new Error(`Username "${updates.username}" is already taken.`);
    }
    updates.username = cleanUser;
  }

  users[idx] = { ...users[idx], ...updates };

  // If this user was the admin, sync with admin credentials
  if (users[idx].role === 'admin' || users[idx].id === 'user-admin-main') {
    if (updates.password) {
      saveAdminCredentials(users[idx].username, updates.password);
    }
    if (updates.pin) {
      savePosAdminPin(updates.pin);
    }
  }

  savePosUsers(users);

  // If the currently active user was updated, update active user too
  const active = getActivePosUser();
  if (active.id === id) {
    setActivePosUser(users[idx]);
  }

  return true;
}

export function deletePosUser(id: string): boolean {
  const users = getPosUsers();
  const target = users.find((u) => u.id === id);
  if (!target) return false;

  // Protect main administrator account from deletion
  if (target.id === 'user-admin-main' || (target.role === 'admin' && users.filter((u) => u.role === 'admin').length <= 1)) {
    throw new Error('Cannot delete the primary Store Administrator account.');
  }

  const filtered = users.filter((u) => u.id !== id);
  savePosUsers(filtered);

  // If active user was deleted, switch back to primary admin
  const active = getActivePosUser();
  if (active.id === id) {
    setActivePosUser(filtered[0] || DEFAULT_USERS[0]);
  }

  return true;
}

export function getActivePosUser(): PosUser {
  if (typeof window === 'undefined') return DEFAULT_USERS[0];
  try {
    const raw = localStorage.getItem(POS_ACTIVE_USER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.id) {
        return parsed;
      }
    }
  } catch {}
  return DEFAULT_USERS[0];
}

export function setActivePosUser(user: PosUser): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(POS_ACTIVE_USER_KEY, JSON.stringify(user));
  } catch (e) {
    console.error('Error saving active POS user:', e);
  }
}

export function authenticatePosUser(identifier: string, secret: string): PosUser | null {
  const cleanId = identifier.trim().toLowerCase();
  const cleanSecret = secret.trim();
  const users = getPosUsers();

  const matched = users.find(
    (u) =>
      u.active &&
      (u.username.toLowerCase() === cleanId || u.pin === cleanSecret || u.id === cleanId) &&
      (u.pin === cleanSecret || u.password === cleanSecret || (cleanId === 'admin' && cleanSecret === DEFAULT_POS_ADMIN_PIN))
  );

  return matched || null;
}

export function canUserEditPrices(user?: PosUser | null): boolean {
  if (!user) return false;
  return user.role === 'admin' || user.role === 'manager';
}

export function canUserManageUsers(user?: PosUser | null): boolean {
  if (!user) return false;
  return user.role === 'admin';
}
