import { getSettings, logoSrc } from '../settings/portalSettings';

export interface Signatory {
  name: string;
  designation: string;
}

export interface ReportSignatories {
  preparedBy: Signatory;
  checkedBy: Signatory;
  approvedBy: Signatory;
}

export interface ReportInstitution {
  republic: string;
  university: string;
  office: string;
  address: string;
  logoPath: string;
}

/** Letterhead for printed reports, as configured in Settings → Reports & Printing. */
export function getReportInstitution(): ReportInstitution {
  const settings = getSettings();
  return { ...settings.reports, logoPath: logoSrc(settings) };
}

export const DEFAULT_SIGNATORIES: ReportSignatories = {
  preparedBy: { name: '', designation: 'Accreditation Staff, Office of Quality Assurance' },
  checkedBy: { name: 'Prof. Liza M. Cabrera', designation: 'Director, Quality Assurance & Accreditation' },
  approvedBy: { name: '', designation: 'University President' }
};

const STORAGE_KEY = 'accrevia_report_signatories';

export function loadSignatories(): ReportSignatories {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SIGNATORIES;
    const parsed = JSON.parse(raw) as Partial<ReportSignatories>;
    return {
      preparedBy: { ...DEFAULT_SIGNATORIES.preparedBy, ...parsed.preparedBy },
      checkedBy: { ...DEFAULT_SIGNATORIES.checkedBy, ...parsed.checkedBy },
      approvedBy: { ...DEFAULT_SIGNATORIES.approvedBy, ...parsed.approvedBy }
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
