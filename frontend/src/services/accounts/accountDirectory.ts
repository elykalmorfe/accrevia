/**
 * Shared account directory. Registrations, approvals, and sign-in go through
 * the API so Chrome and Edge see the same people without a manual refresh.
 */
import { PortalUser, UserStatus } from '../../types/user';
import { apiFetch, getApiBaseUrl } from '../api/client';

export type ApprovalDecision = 'approved' | 'rejected' | 'pending';

export class RemoteAuthError extends Error {
  readonly reason: 'invalid' | 'pending' | 'rejected' | 'deactivated' | 'network';
  readonly status: number;

  constructor(reason: RemoteAuthError['reason'], message: string, status: number) {
    super(message);
    this.name = 'RemoteAuthError';
    this.reason = reason;
    this.status = status;
  }
}

type SessionPayload = {
  id?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  email: string;
  role: string;
  approvalStatus?: ApprovalDecision;
  mustChangePassword?: boolean;
  createdAt?: string;
};

async function readDetail(res: Response, fallback: string): Promise<string> {
  try {
    const body = (await res.json()) as { detail?: string };
    if (body?.detail) return body.detail;
  } catch {
    // Ignore empty or non-JSON error bodies.
  }
  return fallback;
}

export function mergeRemoteUsers(local: PortalUser[], remote: PortalUser[]): PortalUser[] {
  const localByEmail = new Map(local.map((user) => [user.email.trim().toLowerCase(), user]));
  return remote.map((user) => {
    const existing = localByEmail.get(user.email.trim().toLowerCase());
    if (!existing) return user;
    return {
      ...existing,
      ...user,
      id: user.id || existing.id,
      name: user.name || existing.name,
      role: user.role || existing.role,
      office: user.office || existing.office,
      status: user.status,
      employeeId: user.employeeId || existing.employeeId,
      personnelClassification: user.personnelClassification || existing.personnelClassification,
      assignedAreas: user.assignedAreas?.length ? user.assignedAreas : existing.assignedAreas,
      assignedPrograms: user.assignedPrograms?.length ? user.assignedPrograms : existing.assignedPrograms,
      allowedFeatures: user.allowedFeatures?.length
        ? user.allowedFeatures
        : existing.allowedFeatures?.length
          ? existing.allowedFeatures
          : undefined,
      campusId: user.campusId || existing.campusId,
      registeredAt: user.registeredAt || existing.registeredAt,
      approvedBy: user.approvedBy || existing.approvedBy,
      approvedAt: user.approvedAt || existing.approvedAt,
      lastLogin: user.lastLogin ?? existing.lastLogin,
      affiliationVerified: user.affiliationVerified ?? existing.affiliationVerified,
      temporaryPassword: existing.temporaryPassword
    };
  });
}

export function samePortalUsers(left: PortalUser[], right: PortalUser[]): boolean {
  if (left.length !== right.length) return false;
  const signature = (list: PortalUser[]) =>
    list
      .map(
        (user) =>
          [
            user.email.trim().toLowerCase(),
            user.id,
            user.name,
            user.role,
            user.status,
            user.office,
            user.personnelClassification ?? '',
            user.campusId ?? '',
            user.affiliationVerified ? '1' : '0',
            user.lastLogin ?? '',
            user.approvedAt ?? '',
            user.employeeId ?? '',
            String(user.allowedFeatures?.length ?? 'full')
          ].join('|')
      )
      .sort()
      .join('\n');
  return signature(left) === signature(right);
}

export async function fetchAccountDirectory(): Promise<PortalUser[] | null> {
  if (!getApiBaseUrl()) return null;
  try {
    const res = await apiFetch('/api/accounts/directory/', {}, 5000);
    if (!res.ok) return null;
    const body = (await res.json()) as { users?: PortalUser[] };
    return Array.isArray(body.users) ? body.users : null;
  } catch {
    return null;
  }
}

export function subscribeAccountDirectory(onChange: () => void): () => void {
  const base = getApiBaseUrl();
  if (!base || typeof EventSource === 'undefined') return () => { /* no-op */ };
  const source = new EventSource(`${base}/api/accounts/events/`);
  source.onmessage = () => onChange();
  return () => source.close();
}

export async function syncBrowserAccounts(snapshot: { accounts: unknown[]; users: unknown[] }): Promise<void> {
  if (!getApiBaseUrl()) return;
  const res = await apiFetch(
    '/api/accounts/sync/',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(snapshot)
    },
    15000
  );
  if (!res.ok) {
    throw new Error(await readDetail(res, 'Could not sync this browser’s accounts.'));
  }
}

export async function pushPasswordHash(email: string, passwordHash: string): Promise<void> {
  if (!getApiBaseUrl()) return;
  const res = await apiFetch(
    '/api/accounts/password/',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, passwordHash })
    },
    15000
  );
  if (!res.ok && res.status !== 404) {
    throw new Error(await readDetail(res, 'Could not update the shared password.'));
  }
}

export async function registerRemote(input: {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
  employeeId?: string;
  personnelClassification?: string;
  campusId?: string;
  office?: string;
  createdAt: string;
}): Promise<void> {
  if (!getApiBaseUrl()) return;
  let res: Response;
  try {
    res = await apiFetch(
      '/api/accounts/register/',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      },
      20000
    );
  } catch {
    throw new Error('The account directory is unreachable. Please try again once the server is running.');
  }
  if (res.ok) return;
  throw new Error(await readDetail(res, 'We could not create your account right now. Please try again.'));
}

export async function loginRemote(email: string, password: string): Promise<SessionPayload> {
  let res: Response;
  try {
    res = await apiFetch(
      '/api/accounts/login/',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      },
      20000
    );
  } catch {
    throw new RemoteAuthError('network', 'Sign-in is temporarily unavailable. Please try again.', 0);
  }
  if (res.ok) {
    const body = (await res.json()) as { account?: SessionPayload };
    if (!body.account?.email) {
      throw new RemoteAuthError('invalid', 'We could not find an account matching these credentials.', 401);
    }
    return body.account;
  }
  let reason: RemoteAuthError['reason'] = 'invalid';
  let detail = 'We could not find an account matching these credentials.';
  try {
    const body = (await res.json()) as { reason?: string; detail?: string };
    if (body.detail) detail = body.detail;
    if (body.reason === 'pending' || body.reason === 'rejected' || body.reason === 'deactivated' || body.reason === 'invalid') {
      reason = body.reason;
    }
  } catch {
    // Keep the generic credential error.
  }
  throw new RemoteAuthError(reason, detail, res.status);
}

export async function pushPortalUser(user: PortalUser, password?: string): Promise<void> {
  if (!getApiBaseUrl()) return;
  const profile = { ...user };
  delete profile.temporaryPassword;
  const res = await apiFetch(
    '/api/accounts/users/',
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: profile, password: password || undefined })
    },
    15000
  );
  if (!res.ok) {
    throw new Error(await readDetail(res, 'Could not update the shared user directory.'));
  }
}

export async function pushApproval(email: string, decision: ApprovalDecision): Promise<void> {
  if (!getApiBaseUrl()) return;
  const res = await apiFetch(
    '/api/accounts/approval/',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, decision })
    },
    15000
  );
  if (!res.ok && res.status !== 404) {
    throw new Error(await readDetail(res, 'Could not update approval status.'));
  }
}

export function approvalDecisionForStatus(status: UserStatus): ApprovalDecision {
  if (status === 'Pending Approval') return 'pending';
  if (status === 'Rejected') return 'rejected';
  return 'approved';
}
