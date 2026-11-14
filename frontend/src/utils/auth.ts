import bcrypt from 'bcryptjs';
import { useSyncExternalStore } from 'react';
import { UserRole } from '../types/user';

const ACCOUNTS_KEY = 'accrevia-users';
const AUTH_KEY = 'accrevia-auth';
const SESSION_KEY = 'accrevia-current-user';
const SESSION_EVENT = 'accrevia-session-change';
const PORTAL_USERS_KEY = 'accrevia_portal_users';
const BCRYPT_ROUNDS = 12;

export const DEFAULT_ADMIN_ID = 'u-admin';
export const DEFAULT_ADMIN_EMAIL = 'admin@nemsu.edu.ph';
/** Development-only seeded QA administrator. Not a shared faculty account. */
export const DEFAULT_ADMIN_PASSWORD = 'Admin@Accrevia2026';

/** Roles that self-registration may assign. Never includes QA/admin privileges. */
export const SELF_REGISTER_ROLES = ['Faculty', 'Staff'] as const;
export type SelfRegisterRole = (typeof SELF_REGISTER_ROLES)[number];

export const PRIVILEGED_AUTH_ROLES = ['Superadmin', 'Administrator', 'QA Personnel'] as const;

export interface StoredAccount {
  id?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  email: string;
  role: string;
  passwordHash?: string;
  /** Legacy plain-text password written by older builds; replaced by `passwordHash` on initialization. */
  password?: string;
  isDefaultAdmin?: boolean;
  /** Marked when created by local Vite DEV seeding. Never a production account. */
  isDevDemoAccount?: boolean;
  mustChangePassword?: boolean;
  createdAt?: string;
  passwordChangedAt?: string;
  acceptedTermsVersion?: string;
  acceptedTermsTimestamp?: string;
}

export type SessionAccount = Omit<StoredAccount, 'password' | 'passwordHash'>;

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export function isPrivilegedAuthRole(role: string | undefined | null): boolean {
  return PRIVILEGED_AUTH_ROLES.includes((role ?? '') as (typeof PRIVILEGED_AUTH_ROLES)[number]);
}

export function isSelfRegisterRole(role: string | undefined | null): role is SelfRegisterRole {
  return SELF_REGISTER_ROLES.includes((role ?? '') as SelfRegisterRole);
}

/** Default post-login destination for the current session role. */
export function defaultPostLoginPath(role: string | undefined | null): string {
  return isPrivilegedAuthRole(role) ? '/dashboard' : '/open';
}

/**
 * Sync a registered/signed-in account into the portal user directory used by PortalContext.
 * Prototype-only localStorage bridge — replace with server user provisioning.
 */
export function upsertPortalUserFromAccount(account: SessionAccount | StoredAccount): void {
  if (typeof window === 'undefined') return;
  const id = account.id || `u-reg-${Date.now()}`;
  const name = [account.firstName, account.middleName, account.lastName].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim() || account.email;
  const role = (isPrivilegedAuthRole(account.role) ? account.role : isSelfRegisterRole(account.role) ? account.role : 'Faculty') as UserRole;

  try {
    const raw = window.localStorage.getItem(PORTAL_USERS_KEY);
    const list: Array<Record<string, unknown>> = raw ? (JSON.parse(raw) as Array<Record<string, unknown>>) : [];
    const email = normalizeEmail(account.email);
    const nextUser = {
      id,
      name,
      email: account.email,
      role,
      office: role === 'Faculty' || role === 'Staff' ? 'Academic / Administrative Unit' : 'Quality Assurance Office',
      status: 'Active',
      lastLogin: new Date().toISOString(),
      affiliationVerified: false,
      registeredAt: account.createdAt || new Date().toISOString()
    };
    const idx = list.findIndex(
      (u) => String(u.id) === id || normalizeEmail(String(u.email ?? '')) === email
    );
    if (idx >= 0) list[idx] = { ...list[idx], ...nextUser, id: String(list[idx].id || id) };
    else list.unshift(nextUser);
    window.localStorage.setItem(PORTAL_USERS_KEY, JSON.stringify(list));
  } catch {
    // Ignore storage failures in the prototype bridge.
  }
}

