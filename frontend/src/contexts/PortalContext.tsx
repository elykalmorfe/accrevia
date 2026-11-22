import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRoleLive } from '../hooks/useRoleLive';
import { applyRemoteAccessRequests } from '../services/accessRequests/mockAccessRequestStore';
import { RoleLiveBoard } from '../services/live/roleLive';
import { frameworks as initialFrameworks } from '../data/frameworks';
import { initialFolders, loadHiddenFolderIds } from '../data/folders';
import { seedMockDocuments } from '../data/mockDocuments';
import { areas as initialAreas } from '../data/areas';
import { criteria as initialCriteria } from '../data/criteria';
import { indicators as initialIndicators } from '../data/indicators';
import { users as initialUsers, PORTAL_USERS_SEED_VERSION } from '../data/users';
import { DEFAULT_SUPERADMIN_ID, exportAccountSnapshot, initializeAuthStore, writeLocalApprovalIfChanged } from '../utils/auth';
import {
  fetchAccountDirectory,
  mergeRemoteUsers,
  pushPortalUser,
  samePortalUsers,
  subscribeAccountDirectory,
  syncBrowserAccounts
} from '../services/accounts/accountDirectory';
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
import { AttachmentAccess, AttachmentRole, DocumentRequest, NewDocumentRequestInput, RequestAttachment, RequestStatus } from '../types/request';
import { initialDocumentRequests } from '../data/documentRequests';
import { metadataToPatch } from '../utils/metadata';
import { isAdminRole, isRecipientRole, nowIso, permissionLabel, recipientRoles, roleGroupName, seesOfficeQueue, SentFileGrant, shareStatus } from '../utils/sharing';
import { formatDate } from '../utils/format';
import { isCampusMatch } from '../utils/campus';
import { normalizeDocumentsPublishingFields, normalizePublishingFields } from '../utils/publicDocuments';
import { deleteStoredFile, getStoredFile, saveStoredFile } from '../utils/fileStore';
import {
  applyLevelChange,
  ensureLevelHistory,
  normalizeLegacyStatus,
  reconcilePaCopcRepository
} from '../utils/programAccreditation';
import { isIsoClauseFolder, purgeLegacySampleData } from '../utils/samplePurge';
import { publishSharedOriginal } from '../services/live/sharedFiles';
import {
  COPC_CERT_FILES_KEY,
  COPC_CERT_FILES_VERSION,
  LINKED_CERTIFICATES_KEY,
  LINKED_CERTIFICATES_VERSION,
  LINKED_COPC_DOCUMENTS_KEY,
  LINKED_COPC_DOCUMENTS_VERSION,
  buildLinkedCertificates,
  buildLinkedCopcDocuments,
  clearGeneratedLinkedCertificateFiles,
  localCertificationFileFor,
  mirrorCopcStoredFiles,
  prefetchCertificateFiles,
  prefetchCopcCertificateFiles,
  refreshLinkedCertificateMeta,
  syncCopcRecordToDocuments
} from '../utils/linkedCertificates';
import {
  RATINGS_DOCUMENTS_KEY,
  RATINGS_DOCUMENTS_VERSION,
  buildRatingsDocuments,
  primaryRatingsPath,
  prefetchRatingsDocuments
} from '../utils/ratingsDocuments';
import {
  FINDINGS_DOCUMENTS_KEY,
  FINDINGS_DOCUMENTS_VERSION,
  buildFindingsDocuments,
  primaryFindingsPath,
  prefetchFindingsDocuments
} from '../utils/findingsDocuments';
import { getSettings } from '../settings/portalSettings';
import { useSessionAccount } from '../utils/auth';
import { usePortalDatabase } from '../services/api/portalDatabase';

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
  /** File permissions from requests, including Anyone files this account does not own. */
  fileGrants: SentFileGrant[];
  createDocumentRequest: (input: NewDocumentRequestInput) => string;
  replyToDocumentRequest: (id: string, body: string, attachments: RequestAttachment[], nextStatus?: RequestStatus) => void;
  /** Change access on a file that was already sent. `attachmentId` null updates every file in the message. */
  updateSentAttachmentAccess: (
    requestId: string,
    messageId: string,
    attachmentId: string | null,
    next: { access: AttachmentAccess; role: AttachmentRole }
  ) => void;
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

const globalForPortal = globalThis as unknown as {
  __accrevia_portal_context__?: React.Context<PortalContextValue | null>;
};

