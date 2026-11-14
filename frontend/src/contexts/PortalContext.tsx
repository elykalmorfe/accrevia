import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { frameworks as initialFrameworks } from '../data/frameworks';
import { initialFolders } from '../data/folders';
import { seedMockDocuments } from '../data/mockDocuments';
import { areas as initialAreas } from '../data/areas';
import { criteria as initialCriteria } from '../data/criteria';
import { indicators as initialIndicators } from '../data/indicators';
import { users as initialUsers } from '../data/users';
import {
  campuses as initialCampuses,
  initialCampusIA,
  initialCampusPQA,
  initialProgramAccreditations,
  initialCOPCRecords,
  initialISORecords
} from '../data/accreditationData';
import { PROGRAM_ACCREDITATION_DATA_VERSION, COPC_DATA_VERSION } from '../data/programAccreditationRecords';
import {
  AccreditationArea,
  Criterion,
  DocumentMetadata,
  EvidenceDocument,
  EvidenceFolder,
  EvidenceRequirement,
  Framework,
  Indicator,
  PendingDocument
} from '../types/evidence';
import {
  Campus,
  CampusId,
  CampusIAStatus,
  IALevel,
  CampusPQAStatus,
  COPCRecord,
  COPCRequirementItem,
  IARequirementItem,
  ISOCorrectiveAction,
  ISOSurveillanceRecord,
  ProgramAccreditation,
  ProgramRequirementItem
} from '../types/accreditation';
import { PortalUser, PortalViewRole, UserStatus } from '../types/user';
import { AccessAction, AccessLogEntry, AccessRequest, DocumentShare, ShareRecipientInput } from '../types/sharing';
import { DocumentRequest, NewDocumentRequestInput, RequestAttachment, RequestStatus } from '../types/request';
import { initialDocumentRequests } from '../data/documentRequests';
import { metadataToPatch } from '../utils/metadata';
import { isAdminRole, isRecipientRole, nowIso, permissionLabel, shareStatus } from '../utils/sharing';
import { formatDate } from '../utils/format';
import { isCampusMatch } from '../utils/campus';
import { normalizeDocumentsPublishingFields, normalizePublishingFields } from '../utils/publicDocuments';
import { deleteStoredFile } from '../utils/fileStore';
import { applyLevelChange, ensureLevelHistory, normalizeLegacyStatus } from '../utils/programAccreditation';
import { purgeLegacySampleData } from '../utils/samplePurge';
import {
  COPC_CERT_FILES_KEY,
  COPC_CERT_FILES_VERSION,
  LINKED_CERTIFICATES_KEY,
  LINKED_CERTIFICATES_VERSION,
  buildLinkedCertificates,
  clearGeneratedLinkedCertificateFiles,
  prefetchCertificateFiles,
  prefetchCopcCertificateFiles,
  refreshLinkedCertificateMeta
} from '../utils/linkedCertificates';
import {
  RATINGS_DOCUMENTS_KEY,
  RATINGS_DOCUMENTS_VERSION,
  buildRatingsDocuments,
  prefetchRatingsDocuments
} from '../utils/ratingsDocuments';
import { getSettings } from '../settings/portalSettings';
import { useSessionAccount } from '../utils/auth';

purgeLegacySampleData();
seedMockDocuments();

export interface PortalNotification {
  id: string;
  title: string;
  detail: string;
  to: string;
  time: string;
  /** `'admins'` for administrators/QA, a user id for one person; omitted means everyone. */
  audience?: 'admins' | string;
}

interface PortalContextValue {
  currentUser: PortalUser;
  isAdmin: boolean;
  selectedCampus: CampusId | 'all';
  setSelectedCampus: (campus: CampusId | 'all') => void;
  selectedCampusObj: Campus | null;
  filteredDocuments: EvidenceDocument[];
  filteredPrograms: ProgramAccreditation[];
  filteredCopcRecords: COPCRecord[];
  filteredIsoRecords: ISOSurveillanceRecord[];
  isCampusMatch: (docCampus?: string, targetCampus?: CampusId | 'all') => boolean;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean | ((prev: boolean) => boolean)) => void;
  toggleSidebar: () => void;
  frameworks: Framework[];
  saveFramework: (framework: Framework) => void;
  setFrameworkActive: (id: string, active: boolean) => void;
  areas: AccreditationArea[];
  saveArea: (area: AccreditationArea) => void;
  criteria: Criterion[];
  saveCriterion: (criterion: Criterion) => void;
  indicators: Indicator[];
  saveIndicator: (indicator: Indicator) => void;
  addRequirement: (indicatorId: string, requirement: EvidenceRequirement) => void;
  documents: EvidenceDocument[];
  addDocument: (doc: EvidenceDocument) => void;
  updateDocument: (id: string, patch: Partial<EvidenceDocument>) => void;
  deleteDocument: (id: string) => void;
  folders: EvidenceFolder[];
  saveFolder: (folder: EvidenceFolder) => void;
  deleteFolder: (id: string) => void;
  pending: PendingDocument[];
  addPending: (doc: PendingDocument) => void;
  classifyPending: (id: string, meta: DocumentMetadata) => void;
  users: PortalUser[];
  saveUser: (user: PortalUser) => void;
  setUserStatus: (id: string, status: UserStatus) => void;
  switchUser: (userId: string) => void;
  shares: DocumentShare[];
  shareDocument: (documentId: string, recipients: ShareRecipientInput[], expiresAt: string | null) => void;
  updateSharePermission: (shareId: string, canDownload: boolean) => void;
  extendShare: (shareId: string, expiresAt: string | null) => void;
  revokeShare: (shareId: string) => void;
  removeShare: (shareId: string) => void;
  accessRequests: AccessRequest[];
  submitAccessRequest: (documentId: string, reason: string, requestedPermission?: 'View only' | 'View and Download') => void;
  reviewAccessRequest: (requestId: string, decision: 'Approved' | 'Rejected', reviewNotes?: string, expiresAt?: string | null) => void;
  notifications: PortalNotification[];
  dismissNotification: (id: string) => void;
  documentRequests: DocumentRequest[];
  createDocumentRequest: (input: NewDocumentRequestInput) => string;
  replyToDocumentRequest: (id: string, body: string, attachments: RequestAttachment[], nextStatus?: RequestStatus) => void;
  setDocumentRequestStatus: (id: string, status: RequestStatus) => void;
  markDocumentRequestRead: (id: string) => void;
  toggleDocumentRequestStar: (id: string) => void;
  accessLog: AccessLogEntry[];
  logAccess: (action: AccessAction, documentId: string, detail?: string) => void;
  recentSearches: string[];
  addRecentSearch: (query: string) => void;
  savedIds: string[];
  toggleSaved: (id: string) => boolean;

  // ================= Accreditation & QA Core =================
  campuses: Campus[];
  saveCampus: (campus: Campus) => void;
  iaRecords: CampusIAStatus[];
  updateCampusIA: (campusId: CampusId, patch: Partial<CampusIAStatus>) => void;
  updateIARequirement: (campusId: CampusId, reqId: string, patch: Partial<IARequirementItem>) => void;

  pqaRecords: CampusPQAStatus[];
  updateCampusPQA: (campusId: CampusId, patch: Partial<CampusPQAStatus>) => void;

  programAccreditations: ProgramAccreditation[];
  saveProgramAccreditation: (program: ProgramAccreditation) => void;
  deleteProgramAccreditation: (id: string) => void;
  updateProgramRequirement: (programId: string, reqId: string, patch: Partial<ProgramRequirementItem>) => void;

  copcRecords: COPCRecord[];
  updateCOPCRecord: (id: string, patch: Partial<COPCRecord>) => void;
  updateCOPCRequirement: (copcId: string, reqId: string, patch: Partial<COPCRequirementItem>) => void;
  resetCOPCRecords: () => void;

  isoRecords: ISOSurveillanceRecord[];
  saveISOSurveillanceRecord: (record: ISOSurveillanceRecord) => void;
  addISOCorrectiveAction: (recordId: string, car: ISOCorrectiveAction) => void;
  updateISOCorrectiveAction: (recordId: string, carId: string, patch: Partial<ISOCorrectiveAction>) => void;
}

