import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { usePortal } from '../../contexts/PortalContext';
import { CampusId, IALevel } from '../../types/accreditation';
import { PageHeader } from '../../components/ui/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { IAFolderManager } from '../../components/accreditation/IAFolderManager';
import {
  Building2Icon,
  ExternalLinkIcon,
  CalculatorIcon,
  FileCheck2Icon
} from 'lucide-react';

export function CampusIAView() {
  const { campuses, iaRecords, updateCampusIA, updateIARequirement, selectedCampus, setSelectedCampus } = usePortal();
  const [selectedCampusId, setSelectedCampusId] = useState<CampusId>(() => {
    return selectedCampus !== 'all' ? selectedCampus : 'tandag';
  });

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

  // Status Determination Engine (Evaluated out of 9 Areas)
  const evaluateRecommendedLevel = (): { level: IALevel; explanation: string } => {
    if (compliancePercentage === 100 && approvedCount >= 9) {
      return {
        level: 'Level III Re-accredited',
        explanation: 'All 9 mandatory institutional areas approved with verified documentation and research outputs.'
      };
    }
    if (compliancePercentage >= 75 || approvedCount >= 7) {
      return {
        level: 'Level II Re-accredited',
        explanation: 'Strong performance across core areas; at least 7 of 9 areas verified without critical deficiencies.'
      };
    }
    if (compliancePercentage >= 50 || approvedCount >= 5) {
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
      <div className="mb-6 flex overflow-x-auto no-scrollbar sm:flex-wrap gap-2 border-b border-line pb-4">
        {campuses.map((c) => {
          const rec = iaRecords.find((r) => r.campusId === c.id);
          const isSelected = c.id === selectedCampusId;
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
            <span className="text-[11px] font-semibold uppercase text-ink-muted">Recommended Accreditation Level:</span>
            <p className="text-xs font-bold text-brand-700">{evaluateRecommendedLevel().level}</p>
            <p className="text-[11px] text-ink-subtle mt-0.5">{evaluateRecommendedLevel().explanation}</p>
          </div>
        </div>
      </div>

      {/* IA DOCUMENT & FOLDER MANAGEMENT SECTION (Folder Creation, Upload, Areas 1-9, Instrument Docs) */}
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

      </>
  );
}
