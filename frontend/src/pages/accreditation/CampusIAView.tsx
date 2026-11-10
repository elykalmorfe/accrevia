import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { usePortal } from '../../contexts/PortalContext';
import { CampusId, IALevel, IA_LEVEL_OPTIONS } from '../../types/accreditation';
import type { EvidenceDocument } from '../../types/evidence';
import { PageHeader } from '../../components/ui/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { IAFolderManager } from '../../components/accreditation/IAFolderManager';
import { CertificateFoldersModal, CertificateLevel } from '../../components/accreditation/CertificateFoldersModal';
import { DocumentPreviewModal } from '../../components/documents/DocumentPreviewModal';
import { institutionalCertificateAreaKey } from '../../utils/programAccreditation';
import { formatDate, pluralize } from '../../utils/format';
import {
  Building2Icon,
  CalendarCheckIcon,
  CalendarClockIcon,
  ExternalLinkIcon,
  FileCheck2Icon,
  FileCheckIcon,
  PencilIcon,
  ShieldCheckIcon,
  UploadIcon
} from 'lucide-react';

const IA_CERTIFICATE_LEVELS: CertificateLevel[] = IA_LEVEL_OPTIONS.map((opt) => ({
  code: opt.value,
  label: opt.value.split(' ').slice(0, 2).join(' ')
}));

/** Maps short statuses such as `Level III` onto the full option value used as the folder code. */
function iaLevelCode(status: IALevel): string {
  return IA_LEVEL_OPTIONS.find((opt) => opt.value === status || opt.value.startsWith(`${status} `))?.value ?? IA_LEVEL_OPTIONS[0].value;
}

/** `Level III Re-accredited` → `Level III`. */
function shortLevel(status: string): string {
  return status.split(' ').slice(0, 2).join(' ');
}

const LEVEL_DOT: Record<string, string> = {
  'Level I': 'bg-slate-400',
  'Level II': 'bg-sky-500',
  'Level III': 'bg-indigo-500',
  'Level IV': 'bg-emerald-500'
};

function levelTone(status: string): string {
  return LEVEL_DOT[shortLevel(status)] ?? 'bg-slate-400';
}

function readableDate(value?: string): string {
  if (!value) return '—';
  try {
    return formatDate(value);
  } catch {
    return value;
  }
}

function validityState(end?: string): { label: string; className: string } | null {
  const endDate = end ? new Date(end) : null;
  if (!endDate || Number.isNaN(endDate.getTime())) return null;
  const months = (endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30.44);
  if (months < 0) return { label: 'Expired', className: 'bg-danger-50 text-danger-700' };
  if (months < 6) {
    const n = Math.max(1, Math.ceil(months));
    return { label: `Expires in ${n} month${n === 1 ? '' : 's'}`, className: 'bg-warning-50 text-warning-700' };
  }
  return { label: 'Active', className: 'bg-success-50 text-success-700' };
}