export const PortalContext =
  globalForPortal.__accrevia_portal_context__ ??
  createContext<PortalContextValue | null>(null);

if (process.env.NODE_ENV !== 'production' || typeof window !== 'undefined') {
  globalForPortal.__accrevia_portal_context__ = PortalContext;
}

const viewAsUserId: Record<PortalViewRole, string> = {
  Superadmin: DEFAULT_SUPERADMIN_ID,
  Administrator: DEFAULT_SUPERADMIN_ID,
  'QA Personnel': DEFAULT_SUPERADMIN_ID,
  Faculty: DEFAULT_SUPERADMIN_ID,
  Staff: DEFAULT_SUPERADMIN_ID,
  Accreditor: DEFAULT_SUPERADMIN_ID,
  User: DEFAULT_SUPERADMIN_ID
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

function recipientsForRequestFile(request: DocumentRequest, file: RequestAttachment): ShareRecipientInput[] {
  const canDownload = (file.role ?? 'viewer') === 'editor';
  const rights = { canView: true, canDownload };
  if (file.access === 'anyone') {
    return recipientRoles.map((role) => ({
      recipientType: 'role' as const,
      recipientId: `role-${role}`,
      recipientName: roleGroupName(role),
      recipientRole: role,
      ...rights
    }));
  }
  return [
    {
      recipientType: 'user' as const,
      recipientId: request.requesterId,
      recipientName: request.requesterName,
      recipientRole: isRecipientRole(request.requesterRole) ? request.requesterRole : 'Faculty',
      ...rights
    }
  ];
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
  const [documents, setDocuments] = useState<EvidenceDocument[]>(() => {
    const docs = normalizeDocumentsPublishingFields(loadStorage<EvidenceDocument[]>('documents', []));
    const stored = loadStorage<EvidenceFolder[]>('folders', initialFolders);
    const hidden = new Set(loadHiddenFolderIds());
    const visible = stored.filter((f) => !hidden.has(f.id));
    const existingIds = new Set(visible.map((f) => f.id));
    const missingRoots = initialFolders.filter((f) => !existingIds.has(f.id) && !hidden.has(f.id));
    const merged = missingRoots.length > 0 ? [...missingRoots, ...visible] : visible;
    return reconcilePaCopcRepository(merged, docs).documents;
  });
  const [folders, setFolders] = useState<EvidenceFolder[]>(() => {
    const docs = normalizeDocumentsPublishingFields(loadStorage<EvidenceDocument[]>('documents', []));
    const stored = loadStorage<EvidenceFolder[]>('folders', initialFolders);
    const hidden = new Set(loadHiddenFolderIds());
    const visible = stored.filter((f) => !hidden.has(f.id));
    const existingIds = new Set(visible.map((f) => f.id));
    const missingRoots = initialFolders.filter((f) => !existingIds.has(f.id) && !hidden.has(f.id));
    const merged = missingRoots.length > 0 ? [...missingRoots, ...visible] : visible;
    return reconcilePaCopcRepository(merged, docs).folders;
  });
  const [pending, setPending] = useState<PendingDocument[]>([]);
  const [users, setUsers] = useState<PortalUser[]>(() => {
    return loadVersionedStorage('portal_users', initialUsers, PORTAL_USERS_SEED_VERSION);
  });

  useEffect(() => {
    saveStorage('portal_users', users);
  }, [users]);

  useEffect(() => {
    let cancelled = false;
    let poll = 0;
    let stopStream = () => {};
    let pulling = false;
    let synced = false;

    const applyDirectory = (remote: PortalUser[]) => {
      if (cancelled) return;
      for (const user of remote) writeLocalApprovalIfChanged(user.email, user.status);
      setUsers((prev) => {
        const merged = mergeRemoteUsers(prev, remote);
        return samePortalUsers(prev, merged) ? prev : merged;
      });
    };

    const pullDirectory = async () => {
      if (pulling || cancelled) return;
      pulling = true;
      try {
        if (!synced) {
          await initializeAuthStore();
          await syncBrowserAccounts(exportAccountSnapshot());
          synced = true;
        }
        const remote = await fetchAccountDirectory();
        if (remote) applyDirectory(remote);
      } catch {
        // Keep retrying the upload until the shared directory accepts this browser's accounts.
      } finally {
        pulling = false;
      }
    };

    void (async () => {
      await pullDirectory();
      if (cancelled) return;
      stopStream = subscribeAccountDirectory(() => {
        void pullDirectory();
      });
      poll = window.setInterval(() => {
        void pullDirectory();
      }, 1500);
    })();

    return () => {
      cancelled = true;
      window.clearInterval(poll);
      stopStream();
    };
  }, []);
  const [shares, setShares] = useState<DocumentShare[]>([]);
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>(() =>
    loadStorage<AccessRequest[]>('accessRequests', [])
  );
  const [notifications, setNotifications] = useState<PortalNotification[]>(() => loadStorage('notifications', []));
  const [fileGrants, setFileGrants] = useState<SentFileGrant[]>([]);
  const [documentRequests, setDocumentRequests] = useState<DocumentRequest[]>(() =>
    loadVersionedStorage('document_requests', initialDocumentRequests, 'document-requests-v2-empty')
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
    setFolders((current) => {
      const next = current.filter((folder) => !isIsoClauseFolder(folder));
      return next.length === current.length ? current : next;
    });
    setDocuments((current) => {
      let changed = false;
      const next = current.map((document) => {
        if (!document.folderId || !isIsoClauseFolder({ id: document.folderId, frameworkId: 'iso' })) return document;
        changed = true;
        return { ...document, folderId: 'folder-iso', areaId: 'iso' };
      });
      return changed ? next : current;
    });
  }, []);

  useEffect(() => {
    setDocuments((current) => {
      const existing = new Set(current.map((document) => document.id));
      const additions: EvidenceDocument[] = [];
      current.forEach((document) => {
        if (document.libraryOnly || document.frameworkId !== 'iso') return;
        const stage = document.isoStage === 'For Surveillance' ? '1st Surveillance' : document.isoStage;
        if (stage !== '1st Surveillance') return;
        (
          [
            ['2nd', '2nd Surveillance'],
            ['recert', 'Recertification']
          ] as const
        ).forEach(([suffix, isoStage]) => {
          const id = `${document.id}::iso-${suffix}`;
          if (existing.has(id)) return;
          existing.add(id);
          additions.push({ ...document, id, isoStage });
          getStoredFile(document.id)
            .then((stored) => {
              if (stored) return saveStoredFile(id, stored.blob, stored.name);
            })
            .catch(() => undefined);
        });
      });
      return additions.length > 0 ? [...additions, ...current] : current;
    });
  }, []);

  useEffect(() => {
    if (localStorage.getItem('accrevia_framework_memory_cleared') === '1') return;
    const frameworks = new Set(['ia', 'pa', 'copc', 'pqa', 'iso']);
    const uploadedFolder = /^folder-\d{10,}-/;
    setDocuments((current) => current.filter((doc) => !frameworks.has(String(doc.frameworkId || ''))));
    setFolders((current) => current.filter((folder) => !uploadedFolder.test(folder.id)));
    localStorage.setItem('accrevia_framework_memory_cleared', '1');
    localStorage.setItem('accrevia_sample_purge', 'empty-framework-folders-1');
  }, []);

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
        // Prefer local level-anchored certificate paths over Drive-only links.
        setProgramAccreditations((prev) => {
          let changed = false;
          const next = prev.map((p) => {
            const local = localCertificationFileFor(p);
            if (!local || p.certificationFile === local) return p;
            changed = true;
            return { ...p, certificationFile: local };
          });
          if (changed) {
            saveStorage('programAccreditations', next);
            return next;
          }
          return prev;
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

  // Seed COPC Status certificates / BOR into Upload Documents → COPC folders.
  useEffect(() => {
    try {
      if (localStorage.getItem(LINKED_COPC_DOCUMENTS_KEY) === LINKED_COPC_DOCUMENTS_VERSION) return;
      localStorage.setItem(LINKED_COPC_DOCUMENTS_KEY, LINKED_COPC_DOCUMENTS_VERSION);
      const seeded = buildLinkedCopcDocuments(copcRecords);
      if (!seeded.length) return;
      setFolders((prev) => reconcilePaCopcRepository(prev, seeded).folders);
      setDocuments((prev) => {
        const seededIds = new Set(seeded.map((d) => d.id));
        const kept = prev.filter((d) => !seededIds.has(d.id));
        return normalizeDocumentsPublishingFields(
          reconcilePaCopcRepository([], [...kept, ...seeded]).documents
        );
      });
    } catch {
      // Storage unavailable; skip seeding.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setProgramAccreditations((prev) => {
        let changed = false;
        const next = prev.map((p) => {
          const primary =
            primaryRatingsPath(p.id) ||
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

  // Seed Summary of Findings & Recommendation documents (once per version).
  useEffect(() => {
    try {
      if (localStorage.getItem(FINDINGS_DOCUMENTS_KEY) === FINDINGS_DOCUMENTS_VERSION) return;
      localStorage.setItem(FINDINGS_DOCUMENTS_KEY, FINDINGS_DOCUMENTS_VERSION);
      const seed = buildFindingsDocuments(programAccreditations);
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
          (d) =>
            !(d.frameworkId === 'pa' && typeof d.areaId === 'string' && d.areaId.startsWith('findings-') && areaIds.has(d.areaId))
        );
        return normalizeDocumentsPublishingFields([
          ...kept,
          ...seededDocs.filter((d) => !kept.some((p) => p.id === d.id))
        ]);
      });
      setProgramAccreditations((prev) => {
        let changed = false;
        const next = prev.map((p) => {
          const primary = primaryFindingsPath(p.id);
          // Only keep real folder files; clear Drive / dummy findings links.
          if (primary) {
            if (p.findingsLink === primary) return p;
            changed = true;
            return { ...p, findingsLink: primary };
          }
          if (p.findingsLink) {
            changed = true;
            const { findingsLink: _removed, ...rest } = p;
            return rest as typeof p;
          }
          return p;
        });
        if (changed) {
          saveStorage('programAccreditations', next);
          return next;
        }
        return prev;
      });
      void prefetchFindingsDocuments(seededDocs).catch((err) =>
        console.error('Could not prefetch findings documents', err)
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
    return loadStorage<string>('active_user_id', viewAsUserId[viewAs] || DEFAULT_SUPERADMIN_ID);
  });

  const session = useSessionAccount();
  usePortalDatabase(Boolean(session), {
    frameworks, areas, criteria, indicators, documents, folders, pending, shares, accessLog, recentSearches,
    campuses, iaRecords, pqaRecords, programAccreditations, copcRecords, isoRecords,
    saved_ids: savedIds, selected_campus: selectedCampus, sidebar_collapsed: sidebarCollapsed
  });
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

  const applyLiveBoard = useCallback((board: RoleLiveBoard) => {
    setFileGrants(board.fileGrants ?? []);
    setDocumentRequests(board.documentRequests);
    saveStorage('document_requests', board.documentRequests);
    setNotifications(board.notifications);
    saveStorage('notifications', board.notifications);
    setAccessRequests(board.accessRequests);
    saveStorage('accessRequests', board.accessRequests);
    applyRemoteAccessRequests(board.technicalReviews);
  }, []);

  useRoleLive({
    role: currentUser.role,
    userId: currentUser.id,
    email: currentUser.email,
    documentRequests,
    notifications,
    accessRequests,
    fileGrants,
    onBoard: applyLiveBoard
  });

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

  const saveUser = useCallback((u: PortalUser) => {
    setUsers((prev) => (prev.some((x) => x.id === u.id) ? upsert(prev, u) : [u, ...prev]));
    return pushPortalUser(u, u.temporaryPassword);
  }, []);
  const setUserStatus = useCallback((id: string, status: UserStatus) => {
    setUsers((prev) => {
      const next = prev.map((u) => (u.id === id ? { ...u, status } : u));
      const updated = next.find((u) => u.id === id);
      if (updated) void pushPortalUser(updated);
      return next;
    });
  }, []);

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

  const applySentFileShare = useCallback(
    (request: DocumentRequest, file: RequestAttachment) => {
      if (!file.documentId) return;
      const recipients = recipientsForRequestFile(request, file);
      const keep = new Set(recipients.map((recipient) => recipient.recipientId));
      setShares((prev) =>
        prev.map((share) => {
          if (share.documentId !== file.documentId || shareStatus(share) !== 'Active') return share;
          const managed = share.recipientId.startsWith('role-') || share.recipientId === request.requesterId;
          if (managed && !keep.has(share.recipientId)) return { ...share, revokedAt: nowIso() };
          return share;
        })
      );
      shareDocument(file.documentId, recipients, null);
    },
    [shareDocument]
  );

  const replyToDocumentRequest = useCallback(
    (id: string, body: string, attachments: RequestAttachment[], nextStatus?: RequestStatus) => {
      const req = documentRequests.find((r) => r.id === id);
      if (!req) return;
      const byAdmin = seesOfficeQueue(currentUser.role) && currentUser.id !== req.requesterId;
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
          .forEach((a) => {
            applySentFileShare(req, a);
            if (a.documentId) void publishSharedOriginal(a.documentId, a.name);
          });
      }

      const fileNote = attachments.length > 0 ? ` · ${attachments.length} attachment${attachments.length === 1 ? '' : 's'}` : '';
      pushNotification({
        title: `${status === 'Fulfilled' ? 'Request fulfilled' : 'New reply'}: ${req.subject}`,
        detail: `${currentUser.name}: "${body.slice(0, 60)}${body.length > 60 ? '...' : ''}"${fileNote}`,
        to: `/requests/${id}`,
        audience: byAdmin ? req.requesterId : 'admins'
      });
    },
    [documentRequests, currentUser, updateDocumentRequests, applySentFileShare, pushNotification]
  );

  const updateSentAttachmentAccess = useCallback(
    (requestId: string, messageId: string, attachmentId: string | null, next: { access: AttachmentAccess; role: AttachmentRole }) => {
      const req = documentRequests.find((r) => r.id === requestId);
      if (!req || !seesOfficeQueue(currentUser.role)) return;
      const message = req.messages.find((m) => m.id === messageId);
      if (!message) return;
      const changed = message.attachments
        .filter((file) => attachmentId === null || file.id === attachmentId)
        .map((file) => ({ ...file, access: next.access, role: next.role }));
      if (changed.length === 0) return;

      updateDocumentRequests((prev) =>
        prev.map((r) =>
          r.id === requestId
            ? {
                ...r,
                updatedAt: nowIso(),
                messages: r.messages.map((m) =>
                  m.id === messageId
                    ? {
                        ...m,
                        attachments: m.attachments.map((file) =>
                          attachmentId === null || file.id === attachmentId ? { ...file, access: next.access, role: next.role } : file
                        )
                      }
                    : m
                )
              }
            : r
        )
      );
      changed.filter((file) => file.kind === 'document' && file.documentId).forEach((file) => applySentFileShare(req, file));
    },
    [documentRequests, currentUser, updateDocumentRequests, applySentFileShare]
  );

  const setDocumentRequestStatus = useCallback(
    (id: string, status: RequestStatus) => {
      const req = documentRequests.find((r) => r.id === id);
      if (!req || req.status === status) return;
      const byAdmin = seesOfficeQueue(currentUser.role) && currentUser.id !== req.requesterId;
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
    [documentRequests, currentUser, updateDocumentRequests, pushNotification]
  );

  const markDocumentRequestRead = useCallback(
    (id: string) => {
      const req = documentRequests.find((r) => r.id === id);
      if (!req) return;
      const asAdmin = seesOfficeQueue(currentUser.role) && currentUser.id !== req.requesterId;
      if (asAdmin ? !req.unreadByAdmin : !req.unreadByRequester) return;
      updateDocumentRequests((prev) =>
        prev.map((r) => (r.id === id ? (asAdmin ? { ...r, unreadByAdmin: false } : { ...r, unreadByRequester: false }) : r))
      );
    },
    [documentRequests, currentUser, updateDocumentRequests]
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
      const updated = next.find((item) => item.id === id);
      if (
        updated &&
        ('documentLink' in patch || 'borRes' in patch || 'certificateNumber' in patch || 'dateIssued' in patch)
      ) {
        setDocuments((docs) => normalizeDocumentsPublishingFields(syncCopcRecordToDocuments(docs, updated)));
        void mirrorCopcStoredFiles(updated).catch(() => undefined);
      }
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
      fileGrants,
      createDocumentRequest,
      replyToDocumentRequest,
      updateSentAttachmentAccess,
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
      fileGrants,
      createDocumentRequest,
      replyToDocumentRequest,
      updateSentAttachmentAccess,
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

export function usePortalSafe(): PortalContextValue | null {
  return useContext(PortalContext);
}

export function usePortal(): PortalContextValue {
  const ctx = useContext(PortalContext);
  if (!ctx) throw new Error('usePortal must be used inside PortalProvider');
  return ctx;
}
