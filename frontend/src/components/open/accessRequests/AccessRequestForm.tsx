import { FormEvent, useMemo, useState } from 'react';
import {
  accessRequestCampusOptions,
  collegeProgramOptionsForCampus
} from '../../../services/accessRequests/campusProgramOptions';

export type AccessRequestFormValues = {
  campusId: string;
  collegeProgram: string;
  purpose: string;
  remarks: string;
};

type AccessRequestFormProps = {
  initial?: Partial<AccessRequestFormValues>;
  submitting?: boolean;
  onSubmit: (values: AccessRequestFormValues & { campusName: string }) => void | Promise<void>;
  onCancel: () => void;
};

type FieldErrors = Partial<Record<'campusId' | 'collegeProgram' | 'purpose', string>>;

const fieldClass =
  'h-11 w-full rounded-xl border border-line bg-surface px-3 text-[14px] font-medium text-ink shadow-none hover:border-brand-300 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/15 disabled:cursor-not-allowed disabled:bg-canvas';

const textareaClass =
  'w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-[14px] font-medium text-ink shadow-none hover:border-brand-300 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/15 disabled:cursor-not-allowed disabled:bg-canvas';

export function AccessRequestForm({ initial, submitting, onSubmit, onCancel }: AccessRequestFormProps) {
  const [campusId, setCampusId] = useState(initial?.campusId ?? '');
  const [collegeProgram, setCollegeProgram] = useState(initial?.collegeProgram ?? '');
  const [purpose, setPurpose] = useState(initial?.purpose ?? '');
  const [remarks, setRemarks] = useState(initial?.remarks ?? '');
  const [errors, setErrors] = useState<FieldErrors>({});

  const programOptions = useMemo(() => collegeProgramOptionsForCampus(campusId), [campusId]);

  const validate = (): boolean => {
    const next: FieldErrors = {};
    if (!campusId) next.campusId = 'Campus is required.';
    if (!collegeProgram.trim()) next.collegeProgram = 'College / Academic Program is required.';
    if (!purpose.trim()) next.purpose = 'Purpose of access is required.';
    else if (purpose.trim().length < 12) next.purpose = 'Please provide a short purpose (at least 12 characters).';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const campusName = accessRequestCampusOptions.find((c) => c.id === campusId)?.label ?? campusId;
    await onSubmit({
      campusId,
      campusName,
      collegeProgram: collegeProgram.trim(),
      purpose: purpose.trim(),
      remarks: remarks.trim()
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <p className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[12px] font-medium text-amber-950">
        This form creates a <strong>DEMO ONLY</strong> access request for UI testing. It is not delivered to real QA
        personnel and never grants Google Drive permissions.
      </p>

      <div>
        <label htmlFor="tr-campus" className="mb-1.5 block text-[12px] font-semibold text-ink">
          Campus <span className="text-rose-600">*</span>
        </label>
        <select
          id="tr-campus"
          className={fieldClass}
          value={campusId}
          aria-invalid={Boolean(errors.campusId)}
          aria-describedby={errors.campusId ? 'tr-campus-error' : undefined}
          disabled={submitting}
          onChange={(e) => {
            setCampusId(e.target.value);
            setCollegeProgram('');
            setErrors((prev) => ({ ...prev, campusId: undefined }));
          }}
        >
          <option value="">Select campus</option>
          {accessRequestCampusOptions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        {errors.campusId ? (
          <p id="tr-campus-error" className="mt-1 text-[12px] font-medium text-rose-700" role="alert">
            {errors.campusId}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="tr-program" className="mb-1.5 block text-[12px] font-semibold text-ink">
          College / Academic Program <span className="text-rose-600">*</span>
        </label>
        <select
          id="tr-program"
          className={fieldClass}
          value={collegeProgram}
          aria-invalid={Boolean(errors.collegeProgram)}
          aria-describedby={errors.collegeProgram ? 'tr-program-error' : undefined}
          disabled={submitting || !campusId}
          onChange={(e) => {
            setCollegeProgram(e.target.value);
            setErrors((prev) => ({ ...prev, collegeProgram: undefined }));
          }}
        >
          <option value="">{campusId ? 'Select college / program' : 'Select a campus first'}</option>
          {programOptions.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        {errors.collegeProgram ? (
          <p id="tr-program-error" className="mt-1 text-[12px] font-medium text-rose-700" role="alert">
            {errors.collegeProgram}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="tr-purpose" className="mb-1.5 block text-[12px] font-semibold text-ink">
          Purpose of access <span className="text-rose-600">*</span>
        </label>
        <textarea
          id="tr-purpose"
          rows={3}
          className={textareaClass}
          value={purpose}
          placeholder="Briefly explain why access is needed for accreditation work…"
          aria-invalid={Boolean(errors.purpose)}
          aria-describedby={errors.purpose ? 'tr-purpose-error' : undefined}
          disabled={submitting}
          onChange={(e) => {
            setPurpose(e.target.value);
            setErrors((prev) => ({ ...prev, purpose: undefined }));
          }}
        />
        {errors.purpose ? (
          <p id="tr-purpose-error" className="mt-1 text-[12px] font-medium text-rose-700" role="alert">
            {errors.purpose}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="tr-remarks" className="mb-1.5 block text-[12px] font-semibold text-ink">
          Supporting remarks <span className="font-medium text-ink-subtle">(optional)</span>
        </label>
        <textarea
          id="tr-remarks"
          rows={2}
          className={textareaClass}
          value={remarks}
          placeholder="Optional notes for the demo request record…"
          disabled={submitting}
          onChange={(e) => setRemarks(e.target.value)}
        />
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:justify-end">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit demo request'}
        </button>
      </div>
    </form>
  );
}