export function CampusIAView() {
  const { campuses, iaRecords, documents, folders, isAdmin, updateCampusIA, updateIARequirement, selectedCampus, setSelectedCampus } = usePortal();
  const [selectedCampusId, setSelectedCampusId] = useState<CampusId>(() => {
    return selectedCampus !== 'all' ? selectedCampus : 'tandag';
  });

  const [isEditAllOpen, setIsEditAllOpen] = useState(false);
  const [certificatesOpen, setCertificatesOpen] = useState(false);
  const [previewCertificate, setPreviewCertificate] = useState<EvidenceDocument | null>(null);

  const certAreaKey = institutionalCertificateAreaKey(selectedCampusId);
  const certificates = useMemo(
    () =>
      documents
        .filter((d) => d.frameworkId === 'ia' && d.areaId === certAreaKey)
        .sort((a, b) => (b.dateAdded || '').localeCompare(a.dateAdded || '') || b.id.localeCompare(a.id)),
    [documents, certAreaKey]
  );
  const certificateLevelCount = useMemo(() => {
    const levelFolders = folders.filter((f) => f.areaId === certAreaKey && f.isSystem);
    const levelOf = (folderId?: string): string | undefined => {
      let cursor = folders.find((f) => f.id === folderId);
      while (cursor && !cursor.isSystem) cursor = folders.find((f) => f.id === cursor?.parentId);
      return cursor?.id;
    };
    return levelFolders.filter((lf) => certificates.some((d) => levelOf(d.folderId) === lf.id)).length;
  }, [folders, certificates, certAreaKey]);

  useEffect(() => {
    if (selectedCampus !== 'all' && selectedCampus !== selectedCampusId) {
      setSelectedCampusId(selectedCampus);
    }
  }, [selectedCampus, selectedCampusId]);

  const campus = campuses.find((c) => c.id === selectedCampusId) || campuses[0];
  const iaRecord = iaRecords.find((r) => r.campusId === selectedCampusId);

  if (!iaRecord) {
    return (
      <div className="panel p-8 text-center">
        <Building2Icon className="mx-auto h-10 w-10 text-ink-subtle" />
        <h3 className="mt-2 text-sm font-semibold text-ink">No Institutional Accreditation record found</h3>
      </div>
    );
  }

  const approvedCount = iaRecord.requirements.filter((r) => r.status === 'Approved').length;
  const reviewCount = iaRecord.requirements.filter((r) => r.status === 'Under Review').length;
  const deficientCount = iaRecord.requirements.filter((r) => r.status === 'Deficient').length;
  const pendingCount = iaRecord.requirements.filter((r) => r.status === 'Pending').length;
  const compliancePercentage = Math.round((approvedCount / iaRecord.requirements.length) * 100);
  const validity = validityState(iaRecord.validityEnd);

  // Recommended level is restricted to Level I through Level IV.
  const recommendedLevel: IALevel =
    compliancePercentage === 100 && approvedCount >= 9
      ? 'Level IV Institutional Accreditation'
      : compliancePercentage >= 75 || approvedCount >= 7
      ? 'Level III Re-accredited'
      : compliancePercentage >= 50 || approvedCount >= 5
      ? 'Level II Re-accredited'
      : 'Level I Accredited';

  const totalAreas = iaRecord.requirements.length;
  const statusBreakdown = [
    { label: 'Approved', count: approvedCount, dot: 'bg-success-600', text: 'text-success-700' },
    { label: 'Under Review', count: reviewCount, dot: 'bg-brand-500', text: 'text-brand-700' },
    { label: 'Deficient', count: deficientCount, dot: 'bg-danger-600', text: 'text-danger-700' },
    { label: 'Pending', count: pendingCount, dot: 'bg-warning-600', text: 'text-warning-700' }
  ];

  return (
    <>
      <PageHeader
        eyebrow="Accreditation"
        title="Institutional Accreditation (IA)"
        description="Track each campus's AACCUP accreditation level, compliance and certificates."
      />

      {/* Campus Selector Bar */}
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-ink-subtle">Campuses</span>
        <button
          type="button"
          onClick={() => setIsEditAllOpen(true)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-800 transition-colors"
        >
          <PencilIcon className="h-3 w-3" />
          Edit All Statuses
        </button>
      </div>

      {/* Campus Selector Pills */}
      <div className="mb-6 grid grid-flow-col auto-cols-[minmax(140px,1fr)] lg:auto-cols-fr overflow-x-auto no-scrollbar gap-2 border-b border-line p-0.5 pb-4">
        {campuses.map((c) => {
          const rec = iaRecords.find((r) => r.campusId === c.id);
          const isSelected = c.id === selectedCampusId;
          const statusText = rec?.status || 'Level I Accredited';
          return (
            <button
              key={c.id}
              type="button"
              title={`${c.name} · ${statusText}`}
              aria-pressed={isSelected}
              onClick={() => {
                setSelectedCampusId(c.id);
                setSelectedCampus(c.id);
              }}
              className={`flex min-w-0 items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition-all ${
                isSelected
                  ? 'border-brand-300 bg-brand-50/70 shadow-sm ring-2 ring-brand-500/20'
                  : 'border-line bg-white hover:border-line-strong hover:bg-canvas'
              }`}
            >
              <Building2Icon className={`hidden h-4 w-4 shrink-0 2xl:block ${isSelected ? 'text-brand-600' : 'text-ink-subtle'}`} />
              <div className="min-w-0">
                <p className={`truncate text-[13px] font-semibold ${isSelected ? 'text-brand-800' : 'text-ink'}`}>
                  {c.shortName} {c.isMain && <span className="text-amber-500">★</span>}
                </p>
                <p className="mt-0.5 flex items-center gap-1.5 text-[11.5px] font-medium text-ink-muted">
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${levelTone(statusText)}`} />
                  {shortLevel(statusText)}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Campus Accreditation Status Card */}
      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <div className="panel col-span-2 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-4">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-lg font-bold text-ink">{campus.name}</h2>

                <Badge tone="brand">{iaRecord.status}</Badge>
              </div>
              <p className="mt-1 text-xs text-ink-muted">
                {campus.location} · Campus Director: <span className="font-medium text-ink">{campus.director}</span>
              </p>
            </div>

            <div className="text-right">
              <div className="flex items-center justify-end gap-2">
                <span className="text-xs text-ink-muted">Accreditation Validity</span>
                {validity && (
                  <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold ${validity.className}`}>{validity.label}</span>
                )}
              </div>
              <p className="mt-0.5 text-sm font-semibold text-ink">
                {readableDate(iaRecord.validityStart)} – {readableDate(iaRecord.validityEnd)}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              {
                icon: ShieldCheckIcon,
                label: 'Evaluating Body',
                value: iaRecord.surveyBody.includes('AACCUP') ? iaRecord.surveyBody : 'AACCUP',
                tone: 'bg-brand-50 text-brand-600'
              },
              { icon: CalendarCheckIcon, label: 'Last Formal Survey', value: readableDate(iaRecord.lastEvaluationDate), tone: 'bg-emerald-50 text-emerald-600' },
              {
                icon: CalendarClockIcon,
                label: 'Next Scheduled Evaluation',
                value: readableDate(iaRecord.nextScheduledEvaluation),
                tone: 'bg-amber-50 text-amber-600'
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

          {iaRecord.remarks && (
            <div className="mt-3 rounded-r-xl border-l-4 border-brand-400 bg-brand-50/40 px-3.5 py-2.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-brand-700">Remarks</p>
              <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-muted">{iaRecord.remarks}</p>
            </div>
          )}

          <div
            className={`mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-xs ${
              certificates.length > 0 ? 'border-success-100 bg-success-50' : 'border-line bg-canvas'
            }`}
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white ring-1 ${
                  certificates.length > 0 ? 'text-success-700 ring-success-100' : 'text-ink-subtle ring-line'
                }`}
              >
                <FileCheck2Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className={`font-semibold ${certificates.length > 0 ? 'text-success-700' : 'text-ink'}`}>Official Certificates</p>
                <p className="truncate text-[11.5px] text-ink-muted">
                  {certificates.length > 0 ? (
                    <>
                      {pluralize(certificates.length, 'certificate')} · {pluralize(certificateLevelCount, 'level')} · Latest:{' '}
                      <button
                        type="button"
                        onClick={() => setPreviewCertificate(certificates[0])}
                        className="font-semibold text-ink hover:text-brand-700 hover:underline"
                      >
                        {certificates[0].title}
                      </button>
                    </>
                  ) : (
                    'No certificate uploaded yet.'
                  )}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {certificates.length === 0 && iaRecord.certificateUrl && (
                <a
                  href={iaRecord.certificateUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-ink-muted hover:text-brand-700 hover:underline"
                >
                  Linked file <ExternalLinkIcon className="h-3 w-3" />
                </a>
              )}
              {certificates.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setCertificatesOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-success-100 bg-white px-2.5 py-1.5 text-[12px] font-semibold text-success-700 transition hover:border-success-600"
                >
                  <FileCheckIcon className="h-3.5 w-3.5" />
                  View Certificates ({certificates.length})
                </button>
              ) : isAdmin ? (
                <button
                  type="button"
                  onClick={() => setCertificatesOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 py-1.5 text-[12px] font-semibold text-ink-muted transition hover:border-brand-300 hover:text-brand-700"
                >
                  <UploadIcon className="h-3.5 w-3.5" />
                  Upload Certificate
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {/* Compliance Card */}
        <div className="panel flex flex-col justify-between p-5">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-subtle">Compliance</h3>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold tracking-tight text-ink">{compliancePercentage}%</span>
              <span className="text-xs font-medium text-ink-muted">
                {approvedCount} of {totalAreas} areas approved
              </span>
            </div>

            <div
              className="mt-3 flex h-2.5 w-full overflow-hidden rounded-full bg-line"
              role="img"
              aria-label={statusBreakdown.map((s) => `${s.label}: ${s.count}`).join(', ')}
            >
              {statusBreakdown.map((s) =>
                s.count > 0 ? (
                  <div
                    key={s.label}
                    className={`h-full transition-all duration-300 ${s.dot}`}
                    style={{ width: `${(s.count / totalAreas) * 100}%` }}
                  />
                ) : null
              )}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2 xs:grid-cols-2">
              {statusBreakdown.map((s) => (
                <div key={s.label} className="rounded-xl border border-line bg-canvas/50 px-3 py-2.5">
                  <p className="flex items-center gap-1.5 text-[11.5px] font-medium text-ink-muted">
                    <span className={`h-2 w-2 rounded-full ${s.dot}`} />
                    {s.label}
                  </p>
                  <p className={`mt-0.5 text-xl font-bold leading-tight ${s.text}`}>{s.count}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 border-t border-line pt-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink-subtle">Recommended level</p>
            <p className="mt-1 flex items-center gap-2 text-[13.5px] font-bold text-ink">
              <span className={`h-2 w-2 rounded-full ${levelTone(recommendedLevel)}`} />
              {recommendedLevel}
            </p>
            <p className="mt-0.5 text-[11.5px] text-ink-subtle">
              {approvedCount === 0 ? 'No areas approved yet' : `Based on ${pluralize(approvedCount, 'approved area')}`}
            </p>
          </div>
        </div>
      </div>

      {/* IA DOCUMENT & FOLDER MANAGEMENT SECTION */}
      <IAFolderManager
        campusId={selectedCampusId}
        campusName={campus.name}
        iaRequirements={iaRecord.requirements}
        onRequirementUpdated={(reqId, docName, docUrl) => {
          updateIARequirement(selectedCampusId, reqId, {
            documentName: docName,
            documentUrl: docUrl,
            status: 'Approved',
            isSubmitted: true
          });
        }}
      />

      <CertificateFoldersModal
        open={certificatesOpen}
        onClose={() => setCertificatesOpen(false)}
        title="Institutional Accreditation Certificates"
        description={`${campus.name} · AACCUP Institutional Accreditation`}
        frameworkId="ia"
        areaKey={certAreaKey}
        levels={IA_CERTIFICATE_LEVELS}
        currentLevelCode={iaLevelCode(iaRecord.status)}
        subject={campus.name}
        program="Institutional Accreditation"
        cycle="AACCUP Institutional Accreditation"
        campusId={selectedCampusId}
        campusName={campus.name}
        stats={[
          { label: 'Current level', value: iaRecord.status },
          { label: 'Validity', value: `${iaRecord.validityStart} – ${iaRecord.validityEnd}` }
        ]}
      />
      <DocumentPreviewModal doc={previewCertificate} onClose={() => setPreviewCertificate(null)} grantAccess />

      {/* Edit All Campus Statuses Modal */}
      <Modal
        open={isEditAllOpen}
        onClose={() => setIsEditAllOpen(false)}
        title="Edit Campus Accreditation Statuses"
        description="Select and update the AACCUP institutional accreditation status (strictly Level I to Level IV) for each campus."
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditAllOpen(false)}
              className="btn btn-primary btn-sm"
            >
              Done
            </button>
          </div>
        }
      >
        <div className="divide-y divide-line overflow-hidden rounded-lg border border-line">
          {campuses.map((c) => {
            const rec = iaRecords.find((r) => r.campusId === c.id);
            const currentStatus = rec?.status || 'Level I Accredited';
            return (
              <div
                key={c.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 hover:bg-canvas/50 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-50 text-brand-700 shrink-0">
                    <Building2Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold text-ink">{c.name}</p>
                    </div>
                    <p className="text-xs text-ink-muted">{c.location}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-semibold text-slate-500">Level:</span>
                  <select
                    value={currentStatus}
                    onChange={(e) => {
                      const newStatus = e.target.value as IALevel;
                      updateCampusIA(c.id, { status: newStatus });
                      toast.success(`Updated ${c.shortName} status to ${newStatus}`);
                    }}
                    className="rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-bold text-ink shadow-2xs hover:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
                  >
                    {IA_LEVEL_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      </Modal>
    </>
  );
}
