import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { usePortal } from '../../contexts/PortalContext';
import { CampusId, ISOComplianceStatus } from '../../types/accreditation';
import type { EvidenceDocument } from '../../types/evidence';
import { PageHeader } from '../../components/ui/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { IAFolderManager } from '../../components/accreditation/IAFolderManager';
import { ISO_FOLDER_FRAMEWORK } from '../../components/accreditation/folderFrameworks';
import { CertificateFoldersModal, CertificateLevel } from '../../components/accreditation/CertificateFoldersModal';
import { OfficialCertificatesStrip, useCampusCertificates } from '../../components/accreditation/OfficialCertificatesStrip';
import { DocumentPreviewModal } from '../../components/documents/DocumentPreviewModal';
import { formatDate } from '../../utils/format';
import {
  ShieldCheckIcon,
  UserCheckIcon,
  HistoryIcon,
  LayersIcon,
  CalendarCheckIcon,
  PencilIcon,
  RotateCcwIcon
} from 'lucide-react';
import { useInstitutionalMutationAccess } from '../../hooks/useInstitutionalMutationAccess';

const ISO_CERTIFICATE_LEVELS: CertificateLevel[] = [
  { code: 'ISO 9001:2015 Certified', label: 'ISO 9001:2015' },
  { code: '1st Surveillance Compliant', label: '1st Surveillance' },
  { code: '2nd Surveillance Compliant', label: '2nd Surveillance' },
  { code: 'Recertification Audit Certified', label: 'Recertification' },
  { code: 'Compliant', label: 'Compliant' }
];

function readableDate(value?: string): string {
  if (!value) return '—';
  try {
    return formatDate(value);
  } catch {
    return value;
  }
}

const DEFAULT_ISO_TITLE = 'ISO 9001:2015 Quality Management Framework';
const DEFAULT_ISO_DESCRIPTION =
  'Campus-level quality management system monitoring, surveillance audits, and auditor sign-off.';

