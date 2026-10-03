import React, { useState } from 'react';
import { SettingRow, SettingsGroup } from './SettingsLayout';
import { Switch } from '../ui/Switch';

export function SharingDefaults() {
  const [s, setS] = useState({ permission: 'view', expiry: '90', roleSharing: true, notify: true, confidentialViewOnly: true });
  const set = <K extends keyof typeof s,>(key: K, value: (typeof s)[K]) => setS((prev) => ({ ...prev, [key]: value }));

  return (
    <SettingsGroup
      title="Sharing defaults"
      description="New uploads are private to administrators and QA personnel. Permissions are re-checked by the server on every view and download; file links are signed and expire within minutes.">
      
      <SettingRow label="Default permission" description="Pre-selected in the Share dialog.">
        <select aria-label="Default permission" className="input" value={s.permission} onChange={(e) => set('permission', e.target.value)}>
          <option value="view">View only</option>
          <option value="download">View + Download</option>
        </select>
      </SettingRow>
      <SettingRow label="Default access expiration">
        <select aria-label="Default access expiration" className="input" value={s.expiry} onChange={(e) => set('expiry', e.target.value)}>
          <option value="none">No expiration</option>
          <option value="30">30 days</option>
          <option value="90">90 days</option>
          <option value="ay">End of academic year</option>
        </select>
      </SettingRow>
      <SettingRow label="Allow sharing with an entire role" description="Lets administrators share with all Faculty, Staff, or Accreditors at once.">
        <Switch checked={s.roleSharing} onChange={(v) => set('roleSharing', v)} label="Allow role-wide sharing" />
      </SettingRow>
      <SettingRow label="Confidential documents are view only" description="Blocks download permission on documents marked Confidential.">
        <Switch checked={s.confidentialViewOnly} onChange={(v) => set('confidentialViewOnly', v)} label="Confidential documents are view only" />
      </SettingRow>
      <SettingRow label="Email recipients when evidence is shared">
        <Switch checked={s.notify} onChange={(v) => set('notify', v)} label="Email recipients when shared" />
      </SettingRow>
    </SettingsGroup>);

}