export function sanitizeSelfRegisterRole(role: string | undefined | null): SelfRegisterRole {
  return isSelfRegisterRole(role) ? role : 'Faculty';
}

export function readAccounts(): StoredAccount[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(ACCOUNTS_KEY) ?? '[]');
    return Array.isArray(parsed) ? (parsed as StoredAccount[]) : [];
  } catch {
    return [];
  }
}

function writeAccounts(accounts: StoredAccount[]) {
  window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function findAccountByEmail(email: string): StoredAccount | undefined {
  const target = normalizeEmail(email);
  return readAccounts().find((a) => normalizeEmail(String(a.email ?? '')) === target);
}

export function addAccount(account: StoredAccount) {
  writeAccounts([...readAccounts(), account]);
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

function toSession(account: StoredAccount): SessionAccount {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, passwordHash, ...rest } = account;
  return rest;
}

// ---------------------------------------------------------------------------
// Initialization: legacy password migration + default administrator seeding
// ---------------------------------------------------------------------------

async function migratePlainTextPasswords() {
  const legacy = readAccounts().filter((a) => typeof a.password === 'string' && !a.passwordHash);
  if (legacy.length === 0) return;
  const hashes = new Map<string, string>();
  for (const account of legacy) {
    hashes.set(normalizeEmail(account.email), await hashPassword(String(account.password)));
  }
  // Re-read so accounts written while hashing are not lost.
  writeAccounts(
    readAccounts().map((a) => {
      const hash = hashes.get(normalizeEmail(String(a.email ?? '')));
      if (!hash || a.passwordHash) return a;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...rest } = a;
      return { ...rest, passwordHash: hash };
    })
  );
}

function sanitizeStoredSession() {
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw) as StoredAccount;
    if ('password' in parsed || 'passwordHash' in parsed) {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(toSession(parsed)));
    }
  } catch {
    window.localStorage.removeItem(SESSION_KEY);
  }
}

const hasDefaultAdmin = (accounts: StoredAccount[]) =>
  accounts.some((a) => a.isDefaultAdmin || a.id === DEFAULT_ADMIN_ID || normalizeEmail(String(a.email ?? '')) === DEFAULT_ADMIN_EMAIL);

async function ensureDefaultAdmin() {
  if (hasDefaultAdmin(readAccounts())) return;
  const passwordHash = await hashPassword(DEFAULT_ADMIN_PASSWORD);
  // Re-check after the async hash: another tab may have seeded it in the meantime.
  const accounts = readAccounts();
  if (hasDefaultAdmin(accounts)) return;
  writeAccounts([
    ...accounts,
    {
      id: DEFAULT_ADMIN_ID,
      firstName: 'System',
      lastName: 'Administrator',
      email: DEFAULT_ADMIN_EMAIL,
      role: 'Administrator',
      passwordHash,
      isDefaultAdmin: true,
      mustChangePassword: true,
      createdAt: new Date().toISOString()
    }
  ]);
}

/**
 * Development-only role test accounts.
 * Gated by Vite `import.meta.env.DEV` so production builds do not seed or ship these credentials.
 * Idempotent: existing emails are left untouched (no password/role overwrite, no duplicates).
 */
async function ensureDevDemoAccounts() {
  if (!import.meta.env.DEV) return;

  type DemoSeed = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
    password: string;
  };

  // Plaintext passwords exist only in this DEV-gated block for local testing.
  const demos: DemoSeed[] = [
    {
      id: 'u-demo-faculty',
      firstName: 'Demo',
      lastName: 'Faculty',
      email: 'faculty.demo@accrevia.local',
      role: 'Faculty',
      password: 'FacultyDemo@2026!'
    },
    {
      id: 'u-demo-qa',
      firstName: 'Demo',
      lastName: 'QA',
      email: 'qa.demo@accrevia.local',
      role: 'QA Personnel',
      password: 'QADemo@2026!'
    }
  ];

  for (const demo of demos) {
    if (findAccountByEmail(demo.email)) continue;

    const passwordHash = await hashPassword(demo.password);
    // Re-check after async hash so parallel tabs cannot create duplicates.
    if (findAccountByEmail(demo.email)) continue;

    const account: StoredAccount = {
      id: demo.id,
      firstName: demo.firstName,
      lastName: demo.lastName,
      email: demo.email,
      role: demo.role,
      passwordHash,
      isDevDemoAccount: true,
      mustChangePassword: false,
      createdAt: new Date().toISOString()
    };

    addAccount(account);
    upsertPortalUserFromAccount(account);
  }
}

