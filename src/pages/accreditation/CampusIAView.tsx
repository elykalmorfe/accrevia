import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { usePortal } from '../../contexts/PortalContext';
import { CampusId, IALevel, IARequirementItem, RequirementVerificationStatus } from '../../types/accreditation';
import { PageHeader } from '../../components/ui/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { AccreditationDocModal } from '../../components/accreditation/AccreditationDocModal';
import {
  Building2Icon,
  FileTextIcon,
  ExternalLinkIcon,
  UploadIcon,
  CalculatorIcon,
  FileCheck2Icon
} from 'lucide-react';

export function CampusIAView() {
  const { campuses, iaRecords, updateCampusIA, updateIARequirement } = usePortal();
  const [selectedCampusId, setSelectedCampusId] = useState<CampusId>('tandag');

  const campus = campuses.find((c) => c.id === selectedCampusId) || campuses[0];
  const iaRecord = iaRecords.find((r) => r.campusId === selectedCampusId);

  // Requirement Modal State
  const [activeReq, setActiveReq] = useState<IARequirementItem | null>(null);

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

  // Status Determination Engine
  const evaluateRecommendedLevel = (): { level: IALevel; explanation: string } => {
    if (compliancePercentage === 100 && approvedCount >= 7) {
      return {
        level: 'Level III Re-accredited',
        explanation: 'All 7 mandatory institutional areas approved with verified documentation and research outputs.'
      };
    }
    if (compliancePercentage >= 75) {
      return {
        level: 'Level II Re-accredited',
        explanation: 'Strong performance across core areas; at least 5 of 7 areas verified without critical deficiencies.'
      };
    }
    if (compliancePercentage >= 50) {
      return {
        level: 'Level I Accredited',
        explanation: 'Baseline institutional areas verified; minimum faculty and facilities standards satisfied.'
      };
    }
    return {
      level: 'Candidate',
      explanation: 'Institutional requirements in preparation; candidate survey documentation pending submission.'
    };
  };

  const handleApplyRecommendedLevel = () => {
    const recommended = evaluateRecommendedLevel();
    updateCampusIA(selectedCampusId, { status: recommended.level });
    toast.success(`Accreditation status updated to "${recommended.level}"`);
  };

  const handleSaveRequirement = (data: {
    documentName: string;
    documentUrl: string;
    status: RequirementVerificationStatus;
    reviewerNotes: string;
  }) => {
    if (!activeReq) return;
    updateIARequirement(selectedCampusId, activeReq.id, {
      documentName: data.documentName,
      documentUrl: data.documentUrl,
      status: data.status,
      reviewerNotes: data.reviewerNotes,
      isSubmitted: !!data.documentName
    });
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
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleApplyRecommendedLevel}
              className="btn btn-secondary btn-sm"
              title="Evaluate and sync level based on requirement audit"
            >
              <CalculatorIcon className="h-4 w-4 text-brand-600" />
              Evaluate & Update Level
            </button>
          </div>
        }
      />

      {/* Campus Selector Pills */}
      <div className="mb-6 flex flex-wrap gap-2 border-b border-line pb-4">
        {campuses.map((c) => {
          const rec = iaRecords.find((r) => r.campusId === c.id);
          const isSelected = c.id === selectedCampusId;
          return (
            <button
              key={c.id}
              onClick={() => setSelectedCampusId(c.id)}
              className={`flex items-center gap-2 rounded-lg border px-3.5 py-2 text-left transition-all ${
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
                <p className="text-[11px] text-ink-muted">{rec?.status || 'Candidate'}</p>
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
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold text-ink">{campus.name}</h2>
                <Badge tone="brand">{iaRecord.status}</Badge>
                {campus.isMain && <Badge tone="gold">Main Campus</Badge>}
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
              <span className="text-xs text-ink-muted">Accreditation Body</span>
              <p className="text-xs font-semibold text-ink mt-0.5">{iaRecord.surveyBody}</p>
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
              <span className="text-xs text-ink-muted">compliant ({approvedCount} of 7 areas verified)</span>
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
            <span className="text-[11px] font-semibold uppercase text-ink-muted">Recommended Accreditation Level:</span>
            <p className="text-xs font-bold text-brand-700">{evaluateRecommendedLevel().level}</p>
            <p className="text-[11px] text-ink-subtle mt-0.5">{evaluateRecommendedLevel().explanation}</p>
          </div>
        </div>
      </div>

      {/* 7 Core Institutional Areas Requirements Table */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-ink">AACCUP Institutional Survey Areas Portfolio</h3>
            <p className="text-xs text-ink-muted">
              Submit and verify campus-level documentation across all 7 comprehensive institutional accreditation areas.
            </p>
          </div>
        </div>

        <div className="panel divide-y divide-line overflow-hidden">
          {iaRecord.requirements.map((req) => (
            <div key={req.id} className="p-4 transition-colors hover:bg-canvas/40">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-brand-700">{req.areaCode}</span>
                    <span className="text-xs font-semibold text-ink">· {req.areaName}</span>
                    <Badge
                      tone={
                        req.status === 'Approved'
                          ? 'success'
                          : req.status === 'Under Review'
                          ? 'brand'
                          : req.status === 'Deficient'
                          ? 'danger'
                          : 'warning'
                      }
                      dot
                    >
                      {req.status}
                    </Badge>
                  </div>

                  <h4 className="mt-1 text-sm font-semibold text-ink">{req.title}</h4>
                  <p className="text-xs text-ink-muted mt-0.5">{req.description}</p>

                  {/* Attached Document info */}
                  {req.documentName && (
                    <div className="mt-2.5 flex items-center gap-2 text-xs">
                      <FileTextIcon className="h-3.5 w-3.5 text-brand-600" />
                      <span className="font-medium text-ink">{req.documentName}</span>
                      {req.submissionDate && (
                        <span className="text-ink-subtle">· Submitted {req.submissionDate}</span>
                      )}
                      {req.documentUrl && (
                        <a
                          href={req.documentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-brand-600 hover:underline"
                        >
                          View File
                        </a>
                      )}
                    </div>
                  )}

                  {req.reviewerNotes && (
                    <div className="mt-2 rounded bg-warning-50/70 border border-warning-100 p-2 text-xs text-warning-800">
                      <strong>Reviewer Remarks:</strong> {req.reviewerNotes}
                    </div>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveReq(req)}
                    className="btn btn-secondary btn-sm"
                  >
                    <UploadIcon className="h-3.5 w-3.5" />
                    Manage & Verify
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Requirement Modal */}
      {activeReq && (
        <AccreditationDocModal
          open={!!activeReq}
          title="Campus Institutional Evidence Submission"
          areaCode={activeReq.areaCode}
          requirementTitle={activeReq.title}
          currentDocumentName={activeReq.documentName}
          currentDocumentUrl={activeReq.documentUrl}
          currentStatus={activeReq.status}
          currentNotes={activeReq.reviewerNotes}
          onClose={() => setActiveReq(null)}
          onSave={handleSaveRequirement}
        />
      )}
    </>
  );
}
