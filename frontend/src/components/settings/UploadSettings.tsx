import React from 'react';
import { SaveBar, SettingRow, SettingsGroup } from './SettingsLayout';
import { UPLOAD_FILE_TYPES, UploadReviewStatus, useSettingsDraft } from '../../settings/portalSettings';
import { applyNamingPattern } from '../../utils/uploadRules';
import { extensionsFor } from '../../utils/fileTypes';

const NAMING_TOKENS = [
{ token: '{name}', hint: 'original file name' },
{ token: '{campus}', hint: 'campus' },
{ token: '{area}', hint: 'area, e.g. Area I' },
{ token: '{year}', hint: 'default academic year' },
{ token: '{date}', hint: 'upload date' }];


export function UploadSettings() {
  const { value, set, dirty, save, discard, reset } = useSettingsDraft('uploads');
  const example = applyNamingPattern('Strategic Plan 2025.pdf', { campus: 'Tandag', area: 'Area I' }, value.namingPattern);

  return (
    <div className="space-y-4">
      <SettingsGroup title="Allowed files" description="Checked when files are chosen in any upload dialog. Files that don't match are skipped with a message.">
        <SettingRow label="Allowed file types">
          <div className="flex flex-wrap gap-2">
            {UPLOAD_FILE_TYPES.map((type) => {
              const checked = value.allowedTypes.includes(type);
              return (
                <label
                  key={type}
                  title={extensionsFor([type]).map((e) => `.${e}`).join(', ')}
                  className={`flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-semibold transition-colors ${checked ? 'border-brand-300 bg-brand-50 text-brand-800' : 'border-line bg-white text-ink-muted hover:bg-slate-50'}`}>
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 accent-brand-600"
                    checked={checked}
                    onChange={() => set({ allowedTypes: checked ? value.allowedTypes.filter((t) => t !== type) : [...value.allowedTypes, type] })} />
                  {type}
                </label>);

            })}
          </div>
          {value.allowedTypes.length === 0 && <p className="mt-2 text-xs text-danger-600">All uploads will be blocked. Select at least one type.</p>}
        </SettingRow>
        <SettingRow label="Maximum file size" description="Per file. Large scans fill up browser storage quickly.">
          <div className="flex items-center gap-2">
            <input
              aria-label="Maximum file size in megabytes"
              type="number"
              min={1}
              max={500}
              className="input w-28"
              value={value.maxFileSizeMb}
              onChange={(e) => set({ maxFileSizeMb: Math.max(1, Number(e.target.value) || 1) })} />
            <span className="text-xs text-ink-muted">MB</span>
          </div>
        </SettingRow>
      </SettingsGroup>

      <SettingsGroup title="Naming and review">
        <SettingRow label="Document naming pattern" description="Used as the document title for files uploaded to accreditation areas.">
          <input aria-label="Document naming pattern" className="input font-mono text-xs" value={value.namingPattern} onChange={(e) => set({ namingPattern: e.target.value })} />
          <p className="mt-1.5 text-xs text-ink-muted">
            Example: <span className="font-medium text-ink">{example}</span>
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {NAMING_TOKENS.map((t) =>
            <button
              key={t.token}
              type="button"
              title={`Insert ${t.hint}`}
              className="rounded border border-line bg-white px-1.5 py-0.5 font-mono text-[11px] text-ink-muted hover:border-brand-300 hover:text-brand-700"
              onClick={() => set({ namingPattern: `${value.namingPattern}${value.namingPattern ? '_' : ''}${t.token}` })}>
                {t.token}
              </button>
            )}
          </div>
        </SettingRow>
        <SettingRow label="Status of new uploads" description="Pending Review sends files to reviewers first. Approved skips review.">
          <select aria-label="Status of new uploads" className="input select" value={value.newUploadStatus} onChange={(e) => set({ newUploadStatus: e.target.value as UploadReviewStatus })}>
            <option value="Pending Review">Pending Review</option>
            <option value="Approved">Approved automatically</option>
          </select>
        </SettingRow>
      </SettingsGroup>
      <SaveBar dirty={dirty} onSave={save} onDiscard={discard} onReset={reset} label="Upload rules saved" />
    </div>);

}
