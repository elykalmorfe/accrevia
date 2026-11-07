import type { CampusIAStatus, COPCRecord, ProgramAccreditation } from '../types/accreditation';
import type { EvidenceDocument, EvidenceFolder } from '../types/evidence';

const PURGE_VERSION_KEY = 'accrevia_sample_purge';
const PURGE_VERSION = 'no-sample-data-1';

const SAMPLE_CAMPUS = '(bislig|cagwait|cantilan|lianga|sanmiguel|tagbina|tandag)';
const SAMPLE_DOCUMENT_ID = new RegExp(`^(d-\\d{3}|doc-${SAMPLE_CAMPUS}-a\\d+-\\d+)$`);
const SAMPLE_FOLDER_ID = new RegExp(`^folder-${SAMPLE_CAMPUS}-a\\d+-[a-z]+$`);
const SAMPLE_SUBFOLDER_IDS = new Set([
  'folder-pa-curriculum',
  'folder-pa-faculty',
  'folder-pa-survey',
  'folder-copc-ched',
  'folder-copc-facilities',
  'folder-pqa-leadership',
  'folder-pqa-strategy',
  'folder-iso-audit',
  'folder-iso-procedures'
]);

const SAMPLE_IA_DOCUMENTS = new Set([
  'Campus_Dev_Plan_2024_2028.pdf',
  'OBE_Compliance_Matrix_2024.pdf',
  'Faculty_Qualifications_Roster.pdf',
  'Research_Accomplishments_AY2024.pdf',
  'Extension_Program_Reports_2024.pdf',
  'Student_Affairs_Portfolio.pdf',
  'Library_Holdings_Audit_2024.pdf',
  'Infrastructure_Safety_Audit_2024.pdf',
  'QA_Culture_Manual_ISO_2024.pdf'
]);
const SAMPLE_PROGRAM_DOCUMENT = /^Area [IVX]+_Portfolio\.pdf$/;
const SAMPLE_COPC_DOCUMENTS = new Set([
  'CMO_Compliant_Curriculum_Matrix.pdf',
  'Faculty_Qualifications_Verification.pdf',
  'Specialized_Laboratories_Inspection.pdf',
  'Library_Titles_Holdings_Cert.pdf',
  'Internship_MOA_Compilation.pdf'
]);
const SAMPLE_COPC_CERTIFICATE = /^COPC-CHED-RO13-\d+$/;
const SAMPLE_COPC_DATE = '2023-08-15';
const SAMPLE_COPC_BOR = 'BOR Resolution No. 042, Series of 2021';
const SAMPLE_DRIVE_LINKS = new Set([
  'https://drive.google.com/file/d/1xsNkKL7GoKyB47CFHPqu0lkF-CmuwH9p/view',
  'https://drive.google.com/drive/folders/1c95n6ZIge4zvZZ11wN4y0IKDr_r2mYko'
]);

const USER_NOTIFICATION_ID = /^notif-\d{13}/;
const USER_ACCESS_REQUEST_ID = /^req-\d{13}/;

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(`accrevia_${key}`);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write<T>(key: string, value: T) {
  localStorage.setItem(`accrevia_${key}`, JSON.stringify(value));
}

function filterStored<T>(key: string, keep: (item: T) => boolean) {
  const stored = read<T[]>(key);
  if (Array.isArray(stored)) write(key, stored.filter(keep));
}

function mapStored<T>(key: string, map: (item: T) => T) {
  const stored = read<T[]>(key);
  if (Array.isArray(stored)) write(key, stored.map(map));
}

/**
 * Removes the bundled demo records (documents, folders, activity, and pre-filled
 * checklist submissions) from data persisted by earlier builds, keeping user-created records.
 */
export function purgeLegacySampleData() {
  try {
    if (localStorage.getItem(PURGE_VERSION_KEY) === PURGE_VERSION) return;

    filterStored<EvidenceDocument>('documents', (d) => !SAMPLE_DOCUMENT_ID.test(d.id));
    filterStored<EvidenceFolder>(
      'folders',
      (f) => !SAMPLE_FOLDER_ID.test(f.id) && !SAMPLE_SUBFOLDER_IDS.has(f.id)
    );
    filterStored<{ id: string }>('notifications', (n) => USER_NOTIFICATION_ID.test(n.id));
    filterStored<{ id: string }>('accessRequests', (r) => USER_ACCESS_REQUEST_ID.test(r.id));

    mapStored<CampusIAStatus>('iaRecords', (rec) => ({
      ...rec,
      requirements: (rec.requirements || []).map((r) =>
        r.documentName && SAMPLE_IA_DOCUMENTS.has(r.documentName)
          ? { ...r, isSubmitted: false, status: 'Pending', documentName: undefined, documentUrl: undefined, submissionDate: undefined, reviewerNotes: undefined }
          : r
      )
    }));

    mapStored<ProgramAccreditation>('programAccreditations', (p) => ({
      ...p,
      requirements: (p.requirements || []).map((r) =>
        r.documentName && SAMPLE_PROGRAM_DOCUMENT.test(r.documentName)
          ? { ...r, isSubmitted: false, verified: false, documentName: undefined, documentUrl: undefined, submissionDate: undefined }
          : r
      )
    }));

    mapStored<COPCRecord>('copcRecords', (c) => ({
      ...c,
      certificateNumber: c.certificateNumber && SAMPLE_COPC_CERTIFICATE.test(c.certificateNumber) ? undefined : c.certificateNumber,
      dateIssued: c.dateIssued === SAMPLE_COPC_DATE ? undefined : c.dateIssued,
      borRes: c.borRes === SAMPLE_COPC_BOR ? undefined : c.borRes,
      documentLink: c.documentLink && SAMPLE_DRIVE_LINKS.has(c.documentLink) ? undefined : c.documentLink,
      requirements: (c.requirements || []).map((r) =>
        r.documentName && SAMPLE_COPC_DOCUMENTS.has(r.documentName)
          ? { ...r, isSubmitted: false, status: 'Pending', documentName: undefined, documentUrl: undefined, deficiencyNote: undefined }
          : r
      )
    }));

    localStorage.setItem(PURGE_VERSION_KEY, PURGE_VERSION);
  } catch {
    // Storage unavailable; seeds are already empty so there is nothing to purge.
  }
}
