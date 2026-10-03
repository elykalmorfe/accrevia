import React, { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { frameworks as initialFrameworks } from '../data/frameworks';
import { areas as initialAreas } from '../data/areas';
import { criteria as initialCriteria } from '../data/criteria';
import { indicators as initialIndicators } from '../data/indicators';
import { documents as initialDocuments } from '../data/documents';
import { pendingDocuments as initialPending } from '../data/pendingDocuments';
import { users as initialUsers } from '../data/users';
import { shares as initialShares, accessLog as initialAccessLog } from '../data/shares';
import { recentSearchActivity } from '../data/analytics';
import {
  AccreditationArea,
  Criterion,
  DocumentMetadata,
  EvidenceDocument,
  EvidenceRequirement,
  Framework,
  Indicator,
  PendingDocument } from
'../types/evidence';
import { PortalUser, PortalViewRole, UserStatus } from '../types/user';
import { AccessAction, AccessLogEntry, DocumentShare, ShareRecipientInput } from '../types/sharing';
import { metadataToPatch } from '../utils/metadata';
import { isAdminRole, nowIso, permissionLabel, shareStatus } from '../utils/sharing';
import { formatDate } from '../utils/format';

interface PortalContextValue {
  currentUser: PortalUser;
  isAdmin: boolean;
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
  updateDocument: (id: string, patch: Partial<EvidenceDocument>) => void;
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
  accessLog: AccessLogEntry[];
  logAccess: (action: AccessAction, documentId: string, detail?: string) => void;
  recentSearches: string[];
  addRecentSearch: (query: string) => void;
  savedIds: string[];
  toggleSaved: (id: string) => boolean;
}

const PortalContext = createContext<PortalContextValue | null>(null);

const viewAsUserId: Record<PortalViewRole, string> = {
  Administrator: 'u-01',
  Faculty: 'u-07',
  Staff: 'u-13',
  Accreditor: 'u-11'
};

function upsert<T extends {id: string;}>(list: T[], item: T): T[] {
  return list.some((i) => i.id === item.id) ? list.map((i) => i.id === item.id ? item : i) : [...list, item];
}

export function PortalProvider({ children, viewAs = 'Administrator' }: {children: ReactNode;viewAs?: PortalViewRole;}) {
  const [frameworks, setFrameworks] = useState(initialFrameworks);
  const [areas, setAreas] = useState(initialAreas);
  const [criteria, setCriteria] = useState(initialCriteria);
  const [indicators, setIndicators] = useState(initialIndicators);
  const [documents, setDocuments] = useState(initialDocuments);
  const [pending, setPending] = useState(initialPending);
  const [users, setUsers] = useState(initialUsers);
  const [shares, setShares] = useState(initialShares);
  const [accessLog, setAccessLog] = useState(initialAccessLog);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => recentSearchActivity.map((s) => s.query));
  const [savedIds, setSavedIds] = useState<string[]>(['d-002', 'd-001']);

  const currentUser = users.find((u) => u.id === viewAsUserId[viewAs]) ?? users[0];
  const isAdmin = isAdminRole(currentUser.role);

  const saveFramework = useCallback((f: Framework) => setFrameworks((prev) => upsert(prev, f)), []);
  const setFrameworkActive = useCallback(
    (id: string, active: boolean) => setFrameworks((prev) => prev.map((f) => f.id === id ? { ...f, active } : f)),
    []
  );
  const saveArea = useCallback((a: AccreditationArea) => setAreas((prev) => upsert(prev, a)), []);
  const saveCriterion = useCallback((c: Criterion) => setCriteria((prev) => upsert(prev, c)), []);
  const saveIndicator = useCallback((i: Indicator) => setIndicators((prev) => upsert(prev, i)), []);
  const addRequirement = useCallback(
    (indicatorId: string, req: EvidenceRequirement) =>
    setIndicators((prev) => prev.map((i) => i.id === indicatorId ? { ...i, requirements: [...i.requirements, req] } : i)),
    []
  );
  const updateDocument = useCallback(
    (id: string, patch: Partial<EvidenceDocument>) => setDocuments((prev) => prev.map((d) => d.id === id ? { ...d, ...patch } : d)),
    []
  );
  const addPending = useCallback((doc: PendingDocument) => setPending((prev) => [doc, ...prev]), []);

  const classifyPending = useCallback(
    (id: string, meta: DocumentMetadata) => {
      const source = pending.find((p) => p.id === id);
      if (!source) return;
      const today = new Date().toISOString().slice(0, 10);
      const newDoc: EvidenceDocument = {
        id: `d-${Date.now()}`,
        title: '', description: '', keywords: [], frameworkId: '', areaId: '', criterionId: '', indicatorId: '',
        docType: 'Other', academicYear: '', cycle: '', program: '', college: '', department: '', office: '', campus: '',
        documentDate: today, confidentiality: 'Internal',
        ...metadataToPatch(meta),
        status: 'Indexed',
        dateAdded: today,
        fileType: source.fileType,
        pages: source.pages,
        sizeMb: source.sizeMb,
        uploadedBy: source.uploadedBy,
        passages: [source.excerpt]
      };
      if (!newDoc.documentDate) newDoc.documentDate = today;
      setDocuments((prev) => [newDoc, ...prev]);
      setPending((prev) => prev.filter((p) => p.id !== id));
    },
    [pending]
  );

  const saveUser = useCallback((u: PortalUser) => setUsers((prev) => prev.some((x) => x.id === u.id) ? upsert(prev, u) : [u, ...prev]), []);
  const setUserStatus = useCallback(
    (id: string, status: UserStatus) => setUsers((prev) => prev.map((u) => u.id === id ? { ...u, status } : u)),
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
    ...prev]
    ),
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
            ...next];

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
      setShares((prev) => prev.map((s) => s.id === shareId ? { ...s, canDownload } : s));
      logAccess('Permission changed', share.documentId, `${share.recipientName}: ${permissionLabel(share.canDownload)} → ${permissionLabel(canDownload)}`);
    },
    [shares, logAccess]
  );

  const extendShare = useCallback(
    (shareId: string, expiresAt: string | null) => {
      const share = shares.find((s) => s.id === shareId);
      if (!share) return;
      setShares((prev) => prev.map((s) => s.id === shareId ? { ...s, expiresAt } : s));
      logAccess('Access extended', share.documentId, `${share.recipientName} · ${expiresAt ? `until ${formatDate(expiresAt)}` : 'no expiry'}`);
    },
    [shares, logAccess]
  );

  const revokeShare = useCallback(
    (shareId: string) => {
      const share = shares.find((s) => s.id === shareId);
      if (!share) return;
      setShares((prev) => prev.map((s) => s.id === shareId ? { ...s, revokedAt: nowIso() } : s));
      logAccess('Access revoked', share.documentId, share.recipientName);
    },
    [shares, logAccess]
  );

  const removeShare = useCallback((shareId: string) => setShares((prev) => prev.filter((s) => s.id !== shareId)), []);

  const addRecentSearch = useCallback((query: string) => {
    setRecentSearches((prev) => [query, ...prev.filter((q) => q.toLowerCase() !== query.toLowerCase())].slice(0, 8));
  }, []);

  const toggleSaved = useCallback(
    (id: string) => {
      const willSave = !savedIds.includes(id);
      setSavedIds((prev) => willSave ? [...prev, id] : prev.filter((x) => x !== id));
      return willSave;
    },
    [savedIds]
  );

  const value = useMemo<PortalContextValue>(
    () => ({
      currentUser, isAdmin,
      frameworks, saveFramework, setFrameworkActive,
      areas, saveArea,
      criteria, saveCriterion,
      indicators, saveIndicator, addRequirement,
      documents, updateDocument,
      pending, addPending, classifyPending,
      users, saveUser, setUserStatus,
      shares, shareDocument, updateSharePermission, extendShare, revokeShare, removeShare,
      accessLog, logAccess,
      recentSearches, addRecentSearch,
      savedIds, toggleSaved
    }),
    [currentUser, isAdmin, frameworks, saveFramework, setFrameworkActive, areas, saveArea, criteria, saveCriterion, indicators,
    saveIndicator, addRequirement, documents, updateDocument, pending, addPending, classifyPending, users, saveUser, setUserStatus,
    shares, shareDocument, updateSharePermission, extendShare, revokeShare, removeShare, accessLog, logAccess, recentSearches,
    addRecentSearch, savedIds, toggleSaved]
  );

  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>;
}

export function usePortal(): PortalContextValue {
  const ctx = useContext(PortalContext);
  if (!ctx) throw new Error('usePortal must be used inside PortalProvider');
  return ctx;
}