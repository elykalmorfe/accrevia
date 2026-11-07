import React from 'react';
import { SaveBar, SettingRow, SettingsGroup } from './SettingsLayout';
import { Switch } from '../ui/Switch';
import { userRoles } from '../../data/options';
import { useSettingsDraft } from '../../settings/portalSettings';

export function WorkflowSettings() {
  const { value, set, dirty, save, discard, reset } = useSettingsDraft('workflow');

  return (
    <div className="space-y-4">
      <SettingsGroup title="Review and approval" description="How evidence files are approved or returned for revision in the Institutional Accreditation areas.">
        <SettingRow label="Who can approve or return files" description="Users with these roles see the Approve and Revise buttons.">
          <div className="flex flex-wrap gap-2">
            {userRoles.map((role) => {
              const checked = value.approverRoles.includes(role);
              return (
                <label
                  key={role}
                  className={`flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${checked ? 'border-brand-300 bg-brand-50 text-brand-800' : 'border-line bg-white text-ink-muted hover:bg-slate-50'}`}>
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 accent-brand-600"
                    checked={checked}
                    onChange={() => set({ approverRoles: checked ? value.approverRoles.filter((r) => r !== role) : [...value.approverRoles, role] })} />
                  {role}
                </label>);

            })}
          </div>
          {value.approverRoles.length === 0 &&
          <p className="mt-2 text-xs text-danger-600">Nobody will be able to approve files. Select at least one role.</p>
          }
        </SettingRow>
        <SettingRow label="Require a note when returning a file" description="Reviewers must explain what to fix before a file is marked Needs Revision.">
          <Switch checked={value.requireRevisionNote} onChange={(v) => set({ requireRevisionNote: v })} label="Require a revision note" />
        </SettingRow>
        <SettingRow label="Mark an area verified when all its files are approved" description="Updates the campus checklist automatically, so the area counts toward Areas Verified.">
          <Switch checked={value.autoVerifyArea} onChange={(v) => set({ autoVerifyArea: v })} label="Auto-verify areas" />
        </SettingRow>
      </SettingsGroup>
      <SaveBar dirty={dirty} onSave={save} onDiscard={discard} onReset={reset} label="Review workflow saved" />
    </div>);

}
