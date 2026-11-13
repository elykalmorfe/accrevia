import React from 'react';
import { SettingRow, SettingsGroup } from './SettingsLayout';
import { Switch } from '../ui/Switch';
import { PortalSettings } from '../../settings/portalSettings';

type SharingConfig = PortalSettings['sharing'];

interface SharingDefaultsProps {
  value: SharingConfig;
  onChange: (patch: Partial<SharingConfig>) => void;
}

export function SharingDefaults({ value: s, onChange }: SharingDefaultsProps) {
  return (
    <SettingsGroup
      title="Sharing defaults"
      description="New uploads are private to administrators and QA personnel. These values are pre-selected when you share a document.">
      
      <SettingRow label="Default permission" description="Pre-selected in the Share dialog.">
        <select aria-label="Default permission" className="input select" value={s.permission} onChange={(e) => onChange({ permission: e.target.value as SharingConfig['permission'] })}>
          <option value="view">View only</option>
          <option value="download">View + Download</option>
        </select>
      </SettingRow>
      <SettingRow label="Default access expiration">
        <select aria-label="Default access expiration" className="input select" value={s.expiry} onChange={(e) => onChange({ expiry: e.target.value })}>
          <option value="none">No expiration</option>
          <option value="30">30 days</option>
          <option value="90">90 days</option>
          <option value="ay">End of academic year</option>
        </select>
      </SettingRow>
      <SettingRow label="Allow sharing with an entire role" description="Lets administrators share with all Faculty, Staff, or Accreditors at once.">
        <Switch checked={s.roleSharing} onChange={(v) => onChange({ roleSharing: v })} label="Allow role-wide sharing" />
      </SettingRow>
      <SettingRow label="Confidential documents are view only" description="Blocks download permission on documents marked Confidential.">
        <Switch checked={s.confidentialViewOnly} onChange={(v) => onChange({ confidentialViewOnly: v })} label="Confidential documents are view only" />
      </SettingRow>
      <SettingRow label="Email recipients when evidence is shared" description="Sent once the mail server is connected.">
        <Switch checked={s.notify} onChange={(v) => onChange({ notify: v })} label="Email recipients when shared" />
      </SettingRow>
    </SettingsGroup>);

}
