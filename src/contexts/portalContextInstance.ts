import { createContext } from 'react';
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
  CampusPQAStatus,
  COPCRecord,
  COPCRequirementItem,
  IARequirementItem,
  ISOCorrectiveAction,
  ISOSurveillanceRecord,
  ProgramAccreditation,
  ProgramRequirementItem
} from '../types/accreditation';
import { PortalUser, UserStatus } from '../types/user';
import { AccessAction, AccessLogEntry, AccessRequest, DocumentShare, ShareRecipientInput } from '../types/sharing';

export interface PortalContextValue {
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
  folders: EvidenceFolder[];
  saveFolder: (folder: EvidenceFolder) => void;
  deleteFolder: (id: string) => void;
  pending: PendingDocument[];
  addPending: (doc: PendingDocument) => void;
  classifyPending: (id: string, meta: DocumentMetadata) => void;
  users: PortalUser[];
  saveUser: (user: PortalUser) => void;
  setUserStatus: (id: string, status: UserStatus) => void;
  shares: DocumentShare[];
  shareDocument: (documentId: string, recipients: ShareRecipientInput[], expiresAt: string | null) => void;
  updateSharePermission: (shareId: string, canDownload: boolean) => void;
  extendShare: (shareId: string, expiresAt: string | null) => void;
  revokeShare: (shareId: string) => void;
  removeShare: (shareId: string) => void;
  accessRequests: AccessRequest[];
  submitAccessRequest: (documentId: string, reason: string, requestedPermission?: 'View only' | 'View and Download') => void;
  reviewAccessRequest: (requestId: string, decision: 'Approved' | 'Rejected', reviewNotes?: string, expiresAt?: string | null) => void;
  notifications: Array<{ id: string; title: string; detail: string; to: string; time: string }>;
  dismissNotification: (id: string) => void;
  accessLog: AccessLogEntry[];
  logAccess: (action: AccessAction, documentId: string, detail?: string) => void;
  recentSearches: string[];
  addRecentSearch: (query: string) => void;
  savedIds: string[];
  toggleSaved: (id: string) => boolean;
  campuses: Campus[];
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
  isoRecords: ISOSurveillanceRecord[];
  saveISOSurveillanceRecord: (record: ISOSurveillanceRecord) => void;
  addISOCorrectiveAction: (recordId: string, car: ISOCorrectiveAction) => void;
  updateISOCorrectiveAction: (recordId: string, carId: string, patch: Partial<ISOCorrectiveAction>) => void;
}

export const PortalContext = createContext<PortalContextValue | null>(null);
