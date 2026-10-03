import React, { ReactNode } from 'react';
import { usePortal } from '../../contexts/PortalContext';
import { Confidentiality, DocumentMetadata, DocumentType } from '../../types/evidence';
import { SelectField } from '../ui/SelectField';
import { TextField } from '../ui/TextField';
import {
  academicYears,
  accreditationCycles,
  campuses,
  colleges,
  confidentialityLevels,
  departments,
  documentTypes,
  offices,
  programs } from
'../../data/options';

interface MetadataFormProps {
  value: DocumentMetadata;
  onChange: (patch: Partial<DocumentMetadata>) => void;
}

function Section({ title, description, children }: {title: string;description?: string;children: ReactNode;}) {
  return (
    <fieldset className="border-t border-line pt-5 first:border-t-0 first:pt-0">
      <legend className="sr-only">{title}</legend>
      <p className="text-sm font-semibold text-ink" aria-hidden="true">
        {title}
      </p>
      {description && <p className="mt-0.5 text-[13px] text-ink-muted">{description}</p>}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>);

}

export function MetadataForm({ value, onChange }: MetadataFormProps) {
  const { frameworks, areas, criteria, indicators } = usePortal();

  const criterionOptions = criteria.
  filter((c) => (!value.frameworkId || c.frameworkId === value.frameworkId) && (!value.areaId || c.areaId === value.areaId)).
  map((c) => ({ value: c.id, label: `${c.code} – ${c.name}` }));
  const indicatorOptions = indicators.
  filter((i) => i.criterionId === value.criterionId).
  map((i) => ({ value: i.id, label: `${i.code} – ${i.name}` }));

  const current = criteria.find((c) => c.id === value.criterionId);

  const setFramework = (frameworkId: string) =>
  onChange({ frameworkId, ...(current && current.frameworkId !== frameworkId ? { criterionId: '', indicatorId: '' } : {}) });
  const setArea = (areaId: string) =>
  onChange({ areaId, ...(current && current.areaId !== areaId ? { criterionId: '', indicatorId: '' } : {}) });
  const setCriterion = (criterionId: string) => {
    const c = criteria.find((x) => x.id === criterionId);
    onChange({ criterionId, indicatorId: '', ...(c ? { frameworkId: c.frameworkId, areaId: c.areaId } : {}) });
  };

  return (
    <div className="space-y-6">
      <Section title="Accreditation classification" description="Connects this evidence to the requirement it supports.">
        <SelectField
          label="Framework"
          value={value.frameworkId}
          onChange={setFramework}
          placeholder="Select framework"
          options={frameworks.filter((f) => f.active).map((f) => ({ value: f.id, label: f.name }))} />
        
        <SelectField
          label="Accreditation area"
          value={value.areaId}
          onChange={setArea}
          placeholder="Select area"
          options={areas.map((a) => ({ value: a.id, label: a.name }))} />
        
        <SelectField
          label="Criterion"
          value={value.criterionId}
          onChange={setCriterion}
          placeholder={criterionOptions.length ? 'Select criterion' : 'No criteria for this selection'}
          options={criterionOptions} />
        
        <SelectField
          label="Indicator"
          value={value.indicatorId}
          onChange={(indicatorId) => onChange({ indicatorId })}
          placeholder={value.criterionId ? 'Select indicator' : 'Select a criterion first'}
          options={indicatorOptions}
          disabled={!value.criterionId} />
        
        <SelectField
          label="Document type"
          value={value.docType}
          onChange={(docType) => onChange({ docType: docType as DocumentType })}
          placeholder="Select document type"
          options={documentTypes} />
        
        <SelectField
          label="Confidentiality level"
          value={value.confidentiality}
          onChange={(c) => onChange({ confidentiality: c as Confidentiality })}
          options={confidentialityLevels} />
        
      </Section>

      <Section title="Document details">
        <TextField label="Document title" value={value.title} onChange={(title) => onChange({ title })} required className="sm:col-span-2" />
        <TextField
          label="Description"
          value={value.description}
          onChange={(description) => onChange({ description })}
          multiline
          className="sm:col-span-2" />
        
        <TextField
          label="Keywords"
          value={value.keywords}
          onChange={(keywords) => onChange({ keywords })}
          placeholder="e.g. faculty development, training"
          hint="Separate keywords with commas."
          className="sm:col-span-2" />
        
        <TextField label="Document date" type="date" value={value.documentDate} onChange={(documentDate) => onChange({ documentDate })} />
        <TextField
          label="Valid until"
          type="date"
          value={value.validUntil}
          onChange={(validUntil) => onChange({ validUntil })}
          hint="Leave blank if the document does not expire." />
        
      </Section>

      <Section title="Institutional context">
        <SelectField label="Campus" value={value.campus} onChange={(campus) => onChange({ campus })} options={campuses} />
        <SelectField label="College" value={value.college} onChange={(college) => onChange({ college })} options={colleges} />
        <SelectField label="Department" value={value.department} onChange={(department) => onChange({ department })} options={departments} />
        <SelectField label="Academic program" value={value.program} onChange={(program) => onChange({ program })} options={programs} />
        <SelectField label="Office / Unit" value={value.office} onChange={(office) => onChange({ office })} placeholder="Select office" options={offices} />
        <SelectField label="Academic year" value={value.academicYear} onChange={(academicYear) => onChange({ academicYear })} options={academicYears} />
        <SelectField
          label="Accreditation cycle"
          value={value.cycle}
          onChange={(cycle) => onChange({ cycle })}
          placeholder="Select cycle"
          options={accreditationCycles}
          className="sm:col-span-2" />
        
      </Section>
    </div>);

}