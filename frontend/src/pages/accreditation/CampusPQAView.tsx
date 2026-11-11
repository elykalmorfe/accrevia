import { useState, useEffect } from 'react';
import { usePortal } from '../../contexts/PortalContext';
import { CampusId } from '../../types/accreditation';
import { PageHeader } from '../../components/ui/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { IAFolderManager } from '../../components/accreditation/IAFolderManager';
import { PQA_FOLDER_FRAMEWORK } from '../../components/accreditation/folderFrameworks';
import { AwardIcon } from 'lucide-react';

export function CampusPQAView() {
  const { campuses, pqaRecords, selectedCampus } = usePortal();
  const [selectedCampusId, setSelectedCampusId] = useState<CampusId>(() => {
    return selectedCampus !== 'all' ? selectedCampus : 'tandag';
  });

  useEffect(() => {
    if (selectedCampus !== 'all' && selectedCampus !== selectedCampusId) {
      setSelectedCampusId(selectedCampus);
    }
  }, [selectedCampus, selectedCampusId]);

  const campus = campuses.find((c) => c.id === selectedCampusId) || campuses[0];
  const pqaRecord = pqaRecords.find((r) => r.campusId === selectedCampusId);

  if (!pqaRecord) {
    return (
      <div className="panel p-8 text-center">
        <AwardIcon className="mx-auto h-10 w-10 text-ink-subtle" />
        <h3 className="mt-2 text-sm font-semibold text-ink">No PQA record found</h3>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow={
          <span>
            Accreditation & Frameworks / Quality Excellence
          </span>
        }
        title="Philippine Quality Award (PQA) Framework"
        description="Campus-level performance excellence evaluation administered and evaluated by the Development Academy of the Philippines (DAP) across 7 Malcolm Baldrige quality dimensions."
      />

      {/* Campus PQA Status Card */}
      <div className="mb-6">
        <div className="panel p-5">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold text-ink">{campus.name}</h2>
                <Badge tone="gold">{pqaRecord.recognitionLevel}</Badge>
              </div>
              <p className="mt-1 text-xs text-ink-muted">
                {campus.location} · PQA Application Cycle: <span className="font-semibold text-ink">{pqaRecord.cycle}</span>
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs text-ink-muted">Assessment Status</span>
              <p className="font-semibold text-brand-700 text-sm">{pqaRecord.evaluationStatus}</p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <span className="text-xs text-ink-muted">Evaluating Body</span>
              <p className="text-xs font-semibold text-brand-700 mt-0.5">
                {pqaRecord.evaluatingBody || 'DAP (Development Academy of the Philippines)'}
              </p>
            </div>
            <div>
              <span className="text-xs text-ink-muted">Last Assessment Date</span>
              <p className="text-xs font-semibold text-ink mt-0.5">{pqaRecord.lastAssessmentDate}</p>
            </div>
            <div>
              <span className="text-xs text-ink-muted">Next Cycle Submission</span>
              <p className="text-xs font-semibold text-brand-700 mt-0.5">{pqaRecord.nextAssessmentCycle}</p>
            </div>
          </div>

          <div className="mt-4 rounded-md border border-line bg-canvas p-3">
            <p className="text-xs text-ink-muted">
              <strong className="text-ink">PQA Assessors Feedback (DAP):</strong> {pqaRecord.feedbackSummary}
            </p>
          </div>
        </div>

      </div>

      {/* PQA Document & Folder Management (7 category folders) */}
      <IAFolderManager
        campusId={selectedCampusId}
        campusName={campus.name}
        framework={PQA_FOLDER_FRAMEWORK}
      />
    </>
  );
}
