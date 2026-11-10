import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { PlusIcon, Trash2Icon } from 'lucide-react';
import { usePortal } from '../../contexts/PortalContext';
import {
  AccreditationLevel,
  AccreditationResult,
  CampusId,
  ProgramAccreditation,
  ProgramLevelHistoryEntry
} from '../../types/accreditation';
import { Modal } from '../ui/Modal';
import { TextField } from '../ui/TextField';
import { SelectField } from '../ui/SelectField';
import { Badge } from '../ui/Badge';
import { RESULT_OPTIONS, createHistoryEntry, formatLevel, getLevelHistory, statusLabel, suggestValidityEnd } from '../../utils/programAccreditation';
import { getSettings, ValidityLevel } from '../../settings/portalSettings';

const HISTORY_LEVEL_OPTIONS: AccreditationLevel[] = ['Candidate', 'Level 1', 'Level 2', 'Level 3', 'Level 4'];
const STATUS_OPTIONS: AccreditationLevel[] = [...HISTORY_LEVEL_OPTIONS, 'Not Accreditable'];

interface ProgramFormModalProps {
  open: boolean;
  program: ProgramAccreditation | null;
  defaultCampusId?: CampusId;
  onClose: () => void;
}

export function ProgramFormModal({ open, program, defaultCampusId = 'tandag', onClose }: ProgramFormModalProps) {
  const { campuses, saveProgramAccreditation, isAdmin, currentUser } = usePortal();

  const [campusId, setCampusId] = useState<CampusId>(defaultCampusId);
  const [programName, setProgramName] = useState('');
  const [degreeLevel, setDegreeLevel] = useState<'Undergraduate' | 'Graduate'>('Undergraduate');
  const [yearOfInitialOperation, setYearOfInitialOperation] = useState('');
  const [status, setStatus] = useState<AccreditationLevel>('Candidate');
  const [validityStart, setValidityStart] = useState('');
  const [validityEnd, setValidityEnd] = useState('');
  const [certificationFile, setCertificationFile] = useState('');
  const [instrumentLink, setInstrumentLink] = useState('');
  const [findingsLink, setFindingsLink] = useState('');
  const [technicalReviewLink, setTechnicalReviewLink] = useState('');
  const [scheduleForAccreditation, setScheduleForAccreditation] = useState('');
  const [copcStatus, setCopcStatus] = useState<'Compliant' | 'Pending' | 'Not Applicable'>('Compliant');
  const [copcCertificateNumber, setCopcCertificateNumber] = useState('');
  const [borRes, setBorRes] = useState('');
  const [cmoNo, setCmoNo] = useState('');
  const [remarks, setRemarks] = useState('');
  const [boardAction, setBoardAction] = useState('');
  const [history, setHistory] = useState<ProgramLevelHistoryEntry[]>([]);
  const [historyYear, setHistoryYear] = useState('');
  const [historyLevel, setHistoryLevel] = useState<AccreditationLevel>('Level 1');
  const [historyResult, setHistoryResult] = useState<AccreditationResult>('Passed');
  const [historyRemarks, setHistoryRemarks] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    if (program) {
      setCampusId(program.campusId);
      setProgramName(program.programName);
      setDegreeLevel(program.degreeLevel);
      setYearOfInitialOperation(program.yearOfInitialOperation || '');
      setStatus(program.status);
      setValidityStart(program.validityStart || '');
      setValidityEnd(program.validityEnd || '');
      setCertificationFile(program.certificationFile || '');
      setInstrumentLink(program.instrumentLink || '');
      setFindingsLink(program.findingsLink || '');
      setTechnicalReviewLink(program.technicalReviewLink || '');
      setScheduleForAccreditation(program.scheduleForAccreditation || '');
      setCopcStatus(program.copcStatus);
      setCopcCertificateNumber(program.copcCertificateNumber || '');
      setBorRes(program.borRes || '');
      setCmoNo(program.cmoNo || '');
      setRemarks(program.remarks || '');
      setBoardAction(program.boardAction || '');
      setHistory(getLevelHistory(program));
    } else {
      setCampusId(defaultCampusId);
      setProgramName('');
      setDegreeLevel('Undergraduate');
      setYearOfInitialOperation(new Date().getFullYear().toString());
      setStatus('Candidate');
      setValidityStart('');
      setValidityEnd('');
      setCertificationFile('');
      setInstrumentLink('');
      setFindingsLink('');
      setTechnicalReviewLink('');
      setScheduleForAccreditation('');
      setCopcStatus('Compliant');
      setCopcCertificateNumber('');
      setBorRes('');
      setCmoNo(getSettings().accreditation.copcCmoDefault);
      setRemarks('');
      setBoardAction('');
      setHistory([]);
    }
    setHistoryYear(String(new Date().getFullYear()));
    setHistoryLevel('Level 1');
    setHistoryResult('Passed');
    setHistoryRemarks('');
  }, [open, program, defaultCampusId]);

  const suggestedEnd = suggestValidityEnd(status, validityStart);
  const validityYears = getSettings().accreditation.levelValidityYears[status as ValidityLevel];

  const handleAddHistory = () => {
    const year = Number(historyYear);
    if (!Number.isInteger(year) || year < 1950 || year > 2100) {
      setError('Enter a valid 4-digit year for the accreditation result.');
      return;
    }
    setError('');
    const entry = createHistoryEntry(
      { year, level: historyLevel, result: historyResult, remarks: historyRemarks.trim() || undefined },
      currentUser.name
    );
    setHistory((prev) => [...prev, entry].sort((a, b) => a.year - b.year));
    setHistoryRemarks('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!programName.trim()) {
      setError('Please provide a valid program name.');
      return;
    }

    const campusObj = campuses.find((c) => c.id === campusId);
    const id = program?.id ?? `pa-${campusId}-${Date.now().toString(36)}`;
    const newProgram: ProgramAccreditation = {
      ...program,
      id,
      campusId,
      campusName: campusObj?.name ?? 'Main Campus',
      programName: programName.trim(),
      degreeLevel,
      yearOfInitialOperation: yearOfInitialOperation.trim(),
      status,
      validityStart: validityStart.trim(),
      validityEnd: validityEnd.trim(),
      certificationFile: certificationFile.trim() || undefined,
      instrumentLink: instrumentLink.trim() || undefined,
      findingsLink: findingsLink.trim() || undefined,
      technicalReviewLink: technicalReviewLink.trim() || undefined,
      scheduleForAccreditation: scheduleForAccreditation.trim() || undefined,
      copcStatus,
      copcCertificateNumber: copcCertificateNumber.trim() || undefined,
      borRes: borRes.trim() || undefined,
      cmoNo: cmoNo.trim() || undefined,
      remarks: remarks.trim() || undefined,
      boardAction: boardAction.trim() || undefined,
      levelHistory: program ? history : undefined,
      requirements:
        program?.requirements ??
        getSettings().accreditation.programAreas.map((area, idx) => ({
          id: `req-${id}-${idx + 1}`,
          areaCode: `AREA-${idx + 1}`,
          areaName: area,
          title: `Compliance Portfolio for ${area}`,
          isSubmitted: false,
          verified: false
        }))
    };

    saveProgramAccreditation(newProgram);
    toast.success(program ? 'Program accreditation updated' : 'Program accreditation added');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={program ? 'Edit Program Accreditation' : 'Add Program Accreditation'}
      description="Track AACCUP program accreditation status, validity schedule, instruments, and COPC compliance."
      size="xl"
      footer={
        <div className="flex w-full items-center justify-between">
          <span className="text-xs text-ink-subtle">
            {isAdmin ? 'Administrator full authorization active' : 'QA Personnel access'}
          </span>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="button" onClick={handleSubmit} className="btn btn-primary">
              {program ? 'Save Changes' : 'Create Program'}
            </button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md border border-danger-100 bg-danger-50 px-4 py-2 text-sm text-danger-700">
            {error}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Campus"
            value={campusId}
            onChange={(val) => setCampusId(val as CampusId)}
            options={campuses.map((c) => ({ value: c.id, label: c.name }))}
            required
          />

          <SelectField
            label="Degree Level"
            value={degreeLevel}
            onChange={(val) => setDegreeLevel(val as 'Undergraduate' | 'Graduate')}
            options={[
              { value: 'Undergraduate', label: 'Undergraduate Program' },
              { value: 'Graduate', label: 'Graduate Program' }
            ]}
            required
          />
        </div>

        <TextField
          label="Program Name"
          value={programName}
          onChange={(val) => setProgramName(val)}
          placeholder="e.g. Bachelor of Science in Civil Engineering"
          required
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <TextField
            label="Year of Initial Operation"
            value={yearOfInitialOperation}
            onChange={(val) => setYearOfInitialOperation(val)}
            placeholder="e.g. 1998, 2007-2008"
          />

          <SelectField
            label="Accreditation Status"
            value={status}
            onChange={(val) => setStatus(val as AccreditationLevel)}
            options={[
              ...STATUS_OPTIONS.map((s) => ({ value: s, label: statusLabel(s) })),
              ...(STATUS_OPTIONS.includes(status) ? [] : [{ value: status, label: `${statusLabel(status)} (current)` }])
            ]}
            required
          />

          <TextField
            label="Schedule for Accreditation"
            value={scheduleForAccreditation}
            onChange={(val) => setScheduleForAccreditation(val)}
            placeholder="e.g. 2025-09-30 or Sep-30-2025"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Validity Start Date"
            value={validityStart}
            onChange={(val) => setValidityStart(val)}
            placeholder="e.g. 2023-09-01 or Sep-01-2023"
          />

          <div>
            <TextField
              label="Validity End Date"
              value={validityEnd}
              onChange={(val) => setValidityEnd(val)}
              placeholder="e.g. 2026-08-31 or Aug-31-2026"
            />
            {suggestedEnd && suggestedEnd !== validityEnd && (
              <button
                type="button"
                className="mt-1 text-[11.5px] font-medium text-brand-700 hover:underline"
                onClick={() => setValidityEnd(suggestedEnd)}
              >
                Use {suggestedEnd} ({formatLevel(status)} is valid for {validityYears} years)
              </button>
            )}
          </div>
        </div>

        <TextField
          label="Board Action"
          value={boardAction}
          onChange={(val) => setBoardAction(val)}
          placeholder="e.g. Re-accredited Level II, valid for 4 years (AACCUP Board, March 2025)"
        />

        {program && (
          <div className="border-t border-line pt-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Official Documents & Supporting Links
            </h3>

            <div className="space-y-3">
              <TextField
                label="Certificate link (optional, legacy)"
                value={certificationFile}
                onChange={(val) => setCertificationFile(val)}
                placeholder="e.g. https://drive.google.com/…"
                hint="Upload certificate files from the AACCUP Certification column; each level has its own folder."
              />

              <div className="grid gap-3 sm:grid-cols-3">
                <TextField
                  label="AACCUP Instrument (Link)"
                  value={instrumentLink}
                  onChange={(val) => setInstrumentLink(val)}
                  placeholder="Google Drive link or URL"
                />

                <TextField
                  label="Summary of Findings & Recommendations"
                  value={findingsLink}
                  onChange={(val) => setFindingsLink(val)}
                  placeholder="Google Drive link or URL"
                />

                <TextField
                  label="AACCUP Technical Review"
                  value={technicalReviewLink}
                  onChange={(val) => setTechnicalReviewLink(val)}
                  placeholder="Google Drive link or URL"
                />
              </div>
            </div>
          </div>
        )}

        <div className="border-t border-line pt-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Compliance & Regulatory References
          </h3>

          <div className="grid gap-3 sm:grid-cols-3">
            <SelectField
              label="COPC Status"
              value={copcStatus}
              onChange={(val) => setCopcStatus(val as 'Compliant' | 'Pending' | 'Not Applicable')}
              options={[
                { value: 'Compliant', label: 'Compliant (With Certificate)' },
                { value: 'Pending', label: 'Pending Review / Under Evaluation' },
                { value: 'Not Applicable', label: 'Not Applicable' }
              ]}
            />

            <TextField
              label="COPC Certificate Number"
              value={copcCertificateNumber}
              onChange={(val) => setCopcCertificateNumber(val)}
              placeholder="e.g. COPC-2023-TAN-01"
            />

            <TextField
              label="BOR Resolution Number"
              value={borRes}
              onChange={(val) => setBorRes(val)}
              placeholder="e.g. Res. no. 027 s. 2013"
            />
          </div>

          <div className="mt-3">
            <TextField
              label="CHED Memorandum Order (CMO)"
              value={cmoNo}
              onChange={(val) => setCmoNo(val)}
              placeholder="e.g. CMO No. 25, Series of 2015"
            />
          </div>
        </div>

        {program && (
          <div className="border-t border-line pt-4">
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Accreditation Level History
            </h3>
            <p className="mb-3 text-[11px] text-ink-subtle">
              Record past survey results (e.g. 2025, 2026) so improvement tracking and year-based reports reflect actual history.
              Changing the Accreditation Status above also records a new entry automatically.
            </p>

            <div className="rounded-lg border border-line divide-y divide-line">
              {history.length === 0 ? (
                <p className="px-3 py-3 text-xs text-ink-muted">No accreditation results recorded yet.</p>
              ) : (
                [...history].reverse().map((entry) => (
                  <div key={entry.id} className="flex flex-wrap items-center gap-x-2 gap-y-1 px-3 py-2 text-xs">
                    <span className="font-mono font-semibold text-ink">{entry.year}</span>
                    <span className="font-semibold text-ink">{formatLevel(entry.level)}</span>
                    <Badge tone={entry.result === 'Passed' ? 'success' : entry.result === 'Failed' ? 'danger' : 'warning'}>
                      {entry.result}
                    </Badge>
                    {entry.remarks && <span className="text-ink-muted">· {entry.remarks}</span>}
                    {entry.recordedBy && <span className="text-ink-subtle">· {entry.recordedBy}</span>}
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => setHistory((prev) => prev.filter((e) => e.id !== entry.id))}
                        className="ml-auto btn btn-ghost btn-sm h-6 w-6 p-0 text-danger-600 hover:bg-danger-50"
                        title="Remove this history entry"
                      >
                        <Trash2Icon className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-[90px_1fr_1fr_2fr_auto] sm:items-end">
              <TextField label="Year" type="number" value={historyYear} onChange={setHistoryYear} />
              <SelectField
                label="Level"
                value={historyLevel}
                onChange={(val) => setHistoryLevel(val as AccreditationLevel)}
                options={HISTORY_LEVEL_OPTIONS.map((l) => ({ value: l, label: formatLevel(l) }))}
              />
              <SelectField
                label="Result"
                value={historyResult}
                onChange={(val) => setHistoryResult(val as AccreditationResult)}
                options={RESULT_OPTIONS}
              />
              <TextField label="Remarks" value={historyRemarks} onChange={setHistoryRemarks} placeholder="e.g. Formal survey visit" />
              <button type="button" onClick={handleAddHistory} className="btn btn-secondary h-10">
                <PlusIcon className="h-4 w-4" /> Add
              </button>
            </div>
          </div>
        )}

        <div>
          <label className="label">Special Remarks</label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="textarea h-20 text-[13px]"
            placeholder="e.g. The program has been offered for less than five (5) years and has not yet reached the required batch of graduates."
          />
        </div>
      </form>
    </Modal>
  );
}
