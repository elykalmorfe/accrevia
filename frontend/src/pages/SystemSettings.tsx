import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { GeneralSettings } from '../components/settings/GeneralSettings';
import { AccreditationSetupSettings } from '../components/settings/AccreditationSetupSettings';
import { ReportsSettings } from '../components/settings/ReportsSettings';
import { WorkflowSettings } from '../components/settings/WorkflowSettings';
import { UploadSettings } from '../components/settings/UploadSettings';
import { ReminderSettings } from '../components/settings/ReminderSettings';
import { PreferenceSettings } from '../components/settings/PreferenceSettings';
import { SearchSettings } from '../components/settings/SearchSettings';
import { ProcessingSettings } from '../components/settings/ProcessingSettings';
import { SecuritySettings } from '../components/settings/SecuritySettings';
import { MaintenanceSettings } from '../components/settings/MaintenanceSettings';

type SettingsTab =
'general' |
'accreditation' |
'reports' |
'workflow' |
'uploads' |
'reminders' |
'preferences' |
'security' |
'maintenance' |
'search' |
'processing';

const groups: {title: string;sections: {id: SettingsTab;label: string;hint: string;}[];}[] = [
{
  title: 'Portal',
  sections: [
  { id: 'general', label: 'General Settings', hint: 'Name, logo, defaults' },
  { id: 'preferences', label: 'Preferences', hint: 'Campus, sidebar, dates, density' }]

},
{
  title: 'Accreditation',
  sections: [
  { id: 'accreditation', label: 'Accreditation Setup', hint: 'Campuses, years, areas, validity' },
  { id: 'workflow', label: 'Review Workflow', hint: 'Approvers and verification' },
  { id: 'uploads', label: 'Uploads & Files', hint: 'File types, size, naming' },
  { id: 'reminders', label: 'Deadlines & Reminders', hint: 'Folder and expiry alerts' },
  { id: 'reports', label: 'Reports & Printing', hint: 'Letterhead and signatories' }]

},
{
  title: 'System',
  sections: [
  { id: 'security', label: 'Security', hint: 'Sessions and permissions' },
  { id: 'maintenance', label: 'Maintenance', hint: 'Backup, restore, storage' }]

},
{
  title: 'Server (not connected)',
  sections: [
  { id: 'search', label: 'Search Configuration', hint: 'Available when the server is connected' },
  { id: 'processing', label: 'Document Processing', hint: 'Available when the server is connected' }]

}];


const panels: Record<SettingsTab, React.ComponentType> = {
  general: GeneralSettings,
  accreditation: AccreditationSetupSettings,
  reports: ReportsSettings,
  workflow: WorkflowSettings,
  uploads: UploadSettings,
  reminders: ReminderSettings,
  preferences: PreferenceSettings,
  security: SecuritySettings,
  maintenance: MaintenanceSettings,
  search: SearchSettings,
  processing: ProcessingSettings
};

export function SystemSettings() {
  const [params, setParams] = useSearchParams();
  const requested = params.get('tab') as SettingsTab | null;
  const tab: SettingsTab = requested && requested in panels ? requested : 'general';
  const Panel = panels[tab];

  return (
    <>
      <PageHeader title="System Settings" description="Configuration for administrators. These options are not visible to other roles." />
      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <nav aria-label="Settings sections" className="lg:sticky lg:top-24 lg:self-start">
          <div className="flex gap-1 overflow-x-auto lg:flex-col lg:gap-4">
            {groups.map((group) =>
            <div key={group.title} className="flex shrink-0 gap-1 lg:flex-col">
                <p className="hidden px-3 pb-1 text-[10.5px] font-semibold uppercase tracking-wider text-ink-subtle lg:block">{group.title}</p>
                <ul className="flex gap-1 lg:flex-col">
                  {group.sections.map((s) => {
                  const active = s.id === tab;
                  return (
                    <li key={s.id} className="shrink-0">
                        <button
                        type="button"
                        onClick={() => setParams({ tab: s.id }, { replace: true })}
                        aria-current={active ? 'page' : undefined}
                        className={`w-full whitespace-nowrap rounded-md px-3 py-2 text-left transition-colors duration-150 ${active ? 'bg-white shadow-sm ring-1 ring-line' : 'hover:bg-white/70'}`}>
                          <span className={`block text-[13px] ${active ? 'font-semibold text-brand-700' : 'font-medium text-ink'}`}>{s.label}</span>
                          <span className="hidden text-xs text-ink-muted lg:block">{s.hint}</span>
                        </button>
                      </li>);

                })}
                </ul>
              </div>
            )}
          </div>
        </nav>
        <div className="min-w-0">
          <Panel key={tab} />
        </div>
      </div>
    </>);

}
