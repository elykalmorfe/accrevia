import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { PageHeader } from '../components/ui/PageHeader';
import { Tabs } from '../components/ui/Tabs';
import { Switch } from '../components/ui/Switch';
import { SettingRow, SettingsGroup } from '../components/settings/SettingsLayout';
import { usePortal } from '../contexts/PortalContext';
import { initials } from '../utils/format';

type AccountTab = 'profile' | 'settings';

export function Account() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') as AccountTab || 'profile';
  const [prefs, setPrefs] = useState({ pending: true, failures: true, digest: false });
  const { currentUser } = usePortal();

  return (
    <>
      <PageHeader title="My Account" description="Your profile and personal preferences." />
      <Tabs<AccountTab>
        label="Account sections"
        value={tab}
        onChange={(t) => setParams({ tab: t }, { replace: true })}
        className="mb-5"
        tabs={[{ id: 'profile', label: 'My Profile' }, { id: 'settings', label: 'Account Settings' }]} />
      
      <div className="max-w-3xl space-y-4">
        {tab === 'profile' ?
        <SettingsGroup title="Profile">
            <div className="flex items-center gap-4 border-b border-line py-5">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-700 text-lg font-semibold text-white" aria-hidden="true">{initials(currentUser.name)}</span>
              <div>
                <p className="text-base font-semibold text-ink">{currentUser.name}</p>
                <p className="text-[13px] text-ink-muted">{currentUser.office} · {currentUser.role}</p>
              </div>
            </div>
            <SettingRow label="Email"><input aria-label="Email" className="input" defaultValue={currentUser.email} /></SettingRow>
            <SettingRow label="Office"><input aria-label="Office" className="input" defaultValue={currentUser.office} readOnly /></SettingRow>
            <SettingRow label="Contact number"><input aria-label="Contact number" className="input" defaultValue="+63 917 555 0142" /></SettingRow>
            <div className="flex justify-end py-4">
              <button type="button" className="btn btn-primary" onClick={() => toast.success('Profile updated')}>Save profile</button>
            </div>
          </SettingsGroup> :

        <>
            <SettingsGroup title="Change password">
              <SettingRow label="Current password"><input aria-label="Current password" type="password" className="input" /></SettingRow>
              <SettingRow label="New password" description="At least 12 characters with upper, lower, number, and symbol."><input aria-label="New password" type="password" className="input" /></SettingRow>
              <div className="flex justify-end py-4">
                <button type="button" className="btn btn-primary" onClick={() => toast.success('Password changed')}>Update password</button>
              </div>
            </SettingsGroup>
            <SettingsGroup title="Notifications">
              <SettingRow label="New documents need classification">
                <Switch checked={prefs.pending} onChange={(v) => setPrefs((p) => ({ ...p, pending: v }))} label="Notify about pending classification" />
              </SettingRow>
              <SettingRow label="Processing failures">
                <Switch checked={prefs.failures} onChange={(v) => setPrefs((p) => ({ ...p, failures: v }))} label="Notify about processing failures" />
              </SettingRow>
              <SettingRow label="Weekly coverage digest by email">
                <Switch checked={prefs.digest} onChange={(v) => setPrefs((p) => ({ ...p, digest: v }))} label="Weekly coverage digest" />
              </SettingRow>
            </SettingsGroup>
          </>
        }
      </div>
    </>);

}