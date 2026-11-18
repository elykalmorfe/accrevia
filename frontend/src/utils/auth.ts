import bcrypt from 'bcryptjs';
import { useSyncExternalStore } from 'react';
import { UserRole } from '../types/user';

const ACCOUNTS_KEY = 'accrevia-users';
const AUTH_KEY = 'accrevia-auth';
const SESSION_KEY = 'accrevia-current-user';
const SESSION_EVENT = 'accrevia-session-change';
const PORTAL_USERS_KEY = 'accrevia_portal_users';
const BCRYPT_ROUNDS = 12;

export const DEFAULT_SUPERADMIN_ID = 'u-superadmin';
export const DEFAULT_SUPERADMIN_EMAIL = 'superadmin@nemsu.edu.ph';
/** Seeded Superadmin password (exact value required by institutional setup). */
export const DEFAULT_SUPERADMIN_PASSWORD = 'superadmin123';

/** @deprecated Use DEFAULT_SUPERADMIN_* — kept for older imports during transition. */
export const DEFAULT_ADMIN_ID = DEFAULT_SUPERADMIN_ID;
export const DEFAULT_ADMIN_EMAIL = DEFAULT_SUPERADMIN_EMAIL;
export const DEFAULT_ADMIN_PASSWORD = DEFAULT_SUPERADMIN_PASSWORD;

/** Roles that self-registration may assign. Never includes admin privileges. */
export const SELF_REGISTER_ROLES = ['Faculty', 'Staff'] as const;
export type SelfRegisterRole = (typeof SELF_REGISTER_ROLES)[number];

export const PRIVILEGED_AUTH_ROLES = ['Superadmin', 'Administrator'] as const;

export type AuthDenialReason = 'invalid' | 'pending' | 'rejected' | 'deactivated';

export class AuthDeniedError extends Error {
  readonly reason: AuthDenialReason;
  constructor(reason: AuthDenialReason, message: string) {
    super(message);
    this.name = 'AuthDeniedError';
    this.reason = reason;
  }
}

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
  isDefaultSuperadmin?: boolean;
  /** Marked when created by local Vite DEV seeding. Never a production account. */
  isDevDemoAccount?: boolean;
  /** Self-registered accounts stay pending until Superadmin/Admin approval. */
  approvalStatus?: 'pending' | 'approved' | 'rejected';
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
function portalStatusForAccount(account: SessionAccount | StoredAccount): 'Active' | 'Pending Approval' | 'Rejected' {
  if (account.approvalStatus === 'pending') return 'Pending Approval';
  if (account.approvalStatus === 'rejected') return 'Rejected';
  return 'Active';
}

export function upsertPortalUserFromAccount(
  account: SessionAccount | StoredAccount,
  options?: { preserveExistingStatus?: boolean }
): void {
  if (typeof window === 'undefined') return;
  const id = account.id || `u-reg-${Date.now()}`;
  const name = [account.firstName, account.middleName, account.lastName].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim() || account.email;
  const role = (isPrivilegedAuthRole(account.role) ? account.role : isSelfRegisterRole(account.role) ? account.role : 'Faculty') as UserRole;

  try {
    const raw = window.localStorage.getItem(PORTAL_USERS_KEY);
    const list: Array<Record<string, unknown>> = raw ? (JSON.parse(raw) as Array<Record<string, unknown>>) : [];
    const email = normalizeEmail(account.email);
    const idx = list.findIndex(
      (u) => String(u.id) === id || normalizeEmail(String(u.email ?? '')) === email
    );
    const existing = idx >= 0 ? list[idx] : null;
    const status =
      options?.preserveExistingStatus && existing?.status
        ? String(existing.status)
        : portalStatusForAccount(account);

    const nextUser = {
      id,
      name,
      email: account.email,
      role,
      office:
        role === 'Faculty' || role === 'Staff'
          ? 'Academic / Administrative Unit'
          : role === 'Superadmin'
            ? 'Office of the University President'
            : 'Quality Assurance Office',
      status,
      lastLogin: status === 'Active' ? new Date().toISOString() : existing?.lastLogin ?? null,
      affiliationVerified: status === 'Active' && isPrivilegedAuthRole(role),
      registeredAt: account.createdAt || (existing?.registeredAt as string) || new Date().toISOString()
    };
    if (idx >= 0) list[idx] = { ...list[idx], ...nextUser, id: String(list[idx].id || id) };
    else list.unshift(nextUser);
    window.localStorage.setItem(PORTAL_USERS_KEY, JSON.stringify(list));
  } catch {
    // Ignore storage failures in the prototype bridge.
  }
}

