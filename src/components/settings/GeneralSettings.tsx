import React, { useState } from 'react';
import { toast } from 'sonner';
import { SaveBar, SettingRow, SettingsGroup } from './SettingsLayout';
import { academicYears } from '../../data/options';

export function GeneralSettings() {
  const [form, setForm] = useState({
    name: 'Accrevia',
    institution: 'North Eastern Mindanao State University – Main Campus',
    year: '2025–2026',
    pageSize: '20',
    timezone: 'Asia/Manila (UTC+8)'
  });

  return (
    <div className="space-y-4">
      <SettingsGroup title="General settings" description="Identity and defaults shown across the portal.">
        <SettingRow label="System name">
          <input aria-label="System name" className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </SettingRow>
        <SettingRow label="Institution">
          <input aria-label="Institution" className="input" value={form.institution} onChange={(e) => setForm((f) => ({ ...f, institution: e.target.value }))} />
        </SettingRow>
        <SettingRow label="Logo" description="Shown in the header, reports, and mobile navigation. Official university seal.">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 overflow-hidden rounded-full ring-2 ring-brand-200 shadow-sm flex items-center justify-center">
              <img
                src="/nemsu-logo.png"
                alt="NEMSU Seal"
                className="h-full w-full object-cover rounded-full select-none"
              />
            </div>
            <div>
              <p className="text-xs font-semibold text-ink">North Eastern Mindanao State University Seal</p>
              <div className="mt-1 flex items-center gap-2">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => toast.success('NEMSU seal is set as primary institutional logo')}>
                  Active Logo
                </button>
                <button type="button" className="btn btn-ghost btn-sm text-xs" onClick={() => toast('Choose a new logo image file')}>
                  Upload New
                </button>
              </div>
            </div>
          </div>
        </SettingRow>
        <SettingRow label="Default academic year" description="Pre-selected when classifying new evidence.">
          <select aria-label="Default academic year" className="input" value={form.year} onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}>
            {academicYears.map((y) => <option key={y}>{y}</option>)}
          </select>
        </SettingRow>
        <SettingRow label="Rows per page" description="Default page size for evidence and user tables.">
          <select aria-label="Rows per page" className="input" value={form.pageSize} onChange={(e) => setForm((f) => ({ ...f, pageSize: e.target.value }))}>
            {['10', '20', '50', '100'].map((n) => <option key={n}>{n}</option>)}
          </select>
        </SettingRow>
        <SettingRow label="Time zone">
          <input aria-label="Time zone" className="input" value={form.timezone} readOnly />
        </SettingRow>
      </SettingsGroup>
      <SaveBar />
    </div>);

}