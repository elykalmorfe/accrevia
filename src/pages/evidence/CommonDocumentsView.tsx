import React, { useMemo, useState } from 'react';
import {
  SearchIcon,
  LockIcon,
  UnlockIcon,
  ExternalLinkIcon,
  FileTextIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  CheckCircle2Icon,
  Building2Icon,
  BookOpenIcon,
  FileCheckIcon,
  GraduationCapIcon,
  AlertTriangleIcon,
  EyeIcon,
  FilterIcon
} from 'lucide-react';
import { usePortal } from '../../contexts/PortalContext';
import { CommonDocType, EvidenceDocument } from '../../types/evidence';
import { PageHeader } from '../../components/ui/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export const officialCommonDocumentTypes: Array<{
  type: CommonDocType;
  classification: 'Accessible' | 'Confidential';
  description: string;
  category: 'Instrument' | 'Review' | 'Profile' | 'Compliance' | 'Governance' | 'Resolution';
}> = [
  {
    type: 'Accreditation Instrument per Program',
    classification: 'Accessible',
    description: 'Official AACCUP self-survey instrument and parameter rating matrix per degree program.',
    category: 'Instrument'
  },
  {
    type: 'AACCUP Technical Review',
    classification: 'Confidential',
    description: 'Confidential technical committee evaluation report assessing program metrics and faculty compliance.',
    category: 'Review'
  },
  {
    type: 'Program Performance Profile (PPP)',
    classification: 'Accessible',
    description: 'Comprehensive program achievement profile covering enrollment, tracer studies, and board pass rates.',
    category: 'Profile'
  },
  {
    type: 'Certificate of Program Compliance (COPC)',
    classification: 'Confidential',
    description: 'Official CHED Regional Office certificate verifying compliance with CHED Policies, Standards & Guidelines.',
    category: 'Compliance'
  },
  {
    type: 'Memorandum (Memo)',
    classification: 'Confidential',
    description: 'Internal administrative and executive memorandums mobilizing QA preparations and mock audits.',
    category: 'Governance'
  },
  {
    type: 'Endorsement Letter',
    classification: 'Confidential',
    description: 'Official university president and campus director transmittal endorsements to accrediting bodies.',
    category: 'Governance'
  },
  {
    type: 'Summary of Findings and Recommendations',
    classification: 'Accessible',
    description: 'Official consolidated findings, commendations, and quality recommendations by external survey teams.',
    category: 'Review'
  },
  {
    type: 'Board of Regents (BOR) Resolution',
    classification: 'Accessible',
    description: 'Official university governing board resolutions approving curricula, policies, and QA centers.',
    category: 'Resolution'
  }
];

