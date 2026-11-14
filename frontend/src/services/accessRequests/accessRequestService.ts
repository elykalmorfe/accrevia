/**
 * Technical Review access-request service.
 * Mock localStorage implementation for the frontend prototype.
 * Replace function bodies with authenticated API calls when the backend is ready.
 */
import type {
  ApproveTechnicalReviewAccessInput,
  CreateTechnicalReviewAccessInput,
  DenyTechnicalReviewAccessInput,
  RevokeTechnicalReviewAccessInput,
  TechnicalReviewAccessHistoryEntry,
  TechnicalReviewAccessRequest,
  TechnicalReviewAccessRequestService,
  TechnicalReviewAccessStatus,
  TechnicalReviewAccessStatusCounts
} from '../../types/technicalReviewAccess';
import { applyExpirationToList } from './expiration';
import {
  loadAccessRequests,
  nextDemoRequestId,
  saveAccessRequests
} from './mockAccessRequestStore';

const LATENCY_MS = 220;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => window.setTimeout(() => resolve(value), LATENCY_MS));
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `tr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function appendHistory(
  request: TechnicalReviewAccessRequest,
  entry: TechnicalReviewAccessHistoryEntry
): TechnicalReviewAccessHistoryEntry[] {
  return [...(request.reviewHistory ?? []), entry];
}

/** Load, derive Expired from past expiresAt, and persist if anything changed. */
function loadWithExpiration(): TechnicalReviewAccessRequest[] {
  const { requests, changed } = applyExpirationToList(loadAccessRequests());
  if (changed) saveAccessRequests(requests);
  return requests.slice().sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

function updateById(
  id: string,
  mutator: (current: TechnicalReviewAccessRequest) => TechnicalReviewAccessRequest
): TechnicalReviewAccessRequest {
  const existing = loadWithExpiration();
  const idx = existing.findIndex((r) => r.id === id || r.demoRequestId === id);
  if (idx < 0) throw new Error('Request not found');
  const updated = mutator(existing[idx]);
  const next = [...existing];
  next[idx] = updated;
  saveAccessRequests(next);
  return updated;
}

function emptyCounts(): TechnicalReviewAccessStatusCounts {
  return { Pending: 0, Approved: 0, Denied: 0, Expired: 0, Revoked: 0, Canceled: 0 };
}

export const mockAccessRequestService: TechnicalReviewAccessRequestService = {
  async listRequests(requesterId?: string) {
    const all = loadWithExpiration();
    if (!requesterId) return delay(all);
    // Faculty "My Access Requests" shows only that requester's rows (seed demos remain on the QA list).
    return delay(all.filter((r) => r.requesterId === requesterId));
  },

  async getRequest(id: string) {
    const all = loadWithExpiration();
    return delay(all.find((r) => r.id === id || r.demoRequestId === id) ?? null);
  },

  async createRequest(input: CreateTechnicalReviewAccessInput) {
    const existing = loadWithExpiration();
    const now = new Date().toISOString();
    const created: TechnicalReviewAccessRequest = {
      id: newId(),
      demoRequestId: nextDemoRequestId(existing),
      campusId: input.campusId,
      campusName: input.campusName,
      collegeProgram: input.collegeProgram.trim(),
      purpose: input.purpose.trim(),
      remarks: input.remarks?.trim() || undefined,
      status: 'Pending',
      submittedAt: now,
      updatedAt: now,
      requesterId: input.requesterId,
      requesterName: input.requesterName,
      requesterEmail: input.requesterEmail,
      reviewHistory: [
        {
          at: now,
          action: 'Submitted',
          by: input.requesterName || input.requesterEmail || 'Faculty/Staff'
        }
      ],
      isDemo: true
    };
    saveAccessRequests([created, ...existing]);
    return delay(created);
  },

  async cancelRequest(id: string, requesterId?: string) {
    const updated = updateById(id, (current) => {
      if (current.status !== 'Pending') throw new Error('Only pending demo requests can be canceled');
      if (requesterId && current.requesterId && current.requesterId !== requesterId) {
        throw new Error('You can only cancel your own demo requests');
      }
      const now = new Date().toISOString();
      const note =
        'Canceled by requester in the Faculty/Staff demo UI. This does not affect any Google Drive permissions.';
      return {
        ...current,
        status: 'Canceled',
        updatedAt: now,
        qaRemarks: note,
        reviewHistory: appendHistory(current, {
          at: now,
          action: 'Canceled',
          by: current.requesterName || requesterId || 'Requester',
          note
        })
      };
    });
    return delay(updated);
  },

  async approveRequest(id: string, input: ApproveTechnicalReviewAccessInput) {
    const expiresAt = input.expiresAt?.trim();
    if (!expiresAt) throw new Error('Expiration date is required for demo approval');
    const expiresMs = Date.parse(/^\d{4}-\d{2}-\d{2}$/.test(expiresAt) ? `${expiresAt}T23:59:59.999Z` : expiresAt);
    if (Number.isNaN(expiresMs)) throw new Error('Expiration date is invalid');
    if (expiresMs < Date.now()) throw new Error('Expiration date must be in the future');

    const updated = updateById(id, (current) => {
      if (current.status !== 'Pending') {
        throw new Error(`Cannot approve a request with status ${current.status}`);
      }
      const now = new Date().toISOString();
      const reviewer = input.reviewerName || 'QA Personnel';
      const note =
        input.remarks?.trim() ||
        'Simulated approval for UI demonstration only. Does not unlock Google Drive materials.';
      return {
        ...current,
        status: 'Approved' as TechnicalReviewAccessStatus,
        expiresAt,
        qaRemarks: note,
        reviewedBy: reviewer,
        reviewedAt: now,
        updatedAt: now,
        reviewHistory: appendHistory(current, {
          at: now,
          action: 'Approved',
          by: reviewer,
          note: `${note} Expires ${expiresAt} (demo).`
        })
      };
    });
    return delay(updated);
  },

  async denyRequest(id: string, input: DenyTechnicalReviewAccessInput) {
    const reason = input.reason?.trim();
    if (!reason) throw new Error('A denial reason is required');

    const updated = updateById(id, (current) => {
      if (current.status !== 'Pending') {
        throw new Error(`Cannot deny a request with status ${current.status}`);
      }
      const now = new Date().toISOString();
      const reviewer = input.reviewerName || 'QA Personnel';
      return {
        ...current,
        status: 'Denied',
        qaRemarks: reason,
        reviewedBy: reviewer,
        reviewedAt: now,
        updatedAt: now,
        expiresAt: undefined,
        reviewHistory: appendHistory(current, {
          at: now,
          action: 'Denied',
          by: reviewer,
          note: reason
        })
      };
    });
    return delay(updated);
  },

  async revokeRequest(id: string, input: RevokeTechnicalReviewAccessInput) {
    const reason = input.reason?.trim();
    if (!reason) throw new Error('A revocation reason is required');

    const updated = updateById(id, (current) => {
      if (current.status !== 'Approved') {
        throw new Error(`Only Approved demo requests can be revoked (current: ${current.status})`);
      }
      const now = new Date().toISOString();
      const reviewer = input.reviewerName || 'QA Personnel';
      return {
        ...current,
        status: 'Revoked',
        qaRemarks: reason,
        reviewedBy: reviewer,
        reviewedAt: now,
        updatedAt: now,
        reviewHistory: appendHistory(current, {
          at: now,
          action: 'Revoked',
          by: reviewer,
          note: reason
        })
      };
    });
    return delay(updated);
  },

  async getStatusCounts() {
    const all = loadWithExpiration();
    const counts = emptyCounts();
    for (const row of all) counts[row.status] += 1;
    return delay(counts);
  }
};

/** Active service binding — swap to an API client later. */
export const accessRequestService: TechnicalReviewAccessRequestService = mockAccessRequestService;
