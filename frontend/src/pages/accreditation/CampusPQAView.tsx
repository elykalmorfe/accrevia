import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { usePortal } from '../../contexts/PortalContext';
import { CampusId, PQARecognitionLevel } from '../../types/accreditation';
import type { EvidenceDocument } from '../../types/evidence';
import { PageHeader } from '../../components/ui/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { IAFolderManager } from '../../components/accreditation/IAFolderManager';
import { PQA_FOLDER_FRAMEWORK } from '../../components/accreditation/folderFrameworks';
import { CertificateFoldersModal, CertificateLevel } from '../../components/accreditation/CertificateFoldersModal';
import { OfficialCertificatesStrip, useCampusCertificates } from '../../components/accreditation/OfficialCertificatesStrip';
import { DocumentPreviewModal } from '../../components/documents/DocumentPreviewModal';
import { pqaCertificateAreaKey } from '../../utils/programAccreditation';
import { formatDate } from '../../utils/format';
import { AwardIcon, CalendarCheckIcon, CalendarClockIcon, ShieldCheckIcon } from 'lucide-react';
import { useInstitutionalMutationAccess } from '../../hooks/useInstitutionalMutationAccess';

const PQA_CERTIFICATE_LEVELS: CertificateLevel[] = (
  [
    'Level 1: Commitment to Quality Management',
    'Level 2: Proficiency in Quality Management',
    'Level 3: Mastery in Quality Management',
    'Level 4: Philippine Quality Award for Performance Excellence'
  ] satisfies PQARecognitionLevel[]
).map((code) => ({ code, label: shortPQALevel(code) }));

/** `Level 2: Proficiency in Quality Management` → `Level 2`. */
function shortPQALevel(level: string): string {
  return level.split(':')[0];
}

/** Display name on every PQA campus card. This label does not follow the selected campus. */
const PQA_CAMPUS_NAME = 'NEMSU';

function readableDate(value?: string): string {
  if (!value) return '—';
  try {
    return formatDate(value);
  } catch {
    return value;
  }
}

export function CampusPQAView() {
  const { campuses, pqaRecords, updateCampusPQA, selectedCampus } = usePortal();
  const { canMutate } = useInstitutionalMutationAccess();
  const [selectedCampusId, setSelectedCampusId] = useState<CampusId>(() => {
    return selectedCampus !== 'all' ? selectedCampus : 'tandag';
  });
  const [certificatesOpen, setCertificatesOpen] = useState(false);
  const [previewCertificate, setPreviewCertificate] = useState<EvidenceDocument | null>(null);

  const certAreaKey = pqaCertificateAreaKey(selectedCampusId);
  const { certificates, activeCertificate, activeLevel, levelCount } = useCampusCertificates('pqa', certAreaKey);

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
      <PageHeader title="Philippine Quality Award (PQA) Framework" />

      {/* Campus PQA Status Card */}
      <div className="mb-6">
        <div className="panel p-5">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-4">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-lg font-bold text-ink">{PQA_CAMPUS_NAME}</h2>
                <Badge tone="gold">{pqaRecord.recognitionLevel}</Badge>
              </div>
              <p className="mt-1 text-xs text-ink-muted">
                {campus?.location || 'Main Campus'} · PQA Application Cycle: <span className="font-medium text-ink">{pqaRecord.cycle}</span>
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs text-ink-muted">Assessment Status</span>
              <p className="mt-0.5 text-sm font-semibold text-brand-700">{pqaRecord.evaluationStatus}</p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              {
                icon: ShieldCheckIcon,
                label: 'Evaluating Body',
                value: pqaRecord.evaluatingBody,
                tone: 'bg-brand-50 text-brand-600'
              },
              {
                icon: CalendarCheckIcon,
                label: 'Last Assessment Date',
                value: readableDate(pqaRecord.lastAssessmentDate),
                tone: 'bg-brand-50 text-brand-600'
              },
              {
                icon: CalendarClockIcon,
                label: 'Next Cycle Submission',
                value: pqaRecord.nextAssessmentCycle || '—',
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

          {pqaRecord.feedbackSummary && (
            <div className="mt-3 rounded-r-xl border-l-4 border-brand-400 bg-brand-50/40 px-3.5 py-2.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-brand-700">DAP Assessors Feedback</p>
              <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-muted">{pqaRecord.feedbackSummary}</p>
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

      {/* PQA Document & Folder Management (7 category folders) */}
      <IAFolderManager
        campusId={selectedCampusId}
        campusName={PQA_CAMPUS_NAME}
        framework={PQA_FOLDER_FRAMEWORK}
        readOnly={!canMutate}
      />

      <CertificateFoldersModal
        open={certificatesOpen}
        onClose={() => setCertificatesOpen(false)}
        title="PQA Recognition Certificates"
        description={`${PQA_CAMPUS_NAME} · Philippine Quality Award`}
        frameworkId="pqa"
        areaKey={certAreaKey}
        levels={PQA_CERTIFICATE_LEVELS}
        currentLevelCode={pqaRecord.recognitionLevel}
        subject={PQA_CAMPUS_NAME}
        program="Philippine Quality Award"
        cycle={pqaRecord.cycle}
        body="PQA"
        campusId={selectedCampusId}
        campusName={PQA_CAMPUS_NAME}
        stats={[
          { label: 'Recognition level', value: shortPQALevel(pqaRecord.recognitionLevel) },
          { label: 'Overall score', value: `${pqaRecord.overallScore} / 1,000` }
        ]}
        onActivate={
          canMutate
            ? (doc, code) => {
                if (code) updateCampusPQA(selectedCampusId, { recognitionLevel: code as PQARecognitionLevel });
                toast.success(code ? `"${doc.title}" activated · campus set to ${shortPQALevel(code)}` : `"${doc.title}" activated`);
              }
            : undefined
        }
      />
      <DocumentPreviewModal doc={previewCertificate} onClose={() => setPreviewCertificate(null)} grantAccess />
    </>
  );
}
