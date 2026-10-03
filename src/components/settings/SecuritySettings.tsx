import React, { useState } from 'react';
import { SaveBar, SettingRow, SettingsGroup } from './SettingsLayout';
import { Switch } from '../ui/Switch';
import { SharingDefaults } from './SharingDefaults';
import { userRoles } from '../../data/options';
import { UserRole } from '../../types/user';

const permissions = [
'Search and view evidence shared with them',
'Download evidence (when the share allows it)',
'Upload evidence',
'Classify and edit metadata',
'Manage frameworks and criteria',
'Manage users',
'View retrieval performance',
'Change system settings'];


const defaults: Record<UserRole, number> = { Administrator: 8, 'QA Personnel': 5, Faculty: 2, Staff: 1, Accreditor: 2 };

export function SecuritySettings() {
  const [s, setS] = useState({ timeout: '30', sessions: 2, minLength: 12, complexity: true, expiry: '90', mfa: true });
  const [matrix, setMatrix] = useState<Record<string, boolean>>(() =>
  Object.fromEntries(userRoles.flatMap((r) => permissions.map((p, i) => [`${r}|${p}`, i < defaults[r]])))
  );
  const set = <K extends keyof typeof s,>(key: K, value: (typeof s)[K]) => setS((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-4">
      <SettingsGroup title="Sessions">
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

      <SharingDefaults />

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
              {permissions.map((p) =>
              <tr key={p}>
                  <td className="td">{p}</td>
                  {userRoles.map((r) => {
                  const key = `${r}|${p}`;
                  const locked = r === 'Administrator';
                  return (
                    <td key={r} className="td text-center">
                        <input
                        type="checkbox"
                        aria-label={`${r}: ${p}`}
                        checked={matrix[key]}
                        disabled={locked}
                        onChange={() => setMatrix((m) => ({ ...m, [key]: !m[key] }))}
                        className="h-4 w-4 rounded border-line-strong accent-brand-600 disabled:opacity-60" />
                      
                      </td>);

                })}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      <SaveBar label="Security settings saved" />
    </div>);

}