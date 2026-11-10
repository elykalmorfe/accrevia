import { useState, useEffect } from 'react';
import { usePortal } from '../../contexts/PortalContext';
import { CampusId } from '../../types/accreditation';
import { PageHeader } from '../../components/ui/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { AwardIcon } from 'lucide-react';

export function CampusPQAView() {
  const { campuses, pqaRecords, selectedCampus, setSelectedCampus } = usePortal();
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

  const percentage = Math.round((pqaRecord.overallScore / 1000) * 100);

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

      {/* Campus Selector Pills */}
      <div className="mb-6 flex overflow-x-auto no-scrollbar sm:flex-wrap gap-2 border-b border-line pb-4">
        {campuses.map((c) => {
          const rec = pqaRecords.find((r) => r.campusId === c.id);
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
              <AwardIcon className={`h-4 w-4 ${isSelected ? 'text-brand-700' : 'text-ink-subtle'}`} />
              <div>
                <p className={`text-xs font-semibold ${isSelected ? 'text-brand-900' : 'text-ink'}`}>
                  {c.shortName}
                </p>
                <p className="text-[11px] text-ink-muted">
                  {rec ? `${rec.overallScore} pts` : 'Candidate'}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Campus PQA Status & Score Card */}
      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <div className="panel col-span-2 p-5">
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

        {/* Scorecard Gauge */}
        <div className="panel p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted">
              Overall Quality Scorecard
            </h3>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-ink">{pqaRecord.overallScore}</span>
              <span className="text-xs text-ink-muted">/ 1,000 points max</span>
            </div>

            <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-line">
              <div
                className="h-full bg-gold-500 transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            </div>

            <p className="mt-2 text-xs text-ink-subtle">
              Score maturity: <strong>{percentage}%</strong> of world-class excellence criteria
            </p>
          </div>

          <div className="mt-4 border-t border-line pt-3 text-xs space-y-1">
            <div className="flex justify-between text-ink-muted">
              <span>Level 1: Commitment</span>
              <span>&gt; 350 pts</span>
            </div>
            <div className="flex justify-between text-ink-muted">
              <span>Level 2: Proficiency</span>
              <span>&gt; 450 pts</span>
            </div>
            <div className="flex justify-between text-ink-muted">
              <span>Level 3: Mastery</span>
              <span>&gt; 550 pts</span>
            </div>
            <div className="flex justify-between font-semibold text-brand-700">
              <span>Level 4: Excellence Award</span>
              <span>&gt; 700 pts</span>
            </div>
          </div>
        </div>
      </div>

      {/* 7 Categories Evaluation Matrix */}
      <div>
        <h3 className="mb-3 text-sm font-bold text-ink">PQA Criteria for Performance Excellence (7 Categories)</h3>

        <div className="space-y-3">
          {pqaRecord.categories.map((cat) => {
            const catPercent = Math.round((cat.awardedScore / cat.maxScore) * 100);
            return (
              <div key={cat.categoryId} className="panel p-4 hover:border-brand-300 transition-all">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-50 text-[11px] font-bold text-brand-700">
                        {cat.categoryNumber}
                      </span>
                      <h4 className="text-sm font-bold text-ink">{cat.categoryName}</h4>
                      <Badge
                        tone={cat.status === 'Met' ? 'success' : cat.status === 'Partially Met' ? 'brand' : 'warning'}
                        dot
                      >
                        {cat.status}
                      </Badge>
                    </div>

                    <p className="mt-1 text-xs text-ink-muted">{cat.narrativeSummary}</p>

                    <div className="mt-2 flex items-center gap-4 text-xs text-ink-subtle">
                      <span>
                        Evidence submitted:{' '}
                        <strong className="text-ink">
                          {cat.evidenceSubmittedCount} / {cat.evidenceRequiredCount}
                        </strong>
                      </span>
                      <span>
                        Score achieved:{' '}
                        <strong className="text-brand-700 font-bold">
                          {cat.awardedScore} / {cat.maxScore} pts ({catPercent}%)
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
