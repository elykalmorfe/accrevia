import React, { useState } from 'react';
import { toast } from 'sonner';
import { usePortal } from '../../contexts/PortalContext';
import {
  CampusId,
  ISOComplianceStatus,
  ISOCorrectiveAction,
  ISOSurveillanceRecord
} from '../../types/accreditation';
import { standardISOClauses } from '../../data/accreditationData';
import { Modal } from '../ui/Modal';
import { TextField } from '../ui/TextField';
import { SelectField } from '../ui/SelectField';
import { PlusIcon, Trash2Icon } from 'lucide-react';

interface ISOSurveillanceModalProps {
  open: boolean;
  campusId: CampusId;
  onClose: () => void;
}

export function ISOSurveillanceModal({ open, campusId, onClose }: ISOSurveillanceModalProps) {
  const { campuses, saveISOSurveillanceRecord, currentUser } = usePortal();

  const campus = campuses.find((c) => c.id === campusId) || campuses[0];
  const [auditDate, setAuditDate] = useState(new Date().toISOString().slice(0, 10));
  const [cycle, setCycle] = useState('2025 Surveillance Audit 1');
  const [auditType, setAuditType] = useState<'Surveillance Audit 1' | 'Surveillance Audit 2' | 'Recertification Audit' | 'Internal Quality Audit'>(
    'Surveillance Audit 1'
  );
  const [leadAuditor, setLeadAuditor] = useState(currentUser.name || 'Lead Quality Auditor');
  const [auditorRole, setAuditorRole] = useState('Certified ISO 9001:2015 Auditor');
  const [scope, setScope] = useState('Higher & Advanced Education, Research, Extension, and Support Operations');
  const [complianceStatus, setComplianceStatus] = useState<ISOComplianceStatus>('Compliant');
  const [summary, setSummary] = useState('');

  // Clauses evaluation
  const [clauseStatuses, setClauseStatuses] = useState<Record<string, 'Conforming' | 'Opportunity for Improvement' | 'Minor Non-Conformance' | 'Major Non-Conformance'>>(
    () => Object.fromEntries(standardISOClauses.map((c) => [c.clauseNumber, 'Conforming']))
  );
  const [clauseNotes, setClauseNotes] = useState<Record<string, string>>({});

  // Corrective actions
  const [cars, setCars] = useState<Omit<ISOCorrectiveAction, 'id'>[]>([]);

  const addCarRow = () => {
    setCars((prev) => [
      ...prev,
      {
        carNumber: `CAR-${campus.shortName.toUpperCase()}-${Date.now().toString().slice(-4)}`,
        clauseRef: 'Clause 7.1.5',
        deficiencyDescription: '',
        rootCause: '',
        correction: '',
        correctiveAction: '',
        responsiblePerson: campus.director,
        targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        status: 'Open'
      }
    ]);
  };

  const removeCar = (index: number) => {
    setCars((prev) => prev.filter((_, i) => i !== index));
  };

  const updateCar = (index: number, patch: Partial<Omit<ISOCorrectiveAction, 'id'>>) => {
    setCars((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const minorNC = Object.values(clauseStatuses).filter((s) => s === 'Minor Non-Conformance').length + cars.length;
    const majorNC = Object.values(clauseStatuses).filter((s) => s === 'Major Non-Conformance').length;
    const ofi = Object.values(clauseStatuses).filter((s) => s === 'Opportunity for Improvement').length;
    const conformances = Object.values(clauseStatuses).filter((s) => s === 'Conforming').length * 2;

    const evaluatedClauses = standardISOClauses.map((c) => ({
      clauseNumber: c.clauseNumber,
      clauseTitle: c.clauseTitle,
      status: clauseStatuses[c.clauseNumber] || 'Conforming',
      notes: clauseNotes[c.clauseNumber] || 'Operational compliance verified during audit walk-through.',
      evidenceChecked: 'QMS Operational Manual, Process Checklists, Records, Risk Register',
      auditor: leadAuditor
    }));

    const finalCars: ISOCorrectiveAction[] = cars.map((car, idx) => ({
      ...car,
      id: `car-${campus.id}-${Date.now()}-${idx}`
    }));

    const newRecord: ISOSurveillanceRecord = {
      id: `iso-${campus.id}-${Date.now()}`,
      campusId: campus.id,
      campusName: campus.name,
      auditDate,
      cycle,
      auditType,
      leadAuditor,
      auditorRole,
      scope,
      complianceStatus,
      summary: summary.trim() || `Conducted ${auditType} for ${campus.name}. All core clauses inspected for conformance with standard parameters.`,
      findingsCount: {
        conformances,
        ofi,
        minorNC,
        majorNC
      },
      clausesEvaluated: evaluatedClauses,
      correctiveActions: finalCars,
      validationDate: auditDate,
      validatedBy: leadAuditor
    };

    saveISOSurveillanceRecord(newRecord);
    toast.success(`ISO Surveillance record saved for ${campus.name}`);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Conduct ISO Surveillance & Monitoring Audit`}
      description={`Record official ISO 9001:2015 quality surveillance, clause conformance checks, and issue CARs for ${campus.name}.`}
      size="xl"
      footer={
        <div className="flex w-full items-center justify-between">
          <span className="text-xs text-ink-subtle">
            ISO Surveillance records are certified under university quality assurance protocol.
          </span>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="button" onClick={handleSubmit} className="btn btn-primary">
              Certify & Save Surveillance Audit
            </button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg border border-line bg-canvas/60 p-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <TextField
              label="Audit Date"
              type="date"
              value={auditDate}
              onChange={(e) => setAuditDate(e.target.value)}
              required
            />

            <TextField
              label="Audit Cycle"
              value={cycle}
              onChange={(e) => setCycle(e.target.value)}
              placeholder="e.g. 2025 Surveillance Audit 1"
              required
            />

            <SelectField
              label="Audit Type"
              value={auditType}
              onChange={(e) => setAuditType(e.target.value as 'Surveillance Audit 1' | 'Surveillance Audit 2' | 'Recertification Audit' | 'Internal Quality Audit')}
              options={[
                { value: 'Surveillance Audit 1', label: 'Surveillance Audit 1' },
                { value: 'Surveillance Audit 2', label: 'Surveillance Audit 2' },
                { value: 'Recertification Audit', label: 'Recertification Audit' },
                { value: 'Internal Quality Audit', label: 'Internal Quality Audit' }
              ]}
            />
          </div>

          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            <TextField
              label="Lead Auditor"
              value={leadAuditor}
              onChange={(e) => setLeadAuditor(e.target.value)}
              placeholder="e.g. Engr. Nelson V. Carandang"
              required
            />

            <TextField
              label="Auditor Role / Accreditation"
              value={auditorRole}
              onChange={(e) => setAuditorRole(e.target.value)}
              placeholder="e.g. Lead ISO Quality Auditor"
              required
            />

            <SelectField
              label="Compliance Determination"
              value={complianceStatus}
              onChange={(e) => setComplianceStatus(e.target.value as ISOComplianceStatus)}
              options={[
                { value: 'Compliant', label: 'Compliant (Zero Major Deficiencies)' },
                { value: 'Certified', label: 'Certified (Full Conformance)' },
                { value: 'Minor Deficiencies', label: 'Minor Deficiencies Noted' },
                { value: 'Major Deficiencies Pending Action', label: 'Major Deficiencies Pending Action' }
              ]}
            />
          </div>

          <div className="mt-3">
            <TextField
              label="Audit Scope"
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              placeholder="Scope of certification..."
            />
          </div>
        </div>

        {/* ISO Clauses Checklist */}
        <div>
          <h3 className="mb-2 text-sm font-semibold text-ink">ISO 9001:2015 Clause Conformance Evaluation</h3>
          <p className="mb-3 text-xs text-ink-muted">
            Assess compliance for each mandatory clause across campus operations, academic delivery, and administration.
          </p>

          <div className="panel divide-y divide-line overflow-hidden">
            {standardISOClauses.map((clause) => {
              const currentStatus = clauseStatuses[clause.clauseNumber] || 'Conforming';
              return (
                <div key={clause.clauseNumber} className="p-3 sm:p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-ink text-sm">{clause.clauseNumber}: {clause.clauseTitle}</span>
                      </div>
                      <p className="text-xs text-ink-muted mt-0.5">{clause.desc}</p>
                    </div>

                    <div className="w-full sm:w-56 shrink-0">
                      <select
                        value={currentStatus}
                        onChange={(e) =>
                          setClauseStatuses((prev) => ({
                            ...prev,
                            [clause.clauseNumber]: e.target.value as 'Conforming' | 'Opportunity for Improvement' | 'Minor Non-Conformance' | 'Major Non-Conformance'
                          }))
                        }
                        className="input text-xs h-8"
                      >
                        <option value="Conforming">Conforming (Pass)</option>
                        <option value="Opportunity for Improvement">Opportunity for Improvement</option>
                        <option value="Minor Non-Conformance">Minor Non-Conformance</option>
                        <option value="Major Non-Conformance">Major Non-Conformance</option>
                      </select>
                    </div>
                  </div>

                  {currentStatus !== 'Conforming' && (
                    <div className="mt-2.5">
                      <input
                        type="text"
                        placeholder="Specify auditor observations, evidence checked, or deficiency details..."
                        value={clauseNotes[clause.clauseNumber] || ''}
                        onChange={(e) =>
                          setClauseNotes((prev) => ({
                            ...prev,
                            [clause.clauseNumber]: e.target.value
                          }))
                        }
                        className="input text-xs h-8 bg-warning-50/50 border-warning-200"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Corrective Action Requests (CARs) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-semibold text-ink">Corrective Action Requests (CARs) Issued</h3>
              <p className="text-xs text-ink-muted">Document non-conformances requiring formal root cause analysis and resolution.</p>
            </div>
            <button
              type="button"
              onClick={addCarRow}
              className="btn btn-secondary btn-sm"
            >
              <PlusIcon className="h-3.5 w-3.5" /> Issue CAR
            </button>
          </div>

          {cars.length === 0 ? (
            <div className="rounded-lg border border-dashed border-line p-4 text-center text-xs text-ink-muted">
              No corrective action requests issued for this surveillance audit cycle.
            </div>
          ) : (
            <div className="space-y-3">
              {cars.map((car, idx) => (
                <div key={idx} className="rounded-lg border border-warning-200 bg-warning-50/30 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-warning-800">{car.carNumber}</span>
                    <button
                      type="button"
                      onClick={() => removeCar(idx)}
                      className="text-danger-600 hover:text-danger-800"
                    >
                      <Trash2Icon className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <TextField
                      label="Deficiency / Non-conformance Description"
                      value={car.deficiencyDescription}
                      onChange={(e) => updateCar(idx, { deficiencyDescription: e.target.value })}
                      placeholder="Describe what standard parameter was not met..."
                      required
                    />

                    <TextField
                      label="Target Resolution Date"
                      type="date"
                      value={car.targetDate}
                      onChange={(e) => updateCar(idx, { targetDate: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <TextField
                      label="Correction (Immediate Action)"
                      value={car.correction}
                      onChange={(e) => updateCar(idx, { correction: e.target.value })}
                      placeholder="Immediate containment action..."
                    />

                    <TextField
                      label="Corrective Action (Systemic Fix)"
                      value={car.correctiveAction}
                      onChange={(e) => updateCar(idx, { correctiveAction: e.target.value })}
                      placeholder="Prevention of recurrence..."
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="label">Executive Audit Summary & Recommendations</label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="textarea h-20 text-[13px]"
            placeholder="Enter overall executive assessment and conclusions for campus management..."
          />
        </div>
      </form>
    </Modal>
  );
}
