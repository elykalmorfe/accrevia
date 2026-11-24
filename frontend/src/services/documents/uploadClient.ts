import type { EvidenceDocument } from '../../types/evidence';
import { persistUpload } from '../../utils/fileStore';
import { apiFetch, checkApiHealth, isApiConfigured } from '../api/client';

const metadataFields = [
  'title', 'description', 'frameworkId', 'areaId', 'criterionId', 'indicatorId',
  'folderId', 'docType', 'academicYear', 'cycle', 'program', 'college',
  'department', 'office', 'campus', 'campusId', 'confidentiality', 'uploadedBy'
] as const;

type UploadStatus = Pick<EvidenceDocument, 'status'> &
  Partial<Pick<EvidenceDocument, 'approvalStatus' | 'passages'>>;

type UploadResponse = UploadStatus & Pick<EvidenceDocument, 'id' | 'dateAdded'>;

async function uploadToIndexer(file: File, document: EvidenceDocument): Promise<UploadResponse | null> {
  if (!isApiConfigured() || !(await checkApiHealth())) return null;

  const form = new FormData();
  form.append('file', file);
  for (const field of metadataFields) {
    const value = document[field];
    if (value) form.append(field, value);
  }
  form.append('keywords', document.keywords.join(', '));

  try {
    const response = await apiFetch('/api/documents/', { method: 'POST', body: form }, 120_000);
    return response.ok ? await response.json() as UploadResponse : null;
  } catch {
    return null;
  }
}

/** Save an uploaded original and keep the review status reported by the indexer. */
export async function saveDocumentUpload(file: File, draft: EvidenceDocument): Promise<EvidenceDocument> {
  const indexed = await uploadToIndexer(file, draft);
  const document: EvidenceDocument = {
    ...draft,
    id: indexed?.id ?? draft.id,
    status: indexed?.status ?? draft.status,
    dateAdded: indexed?.dateAdded ?? draft.dateAdded,
    passages: indexed?.passages?.length ? indexed.passages : draft.passages,
    approvalStatus: indexed?.approvalStatus ?? 'Pending Review'
  };
  await persistUpload(document.id, file);
  return document;
}

export function isIndexingUpload(document: EvidenceDocument): boolean {
  return document.status === 'Processing' && /^[0-9a-f]{32}$/.test(document.id);
}

export async function fetchCompletedUpload(id: string): Promise<UploadStatus | null> {
  if (!isApiConfigured()) return null;
  try {
    const response = await apiFetch(`/api/documents/${id}/status/`, {}, 8_000);
    if (!response.ok) return null;
    const update = await response.json() as UploadStatus;
    return update.status === 'Indexed' || update.status === 'Failed' ? update : null;
  } catch {
    return null;
  }
}