function readPortalUserStatus(email: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(PORTAL_USERS_KEY);
    if (!raw) return null;
    const list = JSON.parse(raw) as Array<{ email?: string; status?: string }>;
    const target = normalizeEmail(email);
    const match = list.find((u) => normalizeEmail(String(u.email ?? '')) === target);
    return match?.status ? String(match.status) : null;
  } catch {
    return null;
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

async function ensureDefaultSuperadmin() {
  const passwordHash = await hashPassword(DEFAULT_SUPERADMIN_PASSWORD);
  // Drop legacy default-admin seed so only Superadmin remains as the bootstrap account.
  let accounts = readAccounts().filter(
    (a) =>
      !(
        a.isDefaultAdmin ||
        a.id === 'u-admin' ||
        normalizeEmail(String(a.email ?? '')) === 'admin@nemsu.edu.ph'
      )
  );

  const idx = accounts.findIndex(
    (a) =>
      a.isDefaultSuperadmin ||
      a.id === DEFAULT_SUPERADMIN_ID ||
      normalizeEmail(String(a.email ?? '')) === DEFAULT_SUPERADMIN_EMAIL
  );

  const superadmin: StoredAccount = {
    ...(idx >= 0 ? accounts[idx] : {}),
    id: DEFAULT_SUPERADMIN_ID,
    firstName: idx >= 0 ? accounts[idx].firstName || 'System' : 'System',
    lastName: idx >= 0 ? accounts[idx].lastName || 'Superadmin' : 'Superadmin',
    email: DEFAULT_SUPERADMIN_EMAIL,
    role: 'Superadmin',
    passwordHash,
    isDefaultSuperadmin: true,
    approvalStatus: 'approved',
    mustChangePassword: false,
    createdAt: idx >= 0 ? accounts[idx].createdAt || new Date().toISOString() : new Date().toISOString()
  };

  if (idx >= 0) {
    accounts = accounts.map((a, i) => (i === idx ? superadmin : a));
  } else {
    accounts = [...accounts, superadmin];
  }
  writeAccounts(accounts);
  upsertPortalUserFromAccount(superadmin, { preserveExistingStatus: idx >= 0 });
}

/** Remove previously seeded development demo logins from local storage. */
function purgeDevDemoAccounts() {
  const accounts = readAccounts();
  const kept = accounts.filter((a) => !a.isDevDemoAccount);
  if (kept.length !== accounts.length) writeAccounts(kept);
}

let initialization: Promise<void> | null = null;

/** Idempotent; safe to call on every startup and before every credential check. */
export function initializeAuthStore(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (!initialization) {
    initialization = (async () => {
      sanitizeStoredSession();
      await migratePlainTextPasswords();
      purgeDevDemoAccounts();
      await ensureDefaultSuperadmin();
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

export async function authenticate(email: string, password: string): Promise<SessionAccount> {
  await initializeAuthStore();
  const account = findAccountByEmail(email);
  if (!account?.passwordHash) {
    throw new AuthDeniedError('invalid', 'We could not find an account matching these credentials.');
  }
  const ok = await bcrypt.compare(password, account.passwordHash);
  if (!ok) {
    throw new AuthDeniedError('invalid', 'We could not find an account matching these credentials.');
  }

  const status = readPortalUserStatus(account.email) || portalStatusForAccount(account);
  if (status === 'Pending Approval' || account.approvalStatus === 'pending') {
    throw new AuthDeniedError(
      'pending',
      'Your registration is waiting for Superadmin or Administrator approval. You can sign in after it is approved.'
    );
  }
  if (status === 'Rejected' || account.approvalStatus === 'rejected') {
    throw new AuthDeniedError('rejected', 'This registration was not approved. Contact the Quality Assurance Office for help.');
  }
  if (status === 'Deactivated') {
    throw new AuthDeniedError('deactivated', 'This account has been deactivated. Contact an administrator for help.');
  }

  return toSession(account);
}

/**
 * Create or update a login account for an Administrator provisioned by Superadmin.
 */
export async function provisionManagedAccount(input: {
  id: string;
  name: string;
  email: string;
  role: 'Administrator' | 'Superadmin' | 'Faculty' | 'Staff';
  temporaryPassword: string;
}): Promise<void> {
  const email = normalizeEmail(input.email);
  const parts = input.name.trim().split(/\s+/);
  const firstName = parts[0] || 'Admin';
  const lastName = parts.slice(1).join(' ') || 'User';
  const passwordHash = await hashPassword(input.temporaryPassword);
  const existing = findAccountByEmail(email);
  const next: StoredAccount = {
    ...(existing || {}),
    id: existing?.id || input.id,
    firstName,
    lastName,
    email,
    role: input.role,
    passwordHash,
    approvalStatus: 'approved',
    mustChangePassword: true,
    createdAt: existing?.createdAt || new Date().toISOString()
  };
  if (existing) {
    writeAccounts(readAccounts().map((a) => (normalizeEmail(String(a.email ?? '')) === email ? next : a)));
  } else {
    addAccount(next);
  }
  upsertPortalUserFromAccount(next);
}

/** Keep auth-store approval flag aligned when Superadmin/Admin approve or reject a registration. */
export function syncAccountApproval(email: string, decision: 'approved' | 'rejected' | 'pending'): void {
  const target = normalizeEmail(email);
  writeAccounts(
    readAccounts().map((a) =>
      normalizeEmail(String(a.email ?? '')) === target ? { ...a, approvalStatus: decision } : a
    )
  );
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
  // Login is only allowed for approved/active accounts — refresh directory without reopening pending status.
  upsertPortalUserFromAccount(
    { ...session, approvalStatus: session.approvalStatus || 'approved' },
    { preserveExistingStatus: true }
  );
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
