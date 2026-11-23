import React, { useState } from 'react';
import { toast } from 'sonner';
import { usePortal } from '../../contexts/PortalContext';
import { ISOComplianceStatus } from '../../types/accreditation';
import type { EvidenceDocument } from '../../types/evidence';
import { PageHeader } from '../../components/ui/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { IAFolderManager } from '../../components/accreditation/IAFolderManager';
import { ISOQmsDocumentsTable } from '../../components/accreditation/ISOQmsDocumentsTable';
import { ISO_FOLDER_FRAMEWORK } from '../../components/accreditation/folderFrameworks';
import { CertificateFoldersModal, CertificateLevel } from '../../components/accreditation/CertificateFoldersModal';
import { OfficialCertificatesStrip, useCampusCertificates } from '../../components/accreditation/OfficialCertificatesStrip';
import { DocumentPreviewModal } from '../../components/documents/DocumentPreviewModal';
import { formatDate } from '../../utils/format';
import {
  ShieldCheckIcon,
  UserCheckIcon,
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

function campusComplianceLabel(status?: string): 'Certified' | 'Compliant' {
  return status === 'Certified' ? 'Certified' : 'Compliant';
}

function readableDate(value?: string): string {
  if (!value) return '—';
  try {
    return formatDate(value);
  } catch {
    return value;
  }
}

const DEFAULT_ISO_TITLE = 'ISO 9001:2015 Quality Management Framework';
const ISO_CAMPUS_ID = 'tandag';
const DEFAULT_ISO_DESCRIPTION =
  'Campus-level quality management system monitoring, surveillance audits, and auditor sign-off.';

export function CampusISOView() {
  const { campuses, isoRecords, saveISOSurveillanceRecord } = usePortal();

  const { canMutate } = useInstitutionalMutationAccess();

  const campus = campuses.find((c) => c.id === ISO_CAMPUS_ID) || campuses[0];
  const campusRecords = isoRecords.filter((r) => r.campusId === ISO_CAMPUS_ID);
  const isoRecord = campusRecords.find((r) => !r.isHistorical) || campusRecords[0];

  const certAreaKey = `cert-iso-${ISO_CAMPUS_ID}`;
  const { certificates, activeCertificate, activeLevel, levelCount } = useCampusCertificates('iso', certAreaKey);
  const [certificatesOpen, setCertificatesOpen] = useState(false);
  const [previewCertificate, setPreviewCertificate] = useState<EvidenceDocument | null>(null);

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
      />

      {/* Active Surveillance Status Card */}
      {isoRecord && (
        <div className="mb-6">
          <div className="panel p-5 shadow-xs">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold text-ink">{campus.name}</h2>
                  <Badge tone="success">
                    {campusComplianceLabel(isoRecord.complianceStatus)}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-ink-muted">{campus.location}</p>
                {isoRecord.scope && (
                  <p className="mt-1 max-w-3xl text-xs leading-relaxed text-ink-muted">
                    <span className="font-semibold text-ink">Scope.</span> {isoRecord.scope}
                  </p>
                )}
              </div>
              <div className="flex overflow-hidden rounded-lg border border-brand-100 bg-brand-100">
                <div className="bg-brand-50 px-3.5 py-2">
                  <p className="text-[10.5px] font-bold uppercase tracking-wider text-brand-700">Standard</p>
                  <p className="mt-0.5 whitespace-nowrap text-sm font-semibold text-ink">
                    {isoRecord.standardVersion || 'ISO 9001:2015'}
                  </p>
                </div>
                <div className="border-l border-brand-100 bg-brand-50 px-3.5 py-2">
                  <p className="text-[10.5px] font-bold uppercase tracking-wider text-brand-700">Cycle</p>
                  <p className="mt-0.5 text-sm font-semibold text-ink">{isoRecord.cycle}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                {
                  icon: ShieldCheckIcon,
                  label: 'Validation',
                  value: isoRecord.validationStatus || 'Certified & Signed',
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
        </div>
      )}

      <ISOQmsDocumentsTable />

      {/* ISO Document & Folder Management (Uniform with IA & PQA) */}
      <IAFolderManager
        campusId={ISO_CAMPUS_ID}
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
          campusId={ISO_CAMPUS_ID}
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
