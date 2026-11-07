import React from 'react';
import { SaveBar, SettingRow, SettingsGroup } from './SettingsLayout';
import { Switch } from '../ui/Switch';
import { useSettingsDraft } from '../../settings/portalSettings';

export function ReminderSettings() {
  const { value, set, dirty, save, discard, reset } = useSettingsDraft('reminders');

  return (
    <div className="space-y-4">
      <SettingsGroup title="Deadlines and reminders" description="Reminders appear in the bell menu at the top of the page.">
        <SettingRow label="Show reminders in notifications">
          <Switch checked={value.enabled} onChange={(v) => set({ enabled: v })} label="Show reminders" />
        </SettingRow>
        <SettingRow label="Folder deadline reminder" description="Warn this many days before an evidence folder's deadline, and once it has passed.">
          <div className="flex items-center gap-2">
            <input
              aria-label="Days before folder deadline"
              type="number"
              min={1}
              max={90}
              disabled={!value.enabled}
              className="input w-24"
              value={value.folderDeadlineDays}
              onChange={(e) => set({ folderDeadlineDays: Math.max(1, Number(e.target.value) || 1) })} />
            <span className="text-xs text-ink-muted">days before</span>
          </div>
        </SettingRow>
        <SettingRow label="Accreditation expiry warning" description="Programs and campus accreditations ending within this window are marked Expiring Soon and listed in reminders.">
          <div className="flex items-center gap-2">
            <input
              aria-label="Months before accreditation expiry"
              type="number"
              min={1}
              max={36}
              className="input w-24"
              value={value.expiryWarningMonths}
              onChange={(e) => set({ expiryWarningMonths: Math.max(1, Number(e.target.value) || 1) })} />
            <span className="text-xs text-ink-muted">months before</span>
          </div>
        </SettingRow>
      </SettingsGroup>
      <SaveBar dirty={dirty} onSave={save} onDiscard={discard} onReset={reset} label="Reminder settings saved" />
    </div>);

}
