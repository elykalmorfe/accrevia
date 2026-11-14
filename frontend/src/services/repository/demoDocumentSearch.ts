/**
 * Search helpers for the separate Faculty/Staff demonstration document catalog.
 * Does not touch verified AACCUP / COPC catalogs.
 */
import {
  demoBrowseHref,
  getDemoDocumentRecords,
  toRepoDocumentItem,
  type DemoDocumentCategory,
  type DemoDocumentRecord
} from '../../data/demoDocuments/demoDocumentCatalog';
import type { RepoDocumentItem } from '../../types/accreditationRepository';

export type DemoSearchHit = {
  id: string;
  title: string;
  category: 'demonstration-document';
  categoryLabel: string;
  demoCategory: DemoDocumentCategory;
  campus?: string;
  college?: string;
  program?: string;
  documentType?: string;
  locationPath?: string;
  href: string;
  document: RepoDocumentItem;
  isDemo: true;
};

export type DemoSearchParams = {
  q?: string;
  campus?: string;
  program?: string;
  documentType?: string;
  demoCategory?: DemoDocumentCategory | '';
};

function matches(record: DemoDocumentRecord, params: DemoSearchParams): boolean {
  if (params.demoCategory && record.category !== params.demoCategory) return false;
  if (params.campus) {
    const f = params.campus.toLowerCase();
    const ok =
      record.campusId.toLowerCase() === f ||
      record.campus.toLowerCase() === f ||
      record.campus.toLowerCase().includes(f);
    if (!ok) return false;
  }
  if (params.program) {
    const p = params.program.toLowerCase();
    const ok =
      (record.program ?? '').toLowerCase() === p ||
      (record.program ?? '').toLowerCase().includes(p) ||
      record.title.toLowerCase().includes(p);
    if (!ok) return false;
  }
  if (params.documentType) {
    const t = params.documentType.toLowerCase();
    if (record.documentType.toLowerCase() !== t && t !== 'pdf') return false;
  }
  const q = params.q?.trim().toLowerCase() ?? '';
  if (!q) return true;
  const hay = [
    record.title,
    record.categoryLabel,
    record.category,
    record.campus,
    record.college,
    record.program,
    record.filename,
    record.verificationNote,
    record.locationPath
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return hay.includes(q);
}

export function searchDemoDocuments(params: DemoSearchParams = {}): DemoSearchHit[] {
  return getDemoDocumentRecords()
    .filter((r) => matches(r, params))
    .map((record) => ({
      id: record.id,
      title: record.title,
      category: 'demonstration-document' as const,
      categoryLabel: `Demonstration · ${record.categoryLabel}`,
      demoCategory: record.category,
      campus: record.campus,
      college: record.college,
      program: record.program,
      documentType: record.documentType,
      locationPath: record.locationPath,
      href: demoBrowseHref(record.id),
      document: toRepoDocumentItem(record),
      isDemo: true as const
    }));
}

export function listDemoCategoryOptions(): Array<{ value: DemoDocumentCategory; label: string }> {
  const map = new Map<DemoDocumentCategory, string>();
  for (const r of getDemoDocumentRecords()) map.set(r.category, r.categoryLabel);
  return [...map.entries()].map(([value, label]) => ({ value, label }));
}
