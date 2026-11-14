import type {
  TechnicalReviewAccessHistoryEntry,
  TechnicalReviewAccessRequest
} from '../../types/technicalReviewAccess';

function endOfDayUtcMs(dateValue: string): number {
  // Accept YYYY-MM-DD or full ISO; treat date-only as end of that UTC day.
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return Date.parse(`${dateValue}T23:59:59.999Z`);
  }
  return Date.parse(dateValue);
}

export function isApprovalExpired(request: TechnicalReviewAccessRequest, now = Date.now()): boolean {
  if (request.status !== 'Approved' || !request.expiresAt) return false;
  const expiresMs = endOfDayUtcMs(request.expiresAt);
  if (Number.isNaN(expiresMs)) return false;
  return expiresMs < now;
}

export function withDerivedExpiration(
  request: TechnicalReviewAccessRequest,
  now = Date.now()
): TechnicalReviewAccessRequest {
  if (!isApprovalExpired(request, now)) return request;
  const at = new Date(now).toISOString();
  const entry: TechnicalReviewAccessHistoryEntry = {
    at,
    action: 'Expired',
    note: `Derived from past expiration date (${request.expiresAt}) — demo only.`
  };
  return {
    ...request,
    status: 'Expired',
    updatedAt: at,
    qaRemarks:
      request.qaRemarks ||
      'Simulated approval expired. This does not change Google Drive permissions.',
    reviewHistory: [...(request.reviewHistory ?? []), entry]
  };
}

/** Apply expiration derivation across a list; returns whether any row changed. */
export function applyExpirationToList(
  requests: TechnicalReviewAccessRequest[],
  now = Date.now()
): { requests: TechnicalReviewAccessRequest[]; changed: boolean } {
  let changed = false;
  const next = requests.map((r) => {
    const derived = withDerivedExpiration(r, now);
    if (derived !== r && derived.status !== r.status) changed = true;
    return derived;
  });
  return { requests: next, changed };
}
