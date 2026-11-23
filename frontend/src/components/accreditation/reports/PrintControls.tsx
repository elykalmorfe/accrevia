import { ReactNode, useId } from 'react';
import { MinusIcon, PlusIcon } from 'lucide-react';
import { getReportInstitution, ReportSignatories, Signatory } from '../../../data/reportTemplates';
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
    <>
      <input
        aria-label={`${label} full name`}
        value={value.name}
        onChange={(e) => onChange({ ...value, name: e.target.value })}
        placeholder="Full name"
        className="input h-8 text-xs"
      />
      <input
        aria-label={`${label} designation`}
        value={value.designation}
        onChange={(e) => onChange({ ...value, designation: e.target.value })}
        placeholder="Designation"
        className="input h-8 text-xs"
      />
    </>
  );
}

export function SignatoryFields({ value, onChange }: { value: ReportSignatories; onChange: (value: ReportSignatories) => void }) {
  const { additionalSignatories } = value;
  const standardSignatories = [
    { key: 'preparedBy', label: 'Prepared by' },
    { key: 'checkedBy', label: 'Checked by' },
    { key: 'approvedBy', label: 'Approved by (optional)' }
  ] as const;

  const addSignatory = () => {
    const id = crypto.randomUUID?.() ?? `signatory-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    onChange({ ...value, additionalSignatories: [...additionalSignatories, { id, role: '', name: '', designation: '' }] });
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        {standardSignatories.map(({ key, label }) => (
          <div key={key} className="space-y-1.5">
            <p className="text-xs font-semibold text-ink">{label}</p>
            <SignatoryInputs label={label} value={value[key]} onChange={(person) => onChange({ ...value, [key]: person })} />
          </div>
        ))}
      </div>
      {additionalSignatories.map((signatory, index) => {
        const label = `Optional signatory ${index + 1}`;
        const updateSignatory = (fields: Partial<typeof signatory>) => onChange({
          ...value,
          additionalSignatories: additionalSignatories.map((person) => person.id === signatory.id ? { ...person, ...fields } : person)
        });
        return (
          <div key={signatory.id} className="space-y-1.5 border-t border-line pt-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-ink">{label}</p>
              <button
                type="button"
                className="btn btn-ghost btn-sm text-xs"
                aria-label={`Remove ${label.toLowerCase()}`}
                onClick={() => onChange({ ...value, additionalSignatories: additionalSignatories.filter((person) => person.id !== signatory.id) })}
              >
                Remove
              </button>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <input
                aria-label={`${label} role`}
                value={signatory.role}
                onChange={(e) => updateSignatory({ role: e.target.value })}
                placeholder="Role (e.g. Reviewed by)"
                className="input h-8 text-xs"
              />
              <SignatoryInputs label={label} value={signatory} onChange={updateSignatory} />
            </div>
          </div>
        );
      })}
      <button type="button" className="btn btn-secondary btn-sm text-xs" onClick={addSignatory}>
        <PlusIcon className="h-3.5 w-3.5" aria-hidden="true" />
        Add optional signatory
      </button>
    </div>
  );
}

export function SignatoryBlock({ signatories, printedAt }: { signatories: ReportSignatories; printedAt?: Date | null }) {
  const blocks = [
    { id: 'preparedBy', label: 'Prepared by', person: signatories.preparedBy },
    { id: 'checkedBy', label: 'Checked by', person: signatories.checkedBy },
    ...(signatories.approvedBy.name?.trim() ? [{ id: 'approvedBy', label: 'Approved by', person: signatories.approvedBy }] : []),
    ...signatories.additionalSignatories.filter((person) => person.name.trim()).map((person) => ({
      id: person.id,
      label: person.role.trim().replace(/:$/, '') || 'Signatory',
      person
    }))
  ];
  const dateText = printedAt ? printedAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
  return (
    <div className={blocks.length > 2 ? 'pr-signatories pr-signatories-three' : 'pr-signatories'}>
      {blocks.map(({ id, label, person }) => (
        <div key={id}>
          <div className="pr-sign-label">{label}:</div>
          <div className="pr-sign-line">
            <div className="pr-sign-name">{person.name || '\u00a0'}</div>
            <div className="pr-sign-role">{person.designation || 'Name and Designation'}</div>
          </div>
          <div className="pr-sign-date">Date: {dateText}</div>
        </div>
      ))}
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

export function ReportHeader({ title, subtitle, centerLogo = false }: { title: string; subtitle?: string; centerLogo?: boolean }) {
  const institution = getReportInstitution();
  return (
    <>
      <div className={centerLogo ? 'pr-header pr-header-centered' : 'pr-header'}>
        <img className="pr-logo" src={institution.logoPath} alt="" />
        <div className="pr-header-text">
          <div className="pr-republic">{institution.republic}</div>
          <div className="pr-univ">{institution.university}</div>
          <div className="pr-office">{institution.office}</div>
          <div className="pr-address">{institution.address}</div>
        </div>
        {!centerLogo && <div className="pr-header-spacer" />}
      </div>
      <h1 className="pr-title">{title}</h1>
      {subtitle && <p className="pr-subtitle">{subtitle}</p>}
    </>
  );
}

export function ReportMeta({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <div className="pr-meta">
      {items.map((item) => (
        <span key={item.label}>
          {item.label}: <b>{item.value}</b>
        </span>
      ))}
    </div>
  );
}