export function CommonDocumentsView() {
  const { documents, isAdmin, currentUser, selectedCampus, isCampusMatch } = usePortal();
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<CommonDocType | 'all'>('all');
  const [accessFilter, setAccessFilter] = useState<'all' | 'Accessible' | 'Confidential'>('all');
  const [restrictedDocModal, setRestrictedDocModal] = useState<EvidenceDocument | null>(null);

  // Common documents filter
  const commonDocs = useMemo(() => {
    return documents.filter((d) => !!d.commonDocType);
  }, [documents]);

  const filteredDocs = useMemo(() => {
    return commonDocs.filter((d) => {
      // Campus filter
      if (selectedCampus !== 'all' && !isCampusMatch(d.campus, selectedCampus)) {
        return false;
      }

      // Type filter
      if (selectedType !== 'all' && d.commonDocType !== selectedType) {
        return false;
      }

      // Accessibility filter
      if (accessFilter === 'Accessible' && d.confidentiality === 'Confidential') {
        return false;
      }
      if (accessFilter === 'Confidential' && d.confidentiality !== 'Confidential') {
        return false;
      }

      // Search keyword
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchTitle = d.title.toLowerCase().includes(q);
        const matchDesc = d.description.toLowerCase().includes(q);
        const matchType = (d.commonDocType || '').toLowerCase().includes(q);
        const matchProg = (d.program || '').toLowerCase().includes(q);
        const matchCampus = (d.campus || '').toLowerCase().includes(q);
        const matchKeywords = (d.keywords || []).some((k) => k.toLowerCase().includes(q));

        if (!matchTitle && !matchDesc && !matchType && !matchProg && !matchCampus && !matchKeywords) {
          return false;
        }
      }

      return true;
    });
  }, [commonDocs, selectedCampus, selectedType, accessFilter, search, isCampusMatch]);

  const handleOpenDoc = (doc: EvidenceDocument) => {
    const isConfidential = doc.confidentiality === 'Confidential';

    if (isConfidential && !isAdmin) {
      setRestrictedDocModal(doc);
      return;
    }

    if (doc.documentUrl) {
      window.open(doc.documentUrl, '_blank', 'noopener,noreferrer');
      toast.success(`Opening ${doc.title}`);
    } else {
      toast.info(`Opening viewer for ${doc.title}`);
    }
  };

  return (
    <>
      <PageHeader
        title="Common Accreditation Documents Hub"
        description="Searchable repository for the 8 official institutional and program accreditation instruments, reports, and governing resolutions."
      />

      {/* Access Control & Permissions Header Banner */}
      <div className="mb-6 rounded-xl border border-line bg-gradient-to-r from-canvas via-white to-canvas p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg shadow-xs ${
                isAdmin ? 'bg-purple-600 text-white' : 'bg-emerald-600 text-white'
              }`}
            >
              {isAdmin ? <ShieldCheckIcon className="h-5 w-5" /> : <CheckCircle2Icon className="h-5 w-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-sm text-ink">
                  {isAdmin ? 'Administrative Clearance Active' : 'Faculty & Staff Authorized Access'}
                </p>
                <span className="text-[11px] font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                  {currentUser.role}
                </span>
              </div>
              <p className="text-xs text-ink-muted mt-0.5 max-w-2xl">
                {isAdmin
                  ? 'You hold elevated administrative privileges. Full clearance granted to search, open, and audit both Accessible and Confidential documents.'
                  : 'Authorized faculty and staff may search and open all Accessible documents (Instruments, PPP, Findings & Recommendations, BOR Resolutions). Confidential records (Technical Reviews, COPC, Memorandums, Endorsements) are restricted to administrators.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <div className="text-right">
              <span className="text-[11px] text-ink-muted block">Available Documents</span>
              <span className="text-base font-extrabold text-ink">{filteredDocs.length} of {commonDocs.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 8 Official Instruments Quick Bar */}
      <div className="mb-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-2.5">
          Official Accreditation Instruments & Records (8 Types)
        </h3>
        <div className="grid gap-2 grid-cols-2 sm:grid-cols-4 lg:grid-cols-4">
          {officialCommonDocumentTypes.map((item) => {
            const count = commonDocs.filter((d) => d.commonDocType === item.type).length;
            const isSelected = selectedType === item.type;
            const isConfidential = item.classification === 'Confidential';

            return (
              <button
                key={item.type}
                type="button"
                onClick={() => setSelectedType(isSelected ? 'all' : item.type)}
                className={`rounded-xl border p-3 text-left transition-all ${
                  isSelected
                    ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500 shadow-xs'
                    : 'border-line bg-white hover:bg-canvas'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[11px] font-bold text-ink truncate" title={item.type}>
                    {item.type}
                  </span>
                  {isConfidential ? (
                    <span className="rounded bg-rose-50 text-rose-700 text-[10px] font-bold px-1.5 py-0.2 shrink-0 border border-rose-200">
                      Confidential
                    </span>
                  ) : (
                    <span className="rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold px-1.5 py-0.2 shrink-0 border border-emerald-200">
                      Accessible
                    </span>
                  )}
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-lg font-extrabold text-ink">{count}</span>
                  <span className="text-[10px] text-ink-muted truncate">{item.category}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="mb-5 panel p-4 space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-ink-subtle" />
            <input
              type="text"
              placeholder="Search by document title, program, campus, keyword, or document content..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9 text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="input h-9 text-xs py-0 w-full sm:w-auto"
            >
              <option value="all">All 8 Document Types</option>
              {officialCommonDocumentTypes.map((t) => (
                <option key={t.type} value={t.type}>
                  {t.type} ({t.classification})
                </option>
              ))}
            </select>

            <select
              value={accessFilter}
              onChange={(e) => setAccessFilter(e.target.value as any)}
              className="input h-9 text-xs py-0 w-full sm:w-auto"
            >
              <option value="all">All Security Levels</option>
              <option value="Accessible">Accessible Only (Open to Faculty & Staff)</option>
              <option value="Confidential">Confidential Only (Restricted to Admins)</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-2 text-xs text-ink-muted">
          <span>
            Showing <strong className="text-ink">{filteredDocs.length}</strong> matching documents
          </span>
          {(selectedType !== 'all' || accessFilter !== 'all' || search) && (
            <button
              type="button"
              onClick={() => {
                setSelectedType('all');
                setAccessFilter('all');
                setSearch('');
              }}
              className="text-brand-600 hover:text-brand-800 font-semibold"
            >
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* Document Cards Grid */}
      {filteredDocs.length === 0 ? (
        <div className="panel p-12 text-center">
          <FileTextIcon className="mx-auto h-10 w-10 text-ink-subtle mb-3" />
          <h4 className="font-bold text-ink text-sm">No common documents found</h4>
          <p className="text-xs text-ink-muted mt-1 max-w-md mx-auto">
            Try adjusting your search query, selecting "All 8 Document Types", or removing campus filters.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDocs.map((doc) => {
            const isConfidential = doc.confidentiality === 'Confidential';
            const canOpen = !isConfidential || isAdmin;

            return (
              <div
                key={doc.id}
                className={`panel p-4 flex flex-col justify-between transition-all hover:shadow-sm ${
                  isConfidential ? 'border-amber-200/60 bg-amber-50/10' : 'border-line bg-white'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-mono text-[11px] font-bold text-ink-subtle">{doc.id.toUpperCase()}</span>
                    {isConfidential ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 text-[10.5px] font-semibold">
                        <LockIcon className="h-3 w-3 text-amber-600" />
                        Confidential
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 text-[10.5px] font-semibold">
                        <UnlockIcon className="h-3 w-3 text-emerald-600" />
                        Accessible
                      </span>
                    )}
                  </div>

                  <h4 className="font-bold text-sm text-ink leading-snug line-clamp-2" title={doc.title}>
                    {doc.title}
                  </h4>

                  <p className="mt-1.5 text-xs text-ink-muted line-clamp-2 leading-relaxed">
                    {doc.description}
                  </p>

                  <div className="mt-3 space-y-1.5 text-xs border-t border-line/70 pt-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-ink-muted">Type:</span>
                      <span className="font-semibold text-brand-700 truncate max-w-[170px]" title={doc.commonDocType}>
                        {doc.commonDocType}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-ink-muted">Campus / Unit:</span>
                      <span className="font-medium text-ink truncate max-w-[170px]" title={doc.campus}>
                        {doc.campus}
                      </span>
                    </div>

                    {doc.program && doc.program !== 'Institution-wide' && (
                      <div className="flex items-center justify-between">
                        <span className="text-ink-muted">Program:</span>
                        <span className="text-ink truncate max-w-[170px]" title={doc.program}>
                          {doc.program}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-ink-muted">Academic Year:</span>
                      <span className="text-ink font-medium">{doc.academicYear}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-line flex items-center justify-between gap-2">
                  <Link
                    to={`/documents/${doc.id}`}
                    className="btn btn-secondary btn-sm text-xs flex-1 justify-center"
                  >
                    <EyeIcon className="h-3.5 w-3.5 mr-1" />
                    Metadata
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleOpenDoc(doc)}
                    className={`btn btn-sm text-xs flex-1 justify-center ${
                      canOpen
                        ? 'btn-primary'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
                    }`}
                  >
                    {canOpen ? (
                      <>
                        <ExternalLinkIcon className="h-3.5 w-3.5 mr-1" />
                        Open Link
                      </>
                    ) : (
                      <>
                        <LockIcon className="h-3.5 w-3.5 mr-1 text-amber-600" />
                        Restricted
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Security Restricted Document Modal */}
      {restrictedDocModal && (
        <Modal
          open={!!restrictedDocModal}
          onClose={() => setRestrictedDocModal(null)}
          title="Access Restricted: Confidential Accreditation Record"
          description="Security clearance enforcement under NEMSU Quality Assurance Protocol."
          footer={
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setRestrictedDocModal(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  toast.success(`Access request submitted for "${restrictedDocModal.title}"`);
                  setRestrictedDocModal(null);
                }}
              >
                Request Authorization
              </button>
            </div>
          }
        >
          <div className="space-y-3">
            <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-900 flex items-start gap-2.5">
              <ShieldAlertIcon className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Confidential Classification</p>
                <p className="mt-0.5">
                  <strong>"{restrictedDocModal.title}"</strong> is designated as an internal confidential asset ({restrictedDocModal.commonDocType}). Opening document links is restricted to certified Administrators and Superadmins.
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-canvas p-3 text-xs space-y-1.5 border border-line">
              <p>
                <span className="text-ink-muted">Document Type:</span>{' '}
                <strong className="text-ink">{restrictedDocModal.commonDocType}</strong>
              </p>
              <p>
                <span className="text-ink-muted">Campus / Office:</span>{' '}
                <span className="text-ink">{restrictedDocModal.campus} · {restrictedDocModal.office}</span>
              </p>
              <p>
                <span className="text-ink-muted">Your Active Role:</span>{' '}
                <span className="text-ink font-semibold">{currentUser.role}</span>
              </p>
            </div>

            <p className="text-xs text-ink-muted">
              If your accreditation committee requires access to this document for official survey preparation, click <strong>"Request Authorization"</strong> to notify the system administrator.
            </p>
          </div>
        </Modal>
      )}
    </>
  );
}
