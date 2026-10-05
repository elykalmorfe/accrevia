import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { usePortal } from '../../contexts/PortalContext';
import { CampusId, ISOCorrectiveAction } from '../../types/accreditation';
import { PageHeader } from '../../components/ui/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { ISOSurveillanceModal } from '../../components/accreditation/ISOSurveillanceModal';
import { Modal } from '../../components/ui/Modal';
import { TextField } from '../../components/ui/TextField';
import {
  ShieldCheckIcon,
  CheckCircle2Icon,
  PlusIcon,
  UserCheckIcon
} from 'lucide-react';

export function CampusISOView() {
  const { campuses, isoRecords, updateISOCorrectiveAction, currentUser } = usePortal();
  const [selectedCampusId, setSelectedCampusId] = useState<CampusId>('tandag');

  const campus = campuses.find((c) => c.id === selectedCampusId) || campuses[0];
  const isoRecord = isoRecords.find((r) => r.campusId === selectedCampusId) || isoRecords[0];

  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState<ISOCorrectiveAction | null>(null);
  const [verifyDate, setVerifyDate] = useState(new Date().toISOString().slice(0, 10));
  const [verifyNotes, setVerifyNotes] = useState('');

  const handleVerifyCar = () => {
    if (!selectedCar) return;
    updateISOCorrectiveAction(isoRecord.id, selectedCar.id, {
      status: 'Closed / Verified',
      verificationDate: verifyDate,
      verifiedBy: currentUser.name || 'Lead Quality Auditor'
    });
    toast.success(`CAR ${selectedCar.carNumber} marked as Verified and Closed`);
    setSelectedCar(null);
  };

  const openCars = (isoRecord.correctiveActions || []).filter((c) => c.status !== 'Closed / Verified');

  return (
    <>
      <PageHeader
        eyebrow={
          <span>
            <Link to="/frameworks" className="hover:text-ink hover:underline">
              Accreditation & Frameworks
            </Link>{' '}
            / Quality Management
          </span>
        }
        title="ISO 9001:2015 Surveillance, Monitoring & Compliance"
        description="Campus-level quality management system monitoring, clause surveillance audits, Corrective Action Request (CAR) tracking, and auditor sign-off."
        actions={
          <button
            type="button"
            onClick={() => setAuditModalOpen(true)}
            className="btn btn-primary btn-sm"
          >
            <PlusIcon className="h-4 w-4" /> Conduct Surveillance Audit
          </button>
        }
      />

      {/* Campus Selector Pills */}
      <div className="mb-6 flex flex-wrap gap-2 border-b border-line pb-4">
        {campuses.map((c) => {
          const rec = isoRecords.find((r) => r.campusId === c.id);
          const isSelected = c.id === selectedCampusId;
          const openCarCount = (rec?.correctiveActions || []).filter((x) => x.status !== 'Closed / Verified').length;
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

      {/* Active Surveillance Status Card */}
      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <div className="panel col-span-2 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold text-ink">{campus.name}</h2>
                <Badge tone="success">{isoRecord.complianceStatus}</Badge>
              </div>
              <p className="mt-1 text-xs text-ink-muted">
                Audit Scope: <strong className="text-ink">{isoRecord.scope}</strong>
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs text-ink-muted">Surveillance Cycle</span>
              <p className="font-semibold text-brand-700 text-sm">{isoRecord.cycle}</p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <span className="text-xs text-ink-muted">Audit Date</span>
              <p className="text-xs font-semibold text-ink mt-0.5">{isoRecord.auditDate}</p>
            </div>
            <div>
              <span className="text-xs text-ink-muted">Lead ISO Auditor</span>
              <p className="text-xs font-semibold text-ink mt-0.5">{isoRecord.leadAuditor}</p>
            </div>
            <div>
              <span className="text-xs text-ink-muted">Validation Status</span>
              <p className="text-xs font-semibold text-success-700 mt-0.5 flex items-center gap-1">
                <CheckCircle2Icon className="h-3.5 w-3.5" /> Certified & Signed
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-md border border-line bg-canvas p-3">
            <p className="text-xs text-ink-muted">
              <strong className="text-ink">Lead Auditor Summary:</strong> {isoRecord.summary}
            </p>
          </div>
        </div>

        {/* Findings Counter */}
        <div className="panel p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted">
              Surveillance Findings Distribution
            </h3>

            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
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

      {/* ISO Clauses Surveillance Checklist */}
      <div className="mb-6 space-y-3">
        <h3 className="text-sm font-bold text-ink">ISO 9001:2015 Clause Conformance Audit Trail</h3>

        <div className="panel divide-y divide-line overflow-hidden">
          {(isoRecord.clausesEvaluated || []).map((clause) => (
            <div key={clause.clauseNumber} className="p-3.5 hover:bg-canvas/50 transition-colors">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-brand-700">{clause.clauseNumber}</span>
                    <span className="font-semibold text-ink text-xs">{clause.clauseTitle}</span>
                    <Badge
                      tone={
                        clause.status === 'Conforming'
                          ? 'success'
                          : clause.status === 'Opportunity for Improvement'
                          ? 'brand'
                          : 'warning'
                      }
                      dot
                    >
                      {clause.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-ink-muted mt-1">{clause.notes}</p>
                </div>

                <div className="text-right text-xs text-ink-subtle shrink-0">
                  <span>Auditor: {clause.auditor}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Corrective Action Requests (CARs) Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-ink">Campus Corrective Action Requests (CARs)</h3>
            <p className="text-xs text-ink-muted">
              Monitoring and verification of non-conformance corrections and systemic preventive measures.
            </p>
          </div>
        </div>

        {(isoRecord.correctiveActions || []).length === 0 ? (
          <div className="panel p-6 text-center text-xs text-ink-muted">
            <CheckCircle2Icon className="mx-auto h-8 w-8 text-success-600 mb-1" />
            No active or past Corrective Action Requests issued for this campus. Full conformance maintained.
          </div>
        ) : (
          <div className="space-y-3">
            {(isoRecord.correctiveActions || []).map((car) => {
              const isClosed = car.status === 'Closed / Verified';
              return (
                <div
                  key={car.id}
                  className={`panel p-4 border-l-4 ${
                    isClosed ? 'border-l-success-600 bg-white' : 'border-l-warning-600 bg-warning-50/20'
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-ink">{car.carNumber}</span>
                        <span className="text-xs text-ink-muted font-medium">({car.clauseRef})</span>
                        <Badge tone={isClosed ? 'success' : 'warning'} dot>
                          {car.status}
                        </Badge>
                      </div>

                      <h4 className="mt-1 text-sm font-semibold text-ink">{car.deficiencyDescription}</h4>

                      <div className="mt-3 grid gap-3 sm:grid-cols-2 rounded-md bg-canvas/70 p-3 text-xs">
                        <div>
                          <strong className="text-ink">Root Cause:</strong>{' '}
                          <span className="text-ink-muted">{car.rootCause}</span>
                        </div>
                        <div>
                          <strong className="text-ink">Immediate Correction:</strong>{' '}
                          <span className="text-ink-muted">{car.correction}</span>
                        </div>
                        <div>
                          <strong className="text-ink">Systemic Corrective Action:</strong>{' '}
                          <span className="text-ink-muted">{car.correctiveAction}</span>
                        </div>
                        <div>
                          <strong className="text-ink">Target Date:</strong>{' '}
                          <span className="text-ink font-semibold">{car.targetDate}</span>
                        </div>
                      </div>

                      {isClosed && (
                        <div className="mt-2 text-xs text-success-700 font-medium flex items-center gap-1">
                          <CheckCircle2Icon className="h-3.5 w-3.5" />
                          Verified and closed on {car.verificationDate} by {car.verifiedBy}
                        </div>
                      )}
                    </div>

                    {!isClosed && (
                      <button
                        type="button"
                        onClick={() => setSelectedCar(car)}
                        className="btn btn-secondary btn-sm text-xs shrink-0"
                      >
                        <UserCheckIcon className="h-3.5 w-3.5" /> Verify & Close CAR
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New Surveillance Modal */}
      <ISOSurveillanceModal
        open={auditModalOpen}
        campusId={selectedCampusId}
        onClose={() => setAuditModalOpen(false)}
      />

      {/* Close CAR Modal */}
      {selectedCar && (
        <Modal
          open={!!selectedCar}
          onClose={() => setSelectedCar(null)}
          title={`Verify & Close ${selectedCar.carNumber}`}
          description={selectedCar.deficiencyDescription}
          size="md"
          footer={
            <div className="flex gap-2 justify-end w-full">
              <button
                type="button"
                onClick={() => setSelectedCar(null)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleVerifyCar}
                className="btn btn-primary"
              >
                Sign Off & Close
              </button>
            </div>
          }
        >
          <div className="space-y-3">
            <TextField
              label="Verification Date"
              type="date"
              value={verifyDate}
              onChange={(e) => setVerifyDate(e.target.value)}
              required
            />

            <div>
              <label className="label">Auditor Verification Remarks</label>
              <textarea
                value={verifyNotes}
                onChange={(e) => setVerifyNotes(e.target.value)}
                className="textarea h-20 text-[13px]"
                placeholder="Confirm that corrective action was evaluated in place and effectiveness was verified..."
              />
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
