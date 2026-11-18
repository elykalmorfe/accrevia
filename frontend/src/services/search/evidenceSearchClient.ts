import { EvidenceDocument, Lookup } from '../../types/evidence';
import { searchEvidence, SearchResult } from '../../utils/search';
import { apiFetch, checkApiHealth, isApiConfigured } from '../api/client';

export type EvidenceSearchFilters = {
  frameworkId?: string;
  areaId?: string;
  criterionId?: string;
  indicatorId?: string;
  campusId?: string;
  program?: string;
};

type ApiSearchHit = {
  doc: Record<string, unknown>;
  score: number;
  terms?: string[];
  passages?: string[];
  keywords?: string[];
  relatedTerms?: string[];
  fields?: string[];
};

function mapApiDoc(raw: Record<string, unknown>, localDocs: EvidenceDocument[]): EvidenceDocument {
  const id = String(raw.id ?? '');
  const local = localDocs.find((d) => d.id === id);
  if (local) {
    return {
      ...local,
      passages: Array.isArray(raw.passages) ? (raw.passages as string[]) : local.passages,
      status: (raw.status as EvidenceDocument['status']) || local.status
    };
  }
  return {
    id,
    title: String(raw.title ?? 'Untitled'),
    description: String(raw.description ?? ''),
    keywords: Array.isArray(raw.keywords) ? (raw.keywords as string[]) : [],
    frameworkId: String(raw.frameworkId ?? 'ia'),
    areaId: String(raw.areaId ?? ''),
    criterionId: String(raw.criterionId ?? ''),
    indicatorId: String(raw.indicatorId ?? ''),
    folderId: (raw.folderId as string) || undefined,
    docType: (raw.docType as EvidenceDocument['docType']) || 'Other',
    academicYear: String(raw.academicYear ?? ''),
    cycle: String(raw.cycle ?? ''),
    program: String(raw.program ?? ''),
    college: String(raw.college ?? ''),
    department: String(raw.department ?? ''),
    office: String(raw.office ?? ''),
    campus: String(raw.campus ?? ''),
    campusId: (raw.campusId as string) || undefined,
    documentDate: String(raw.documentDate ?? ''),
    confidentiality: (raw.confidentiality as EvidenceDocument['confidentiality']) || 'Internal',
    status: (raw.status as EvidenceDocument['status']) || 'Indexed',
    dateAdded: String(raw.dateAdded ?? new Date().toISOString()),
    fileType: (raw.fileType as EvidenceDocument['fileType']) || 'PDF',
    pages: Number(raw.pages ?? 1),
    sizeMb: Number(raw.sizeMb ?? 0.1),
    uploadedBy: String(raw.uploadedBy ?? 'system'),
    passages: Array.isArray(raw.passages) ? (raw.passages as string[]) : [],
    approvalStatus: (raw.approvalStatus as EvidenceDocument['approvalStatus']) || 'Pending Review'
  };
}

/**
 * Prefer Django hybrid search when the API is healthy; otherwise use local searchEvidence.
 */
export async function searchEvidenceAsync(
  query: string,
  docs: EvidenceDocument[],
  lookup: Lookup,
  filters?: EvidenceSearchFilters,
  limit = 50
): Promise<{ results: SearchResult[]; source: 'api' | 'local' }> {
  const q = query.trim();
  if (q.length <= 1) {
    return { results: searchEvidence(q, docs, lookup), source: 'local' };
  }

  if (isApiConfigured() && (await checkApiHealth())) {
    try {
      const res = await apiFetch(
        '/api/search/',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ q, limit, ...filters })
        },
        60_000
      );
      if (res.ok) {
        const body = (await res.json()) as { results?: ApiSearchHit[] };
        const results: SearchResult[] = (body.results ?? []).map((hit) => ({
          doc: mapApiDoc(hit.doc || {}, docs),
          score: Number(hit.score ?? 0),
          terms: hit.terms ?? [],
          passages: hit.passages ?? [],
          keywords: hit.keywords ?? [],
          relatedTerms: hit.relatedTerms ?? [],
          fields: hit.fields ?? ['document text']
        }));
        return { results, source: 'api' };
      }
    } catch {
      // fall through
    }
  }

  return { results: searchEvidence(q, docs, lookup), source: 'local' };
}