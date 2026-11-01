import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { usePortal } from '../../contexts/PortalContext';
import { CampusId, IALevel, IA_LEVEL_OPTIONS } from '../../types/accreditation';
import { PageHeader } from '../../components/ui/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { IAFolderManager } from '../../components/accreditation/IAFolderManager';
import {
  Building2Icon,
  ExternalLinkIcon,
  FileCheck2Icon,
  PencilIcon
} from 'lucide-react';

export function CampusIAView() {
  const { campuses, iaRecords, updateCampusIA, updateIARequirement, selectedCampus, setSelectedCampus } = usePortal();
  const [selectedCampusId, setSelectedCampusId] = useState<CampusId>(() => {
    return selectedCampus !== 'all' ? selectedCampus : 'tandag';
  });

  const [isEditAllOpen, setIsEditAllOpen] = useState(false);

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

  // Status Determination Engine (Restricted strictly to Level I through Level IV)
  const evaluateRecommendedLevel = (): { level: IALevel; explanation: string } => {
    if (compliancePercentage === 100 && approvedCount >= 9) {
      return {
        level: 'Level IV Institutional Accreditation',
        explanation: 'All 9 mandatory institutional areas approved with verified documentation and research outputs.'
      };
    }
    if (compliancePercentage >= 75 || approvedCount >= 7) {
      return {
        level: 'Level III Re-accredited',
        explanation: 'Strong performance across core areas; at least 7 of 9 areas verified without critical deficiencies.'
      };
    }
    if (compliancePercentage >= 50 || approvedCount >= 5) {
      return {
        level: 'Level II Re-accredited',
        explanation: 'Baseline institutional areas verified; minimum faculty and facilities standards satisfied.'
      };
    }
    return {
      level: 'Level I Accredited',
      explanation: 'Institutional survey documentation satisfies baseline Level I criteria.'
    };
  };

  return (
    <>
      <PageHeader
        eyebrow={
          <span>
            <Link to="/frameworks" className="hover:text-ink hover:underline">
              Accreditation & Frameworks
            </Link>{' '}
            / Campus-Based Accreditation
          </span>
        }
        title="Institutional Accreditation (IA)"
        description="Campus-level AACCUP institutional accreditation tracking, criteria validation, evidence portfolio, and automated accreditation status determination."
      />

      {/* Campus Selector Bar */}
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Campuses (Click to select & edit status)
        </span>
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
      <div className="mb-6 flex overflow-x-auto no-scrollbar sm:flex-wrap gap-2 border-b border-line pb-4">
        {campuses.map((c) => {
          const rec = iaRecords.find((r) => r.campusId === c.id);
          const isSelected = c.id === selectedCampusId;
          const statusText = rec?.status || 'Level I Accredited';
          return (
            <button
              key={c.id}
              onClick={() => {
                setSelectedCampusId(c.id);
                setSelectedCampus(c.id);
              }}
              className={`flex shrink-0 items-center gap-2 rounded-lg border px-3.5 py-2 text-left transition-all ${
                isSelected
                  ? 'border-brand-500 bg-brand-50/70 shadow-sm ring-1 ring-brand-500'
                  : 'border-line bg-white hover:bg-canvas'
              }`}
            >
              <Building2Icon className={`h-4 w-4 ${isSelected ? 'text-brand-700' : 'text-ink-subtle'}`} />
              <div>
                <p className={`text-xs font-semibold ${isSelected ? 'text-brand-900' : 'text-ink'}`}>
                  {c.shortName} {c.isMain && '★'}
                </p>
                <p className="text-[11px] font-medium text-slate-600">{statusText}</p>
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
              <span className="text-xs text-ink-muted">Accreditation Validity</span>
              <p className="font-semibold text-ink text-sm">
                {iaRecord.validityStart} to {iaRecord.validityEnd}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <span className="text-xs text-ink-muted">Evaluating Body</span>
              <p className="text-xs font-semibold text-brand-700 mt-0.5">
                {iaRecord.surveyBody.includes('AACCUP') ? iaRecord.surveyBody : 'AACCUP (Accrediting Agency of Chartered Colleges and Universities in the Philippines)'}
              </p>
            </div>
            <div>
              <span className="text-xs text-ink-muted">Last Formal Survey</span>
              <p className="text-xs font-semibold text-ink mt-0.5">{iaRecord.lastEvaluationDate}</p>
            </div>
            <div>
              <span className="text-xs text-ink-muted">Next Scheduled Evaluation</span>
              <p className="text-xs font-semibold text-brand-700 mt-0.5">{iaRecord.nextScheduledEvaluation}</p>
            </div>
          </div>

          <div className="mt-4 rounded-md border border-line bg-canvas p-3">
            <p className="text-xs text-ink-muted">
              <strong className="text-ink">Accreditation Commission Remarks:</strong> {iaRecord.remarks}
            </p>
          </div>

          {iaRecord.certificationFile && (
            <div className="mt-3 flex items-center justify-between rounded-md border border-success-100 bg-success-50 px-3 py-2 text-xs">
              <div className="flex items-center gap-2">
                <FileCheck2Icon className="h-4 w-4 text-success-700" />
                <span className="font-medium text-success-700">Official Certificate: {iaRecord.certificationFile}</span>
              </div>
              {iaRecord.certificateUrl && (
                <a
                  href={iaRecord.certificateUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 font-semibold text-success-700 hover:underline"
                >
                  View Certificate <ExternalLinkIcon className="h-3 w-3" />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Dynamic Status Determination Card */}
        <div className="panel p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted">
              Requirement Compliance Audit
            </h3>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-ink">{compliancePercentage}%</span>
              <span className="text-xs text-ink-muted">compliant ({approvedCount} of 9 areas verified)</span>
            </div>

            <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-line">
              <div
                className="h-full bg-brand-600 transition-all duration-300"
                style={{ width: `${compliancePercentage}%` }}
              />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded border border-line p-2">
                <span className="text-ink-muted">Approved</span>
                <p className="font-bold text-success-700 text-sm">{approvedCount}</p>
              </div>
              <div className="rounded border border-line p-2">
                <span className="text-ink-muted">Under Review</span>
                <p className="font-bold text-brand-700 text-sm">{reviewCount}</p>
              </div>
              <div className="rounded border border-line p-2">
                <span className="text-ink-muted">Deficient</span>
                <p className="font-bold text-danger-700 text-sm">{deficientCount}</p>
              </div>
              <div className="rounded border border-line p-2">
                <span className="text-ink-muted">Pending</span>
                <p className="font-bold text-warning-700 text-sm">{pendingCount}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 border-t border-line pt-3">
            <span className="text-[11px] font-semibold uppercase text-ink-muted">Recommended Level (Level I - IV):</span>
            <p className="text-xs font-bold text-brand-700">{evaluateRecommendedLevel().level}</p>
            <p className="text-[11px] text-ink-subtle mt-0.5">{evaluateRecommendedLevel().explanation}</p>
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
