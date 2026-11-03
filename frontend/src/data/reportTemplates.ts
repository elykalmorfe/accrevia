export interface Signatory {
  name: string;
  designation: string;
}

export interface ReportSignatories {
  preparedBy: Signatory;
  checkedBy: Signatory;
}

export const REPORT_INSTITUTION = {
  republic: 'Republic of the Philippines',
  university: 'North Eastern Mindanao State University',
  office: 'Office of Quality Assurance & Accreditation',
  address: 'Tandag City, Surigao del Sur',
  logoPath: '/nemsu-logo.png'
};

// The official "Prepared by" template is still to be supplied by the QA Office (Ma'am Lea);
// update these defaults (and SignatoryBlock in ProgramReportDocuments) once it is available.
export const DEFAULT_SIGNATORIES: ReportSignatories = {
  preparedBy: { name: '', designation: 'Accreditation Staff, Office of Quality Assurance' },
  checkedBy: { name: 'Prof. Liza M. Cabrera', designation: 'Director, Quality Assurance & Accreditation' }
};

const STORAGE_KEY = 'accrevia_report_signatories';

export function loadSignatories(): ReportSignatories {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SIGNATORIES;
    const parsed = JSON.parse(raw) as Partial<ReportSignatories>;
    return {
      preparedBy: { ...DEFAULT_SIGNATORIES.preparedBy, ...parsed.preparedBy },
      checkedBy: { ...DEFAULT_SIGNATORIES.checkedBy, ...parsed.checkedBy }
    };
  } catch {
    return DEFAULT_SIGNATORIES;
  }
}

export function saveSignatories(value: ReportSignatories) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors
  }
}
