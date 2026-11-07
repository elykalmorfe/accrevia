import React from 'react';
import { SaveBar, SettingRow, SettingsGroup } from './SettingsLayout';
import { Switch } from '../ui/Switch';
import { SharingDefaults } from './SharingDefaults';
import { userRoles } from '../../data/options';
import { UserRole } from '../../types/user';
import { PortalSettings, useSettingsDraft } from '../../settings/portalSettings';

type SecurityConfig = PortalSettings['security'];

const permissions = [
'Search and view documents shared with them',
'Download documents (when the share allows it)',
'Upload documents',
'Classify and edit metadata',
'Manage frameworks and criteria',
'Manage users',
'View retrieval performance',
'Change system settings'];


const defaults: Record<UserRole, number> = {
  Superadmin: 8,
  Administrator: 8,
  'QA Personnel': 5,
  Faculty: 3,
  Staff: 2,
  Accreditor: 2,
  User: 2
};

function isAllowed(overrides: Record<string, boolean>, role: UserRole, permission: string, index: number) {
  const key = `${role}|${permission}`;
  return key in overrides ? overrides[key] : index < defaults[role];
}

export function SecuritySettings() {
  const security = useSettingsDraft('security');
  const sharing = useSettingsDraft('sharing');
  const s = security.value;
  const set = <K extends keyof SecurityConfig,>(key: K, value: SecurityConfig[K]) => security.set({ [key]: value } as Partial<SecurityConfig>);

  return (
    <div className="space-y-4">
      <SettingsGroup title="Sessions" description="Enforced by the sign-in server once it is connected.">
        <SettingRow label="Sign out after inactivity">
          <select aria-label="Session timeout" className="input" value={s.timeout} onChange={(e) => set('timeout', e.target.value)}>
            {['15', '30', '60', '120'].map((m) => <option key={m} value={m}>{m} minutes</option>)}
          </select>
        </SettingRow>
        <SettingRow label="Concurrent sessions per user">
          <input aria-label="Concurrent sessions" type="number" min={1} max={5} className="input" value={s.sessions} onChange={(e) => set('sessions', Number(e.target.value))} />
        </SettingRow>
        <SettingRow label="Require two-factor authentication for administrators">
          <Switch checked={s.mfa} onChange={(v) => set('mfa', v)} label="Require two-factor authentication" />
        </SettingRow>
      </SettingsGroup>

      <SettingsGroup title="Password policy">
        <SettingRow label="Minimum length">
          <input aria-label="Minimum password length" type="number" min={8} max={32} className="input" value={s.minLength} onChange={(e) => set('minLength', Number(e.target.value))} />
        </SettingRow>
        <SettingRow label="Require upper, lower, number, and symbol">
          <Switch checked={s.complexity} onChange={(v) => set('complexity', v)} label="Require password complexity" />
        </SettingRow>
        <SettingRow label="Password expiry">
          <select aria-label="Password expiry" className="input" value={s.expiry} onChange={(e) => set('expiry', e.target.value)}>
            {['30', '90', '180', 'never'].map((d) => <option key={d} value={d}>{d === 'never' ? 'Never' : `${d} days`}</option>)}
          </select>
        </SettingRow>
      </SettingsGroup>

      <SharingDefaults value={sharing.value} onChange={sharing.set} />

      <section className="panel overflow-hidden">
        <div className="px-5 py-4">
          <h2 className="panel-title">Access permissions</h2>
          <p className="mt-0.5 text-xs text-ink-muted">What each role can do. Technical configuration is limited to administrators.</p>
        </div>
        <div className="overflow-x-auto border-t border-line">
          <table className="w-full min-w-[640px]">
            <thead className="bg-canvas">
              <tr>
                <th className="th">Permission</th>
                {userRoles.map((r) => <th key={r} className="th text-center">{r}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {permissions.map((p, i) =>
              <tr key={p}>
                  <td className="td">{p}</td>
                  {userRoles.map((r) => {
                  const key = `${r}|${p}`;
                  const locked = r === 'Administrator';
                  const checked = isAllowed(s.permissions, r, p, i);
                  return (
                    <td key={r} className="td text-center">
                        <input
                        type="checkbox"
                        aria-label={`${r}: ${p}`}
                        checked={checked}
                        disabled={locked}
                        onChange={() => set('permissions', { ...s.permissions, [key]: !checked })}
                        className="h-4 w-4 rounded border-line-strong accent-brand-600 disabled:opacity-60" />
                      
                      </td>);

                })}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      <SaveBar
        dirty={security.dirty || sharing.dirty}
        onSave={() => {
          security.save();
          sharing.save();
        }}
        onDiscard={() => {
          security.discard();
          sharing.discard();
        }}
        onReset={() => {
          security.reset();
          sharing.reset();
        }}
        label="Security settings saved" />
    </div>);

}
