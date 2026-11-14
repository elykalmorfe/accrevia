/** Technical Review access-request models (frontend demo + future API-compatible). */

export type TechnicalReviewAccessStatus =
  | 'Pending'
  | 'Approved'
  | 'Denied'
  | 'Expired'
  | 'Revoked'
  | 'Canceled';

export type TechnicalReviewAccessHistoryAction =
  | 'Submitted'
  | 'Approved'
  | 'Denied'
  | 'Revoked'
  | 'Canceled'
  | 'Expired';

export interface TechnicalReviewAccessHistoryEntry {
  at: string;
  action: TechnicalReviewAccessHistoryAction;
  by?: string;
  note?: string;
}

export interface TechnicalReviewAccessRequest {
  id: string;
  /** Demo-only public identifier shown in the UI. */
  demoRequestId: string;
  campusId: string;
  campusName: string;
  /** Combined College / Academic Program selection. */
  collegeProgram: string;
  purpose: string;
  remarks?: string;
  status: TechnicalReviewAccessStatus;
  submittedAt: string;
  updatedAt: string;
  requesterId?: string;
  requesterName?: string;
  requesterEmail?: string;
  /** Simulated QA note — never implies real authorization. */
  qaRemarks?: string;
  /** ISO date (YYYY-MM-DD or full ISO) when demo approval expires. */
  expiresAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  /** Chronological demo review trail. */
  reviewHistory?: TechnicalReviewAccessHistoryEntry[];
  /** Always true in the current prototype. */
  isDemo: true;
}

export type CreateTechnicalReviewAccessInput = {
  campusId: string;
  campusName: string;
  collegeProgram: string;
  purpose: string;
  remarks?: string;
  requesterId?: string;
  requesterName?: string;
  requesterEmail?: string;
};

export type ApproveTechnicalReviewAccessInput = {
  expiresAt: string;
  remarks?: string;
  reviewerName?: string;
};

export type DenyTechnicalReviewAccessInput = {
  reason: string;
  reviewerName?: string;
};

export type RevokeTechnicalReviewAccessInput = {
  reason: string;
  reviewerName?: string;
};

export type TechnicalReviewAccessFilters = {
  query: string;
  status: TechnicalReviewAccessStatus | '';
};

export type TechnicalReviewAccessStatusCounts = Record<TechnicalReviewAccessStatus, number>;

/**
 * Service contract for Technical Review access requests.
 * Swap mockAccessRequestService for a backend API client later without changing UI components.
 */
export interface TechnicalReviewAccessRequestService {
  listRequests(requesterId?: string): Promise<TechnicalReviewAccessRequest[]>;
  getRequest(id: string): Promise<TechnicalReviewAccessRequest | null>;
  createRequest(input: CreateTechnicalReviewAccessInput): Promise<TechnicalReviewAccessRequest>;
  cancelRequest(id: string, requesterId?: string): Promise<TechnicalReviewAccessRequest>;
  approveRequest(id: string, input: ApproveTechnicalReviewAccessInput): Promise<TechnicalReviewAccessRequest>;
  denyRequest(id: string, input: DenyTechnicalReviewAccessInput): Promise<TechnicalReviewAccessRequest>;
  revokeRequest(id: string, input: RevokeTechnicalReviewAccessInput): Promise<TechnicalReviewAccessRequest>;
  getStatusCounts(): Promise<TechnicalReviewAccessStatusCounts>;
}
