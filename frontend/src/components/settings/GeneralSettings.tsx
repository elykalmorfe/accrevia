import React, { useRef } from 'react';
import { toast } from 'sonner';
import { SaveBar, SettingRow, SettingsGroup } from './SettingsLayout';
import { DEFAULT_LOGO_SRC, usePortalSettings, useSettingsDraft } from '../../settings/portalSettings';

const MAX_LOGO_BYTES = 512 * 1024;

export function GeneralSettings() {
  const { value: form, set, dirty, save, discard, reset } = useSettingsDraft('general');
  const { accreditation } = usePortalSettings();
  const logoInput = useRef<HTMLInputElement>(null);

  const handleLogo = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Choose an image file (PNG, JPG, or SVG).');
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      toast.error('Logo must be 512 KB or smaller.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => set({ logoDataUrl: String(reader.result) });
    reader.readAsDataURL(file);
  };

  const years = accreditation.academicYears.includes(form.defaultAcademicYear) ?
  accreditation.academicYears :
  [form.defaultAcademicYear, ...accreditation.academicYears];

  return (
    <div className="space-y-4">
      <SettingsGroup title="General settings" description="Identity and defaults shown across the portal.">
        <SettingRow label="System name" description="Shown in the header and the browser tab.">
          <input aria-label="System name" className="input" value={form.systemName} onChange={(e) => set({ systemName: e.target.value })} />
        </SettingRow>
        <SettingRow label="Institution">
          <input aria-label="Institution" className="input" value={form.institution} onChange={(e) => set({ institution: e.target.value })} />
        </SettingRow>
        <SettingRow label="Logo" description="Shown in the header and on printed reports. PNG, JPG, or SVG up to 512 KB.">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full ring-2 ring-brand-200 shadow-sm">
              <img src={form.logoDataUrl || DEFAULT_LOGO_SRC} alt="Current logo" className="h-full w-full select-none object-cover" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => logoInput.current?.click()}>
                Upload new
              </button>
              {form.logoDataUrl &&
              <button type="button" className="btn btn-ghost btn-sm text-xs" onClick={() => set({ logoDataUrl: '' })}>
                  Use NEMSU seal
                </button>
              }
              <input
                ref={logoInput}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  handleLogo(e.target.files?.[0]);
                  e.target.value = '';
                }} />
            </div>
          </div>
        </SettingRow>
        <SettingRow label="Default academic year" description="Pre-selected when classifying and uploading new evidence. Manage the list under Accreditation Setup.">
          <select aria-label="Default academic year" className="input select" value={form.defaultAcademicYear} onChange={(e) => set({ defaultAcademicYear: e.target.value })}>
            {years.map((y) => <option key={y}>{y}</option>)}
          </select>
        </SettingRow>
        <SettingRow label="Rows per page" description="Page size for the evidence tables.">
          <select aria-label="Rows per page" className="input select" value={form.pageSize} onChange={(e) => set({ pageSize: Number(e.target.value) })}>
            {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </SettingRow>
        <SettingRow label="Time zone">
          <input aria-label="Time zone" className="input" value={form.timezone} readOnly />
        </SettingRow>
      </SettingsGroup>
      <SaveBar dirty={dirty} onSave={save} onDiscard={discard} onReset={reset} label="General settings saved" />
    </div>);

}
