import { ReactNode, useId } from 'react';
import { MinusIcon, PlusIcon } from 'lucide-react';
import { ReportSignatories, Signatory } from '../../../data/reportTemplates';
import { MAX_PRINT_COPIES, REPORT_CSS, clampCopies } from '../../../utils/print';

export function CopiesField({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const id = useId();
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="text-xs font-medium text-ink-muted whitespace-nowrap">
        Copies
      </label>
      <div className="flex items-center rounded-lg border border-line bg-white">
        <button
          type="button"
          onClick={() => onChange(clampCopies(value - 1))}
          disabled={value <= 1}
          className="grid h-8 w-8 place-items-center text-ink-muted hover:text-ink disabled:opacity-40"
          aria-label="Decrease copies"
        >
          <MinusIcon className="h-3.5 w-3.5" />
        </button>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={1}
          max={MAX_PRINT_COPIES}
          value={value}
          onChange={(e) => onChange(clampCopies(Number(e.target.value)))}
          className="h-8 w-12 border-x border-line text-center text-sm font-semibold text-ink focus:outline-none"
        />
        <button
          type="button"
          onClick={() => onChange(clampCopies(value + 1))}
          disabled={value >= MAX_PRINT_COPIES}
          className="grid h-8 w-8 place-items-center text-ink-muted hover:text-ink disabled:opacity-40"
          aria-label="Increase copies"
        >
          <PlusIcon className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function SignatoryInputs({ label, value, onChange }: { label: string; value: Signatory; onChange: (value: Signatory) => void }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-ink">{label}</p>
      <input
        value={value.name}
        onChange={(e) => onChange({ ...value, name: e.target.value })}
        placeholder="Full name"
        className="input h-8 text-xs"
      />
      <input
        value={value.designation}
        onChange={(e) => onChange({ ...value, designation: e.target.value })}
        placeholder="Designation"
        className="input h-8 text-xs"
      />
    </div>
  );
}

export function SignatoryFields({ value, onChange }: { value: ReportSignatories; onChange: (value: ReportSignatories) => void }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <SignatoryInputs label="Prepared by" value={value.preparedBy} onChange={(preparedBy) => onChange({ ...value, preparedBy })} />
      <SignatoryInputs label="Checked by" value={value.checkedBy} onChange={(checkedBy) => onChange({ ...value, checkedBy })} />
      <SignatoryInputs label="Approved by (optional)" value={value.approvedBy} onChange={(approvedBy) => onChange({ ...value, approvedBy })} />
    </div>
  );
}

export function ReportPreview({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-auto rounded-xl border border-line bg-slate-100 p-2 sm:p-4">
      <style>{REPORT_CSS}</style>
      <div className="light-island mx-auto min-w-[640px] max-w-[820px] bg-white p-5 text-ink shadow-sm sm:p-7">{children}</div>
    </div>
  );
}