const PortalContext = createContext<PortalContextValue | null>(null);

const viewAsUserId: Record<PortalViewRole, string> = {
  Superadmin: 'u-00',
  Administrator: 'u-01',
  'QA Personnel': 'u-02',
  Faculty: 'u-07',
  Staff: 'u-13',
  Accreditor: 'u-11',
  User: 'u-16'
};

function upsert<T extends { id: string }>(list: T[], item: T): T[] {
  return list.some((i) => i.id === item.id) ? list.map((i) => (i.id === item.id ? item : i)) : [...list, item];
}

function loadStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(`accrevia_${key}`);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

/** Like loadStorage, but discards the stored copy when it was saved against an older seed version. */
function loadVersionedStorage<T>(key: string, defaultValue: T, version: string): T {
  const versionKey = `accrevia_${key}_version`;
  try {
    if (localStorage.getItem(versionKey) !== version) {
      localStorage.removeItem(`accrevia_${key}`);
      localStorage.setItem(versionKey, version);
      return defaultValue;
    }
  } catch {
    return defaultValue;
  }
  return loadStorage(key, defaultValue);
}

function saveStorage<T>(key: string, value: T) {
  try {
    localStorage.setItem(`accrevia_${key}`, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors in sandbox
  }
}

export function PortalProvider({ children, viewAs = 'Administrator' }: { children: ReactNode; viewAs?: PortalViewRole }) {
  const [frameworks, setFrameworks] = useState(initialFrameworks);
  const [areas, setAreas] = useState(initialAreas);
  const [criteria, setCriteria] = useState(initialCriteria);
  const [indicators, setIndicators] = useState(initialIndicators);
  const [documents, setDocuments] = useState<EvidenceDocument[]>(() =>
    normalizeDocumentsPublishingFields(loadStorage<EvidenceDocument[]>('documents', []))
  );
  const [folders, setFolders] = useState<EvidenceFolder[]>(() => {
    const stored = loadStorage<EvidenceFolder[]>('folders', initialFolders);
    const existingIds = new Set(stored.map((f) => f.id));
    const missingRoots = initialFolders.filter((f) => !existingIds.has(f.id));
    return missingRoots.length > 0 ? [...missingRoots, ...stored] : stored;
  });
  const [pending, setPending] = useState<PendingDocument[]>([]);
  const [users, setUsers] = useState<PortalUser[]>(() => {
    return loadStorage<PortalUser[]>('portal_users', initialUsers);
  });

  useEffect(() => {
    saveStorage('portal_users', users);
  }, [users]);
  const [shares, setShares] = useState<DocumentShare[]>([]);
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>(() =>
    loadStorage<AccessRequest[]>('accessRequests', [])
  );
  const [notifications, setNotifications] = useState<PortalNotification[]>(() => loadStorage('notifications', []));
  const [documentRequests, setDocumentRequests] = useState<DocumentRequest[]>(() =>
    loadStorage<DocumentRequest[]>('document_requests', initialDocumentRequests)
  );
  const [accessLog, setAccessLog] = useState<AccessLogEntry[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>(() => loadStorage<string[]>('saved_ids', []));

  // Global Campus Filter State
  const [selectedCampus, setSelectedCampusState] = useState<CampusId | 'all'>(() => {
    const { startupCampus } = getSettings().preferences;
    if (startupCampus !== 'remember') return startupCampus;
    return loadStorage<CampusId | 'all'>('selected_campus', 'all');
  });

  const setSelectedCampus = useCallback((campus: CampusId | 'all') => {
    setSelectedCampusState(campus);
    saveStorage('selected_campus', campus);
  }, []);

  // Sidebar Collapse State
  const [sidebarCollapsed, setSidebarCollapsedState] = useState<boolean>(() => {
    const { startupSidebar } = getSettings().preferences;
    if (startupSidebar !== 'remember') return startupSidebar === 'collapsed';
    return loadStorage<boolean>('sidebar_collapsed', false);
  });

  const setSidebarCollapsed = useCallback((collapsed: boolean | ((prev: boolean) => boolean)) => {
    setSidebarCollapsedState((prev) => {
      const next = typeof collapsed === 'function' ? collapsed(prev) : collapsed;
      saveStorage('sidebar_collapsed', next);
      return next;
    });
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, [setSidebarCollapsed]);

  useEffect(() => {
    saveStorage('folders', folders);
  }, [folders]);

  useEffect(() => {
    saveStorage('documents', documents);
  }, [documents]);

  useEffect(() => {
    saveStorage('saved_ids', savedIds);
  }, [savedIds]);

  // Accreditation & QA State
  const [campuses, setCampuses] = useState<Campus[]>(() => {
    const stored = loadStorage<Campus[]>('campuses', initialCampuses);
    return initialCampuses.map((c) => ({ ...c, ...stored.find((s) => s.id === c.id) }));
  });
  const saveCampus = useCallback((campus: Campus) => {
    setCampuses((prev) => {
      const next = prev.map((c) => (c.id === campus.id ? campus : c));
      saveStorage('campuses', next);
      return next;
    });
  }, []);
  const [iaRecords, setIaRecords] = useState<CampusIAStatus[]>(() => {
    const loaded = loadStorage('iaRecords', initialCampusIA);
    return loaded.map((rec) => {
      if ((rec.status as string) === 'Candidate' || (rec.status as string) === 'Under Evaluation') {
        return { ...rec, status: 'Level I Accredited' as IALevel };
      }
      return rec;
    });
  });
  const [pqaRecords, setPqaRecords] = useState<CampusPQAStatus[]>(() => loadStorage('pqaRecords', initialCampusPQA));
  const [programAccreditations, setProgramAccreditations] = useState<ProgramAccreditation[]>(() => {
    const loaded = loadVersionedStorage(
      'programAccreditations',
      initialProgramAccreditations,
      PROGRAM_ACCREDITATION_DATA_VERSION
    );
    const migrated = loaded.map((p) => ensureLevelHistory(normalizeLegacyStatus(p)));
    if (migrated.some((p, i) => p !== loaded[i])) saveStorage('programAccreditations', migrated);
    return migrated;
  });
  const [copcRecords, setCopcRecords] = useState<COPCRecord[]>(() => {
    const loaded = loadVersionedStorage('copcRecords', initialCOPCRecords, COPC_DATA_VERSION);
    // Auto-heal: If all records have 0 approved requirements (stale legacy cache), force re-seed to initialCOPCRecords
    const hasApproved = loaded.some((c) => c.requirements.some((r) => r.status === 'Approved'));
    if (!hasApproved && initialCOPCRecords.some((c) => c.requirements.some((r) => r.status === 'Approved'))) {
      saveStorage('copcRecords', initialCOPCRecords);
      try {
        localStorage.setItem('accrevia_copcRecords_version', COPC_DATA_VERSION);
      } catch {
        // ignore storage errors
      }
      return initialCOPCRecords;
    }
    return loaded;
  });
  const [isoRecords, setIsoRecords] = useState<ISOSurveillanceRecord[]>(() => loadStorage('isoRecords', initialISORecords));

  // Seed AACCUP certificate folders/docs from the local manifest (once per seed version).
  useEffect(() => {
    try {
      if (localStorage.getItem(LINKED_CERTIFICATES_KEY) !== LINKED_CERTIFICATES_VERSION) {
        localStorage.setItem(LINKED_CERTIFICATES_KEY, LINKED_CERTIFICATES_VERSION);
        const seed = buildLinkedCertificates(programAccreditations);
        const folderIdFor = new Map<string, string>();
        const addedFolders = seed.folders.filter((f) => {
          const existing = folders.find((e) => e.isSystem && e.areaId === f.areaId && e.code === f.code);
          if (existing) folderIdFor.set(f.id, existing.id);
          return !existing && !folders.some((e) => e.id === f.id);
        });
        const seededDocs = seed.documents.map((d) =>
          d.folderId && folderIdFor.has(d.folderId) ? { ...d, folderId: folderIdFor.get(d.folderId) } : d
        );
        if (addedFolders.length) setFolders((prev) => [...prev, ...addedFolders.filter((f) => !prev.some((p) => p.id === f.id))]);
        setDocuments((prev) => {
          // Replace prior linked/local certificate docs for these programs so level files refresh.
          const seededIds = new Set(seededDocs.map((d) => d.id));
          const areaIds = new Set(seededDocs.map((d) => d.areaId));
          const kept = prev.filter(
            (d) =>
              !(d.frameworkId === 'pa' && areaIds.has(d.areaId) && (d.id.startsWith('doc-cert-') || seededIds.has(d.id)))
          );
          return normalizeDocumentsPublishingFields(
            refreshLinkedCertificateMeta([...kept, ...seededDocs], programAccreditations)
          );
        });
        void clearGeneratedLinkedCertificateFiles(programAccreditations)
          .then(() => prefetchCertificateFiles(seededDocs))
          .catch((err) => console.error('Could not prefetch certificate files', err));
      }
    } catch {
      // Storage unavailable; skip seeding.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programAccreditations]);

  // Prefetch COPC official certificate binaries into IndexedDB once per version.
  useEffect(() => {
    try {
      if (localStorage.getItem(COPC_CERT_FILES_KEY) === COPC_CERT_FILES_VERSION) return;
      localStorage.setItem(COPC_CERT_FILES_KEY, COPC_CERT_FILES_VERSION);
      void prefetchCopcCertificateFiles(copcRecords).catch((err) =>
        console.error('Could not prefetch COPC certificate files', err)
      );
    } catch {
      // ignore
    }
  }, [copcRecords]);

  // Seed Technical Review & Board Action rating documents (once per version).
  useEffect(() => {
    try {
      if (localStorage.getItem(RATINGS_DOCUMENTS_KEY) === RATINGS_DOCUMENTS_VERSION) return;
      localStorage.setItem(RATINGS_DOCUMENTS_KEY, RATINGS_DOCUMENTS_VERSION);
      const seed = buildRatingsDocuments(programAccreditations);
      const folderIdFor = new Map<string, string>();
      const addedFolders = seed.folders.filter((f) => {
        const existing = folders.find((e) => e.isSystem && e.areaId === f.areaId && e.code === f.code);
        if (existing) folderIdFor.set(f.id, existing.id);
        return !existing && !folders.some((e) => e.id === f.id);
      });
      const seededDocs = seed.documents.map((d) =>
        d.folderId && folderIdFor.has(d.folderId) ? { ...d, folderId: folderIdFor.get(d.folderId) } : d
      );
      if (addedFolders.length) setFolders((prev) => [...prev, ...addedFolders.filter((f) => !prev.some((p) => p.id === f.id))]);
      setDocuments((prev) => {
        const areaIds = new Set(seededDocs.map((d) => d.areaId));
        const kept = prev.filter(
          (d) => !(d.frameworkId === 'pa' && typeof d.areaId === 'string' && d.areaId.startsWith('trba-') && areaIds.has(d.areaId))
        );
        return normalizeDocumentsPublishingFields([
          ...kept,
          ...seededDocs.filter((d) => !kept.some((p) => p.id === d.id))
        ]);
      });
      // Point technicalReviewLink at the newest local ratings file.
      setProgramAccreditations((prev) => {
        let changed = false;
        const next = prev.map((p) => {
          const primary =
            seed.documents.find((d) => d.areaId === `trba-${p.id}` && d.isActive)?.documentUrl ||
            seed.documents.find((d) => d.areaId === `trba-${p.id}`)?.documentUrl;
          if (!primary || p.technicalReviewLink === primary) return p;
          changed = true;
          return { ...p, technicalReviewLink: primary };
        });
        if (changed) {
          saveStorage('programAccreditations', next);
          return next;
        }
        return prev;
      });
      void prefetchRatingsDocuments(seededDocs).catch((err) =>
        console.error('Could not prefetch ratings documents', err)
      );
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programAccreditations]);

  // Selected campus derived helpers
  const selectedCampusObj = useMemo(() => {
    if (selectedCampus === 'all') return null;
    return campuses.find((c) => c.id === selectedCampus) || null;
  }, [campuses, selectedCampus]);

  const filteredDocuments = useMemo(() => {
    if (selectedCampus === 'all') return documents;
    return documents.filter((d) => isCampusMatch(d.campus, selectedCampus));
  }, [documents, selectedCampus]);

  const filteredPrograms = useMemo(() => {
    if (selectedCampus === 'all') return programAccreditations;
    return programAccreditations.filter((p) => p.campusId === selectedCampus);
  }, [programAccreditations, selectedCampus]);

  const filteredCopcRecords = useMemo(() => {
    if (selectedCampus === 'all') return copcRecords;
    return copcRecords.filter((r) => r.campusId === selectedCampus);
  }, [copcRecords, selectedCampus]);

  const filteredIsoRecords = useMemo(() => {
    if (selectedCampus === 'all') return isoRecords;
    return isoRecords.filter((r) => r.campusId === selectedCampus);
  }, [isoRecords, selectedCampus]);

  const [activeUserId, setActiveUserId] = useState<string>(() => {
    return loadStorage<string>('active_user_id', viewAsUserId[viewAs] || 'u-01');
  });

  const session = useSessionAccount();
  const currentUser = useMemo(() => {
    if (session?.email) {
      const byId = session.id ? users.find((u) => u.id === session.id) : undefined;
      if (byId) return byId;
      const email = session.email.trim().toLowerCase();
      const byEmail = users.find((u) => u.email.trim().toLowerCase() === email);
      if (byEmail) return byEmail;
      // Session exists but portal directory has not synced yet — never fall back to a seeded admin.
      const role = (session.role as PortalUser['role']) || 'Faculty';
      const name =
        [session.firstName, session.middleName, session.lastName].filter(Boolean).join(' ').trim() || session.email;
      return {
        id: session.id || `session-${email}`,
        name,
        email: session.email,
        role,
        office: '',
        status: 'Active' as const,
        lastLogin: null
      };
    }
    return users.find((u) => u.id === activeUserId) ?? users.find((u) => u.id === viewAsUserId[viewAs]) ?? users[0];
  }, [users, activeUserId, viewAs, session]);

  const switchUser = useCallback((userId: string) => {
    setActiveUserId(userId);
    saveStorage('active_user_id', userId);
  }, []);
  const isAdmin = isAdminRole(currentUser.role);

  const saveFramework = useCallback((f: Framework) => setFrameworks((prev) => upsert(prev, f)), []);
  const setFrameworkActive = useCallback(
    (id: string, active: boolean) => setFrameworks((prev) => prev.map((f) => (f.id === id ? { ...f, active } : f))),
    []
  );
  const saveArea = useCallback((a: AccreditationArea) => setAreas((prev) => upsert(prev, a)), []);
  const saveCriterion = useCallback((c: Criterion) => setCriteria((prev) => upsert(prev, c)), []);
  const saveIndicator = useCallback((i: Indicator) => setIndicators((prev) => upsert(prev, i)), []);
  const addRequirement = useCallback(
    (indicatorId: string, req: EvidenceRequirement) =>
      setIndicators((prev) => prev.map((i) => (i.id === indicatorId ? { ...i, requirements: [...i.requirements, req] } : i))),
    []
  );
  const updateDocument = useCallback(
    (id: string, patch: Partial<EvidenceDocument>) =>
      setDocuments((prev) => prev.map((d) => (d.id === id ? normalizePublishingFields({ ...d, ...patch }) : d))),
    []
  );
  const addDocument = useCallback(
    (doc: EvidenceDocument) =>
      setDocuments((prev) => [
        normalizePublishingFields({
          ...doc,
          isPubliclyPublished: doc.isPubliclyPublished ?? false,
          publicPublishedAt: doc.publicPublishedAt ?? null
        }),
        ...prev
      ]),
    []
  );
  const deleteDocument = useCallback((id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    deleteStoredFile(id).catch(() => undefined);
  }, []);
  const saveFolder = useCallback((folder: EvidenceFolder) => {
    setFolders((prev) => {
      const idx = prev.findIndex((f) => f.id === folder.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = folder;
        return next;
      }
      return [...prev, folder];
    });
  }, []);
  const deleteFolder = useCallback((id: string) => {
    setFolders((prev) => prev.filter((f) => f.id !== id));
  }, []);
  const addPending = useCallback((doc: PendingDocument) => setPending((prev) => [doc, ...prev]), []);

  const classifyPending = useCallback(
    (id: string, meta: DocumentMetadata) => {
      const source = pending.find((p) => p.id === id);
      if (!source) return;
      const today = new Date().toISOString().slice(0, 10);
      const newDoc: EvidenceDocument = {
        id: `d-${Date.now()}`,
        title: '',
        description: '',
        keywords: [],
        frameworkId: '',
        areaId: '',
        criterionId: '',
        indicatorId: '',
        docType: 'Other',
        academicYear: '',
        cycle: '',
        program: '',
        college: '',
        department: '',
        office: '',
        campus: '',
        documentDate: today,
        confidentiality: 'Internal',
        ...metadataToPatch(meta),
        status: 'Indexed',
        dateAdded: today,
        fileType: source.fileType,
        pages: source.pages,
        sizeMb: source.sizeMb,
        uploadedBy: source.uploadedBy,
        passages: [source.excerpt],
        isPubliclyPublished: false,
        publicPublishedAt: null
      };
      if (!newDoc.documentDate) newDoc.documentDate = today;
      setDocuments((prev) => [newDoc, ...prev]);
      setPending((prev) => prev.filter((p) => p.id !== id));
    },
    [pending]
  );

  const saveUser = useCallback(
    (u: PortalUser) => setUsers((prev) => (prev.some((x) => x.id === u.id) ? upsert(prev, u) : [u, ...prev])),
    []
  );
  const setUserStatus = useCallback(
    (id: string, status: UserStatus) => setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status } : u))),
    []
  );

  const logAccess = useCallback(
    (action: AccessAction, documentId: string, detail?: string) =>
      setAccessLog((prev) => [
        {
          id: `l-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          actor: currentUser.name,
          actorRole: currentUser.role,
          action,
          documentId,
          detail,
          at: nowIso()
        },
        ...prev
      ]),
    [currentUser]
  );

  const shareDocument = useCallback(
    (documentId: string, recipients: ShareRecipientInput[], expiresAt: string | null) => {
      const at = nowIso();
      setShares((prev) => {
        let next = [...prev];
        recipients.forEach((r, i) => {
          const idx = next.findIndex((s) => s.documentId === documentId && s.recipientId === r.recipientId && shareStatus(s) === 'Active');
          if (idx >= 0) {
            next[idx] = { ...next[idx], canView: r.canView, canDownload: r.canDownload, expiresAt };
          } else {
            next = [
              { id: `s-${Date.now()}-${i}`, documentId, ...r, sharedBy: currentUser.name, sharedAt: at, expiresAt, revokedAt: null },
              ...next
            ];
          }
        });
        return next;
      });
      const detail = recipients.map((r) => `${r.recipientName} · ${permissionLabel(r.canDownload)}`).join('; ');
      logAccess('Shared', documentId, `${detail}${expiresAt ? ` · expires ${formatDate(expiresAt)}` : ''}`);
    },
    [currentUser, logAccess]
  );

  const updateSharePermission = useCallback(
    (shareId: string, canDownload: boolean) => {
      const share = shares.find((s) => s.id === shareId);
      if (!share) return;
      setShares((prev) => prev.map((s) => (s.id === shareId ? { ...s, canDownload } : s)));
      logAccess(
        'Permission changed',
        share.documentId,
        `${share.recipientName}: ${permissionLabel(share.canDownload)} → ${permissionLabel(canDownload)}`
      );
    },
    [shares, logAccess]
  );

  const extendShare = useCallback(
    (shareId: string, expiresAt: string | null) => {
      const share = shares.find((s) => s.id === shareId);
      if (!share) return;
      setShares((prev) => prev.map((s) => (s.id === shareId ? { ...s, expiresAt } : s)));
      logAccess('Access extended', share.documentId, `${share.recipientName} · ${expiresAt ? `until ${formatDate(expiresAt)}` : 'no expiry'}`);
    },
    [shares, logAccess]
  );

  const revokeShare = useCallback(
    (shareId: string) => {
      const share = shares.find((s) => s.id === shareId);
      if (!share) return;
      setShares((prev) => prev.map((s) => (s.id === shareId ? { ...s, revokedAt: nowIso() } : s)));
      logAccess('Access revoked', share.documentId, share.recipientName);
    },
    [shares, logAccess]
  );

  const removeShare = useCallback((shareId: string) => setShares((prev) => prev.filter((s) => s.id !== shareId)), []);

  const submitAccessRequest = useCallback(
    (documentId: string, reason: string, requestedPermission: 'View only' | 'View and Download' = 'View only') => {
      const doc = documents.find((d) => d.id === documentId);
      const docTitle = doc?.title || 'Accreditation Document';
      const newReq: AccessRequest = {
        id: `req-${Date.now()}`,
        documentId,
        documentTitle: docTitle,
        requesterId: currentUser.id,
        requesterName: currentUser.name,
        requesterRole: currentUser.role,
        requesterOffice: currentUser.office,
        reason,
        requestedPermission,
        status: 'Pending',
        requestedAt: nowIso()
      };

      setAccessRequests((prev) => {
        const next = [newReq, ...prev];
        saveStorage('accessRequests', next);
        return next;
      });

      // Real-time / In-app notification for QA dashboard
      const newNotif: PortalNotification = {
        id: `notif-${Date.now()}`,
        title: `Access Request: ${docTitle}`,
        detail: `${currentUser.name} (${currentUser.role}) requested ${requestedPermission}. Purpose: "${reason.slice(0, 50)}${reason.length > 50 ? '...' : ''}"`,
        to: '/evidence/shared?tab=requests',
        time: 'Just now',
        audience: 'admins'
      };
      setNotifications((prev) => {
        const next = [newNotif, ...prev];
        saveStorage('notifications', next);
        return next;
      });

      logAccess('Access requested', documentId, `${currentUser.name} requested ${requestedPermission}: ${reason}`);
    },
    [currentUser, documents, logAccess]
  );

  const reviewAccessRequest = useCallback(
    (requestId: string, decision: 'Approved' | 'Rejected', reviewNotes?: string, expiresAt?: string | null) => {
      const req = accessRequests.find((r) => r.id === requestId);
      if (!req) return;

      const now = nowIso();
      const updatedReq: AccessRequest = {
        ...req,
        status: decision,
        reviewedBy: currentUser.name,
        reviewedAt: now,
        reviewNotes: reviewNotes || (decision === 'Approved' ? 'Access approved by Quality Assurance Personnel' : 'Access request declined'),
        grantedExpiresAt: expiresAt ?? null
      };

      setAccessRequests((prev) => {
        const next = prev.map((r) => (r.id === requestId ? updatedReq : r));
        saveStorage('accessRequests', next);
        return next;
      });

      if (decision === 'Approved') {
        const canDownload = req.requestedPermission === 'View and Download';
        shareDocument(
          req.documentId,
          [
            {
              recipientType: 'user',
              recipientId: req.requesterId,
              recipientName: req.requesterName,
              recipientRole: isRecipientRole(req.requesterRole) ? req.requesterRole : 'Faculty',
              canView: true,
              canDownload
            }
          ],
          expiresAt ?? null
        );
        logAccess('Access approved', req.documentId, `Approved request from ${req.requesterName} (${req.requestedPermission})`);
      } else {
        logAccess('Access rejected', req.documentId, `Rejected request from ${req.requesterName}: ${reviewNotes || 'Declined'}`);
      }
    },
    [accessRequests, currentUser, shareDocument, logAccess]
  );

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => {
      const next = prev.filter((n) => n.id !== id);
      saveStorage('notifications', next);
      return next;
    });
  }, []);

  const pushNotification = useCallback((n: Omit<PortalNotification, 'id' | 'time'>) => {
    setNotifications((prev) => {
      const next = [{ id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, time: 'Just now', ...n }, ...prev];
      saveStorage('notifications', next);
      return next;
    });
  }, []);

  const updateDocumentRequests = useCallback((update: (prev: DocumentRequest[]) => DocumentRequest[]) => {
    setDocumentRequests((prev) => {
      const next = update(prev);
      saveStorage('document_requests', next);
      return next;
    });
  }, []);

  const createDocumentRequest = useCallback(
    (input: NewDocumentRequestInput) => {
      const at = nowIso();
      const id = `dreq-${Date.now()}`;
      const request: DocumentRequest = {
        id,
        subject: input.subject,
        category: input.category,
        priority: input.priority,
        reference: input.reference || undefined,
        requesterId: currentUser.id,
        requesterName: currentUser.name,
        requesterRole: currentUser.role,
        requesterEmail: currentUser.email,
        requesterOffice: currentUser.office,
        status: 'Open',
        messages: [
          {
            id: `dmsg-${Date.now()}`,
            authorId: currentUser.id,
            authorName: currentUser.name,
            authorRole: currentUser.role,
            body: input.body,
            attachments: input.attachments,
            sentAt: at
          }
        ],
        createdAt: at,
        updatedAt: at,
        unreadByAdmin: true,
        unreadByRequester: false
      };
      updateDocumentRequests((prev) => [request, ...prev]);
      pushNotification({
        title: `New request: ${input.subject}`,
        detail: `${currentUser.name} (${currentUser.role}) requested ${input.category.toLowerCase()}${input.priority === 'Urgent' ? ' · Urgent' : ''}.`,
        to: `/requests/${id}`,
        audience: 'admins'
      });
      return id;
    },
    [currentUser, updateDocumentRequests, pushNotification]
  );

  const replyToDocumentRequest = useCallback(
    (id: string, body: string, attachments: RequestAttachment[], nextStatus?: RequestStatus) => {
      const req = documentRequests.find((r) => r.id === id);
      if (!req) return;
      const byAdmin = isAdmin && currentUser.id !== req.requesterId;
      const at = nowIso();
      const status: RequestStatus =
        nextStatus ??
        (byAdmin
          ? req.status === 'Open'
            ? 'In Progress'
            : req.status
          : req.status === 'Fulfilled' || req.status === 'Closed'
          ? 'Open'
          : req.status);

      updateDocumentRequests((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                status,
                updatedAt: at,
                unreadByAdmin: byAdmin ? r.unreadByAdmin : true,
                unreadByRequester: byAdmin ? true : r.unreadByRequester,
                messages: [
                  ...r.messages,
                  {
                    id: `dmsg-${Date.now()}`,
                    authorId: currentUser.id,
                    authorName: currentUser.name,
                    authorRole: currentUser.role,
                    body,
                    attachments,
                    sentAt: at
                  }
                ]
              }
            : r
        )
      );

      if (byAdmin) {
        attachments
          .filter((a) => a.kind === 'document' && a.documentId)
          .forEach((a) =>
            shareDocument(
              a.documentId as string,
              [
                {
                  recipientType: 'user',
                  recipientId: req.requesterId,
                  recipientName: req.requesterName,
                  recipientRole: isRecipientRole(req.requesterRole) ? req.requesterRole : 'Faculty',
                  canView: true,
                  canDownload: true
                }
              ],
              null
            )
          );
      }

      const fileNote = attachments.length > 0 ? ` · ${attachments.length} attachment${attachments.length === 1 ? '' : 's'}` : '';
      pushNotification({
        title: `${status === 'Fulfilled' ? 'Request fulfilled' : 'New reply'}: ${req.subject}`,
        detail: `${currentUser.name}: "${body.slice(0, 60)}${body.length > 60 ? '...' : ''}"${fileNote}`,
        to: `/requests/${id}`,
        audience: byAdmin ? req.requesterId : 'admins'
      });
    },
    [documentRequests, isAdmin, currentUser, updateDocumentRequests, shareDocument, pushNotification]
  );

  const setDocumentRequestStatus = useCallback(
    (id: string, status: RequestStatus) => {
      const req = documentRequests.find((r) => r.id === id);
      if (!req || req.status === status) return;
      const byAdmin = isAdmin && currentUser.id !== req.requesterId;
      updateDocumentRequests((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                status,
                updatedAt: nowIso(),
                unreadByAdmin: byAdmin ? r.unreadByAdmin : true,
                unreadByRequester: byAdmin ? true : r.unreadByRequester
              }
            : r
        )
      );
      pushNotification({
        title: `Request ${status === 'Open' ? 'reopened' : `marked ${status.toLowerCase()}`}: ${req.subject}`,
        detail: `Updated by ${currentUser.name}.`,
        to: `/requests/${id}`,
        audience: byAdmin ? req.requesterId : 'admins'
      });
    },
    [documentRequests, isAdmin, currentUser, updateDocumentRequests, pushNotification]
  );

  const markDocumentRequestRead = useCallback(
    (id: string) => {
      const req = documentRequests.find((r) => r.id === id);
      if (!req) return;
      const asAdmin = isAdmin && currentUser.id !== req.requesterId;
      if (asAdmin ? !req.unreadByAdmin : !req.unreadByRequester) return;
      updateDocumentRequests((prev) =>
        prev.map((r) => (r.id === id ? (asAdmin ? { ...r, unreadByAdmin: false } : { ...r, unreadByRequester: false }) : r))
      );
    },
    [documentRequests, isAdmin, currentUser, updateDocumentRequests]
  );

  const toggleDocumentRequestStar = useCallback(
    (id: string) => updateDocumentRequests((prev) => prev.map((r) => (r.id === id ? { ...r, starred: !r.starred } : r))),
    [updateDocumentRequests]
  );

  const addRecentSearch = useCallback((query: string) => {
    setRecentSearches((prev) => [query, ...prev.filter((q) => q.toLowerCase() !== query.toLowerCase())].slice(0, 8));
  }, []);

  const toggleSaved = useCallback(
    (id: string) => {
      const willSave = !savedIds.includes(id);
      setSavedIds((prev) => (willSave ? [...prev, id] : prev.filter((x) => x !== id)));
      return willSave;
    },
    [savedIds]
  );

  // ================= Accreditation Mutations =================
  const updateCampusIA = useCallback((campusId: CampusId, patch: Partial<CampusIAStatus>) => {
    setIaRecords((prev) => {
      const next = prev.map((item) => (item.campusId === campusId ? { ...item, ...patch } : item));
      saveStorage('iaRecords', next);
      return next;
    });
  }, []);

  const updateIARequirement = useCallback((campusId: CampusId, reqId: string, patch: Partial<IARequirementItem>) => {
    setIaRecords((prev) => {
      const next = prev.map((campus) => {
        if (campus.campusId !== campusId) return campus;
        const updatedReqs = campus.requirements.map((r) => (r.id === reqId ? { ...r, ...patch, lastUpdated: new Date().toISOString() } : r));
        return { ...campus, requirements: updatedReqs };
      });
      saveStorage('iaRecords', next);
      return next;
    });
  }, []);

  const updateCampusPQA = useCallback((campusId: CampusId, patch: Partial<CampusPQAStatus>) => {
    setPqaRecords((prev) => {
      const next = prev.map((item) => (item.campusId === campusId ? { ...item, ...patch } : item));
      saveStorage('pqaRecords', next);
      return next;
    });
  }, []);

  const saveProgramAccreditation = useCallback(
    (prog: ProgramAccreditation) => {
      setProgramAccreditations((prev) => {
        const previous = prev.find((p) => p.id === prog.id);
        const next = upsert(prev, applyLevelChange(prog, previous, currentUser.name));
        saveStorage('programAccreditations', next);
        return next;
      });
    },
    [currentUser.name]
  );

  const deleteProgramAccreditation = useCallback((id: string) => {
    setProgramAccreditations((prev) => {
      const next = prev.filter((p) => p.id !== id);
      saveStorage('programAccreditations', next);
      return next;
    });
  }, []);

  const updateProgramRequirement = useCallback((programId: string, reqId: string, patch: Partial<ProgramRequirementItem>) => {
    setProgramAccreditations((prev) => {
      const next = prev.map((prog) => {
        if (prog.id !== programId) return prog;
        const reqs = (prog.requirements || []).map((r) => (r.id === reqId ? { ...r, ...patch } : r));
        return { ...prog, requirements: reqs };
      });
      saveStorage('programAccreditations', next);
      return next;
    });
  }, []);

  const updateCOPCRecord = useCallback((id: string, patch: Partial<COPCRecord>) => {
    setCopcRecords((prev) => {
      const next = prev.map((item) => (item.id === id ? { ...item, ...patch } : item));
      saveStorage('copcRecords', next);
      return next;
    });
  }, []);

  const updateCOPCRequirement = useCallback((copcId: string, reqId: string, patch: Partial<COPCRequirementItem>) => {
    setCopcRecords((prev) => {
      const next = prev.map((copc) => {
        if (copc.id !== copcId) return copc;
        const reqs = copc.requirements.map((r) => (r.id === reqId ? { ...r, ...patch } : r));
        return { ...copc, requirements: reqs };
      });
      saveStorage('copcRecords', next);
      return next;
    });
  }, []);

  const resetCOPCRecords = useCallback(() => {
    setCopcRecords(initialCOPCRecords);
    saveStorage('copcRecords', initialCOPCRecords);
    try {
      localStorage.setItem('accrevia_copcRecords_version', COPC_DATA_VERSION);
    } catch {
      // ignore
    }
  }, []);

  const saveISOSurveillanceRecord = useCallback((rec: ISOSurveillanceRecord) => {
    setIsoRecords((prev) => {
      // Historical Preservation: Never overwrite or delete previous records when adding a new standard/audit.
      const exists = prev.some((r) => r.id === rec.id);
      let next: ISOSurveillanceRecord[];
      if (exists) {
        next = prev.map((r) => (r.id === rec.id ? rec : r));
      } else {
        // Mark previous records for this campus as historical, keeping all historical records intact
        next = [
          { ...rec, isHistorical: false },
          ...prev.map((r) => (r.campusId === rec.campusId ? { ...r, isHistorical: true } : r))
        ];
      }
      saveStorage('isoRecords', next);
      return next;
    });
  }, []);

  const addISOCorrectiveAction = useCallback((recordId: string, car: ISOCorrectiveAction) => {
    setIsoRecords((prev) => {
      const next = prev.map((rec) => {
        if (rec.id !== recordId) return rec;
        return { ...rec, correctiveActions: [car, ...rec.correctiveActions] };
      });
      saveStorage('isoRecords', next);
      return next;
    });
  }, []);

  const updateISOCorrectiveAction = useCallback((recordId: string, carId: string, patch: Partial<ISOCorrectiveAction>) => {
    setIsoRecords((prev) => {
      const next = prev.map((rec) => {
        if (rec.id !== recordId) return rec;
        const actions = rec.correctiveActions.map((c) => (c.id === carId ? { ...c, ...patch } : c));
        return { ...rec, correctiveActions: actions };
      });
      saveStorage('isoRecords', next);
      return next;
    });
  }, []);

  const value = useMemo<PortalContextValue>(
    () => ({
      currentUser,
      isAdmin,
      frameworks,
      saveFramework,
      setFrameworkActive,
      areas,
      saveArea,
      criteria,
      saveCriterion,
      indicators,
      saveIndicator,
      addRequirement,
      documents,
      addDocument,
      updateDocument,
      deleteDocument,
      folders,
      saveFolder,
      deleteFolder,
      pending,
      addPending,
      classifyPending,
      users,
      saveUser,
      setUserStatus,
      switchUser,
      shares,
      shareDocument,
      updateSharePermission,
      extendShare,
      revokeShare,
      removeShare,
      accessRequests,
      submitAccessRequest,
      reviewAccessRequest,
      notifications,
      dismissNotification,
      documentRequests,
      createDocumentRequest,
      replyToDocumentRequest,
      setDocumentRequestStatus,
      markDocumentRequestRead,
      toggleDocumentRequestStar,
      accessLog,
      logAccess,
      recentSearches,
      addRecentSearch,
      savedIds,
      toggleSaved,

      // Campus Filter Core
      selectedCampus,
      setSelectedCampus,
      selectedCampusObj,
      filteredDocuments,
      filteredPrograms,
      filteredCopcRecords,
      filteredIsoRecords,
      isCampusMatch,
      sidebarCollapsed,
      setSidebarCollapsed,
      toggleSidebar,

      // Accreditation & QA
      campuses,
      saveCampus,
      iaRecords,
      updateCampusIA,
      updateIARequirement,
      pqaRecords,
      updateCampusPQA,
      programAccreditations,
      saveProgramAccreditation,
      deleteProgramAccreditation,
      updateProgramRequirement,
      copcRecords,
      updateCOPCRecord,
      updateCOPCRequirement,
      resetCOPCRecords,
      isoRecords,
      saveISOSurveillanceRecord,
      addISOCorrectiveAction,
      updateISOCorrectiveAction
    }),
    [
      currentUser,
      isAdmin,
      selectedCampus,
      setSelectedCampus,
      selectedCampusObj,
      filteredDocuments,
      filteredPrograms,
      filteredCopcRecords,
      filteredIsoRecords,
      sidebarCollapsed,
      setSidebarCollapsed,
      toggleSidebar,
      frameworks,
      saveFramework,
      setFrameworkActive,
      areas,
      saveArea,
      criteria,
      saveCriterion,
      indicators,
      saveIndicator,
      addRequirement,
      documents,
      addDocument,
      updateDocument,
      deleteDocument,
      folders,
      saveFolder,
      deleteFolder,
      pending,
      addPending,
      classifyPending,
      users,
      saveUser,
      setUserStatus,
      switchUser,
      shares,
      shareDocument,
      updateSharePermission,
      extendShare,
      revokeShare,
      removeShare,
      accessRequests,
      submitAccessRequest,
      reviewAccessRequest,
      notifications,
      dismissNotification,
      documentRequests,
      createDocumentRequest,
      replyToDocumentRequest,
      setDocumentRequestStatus,
      markDocumentRequestRead,
      toggleDocumentRequestStar,
      accessLog,
      logAccess,
      recentSearches,
      addRecentSearch,
      savedIds,
      toggleSaved,
      campuses,
      saveCampus,
      iaRecords,
      updateCampusIA,
      updateIARequirement,
      pqaRecords,
      updateCampusPQA,
      programAccreditations,
      saveProgramAccreditation,
      deleteProgramAccreditation,
      updateProgramRequirement,
      copcRecords,
      updateCOPCRecord,
      updateCOPCRequirement,
      resetCOPCRecords,
      isoRecords,
      saveISOSurveillanceRecord,
      addISOCorrectiveAction,
      updateISOCorrectiveAction
    ]
  );

  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>;
}

export function usePortal(): PortalContextValue {
  const ctx = useContext(PortalContext);
  if (!ctx) throw new Error('usePortal must be used inside PortalProvider');
  return ctx;
}