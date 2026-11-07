import { useCallback, useState, useSyncExternalStore } from 'react';
import { CampusId } from '../types/accreditation';
import { FileType } from '../types/evidence';
import { UserRole } from '../types/user';
import { academicYears, accreditationCycles } from '../data/options';
import { standardProgramSurveyAreas } from '../data/accreditationData';

export interface IAAreaTemplate {
  code: string;
  number: number;
  name: string;
  shortDesc: string;
}

export type ValidityLevel = 'Level 1' | 'Level 2' | 'Level 3' | 'Level 4';
export type DateFormatOption = 'MMM d, yyyy' | 'MM/dd/yyyy' | 'dd/MM/yyyy' | 'yyyy-MM-dd';
export type UploadReviewStatus = 'Pending Review' | 'Approved';

export interface PortalSettings {
  general: {
    systemName: string;
    institution: string;
    /** Uploaded logo as a data URL; empty means the bundled NEMSU seal. */
    logoDataUrl: string;
    defaultAcademicYear: string;
    pageSize: number;
    timezone: string;
  };
  accreditation: {
    academicYears: string[];
    cycles: string[];
    iaAreas: IAAreaTemplate[];
    programAreas: string[];
    levelValidityYears: Record<ValidityLevel, number>;
    copcCmoDefault: string;
  };
  reports: {
    republic: string;
    university: string;
    office: string;
    address: string;
  };
  workflow: {
    approverRoles: UserRole[];
    requireRevisionNote: boolean;
    autoVerifyArea: boolean;
  };
  uploads: {
    allowedTypes: FileType[];
    maxFileSizeMb: number;
    namingPattern: string;
    newUploadStatus: UploadReviewStatus;
  };
  reminders: {
    enabled: boolean;
    folderDeadlineDays: number;
    expiryWarningMonths: number;
  };
  preferences: {
    startupCampus: 'remember' | 'all' | CampusId;
    startupSidebar: 'remember' | 'expanded' | 'collapsed';
    dateFormat: DateFormatOption;
    density: 'comfortable' | 'compact';
  };
  security: {
    timeout: string;
    sessions: number;
    minLength: number;
    complexity: boolean;
    expiry: string;
    mfa: boolean;
    /** Overrides keyed `role|permission`; missing keys fall back to the role defaults. */
    permissions: Record<string, boolean>;
  };
  sharing: {
    permission: 'view' | 'download';
    expiry: string;
    roleSharing: boolean;
    notify: boolean;
    confidentialViewOnly: boolean;
  };
  search: {
    k1: number;
    b: number;
    semanticWeight: number;
    candidates: number;
    accreditationBoost: boolean;
    boostWeight: number;
    rerank: boolean;
    rerankTopN: number;
    resultCount: number;
    minScore: number;
  };
  processing: {
    engine: string;
    languages: string;
    autoDetect: boolean;
    dpi: string;
    minConfidence: number;
    keepTables: boolean;
    stripHeaders: boolean;
    chunkSize: number;
    overlap: number;
  };
}

export const DEFAULT_IA_AREAS: IAAreaTemplate[] = [
  { code: 'AREA-I', number: 1, name: 'Governance and Management', shortDesc: 'Strategic plans, organizational manuals, BOR resolutions' },
  { code: 'AREA-II', number: 2, name: 'Teaching, Learning, and Evaluation', shortDesc: 'OBE syllabi, curricular approvals, graduation metrics' },
  { code: 'AREA-III', number: 3, name: 'Faculty and Staff', shortDesc: 'Plantilla credentials, FDP plans, QCE/NBC 461 ratings' },
  { code: 'AREA-IV', number: 4, name: 'Research', shortDesc: 'Institutional agenda, Scopus publications, IP disclosures' },
  { code: 'AREA-V', number: 5, name: 'Extension, Consultancy, and Linkages', shortDesc: 'Extension master plan, LGU MOUs, impact assessment' },
  { code: 'AREA-VI', number: 6, name: 'Support to Students', shortDesc: 'SAS operations manual, guidance counseling, scholarships' },
  { code: 'AREA-VII', number: 7, name: 'Library', shortDesc: 'Holdings inventory, electronic databases, OPAC portal' },
  { code: 'AREA-VIII', number: 8, name: 'Infrastructure and Other Learning Resources', shortDesc: 'Physical plant, lab safety audit, IT high-speed network' },
  { code: 'AREA-IX', number: 9, name: 'Quality Assurance Culture', shortDesc: 'QA manual, ISO 9001:2015 QMS, IQA resolutions' }
];

export const UPLOAD_FILE_TYPES: FileType[] = ['PDF', 'DOCX', 'XLSX', 'PPTX', 'JPG', 'PNG', 'TIFF'];