export function CampusISOView() {
  const {
    campuses,
    isoRecords,
    saveISOSurveillanceRecord,
    selectedCampus,
    setSelectedCampus
  } = usePortal();

  const { canMutate } = useInstitutionalMutationAccess();

  const [selectedCampusId, setSelectedCampusId] = useState<CampusId>(() => {
    return selectedCampus !== 'all' ? selectedCampus : 'tandag';
  });
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  // Auto-sync campus selection with global portal context
  useEffect(() => {
    if (selectedCampus !== 'all' && selectedCampus !== selectedCampusId) {
      setSelectedCampusId(selectedCampus);
      setSelectedRecordId(null);
    }
  }, [selectedCampus, selectedCampusId]);

  const campus = campuses.find((c) => c.id === selectedCampusId) || campuses[0];
  const campusRecords = isoRecords.filter((r) => r.campusId === selectedCampusId);
  const activeRecord = campusRecords.find((r) => !r.isHistorical) || campusRecords[0];
  const isoRecord = campusRecords.find((r) => r.id === selectedRecordId) || activeRecord || isoRecords[0];

  const certAreaKey = `cert-iso-${selectedCampusId}`;
  const { certificates, activeCertificate, activeLevel, levelCount } = useCampusCertificates('iso', certAreaKey);
  const [certificatesOpen, setCertificatesOpen] = useState(false);
  const [previewCertificate, setPreviewCertificate] = useState<EvidenceDocument | null>(null);

  const handleSelectCampus = (cid: CampusId) => {
    setSelectedCampusId(cid);
    setSelectedRecordId(null);
    setSelectedCampus(cid);
  };

  const openCars = (isoRecord?.correctiveActions || []).filter((c) => c.status !== 'Closed / Verified');

  // Section Header Editing
  const [sectionTitle, setSectionTitle] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('accrevia_iso_section_title');
      return saved ? JSON.parse(saved) : DEFAULT_ISO_TITLE;
    } catch {
      return DEFAULT_ISO_TITLE;
    }
  });

  const [sectionDescription, setSectionDescription] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('accrevia_iso_section_description');
      return saved ? JSON.parse(saved) : DEFAULT_ISO_DESCRIPTION;
    } catch {
      return DEFAULT_ISO_DESCRIPTION;
    }
  });

  const [headerModalOpen, setHeaderModalOpen] = useState(false);
  const [modalTitleValue, setModalTitleValue] = useState(sectionTitle);
  const [modalDescValue, setModalDescValue] = useState(sectionDescription);

  const handleOpenEditHeader = () => {
    setModalTitleValue(sectionTitle);
    setModalDescValue(sectionDescription);
    setHeaderModalOpen(true);
  };

  const handleSaveModalHeader = (e?: React.FormEvent) => {
    if (!canMutate) return;
    if (e) e.preventDefault();
    const trimmedTitle = modalTitleValue.trim();
    if (!trimmedTitle) {
      toast.error('Title cannot be empty');
      return;
    }
    const trimmedDesc = modalDescValue.trim() || DEFAULT_ISO_DESCRIPTION;
    setSectionTitle(trimmedTitle);
    setSectionDescription(trimmedDesc);
    try {
      localStorage.setItem('accrevia_iso_section_title', JSON.stringify(trimmedTitle));
      localStorage.setItem('accrevia_iso_section_description', JSON.stringify(trimmedDesc));
    } catch {
      // storage unavailable
    }
    setHeaderModalOpen(false);
    toast.success('Header updated successfully');
  };

  const handleResetHeader = () => {
    setModalTitleValue(DEFAULT_ISO_TITLE);
    setModalDescValue(DEFAULT_ISO_DESCRIPTION);
    setSectionTitle(DEFAULT_ISO_TITLE);
    setSectionDescription(DEFAULT_ISO_DESCRIPTION);
    try {
      localStorage.removeItem('accrevia_iso_section_title');
      localStorage.removeItem('accrevia_iso_section_description');
    } catch {
      // storage unavailable
    }
    setHeaderModalOpen(false);
    toast.success('Header reset to default');
  };

  return (
    <>
      <PageHeader
        eyebrow={
          <span>
            Accreditation & Frameworks / Quality Management
          </span>
        }
        title={
          <div className="flex items-center gap-2.5">
            <span>{sectionTitle}</span>
            {canMutate && (
              <button
                type="button"
                onClick={handleOpenEditHeader}
                className="inline-flex items-center justify-center rounded-md p-1.5 text-ink-muted hover:text-brand-600 hover:bg-brand-50 transition-colors"
                title="Edit Header"
                aria-label="Edit Header"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        }
        description={sectionDescription}
        actions={
          canMutate ? (
            <button
              type="button"
              onClick={handleOpenEditHeader}
              className="btn btn-secondary btn-sm text-xs gap-1.5"
              title="Edit Section Title & Description"
            >
              <PencilIcon className="h-3.5 w-3.5" />
              <span>Edit Header</span>
            </button>
          ) : undefined
        }
      />

      {/* Campus Selector Pills */}
      <div className="mb-6 flex overflow-x-auto no-scrollbar sm:flex-wrap gap-2 border-b border-line pb-4">
        {campuses.map((c) => {
          const rec = isoRecords.find((r) => r.campusId === c.id && !r.isHistorical) || isoRecords.find((r) => r.campusId === c.id);
          const isSelected = c.id === selectedCampusId;
          const openCarCount = (rec?.correctiveActions || []).filter((x) => x.status !== 'Closed / Verified').length;
          return (
            <button
              key={c.id}
              onClick={() => handleSelectCampus(c.id)}
              className={`flex shrink-0 items-center gap-2 rounded-lg border px-3.5 py-2 text-left transition-all ${
                isSelected
                  ? 'border-brand-500 bg-brand-50/70 shadow-sm ring-1 ring-brand-500'
                  : 'border-line bg-white hover:bg-canvas'
              }`}
            >
              <ShieldCheckIcon className={`h-4 w-4 ${isSelected ? 'text-brand-700' : 'text-ink-subtle'}`} />
              <div>
                <p className={`text-xs font-semibold ${isSelected ? 'text-brand-900' : 'text-ink'}`}>
                  {c.shortName}
                </p>
                <div className="flex items-center gap-1.5 text-[11px] text-ink-muted">
                  <span>{rec?.complianceStatus || 'Compliant'}</span>
                  {openCarCount > 0 && (
                    <span className="rounded bg-danger-100 px-1 font-bold text-danger-700 text-[10px]">
                      {openCarCount} CAR
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Historical Audit Cycle & Standard Selector */}
      {campusRecords.length > 1 && (
        <div className="mb-6 rounded-lg border border-line bg-canvas/60 p-3.5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <LayersIcon className="h-4 w-4 text-brand-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-ink">
                ISO Standards & Surveillance Cycles ({campus.shortName})
              </span>
            </div>
            <span className="text-[11px] text-ink-muted">
              All previous ISO standards and records are preserved permanently for historical reference.
            </span>
          </div>

          <div className="mt-3 flex overflow-x-auto no-scrollbar sm:flex-wrap gap-2">
            {campusRecords.map((rec) => {
              const isCurrent = rec.id === isoRecord?.id;
              const isHistorical = !!rec.isHistorical;
              return (
                <button
                  key={rec.id}
                  type="button"
                  onClick={() => setSelectedRecordId(rec.id)}
                  className={`flex shrink-0 items-center gap-2 rounded-md border px-3 py-1.5 text-xs transition-all ${
                    isCurrent
                      ? 'border-brand-500 bg-brand-50 font-semibold text-brand-900 shadow-xs ring-1 ring-brand-500'
                      : 'border-line bg-white text-ink hover:bg-canvas'
                  }`}
                >
                  {isHistorical ? (
                    <HistoryIcon className="h-3.5 w-3.5 text-brand-600" />
                  ) : (
                    <ShieldCheckIcon className="h-3.5 w-3.5 text-brand-600" />
                  )}
                  <span>{rec.standardVersion || 'ISO 9001:2015'}</span>
                  <span className="text-ink-muted">·</span>
                  <span>{rec.cycle}</span>
                  {isHistorical ? (
                    <span className="rounded bg-brand-100 px-1.5 py-0.5 text-[10px] font-semibold text-brand-800">
                      Preserved
                    </span>
                  ) : (
                    <span className="rounded bg-brand-100 px-1.5 py-0.5 text-[10px] font-semibold text-brand-700">
                      Active Cycle
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Preserved Historical Record Callout Banner */}
      {isoRecord?.isHistorical && (
        <div className="mb-6 rounded-lg border border-brand-300 bg-brand-50/80 p-4 text-brand-900 shadow-sm flex items-start gap-3.5">
          <div className="rounded-md bg-brand-100 p-2 text-brand-700 shrink-0">
            <HistoryIcon className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-bold text-sm text-brand-950">
                Preserved Historical ISO Standard & Audit Record
              </h4>
              <Badge tone="warning">Preserved · Read-Only</Badge>
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-brand-200/60 text-brand-900">
                {isoRecord.standardVersion || 'ISO 9001:2015'}
              </span>
            </div>
            <p className="mt-1 text-xs text-brand-800 leading-relaxed">
              Viewing preserved historical audit record for <strong>{campus.name}</strong> ({isoRecord.cycle}, audited on {isoRecord.auditDate}). As required by quality management policies, all previous ISO standards, surveillance evaluations, and compliance records are retained permanently for institutional accreditation and regulatory audits. Past records are never overwritten or deleted.
            </p>
            {activeRecord && activeRecord.id !== isoRecord.id && (
              <div className="mt-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedRecordId(activeRecord.id)}
                  className="btn btn-secondary btn-sm text-xs bg-white text-ink border-brand-300 hover:bg-brand-100/50"
                >
                  Return to Active Audit Cycle ({activeRecord.cycle})
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Active Surveillance Status Card (Uniform with PQA & Institutional Frameworks) */}
      {isoRecord && (
        <div className="mb-6 grid gap-4 lg:grid-cols-3">
          <div className="panel col-span-2 p-5 shadow-xs transition-shadow">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg font-bold text-ink">{campus.name}</h2>
                  <Badge
                    tone={
                      isoRecord.complianceStatus === 'Compliant' || isoRecord.complianceStatus === 'Certified'
                        ? 'success'
                        : isoRecord.complianceStatus === 'Minor Deficiencies'
                        ? 'warning'
                        : 'danger'
                    }
                  >
                    {isoRecord.complianceStatus}
                  </Badge>
                  {isoRecord.isHistorical && <Badge tone="warning">Preserved Record</Badge>}
                </div>
                <p className="mt-1 text-xs text-ink-muted">
                  {campus.location} · ISO Surveillance Cycle: <strong className="text-ink">{isoRecord.cycle}</strong> · Lead Auditor: <strong className="text-ink">{isoRecord.leadAuditor || 'Dr. Evelyn P. Miranda'}</strong>
                </p>
                {isoRecord.scope && (
                  <p className="mt-0.5 text-xs text-ink-muted">
                    Audit Scope: <span className="font-medium text-ink">{isoRecord.scope}</span>
                  </p>
                )}
              </div>

              <div className="text-right">
                <span className="text-xs text-ink-muted">Standard & Cycle</span>
                <p className="mt-0.5 text-sm font-semibold text-brand-700">
                  {isoRecord.standardVersion || 'ISO 9001:2015'} · {isoRecord.cycle}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                {
                  icon: ShieldCheckIcon,
                  label: 'ISO Standard',
                  value: isoRecord.standardVersion || 'ISO 9001:2015',
                  tone: 'bg-brand-50 text-brand-600'
                },
                {
                  icon: CalendarCheckIcon,
                  label: 'Audit Date',
                  value: readableDate(isoRecord.auditDate),
                  tone: 'bg-brand-50 text-brand-600'
                },
                {
                  icon: UserCheckIcon,
                  label: 'Lead ISO Auditor',
                  value: isoRecord.leadAuditor || 'Prof. Liza M. Cabrera',
                  tone: 'bg-brand-50 text-brand-600'
                }
              ].map((info) => (
                <div key={info.label} className="flex items-start gap-2.5 rounded-xl border border-line bg-canvas/50 p-3">
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${info.tone}`}>
                    <info.icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-ink-subtle">{info.label}</p>
                    <p className="mt-0.5 text-[12.5px] font-semibold leading-snug text-ink">{info.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {isoRecord.summary && (
              <div className="mt-3 rounded-r-xl border-l-4 border-brand-400 bg-brand-50/40 px-3.5 py-2.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-brand-700">LEAD AUDITOR SUMMARY</p>
                <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-muted">{isoRecord.summary}</p>
              </div>
            )}

            <OfficialCertificatesStrip
              certificates={certificates}
              activeCertificate={activeCertificate}
              activeLevel={activeLevel}
              levelCount={levelCount}
              isAdmin={canMutate}
              onOpen={() => setCertificatesOpen(true)}
              onPreview={setPreviewCertificate}
            />
          </div>

          {/* Findings Counter */}
          <div className="panel p-5 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                Surveillance Findings Distribution
              </h3>

              <div className="mt-4 grid grid-cols-1 gap-2 text-xs xs:grid-cols-2">
                <div className="rounded border border-success-200 bg-success-50/50 p-2.5">
                  <span className="text-success-800 font-medium">Conformances</span>
                  <p className="font-bold text-success-900 text-lg mt-0.5">
                    {isoRecord.findingsCount?.conformances || 14}
                  </p>
                </div>
                <div className="rounded border border-brand-200 bg-brand-50/50 p-2.5">
                  <span className="text-brand-800 font-medium">OFI (Opportunities)</span>
                  <p className="font-bold text-brand-900 text-lg mt-0.5">
                    {isoRecord.findingsCount?.ofi || 2}
                  </p>
                </div>
                <div className="rounded border border-warning-200 bg-warning-50/50 p-2.5">
                  <span className="text-warning-800 font-medium">Minor NC</span>
                  <p className="font-bold text-warning-900 text-lg mt-0.5">
                    {isoRecord.findingsCount?.minorNC || 0}
                  </p>
                </div>
                <div className="rounded border border-danger-200 bg-danger-50/50 p-2.5">
                  <span className="text-danger-800 font-medium">Major NC (CAR)</span>
                  <p className="font-bold text-danger-900 text-lg mt-0.5">
                    {isoRecord.findingsCount?.majorNC || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 border-t border-line pt-3 flex items-center justify-between text-xs">
              <span className="text-ink-muted">Active Non-conformances:</span>
              <span className={`font-bold ${openCars.length > 0 ? 'text-danger-700' : 'text-success-700'}`}>
                {openCars.length === 0 ? '0 (All Closed)' : `${openCars.length} Pending Action`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ISO Document & Folder Management (Uniform with IA & PQA) */}
      <IAFolderManager
        campusId={selectedCampusId}
        campusName={campus.name}
        framework={ISO_FOLDER_FRAMEWORK}
        readOnly={!canMutate}
      />

      {/* Official Recognition & Compliance Certificates Modal */}
      {isoRecord && (
        <CertificateFoldersModal
          open={certificatesOpen}
          onClose={() => setCertificatesOpen(false)}
          title="Recognition & Compliance Certificates"
          description={`${campus.name} · Institutional Recognition & Standards`}
          frameworkId="iso"
          areaKey={certAreaKey}
          levels={ISO_CERTIFICATE_LEVELS}
          currentLevelCode={isoRecord.complianceStatus}
          subject={campus.name}
          program="Quality Management & Institutional Excellence"
          cycle={isoRecord.cycle}
          body="TÜV Rheinland"
          campusId={selectedCampusId}
          campusName={campus.name}
          stats={[
            { label: 'Surveillance Cycle', value: isoRecord.cycle },
            { label: 'Validation Status', value: isoRecord.validationStatus || 'Certified & Signed' }
          ]}
          onActivate={
            canMutate
              ? (doc, code) => {
                  if (code) {
                    saveISOSurveillanceRecord({
                      ...isoRecord,
                      complianceStatus: code as ISOComplianceStatus
                    });
                  }
                  toast.success(code ? `"${doc.title}" activated` : `"${doc.title}" activated`);
                }
              : undefined
          }
        />
      )}
      {/* Edit Section Header Modal */}
      {headerModalOpen && (
        <Modal
          open={headerModalOpen}
          onClose={() => setHeaderModalOpen(false)}
          title="Edit ISO Section Header"
          description="Update the title and contextual description for the ISO quality management framework."
          size="md"
          footer={
            <div className="flex flex-col-reverse sm:flex-row w-full items-stretch sm:items-center justify-between gap-3">
              {sectionTitle !== DEFAULT_ISO_TITLE || sectionDescription !== DEFAULT_ISO_DESCRIPTION ? (
                <button
                  type="button"
                  onClick={handleResetHeader}
                  className="btn btn-ghost btn-sm text-ink-muted hover:text-ink gap-1.5 self-center sm:self-auto"
                >
                  <RotateCcwIcon className="h-3.5 w-3.5" /> Reset to Default
                </button>
              ) : <div />}
              <div className="flex flex-col-reverse sm:flex-row gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setHeaderModalOpen(false)}
                  className="btn btn-secondary w-full sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveModalHeader}
                  className="btn btn-primary w-full sm:w-auto"
                >
                  Save Changes
                </button>
              </div>
            </div>
          }
        >
          <form onSubmit={handleSaveModalHeader} className="space-y-4">
            <div>
              <label className="label">Section Title</label>
              <input
                type="text"
                value={modalTitleValue}
                onChange={(e) => setModalTitleValue(e.target.value)}
                className="input"
                placeholder="e.g. ISO 9001:2015 Quality Management Framework"
                maxLength={120}
                required
              />
              <p className="mt-1 text-[11px] text-ink-muted">
                Main heading displayed at the top of the ISO quality management section.
              </p>
            </div>

            <div>
              <label className="label">Section Description</label>
              <textarea
                value={modalDescValue}
                onChange={(e) => setModalDescValue(e.target.value)}
                className="textarea h-24 text-[13px]"
                placeholder="Campus-level quality management system monitoring, surveillance audits, and auditor sign-off."
              />
              <p className="mt-1 text-[11px] text-ink-muted">
                Sub-description explaining the scope of this quality framework.
              </p>
            </div>
          </form>
        </Modal>
      )}

      <DocumentPreviewModal doc={previewCertificate} onClose={() => setPreviewCertificate(null)} grantAccess />
    </>
  );
}
