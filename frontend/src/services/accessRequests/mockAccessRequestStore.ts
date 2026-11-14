import type { TechnicalReviewAccessRequest } from '../../types/technicalReviewAccess';
import { seedTechnicalReviewAccessRequests } from './seedAccessRequests';

const STORAGE_KEY = 'accrevia_tr_access_requests_demo';
const VERSION_KEY = 'accrevia_tr_access_requests_demo_version';
const SEED_VERSION = 2;

function readRaw(): TechnicalReviewAccessRequest[] {
  if (typeof window === 'undefined') return [...seedTechnicalReviewAccessRequests];
  try {
    const version = Number(window.localStorage.getItem(VERSION_KEY) ?? '0');
    if (version !== SEED_VERSION) {
      writeAll([...seedTechnicalReviewAccessRequests]);
      return [...seedTechnicalReviewAccessRequests];
    }
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      writeAll([...seedTechnicalReviewAccessRequests]);
      return [...seedTechnicalReviewAccessRequests];
    }
    const parsed = JSON.parse(raw) as TechnicalReviewAccessRequest[];
    return Array.isArray(parsed) ? parsed : [...seedTechnicalReviewAccessRequests];
  } catch {
    return [...seedTechnicalReviewAccessRequests];
  }
}

function writeAll(requests: TechnicalReviewAccessRequest[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
    window.localStorage.setItem(VERSION_KEY, String(SEED_VERSION));
    window.dispatchEvent(new Event('accrevia-tr-access-requests-change'));
  } catch {
    // Demo storage failures are ignored.
  }
}

export function loadAccessRequests(): TechnicalReviewAccessRequest[] {
  return readRaw().slice().sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

export function saveAccessRequests(requests: TechnicalReviewAccessRequest[]) {
  writeAll(requests);
}

export function subscribeAccessRequests(onChange: () => void) {
  if (typeof window === 'undefined') return () => undefined;
  const handler = () => onChange();
  window.addEventListener('accrevia-tr-access-requests-change', handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener('accrevia-tr-access-requests-change', handler);
    window.removeEventListener('storage', handler);
  };
}

export function nextDemoRequestId(existing: TechnicalReviewAccessRequest[]): string {
  const year = new Date().getFullYear();
  const seq = existing.length + 1;
  return `DEMO-TR-${year}-${String(seq).padStart(4, '0')}`;
}
