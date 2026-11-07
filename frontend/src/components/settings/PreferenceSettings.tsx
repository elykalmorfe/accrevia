import React from 'react';
import { format } from 'date-fns';
import { SaveBar, SettingRow, SettingsGroup } from './SettingsLayout';
import { usePortal } from '../../contexts/PortalContext';
import { DateFormatOption, PortalSettings, useSettingsDraft } from '../../settings/portalSettings';

type Preferences = PortalSettings['preferences'];

const DATE_FORMATS: DateFormatOption[] = ['MMM d, yyyy', 'MM/dd/yyyy', 'dd/MM/yyyy', 'yyyy-MM-dd'];

export function PreferenceSettings() {
  const { campuses } = usePortal();
  const { value, set, dirty, save, discard, reset } = useSettingsDraft('preferences');
  const today = new Date();

  return (
    <div className="space-y-4">
      <SettingsGroup title="Display preferences" description="Saved in this browser.">
        <SettingRow label="Campus on startup" description="Which campus filter is selected when the portal opens.">
          <select aria-label="Campus on startup" className="input" value={value.startupCampus} onChange={(e) => set({ startupCampus: e.target.value as Preferences['startupCampus'] })}>
            <option value="remember">Remember my last selection</option>
            <option value="all">All campuses</option>
            {campuses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </SettingRow>
        <SettingRow label="Sidebar on startup" description="On large screens, the menu button next to the logo hides or shows the sidebar.">
          <select aria-label="Sidebar on startup" className="input" value={value.startupSidebar} onChange={(e) => set({ startupSidebar: e.target.value as Preferences['startupSidebar'] })}>
            <option value="remember">Remember last state</option>
            <option value="expanded">Always shown</option>
            <option value="collapsed">Always hidden</option>
          </select>
        </SettingRow>
        <SettingRow label="Date format">
          <select aria-label="Date format" className="input" value={value.dateFormat} onChange={(e) => set({ dateFormat: e.target.value as DateFormatOption })}>
            {DATE_FORMATS.map((f) => <option key={f} value={f}>{format(today, f)}</option>)}
          </select>
        </SettingRow>
        <SettingRow label="Table density" description="Compact fits more rows on screen.">
          <div className="inline-flex rounded-md border border-line bg-white p-0.5">
            {(['comfortable', 'compact'] as const).map((d) =>
            <button
              key={d}
              type="button"
              aria-pressed={value.density === d}
              onClick={() => set({ density: d })}
              className={`rounded px-3 py-1.5 text-xs font-medium capitalize transition-colors ${value.density === d ? 'bg-brand-600 text-white' : 'text-ink-muted hover:text-ink'}`}>
                {d}
              </button>
            )}
          </div>
        </SettingRow>
      </SettingsGroup>
      <SaveBar dirty={dirty} onSave={save} onDiscard={discard} onReset={reset} label="Preferences saved" />
    </div>);

}
