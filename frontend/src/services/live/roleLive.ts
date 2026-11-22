/**
 * Shared live board. Every signed-in browser stays connected, and the server
 * returns only the requests and notices that role is allowed to see.
 */
import { getSessionAccount } from '../../utils/auth';
import { apiFetch, getApiBaseUrl } from '../api/client';
import { AccessRequest } from '../../types/sharing';
import { DocumentRequest } from '../../types/request';
import { SentFileGrant } from '../../utils/sharing';
import { TechnicalReviewAccessRequest } from '../../types/technicalReviewAccess';

export interface LiveNotification {
  id: string;
  title: string;
  detail: string;
  to: string;
  time: string;
  audience?: string;
}

export interface RoleLiveBoard {
  revision: number;
  documentRequests: DocumentRequest[];
  notifications: LiveNotification[];
  accessRequests: AccessRequest[];
  technicalReviews: TechnicalReviewAccessRequest[];
  fileGrants: SentFileGrant[];
}

export interface RoleLiveIdentity {
  role: string;
  userId: string;
  email: string;
}

type LivePush = {
  documentRequests?: DocumentRequest[];
  notifications?: LiveNotification[];
  dismissedNotificationIds?: string[];
  accessRequests?: AccessRequest[];
  technicalReviews?: TechnicalReviewAccessRequest[];
};

let tail: Promise<void> = Promise.resolve();

function enqueue(task: () => Promise<void>): Promise<void> {
  const run = tail.then(task, task);
  tail = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

export function currentLiveIdentity(): RoleLiveIdentity {
  const session = getSessionAccount();
  return {
    role: session?.role || 'Faculty',
    userId: session?.id || '',
    email: session?.email || ''
  };
}

function readBoard(body: unknown): RoleLiveBoard | null {
  if (!body || typeof body !== 'object') return null;
  const record = body as Partial<RoleLiveBoard>;
  return {
    revision: Number(record.revision) || 0,
    documentRequests: Array.isArray(record.documentRequests) ? record.documentRequests : [],
    notifications: Array.isArray(record.notifications) ? record.notifications : [],
    accessRequests: Array.isArray(record.accessRequests) ? record.accessRequests : [],
    technicalReviews: Array.isArray(record.technicalReviews) ? record.technicalReviews : [],
    fileGrants: Array.isArray(record.fileGrants) ? record.fileGrants : []
  };
}

export async function fetchRoleLive(identity: RoleLiveIdentity = currentLiveIdentity()): Promise<RoleLiveBoard | null> {
  if (!getApiBaseUrl()) return null;
  const params = new URLSearchParams({
    role: identity.role,
    userId: identity.userId,
    email: identity.email
  });
  try {
    const res = await apiFetch(`/api/live/state/?${params.toString()}`, {}, 8000);
    if (!res.ok) return null;
    return readBoard(await res.json());
  } catch {
    return null;
  }
}

export async function syncRoleLive(
  patch: LivePush,
  identity: RoleLiveIdentity = currentLiveIdentity()
): Promise<RoleLiveBoard | null> {
  if (!getApiBaseUrl()) return null;
  try {
    const res = await apiFetch(
      '/api/live/sync/',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...identity, ...patch })
      },
      15000
    );
    if (!res.ok) return null;
    return readBoard(await res.json());
  } catch {
    return null;
  }
}

export function subscribeRoleLive(onChange: () => void): () => void {
  const base = getApiBaseUrl();
  if (!base || typeof EventSource === 'undefined') return () => {};
  const source = new EventSource(`${base}/api/live/events/`);
  source.onmessage = () => onChange();
  return () => source.close();
}

export function runLiveTask(task: () => Promise<void>): Promise<void> {
  return enqueue(task);
}