export const DEFAULT_SETTINGS: PortalSettings = {
  general: {
    systemName: 'Accrevia',
    institution: 'North Eastern Mindanao State University',
    logoDataUrl: '',
    defaultAcademicYear: academicYears[0],
    pageSize: 20,
    timezone: 'Asia/Manila (UTC+8)'
  },
  accreditation: {
    academicYears,
    cycles: accreditationCycles,
    iaAreas: DEFAULT_IA_AREAS,
    programAreas: standardProgramSurveyAreas,
    levelValidityYears: { 'Level 1': 3, 'Level 2': 5, 'Level 3': 5, 'Level 4': 5 },
    copcCmoDefault: 'CMO No. 25, Series of 2015 / CMO No. 20, Series of 2013'
  },
  reports: {
    republic: 'Republic of the Philippines',
    university: 'North Eastern Mindanao State University',
    office: 'Office of Quality Assurance & Accreditation',
    address: 'Tandag City, Surigao del Sur'
  },
  workflow: {
    approverRoles: ['Superadmin', 'Administrator', 'QA Personnel'],
    requireRevisionNote: true,
    autoVerifyArea: true
  },
  uploads: {
    allowedTypes: UPLOAD_FILE_TYPES,
    maxFileSizeMb: 25,
    namingPattern: '{name}',
    newUploadStatus: 'Pending Review'
  },
  reminders: {
    enabled: true,
    folderDeadlineDays: 7,
    expiryWarningMonths: 12
  },
  preferences: {
    startupCampus: 'remember',
    startupSidebar: 'remember',
    dateFormat: 'MMM d, yyyy',
    density: 'comfortable'
  },
  security: { timeout: '30', sessions: 2, minLength: 12, complexity: true, expiry: '90', mfa: true, permissions: {} },
  sharing: { permission: 'view', expiry: '90', roleSharing: true, notify: true, confidentialViewOnly: true },
  search: {
    k1: 1.2,
    b: 0.75,
    semanticWeight: 0.6,
    candidates: 50,
    accreditationBoost: true,
    boostWeight: 0.15,
    rerank: true,
    rerankTopN: 30,
    resultCount: 20,
    minScore: 25
  },
  processing: {
    engine: 'Tesseract 5',
    languages: 'English + Filipino',
    autoDetect: true,
    dpi: '300',
    minConfidence: 60,
    keepTables: true,
    stripHeaders: true,
    chunkSize: 512,
    overlap: 64
  }
};

const STORAGE_KEY = 'accrevia_settings';
const listeners = new Set<() => void>();

function withDefaults(raw: Partial<Record<keyof PortalSettings, object>> | null): PortalSettings {
  const merged: Record<string, unknown> = {};
  for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof PortalSettings)[]) {
    merged[key] = { ...DEFAULT_SETTINGS[key], ...(raw?.[key] ?? {}) };
  }
  return merged as unknown as PortalSettings;
}

function readStoredSettings(): PortalSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return withDefaults(raw ? JSON.parse(raw) : null);
  } catch {
    return withDefaults(null);
  }
}

function applyDocumentPreferences(settings: PortalSettings) {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.density = settings.preferences.density;
  document.title = `${settings.general.systemName} · ${settings.reports.university}`;
}

let current = readStoredSettings();
applyDocumentPreferences(current);

function commit(next: PortalSettings) {
  current = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage quota errors
  }
  applyDocumentPreferences(next);
  listeners.forEach((l) => l());
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== STORAGE_KEY) return;
    current = readStoredSettings();
    applyDocumentPreferences(current);
    listeners.forEach((l) => l());
  });
}

export function getSettings(): PortalSettings {
  return current;
}

export const DEFAULT_LOGO_SRC = '/nemsu-logo.png';

export function logoSrc(settings: PortalSettings = current): string {
  return settings.general.logoDataUrl || DEFAULT_LOGO_SRC;
}

export function updateSettings<K extends keyof PortalSettings>(section: K, value: PortalSettings[K]) {
  commit({ ...current, [section]: value });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function usePortalSettings(): PortalSettings {
  return useSyncExternalStore(subscribe, getSettings, getSettings);
}

/** Unsaved edits for one settings section, committed only when `save` is called. */
export function useSettingsDraft<K extends keyof PortalSettings>(section: K) {
  const saved = usePortalSettings()[section];
  const [draft, setDraft] = useState<PortalSettings[K] | null>(null);
  const value = draft ?? saved;
  const dirty = draft !== null && JSON.stringify(draft) !== JSON.stringify(saved);

  const set = useCallback(
    (patch: Partial<PortalSettings[K]>) => setDraft((prev) => ({ ...(prev ?? getSettings()[section]), ...patch })),
    [section]
  );
  const save = useCallback(() => {
    if (draft) updateSettings(section, draft);
    setDraft(null);
  }, [draft, section]);
  const discard = useCallback(() => setDraft(null), []);
  const reset = useCallback(() => setDraft(DEFAULT_SETTINGS[section]), [section]);

  return { value, set, dirty, save, discard, reset };
}
