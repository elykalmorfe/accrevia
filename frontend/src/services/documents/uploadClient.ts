import { EvidenceDocument } from '../../types/evidence';
import { apiFetch, checkApiHealth, isApiConfigured } from '../api/client';

export type UploadMeta = {
  title?: string;
  description?: string;
  frameworkId?: string;
  areaId?: string;
  criterionId?: string;
  indicatorId?: string;
  folderId?: string;
  docType?: string;
  academicYear?: string;
  cycle?: string;
  program?: string;
  college?: string;
  department?: string;
  office?: string;
  campus?: string;
  campusId?: string;
  confidentiality?: string;
  uploadedBy?: string;
  keywords?: string;
};

function sleep(ms: number) {
  return new Promise((r) => window.setTimeout(r, ms));
}

function mapUploadedDoc(raw: Record<string, unknown>, file: File, fallback: Partial<EvidenceDocument>): EvidenceDocument {
  const sizeMb = Math.max(0.1, Math.round((file.size / 1024 / 1024) * 10) / 10);
  return {
    id: String(raw.id),
    title: String(raw.title ?? fallback.title ?? file.name),
    description: String(raw.description ?? fallback.description ?? ''),
    keywords: Array.isArray(raw.keywords) ? (raw.keywords as string[]) : fallback.keywords ?? [],
    frameworkId: String(raw.frameworkId ?? fallback.frameworkId ?? 'ia'),
    areaId: String(raw.areaId ?? fallback.areaId ?? ''),
    criterionId: String(raw.criterionId ?? fallback.criterionId ?? ''),
    indicatorId: String(raw.indicatorId ?? fallback.indicatorId ?? ''),
    folderId: (raw.folderId as string) || fallback.folderId,
    docType: (raw.docType as EvidenceDocument['docType']) || (fallback.docType as EvidenceDocument['docType']) || 'Report',
    academicYear: String(raw.academicYear ?? fallback.academicYear ?? ''),
    cycle: String(raw.cycle ?? fallback.cycle ?? ''),
    program: String(raw.program ?? fallback.program ?? ''),
    college: String(raw.college ?? fallback.college ?? ''),
    department: String(raw.department ?? fallback.department ?? ''),
    office: String(raw.office ?? fallback.office ?? ''),
    campus: String(raw.campus ?? fallback.campus ?? ''),
    campusId: (raw.campusId as string) || fallback.campusId,
    documentDate: String(raw.documentDate ?? fallback.documentDate ?? new Date().toISOString().slice(0, 10)),
    confidentiality:
      (raw.confidentiality as EvidenceDocument['confidentiality']) || fallback.confidentiality || 'Internal',
    status: (raw.status as EvidenceDocument['status']) || 'Processing',
    dateAdded: String(raw.dateAdded ?? new Date().toISOString()),
    fileType: (raw.fileType as EvidenceDocument['fileType']) || fallback.fileType || 'PDF',
    pages: Number(raw.pages ?? fallback.pages ?? Math.max(1, Math.round(sizeMb * 6))),
    sizeMb: Number(raw.sizeMb ?? sizeMb),
    uploadedBy: String(raw.uploadedBy ?? fallback.uploadedBy ?? 'system'),
    passages: Array.isArray(raw.passages) ? (raw.passages as string[]) : fallback.passages ?? [],
    approvalStatus: (raw.approvalStatus as EvidenceDocument['approvalStatus']) || 'Pending Review'
  };
}

/**
 * Upload to Django when healthy. Returns null so callers can fall back to IndexedDB/localStorage.
 */
export async function uploadDocumentRemote(
  file: File,
  meta: UploadMeta,
  fallback: Partial<EvidenceDocument> = {}
): Promise<EvidenceDocument | null> {
  if (!isApiConfigured() || !(await checkApiHealth())) return null;

  const form = new FormData();
  form.append('file', file);
  Object.entries(meta).forEach(([k, v]) => {
    if (v != null && String(v).length > 0) form.append(k, String(v));
  });

  try {
    const res = await apiFetch('/api/documents/', { method: 'POST', body: form }, 120_000);
    if (!res.ok) return null;
    const created = (await res.json()) as Record<string, unknown>;
    const id = String(created.id);

    for (let i = 0; i < 45; i += 1) {
      const st = await apiFetch(`/api/documents/${id}/status/`, {}, 15_000);
      if (st.ok) {
        const body = (await st.json()) as { status?: string };
        if (body.status === 'Indexed' || body.status === 'Failed') break;
      }
      await sleep(2000);
    }

    const detail = await apiFetch(`/api/documents/${id}/`, {}, 15_000);
    if (!detail.ok) return mapUploadedDoc(created, file, fallback);
    const full = (await detail.json()) as Record<string, unknown>;
    return mapUploadedDoc(full, file, fallback);
  } catch {
    return null;
  }
}