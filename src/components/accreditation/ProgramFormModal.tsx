import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { usePortal } from '../../contexts/PortalContext';
import { AccreditationLevel, CampusId, ProgramAccreditation } from '../../types/accreditation';
import { Modal } from '../ui/Modal';
import { TextField } from '../ui/TextField';
import { SelectField } from '../ui/SelectField';

interface ProgramFormModalProps {
  open: boolean;
  program: ProgramAccreditation | null;
  defaultCampusId?: CampusId;
  onClose: () => void;
}

export function ProgramFormModal({ open, program, defaultCampusId = 'tandag', onClose }: ProgramFormModalProps) {
  const { campuses, saveProgramAccreditation, isAdmin } = usePortal();

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
      setCmoNo('');
      setRemarks('');
    }
  }, [open, program, defaultCampusId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!programName.trim()) {
      setError('Please provide a valid program name.');
      return;
    }

    const campusObj = campuses.find((c) => c.id === campusId);
    const newProgram: ProgramAccreditation = {
      id: program?.id ?? `pa-${campusId}-${Date.now().toString(36)}`,
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
      requirements: program?.requirements
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
            onChange={(e) => setCampusId(e.target.value as CampusId)}
            options={campuses.map((c) => ({ value: c.id, label: c.name }))}
            required
          />

          <SelectField
            label="Degree Level"
            value={degreeLevel}
            onChange={(e) => setDegreeLevel(e.target.value as 'Undergraduate' | 'Graduate')}
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
          onChange={(e) => setProgramName(e.target.value)}
          placeholder="e.g. Bachelor of Science in Civil Engineering"
          required
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <TextField
            label="Year of Initial Operation"
            value={yearOfInitialOperation}
            onChange={(e) => setYearOfInitialOperation(e.target.value)}
            placeholder="e.g. 1998, 2007-2008"
          />

          <SelectField
            label="Accreditation Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as AccreditationLevel)}
            options={[
              { value: 'Candidate', label: 'Candidate' },
              { value: 'Level 1', label: 'Level 1' },
              { value: 'Level 2', label: 'Level 2' },
              { value: 'Level 3', label: 'Level 3' },
              { value: 'Level 4', label: 'Level 4' },
              { value: 'Not Accreditable', label: 'Not Accreditable (<5 yrs)' },
              { value: 'for accreditation', label: 'For Accreditation' },
              { value: 'waiting', label: 'Waiting for Survey' }
            ]}
            required
          />

          <TextField
            label="Schedule for Accreditation"
            value={scheduleForAccreditation}
            onChange={(e) => setScheduleForAccreditation(e.target.value)}
            placeholder="e.g. 2025-09-30 or Sep-30-2025"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Validity Start Date"
            value={validityStart}
            onChange={(e) => setValidityStart(e.target.value)}
            placeholder="e.g. 2023-09-01 or Sep-01-2023"
          />

          <TextField
            label="Validity End Date"
            value={validityEnd}
            onChange={(e) => setValidityEnd(e.target.value)}
            placeholder="e.g. 2026-08-31 or Aug-31-2026"
          />
        </div>

        <div className="border-t border-line pt-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Official Documents & Supporting Links
          </h3>

          <div className="space-y-3">
            <TextField
              label="Accreditation Certificate File"
              value={certificationFile}
              onChange={(e) => setCertificationFile(e.target.value)}
              placeholder="e.g. AACCUP Certification 2022.pdf"
            />

            <div className="grid gap-3 sm:grid-cols-3">
              <TextField
                label="AACCUP Instrument (Link)"
                value={instrumentLink}
                onChange={(e) => setInstrumentLink(e.target.value)}
                placeholder="Google Drive link or URL"
              />

              <TextField
                label="Summary of Findings & Recommendations"
                value={findingsLink}
                onChange={(e) => setFindingsLink(e.target.value)}
                placeholder="Google Drive link or URL"
              />

              <TextField
                label="AACCUP Technical Review"
                value={technicalReviewLink}
                onChange={(e) => setTechnicalReviewLink(e.target.value)}
                placeholder="Google Drive link or URL"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-line pt-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Compliance & Regulatory References
          </h3>

          <div className="grid gap-3 sm:grid-cols-3">
            <SelectField
              label="COPC Status"
              value={copcStatus}
              onChange={(e) => setCopcStatus(e.target.value as 'Compliant' | 'Pending' | 'Not Applicable')}
              options={[
                { value: 'Compliant', label: 'Compliant (With Certificate)' },
                { value: 'Pending', label: 'Pending Review / Under Evaluation' },
                { value: 'Not Applicable', label: 'Not Applicable' }
              ]}
            />

            <TextField
              label="COPC Certificate Number"
              value={copcCertificateNumber}
              onChange={(e) => setCopcCertificateNumber(e.target.value)}
              placeholder="e.g. COPC-2023-TAN-01"
            />

            <TextField
              label="BOR Resolution Number"
              value={borRes}
              onChange={(e) => setBorRes(e.target.value)}
              placeholder="e.g. Res. no. 027 s. 2013"
            />
          </div>

          <div className="mt-3">
            <TextField
              label="CHED Memorandum Order (CMO)"
              value={cmoNo}
              onChange={(e) => setCmoNo(e.target.value)}
              placeholder="e.g. CMO No. 25, Series of 2015"
            />
          </div>
        </div>

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
