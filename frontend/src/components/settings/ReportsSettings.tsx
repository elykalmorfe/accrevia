import React, { useState } from 'react';
import { SaveBar, SettingRow, SettingsGroup } from './SettingsLayout';
import { DEFAULT_SIGNATORIES, loadSignatories, ReportSignatories, saveSignatories, Signatory } from '../../data/reportTemplates';
import { logoSrc, usePortalSettings, useSettingsDraft } from '../../settings/portalSettings';

const SIGNATORY_ROWS: { key: keyof ReportSignatories; label: string; description: string }[] = [
{ key: 'preparedBy', label: 'Prepared by', description: 'Usually the accreditation staff who compiled the report.' },
{ key: 'checkedBy', label: 'Checked by', description: 'Usually the Director of Quality Assurance.' },
{ key: 'approvedBy', label: 'Approved by', description: 'Optional. Leave the name blank to omit this signature.' }];


function SignatoryInput({ value, onChange, label }: {value: Signatory;onChange: (v: Signatory) => void;label: string;}) {
  return (
    <div className="grid gap-2">
      <input aria-label={`${label} name`} className="input" placeholder="Full name" value={value.name} onChange={(e) => onChange({ ...value, name: e.target.value })} />
      <input aria-label={`${label} designation`} className="input" placeholder="Designation" value={value.designation} onChange={(e) => onChange({ ...value, designation: e.target.value })} />
    </div>);

}

export function ReportsSettings() {
  const letterhead = useSettingsDraft('reports');
  const settings = usePortalSettings();
  const [savedSignatories, setSavedSignatories] = useState<ReportSignatories>(loadSignatories);
  const [signatories, setSignatories] = useState<ReportSignatories>(savedSignatories);
  const signatoriesDirty = JSON.stringify(signatories) !== JSON.stringify(savedSignatories);
  const lh = letterhead.value;

  return (
    <div className="space-y-4">
      <SettingsGroup title="Letterhead" description="Printed at the top of every accreditation report. The logo is set under General Settings.">
        <SettingRow label="Country line">
          <input aria-label="Country line" className="input" value={lh.republic} onChange={(e) => letterhead.set({ republic: e.target.value })} />
        </SettingRow>
        <SettingRow label="Institution name">
          <input aria-label="Institution name" className="input" value={lh.university} onChange={(e) => letterhead.set({ university: e.target.value })} />
        </SettingRow>
        <SettingRow label="Office">
          <input aria-label="Office" className="input" value={lh.office} onChange={(e) => letterhead.set({ office: e.target.value })} />
        </SettingRow>
        <SettingRow label="Address">
          <input aria-label="Address" className="input" value={lh.address} onChange={(e) => letterhead.set({ address: e.target.value })} />
        </SettingRow>
        <div className="border-t border-line py-4">
          <p className="mb-2 text-xs font-medium text-ink-muted">Preview</p>
          <div className="flex items-center gap-4 rounded-lg border border-line bg-white px-5 py-4">
            <img src={logoSrc(settings)} alt="" className="h-14 w-14 shrink-0 rounded-full object-cover" />
            <div className="min-w-0 flex-1 text-center leading-tight">
              <p className="text-[11px] text-ink-muted">{lh.republic}</p>
              <p className="text-sm font-bold uppercase tracking-wide text-ink">{lh.university}</p>
              <p className="text-[11px] font-semibold text-brand-700">{lh.office}</p>
              <p className="text-[11px] text-ink-muted">{lh.address}</p>
            </div>
            <div className="w-14 shrink-0" />
          </div>
        </div>
      </SettingsGroup>

      <SettingsGroup title="Signatories" description="Default names on printed reports. You can still change them in the print dialog for a single report.">
        {SIGNATORY_ROWS.map((row) =>
        <SettingRow key={row.key} label={row.label} description={row.description}>
            <SignatoryInput label={row.label} value={signatories[row.key]} onChange={(v) => setSignatories((s) => ({ ...s, [row.key]: v }))} />
          </SettingRow>
        )}
      </SettingsGroup>

      <SaveBar
        dirty={letterhead.dirty || signatoriesDirty}
        onSave={() => {
          letterhead.save();
          saveSignatories(signatories);
          setSavedSignatories(signatories);
        }}
        onDiscard={() => {
          letterhead.discard();
          setSignatories(savedSignatories);
        }}
        onReset={() => {
          letterhead.reset();
          setSignatories(DEFAULT_SIGNATORIES);
        }}
        label="Report settings saved" />
    </div>);

}