let initialization: Promise<void> | null = null;

/** Idempotent; safe to call on every startup and before every credential check. */
export function initializeAuthStore(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (!initialization) {
    initialization = (async () => {
      sanitizeStoredSession();
      await migratePlainTextPasswords();
      await ensureDefaultAdmin();
      await ensureDevDemoAccounts();
    })().catch((error) => {
      initialization = null;
      throw error;
    });
  }
  return initialization;
}

// ---------------------------------------------------------------------------
// Authentication
// ---------------------------------------------------------------------------

export async function authenticate(email: string, password: string): Promise<SessionAccount | null> {
  await initializeAuthStore();
  const account = findAccountByEmail(email);
  if (!account?.passwordHash) return null;
  return (await bcrypt.compare(password, account.passwordHash)) ? toSession(account) : null;
}

export const PASSWORD_MIN_LENGTH = 12;

export function passwordPolicyError(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) return `New password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  if (!/[A-Z]/.test(password)) return 'New password must include an uppercase letter.';
  if (!/[a-z]/.test(password)) return 'New password must include a lowercase letter.';
  if (!/\d/.test(password)) return 'New password must include a number.';
  if (!/[^A-Za-z0-9]/.test(password)) return 'New password must include a symbol.';
  return null;
}

export async function changePassword(email: string, currentPassword: string, newPassword: string): Promise<void> {
  const account = findAccountByEmail(email);
  if (!account?.passwordHash) throw new Error('Your account could not be found. Please sign in again.');
  if (!(await bcrypt.compare(currentPassword, account.passwordHash))) throw new Error('Current password is incorrect.');
  if (await bcrypt.compare(newPassword, account.passwordHash)) throw new Error('New password must be different from the current password.');
  const policyError = passwordPolicyError(newPassword);
  if (policyError) throw new Error(policyError);

  const passwordHash = await hashPassword(newPassword);
  const target = normalizeEmail(email);
  let updated: StoredAccount | undefined;
  writeAccounts(
    readAccounts().map((a) => {
      if (normalizeEmail(String(a.email ?? '')) !== target) return a;
      updated = { ...a, passwordHash, mustChangePassword: false, passwordChangedAt: new Date().toISOString() };
      return updated;
    })
  );
  if (updated && normalizeEmail(getSessionAccount()?.email ?? '') === target) startSession(updated);
}

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------

function notifySessionChange() {
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function startSession(account: StoredAccount | SessionAccount) {
  const session = toSession(account as StoredAccount);
  window.localStorage.setItem(AUTH_KEY, 'true');
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  upsertPortalUserFromAccount(session);
  notifySessionChange();
}

export function endSession() {
  window.localStorage.removeItem(AUTH_KEY);
  window.localStorage.removeItem(SESSION_KEY);
  notifySessionChange();
}

let cachedRaw: string | null = null;
let cachedSession: SessionAccount | null = null;

export function getSessionAccount(): SessionAccount | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(AUTH_KEY) === 'true' ? window.localStorage.getItem(SESSION_KEY) : null;
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cachedSession = raw ? (JSON.parse(raw) as SessionAccount) : null;
    } catch {
      cachedSession = null;
    }
  }
  return cachedSession;
}

function subscribeSession(onChange: () => void) {
  window.addEventListener(SESSION_EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(SESSION_EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

export function useSessionAccount(): SessionAccount | null {
  return useSyncExternalStore(subscribeSession, getSessionAccount, () => null);
}
