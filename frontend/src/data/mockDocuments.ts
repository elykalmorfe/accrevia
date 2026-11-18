import type { EvidenceDocument } from '../types/evidence';

const DOCUMENTS_KEY = 'accrevia_documents';
const MOCK_SEED_KEY = 'accrevia_mock_documents';
/** Bumped so browsers stop re-applying older mock packs and strip leftover mock ids. */
const MOCK_SEED_VERSION = 'v3-empty';

/**
 * Mock evidence pack removed — uploads and API-indexed documents only.
 * Kept as an empty export so older imports do not break.
 */
export function buildMockDocuments(_today?: Date): EvidenceDocument[] {
  return [];
}

/**
 * Ensures mock documents are not re-seeded. Also strips leftover `mock-doc-*` rows
 * from localStorage once when upgrading from older builds.
 */
export function seedMockDocuments() {
  try {
    if (localStorage.getItem(MOCK_SEED_KEY) === MOCK_SEED_VERSION) return;
    const raw = localStorage.getItem(DOCUMENTS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    const stored = Array.isArray(parsed) ? (parsed as EvidenceDocument[]) : [];
    const cleaned = stored.filter((d) => !String(d.id || '').startsWith('mock-doc-'));
    localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(cleaned));
    localStorage.setItem(MOCK_SEED_KEY, MOCK_SEED_VERSION);
  } catch {
    // Storage unavailable; leave stored documents untouched.
  }
}
