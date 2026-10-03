import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { GeneralSettings } from '../components/settings/GeneralSettings';
import { SearchSettings } from '../components/settings/SearchSettings';
import { ProcessingSettings } from '../components/settings/ProcessingSettings';
import { SecuritySettings } from '../components/settings/SecuritySettings';
import { MaintenanceSettings } from '../components/settings/MaintenanceSettings';

type SettingsTab = 'general' | 'search' | 'processing' | 'security' | 'maintenance';

const sections: {id: SettingsTab;label: string;hint: string;}[] = [
{ id: 'general', label: 'General Settings', hint: 'Name, institution, defaults' },
{ id: 'search', label: 'Search Configuration', hint: 'Ranking and results' },
{ id: 'processing', label: 'Document Processing', hint: 'OCR, chunking, indexing' },
{ id: 'security', label: 'Security', hint: 'Sessions and permissions' },
{ id: 'maintenance', label: 'Maintenance', hint: 'Status, backup, logs' }];


export function SystemSettings() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') as SettingsTab || 'general';

  return (
    <>
      <PageHeader title="System Settings" description="Technical configuration for administrators. These options are not visible to other roles." />
      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <nav aria-label="Settings sections" className="lg:sticky lg:top-24 lg:self-start">
          <ul className="flex gap-1 overflow-x-auto lg:flex-col">
            {sections.map((s) => {
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
        </nav>
        <div className="min-w-0">
          {tab === 'general' && <GeneralSettings />}
          {tab === 'search' && <SearchSettings />}
          {tab === 'processing' && <ProcessingSettings />}
          {tab === 'security' && <SecuritySettings />}
          {tab === 'maintenance' && <MaintenanceSettings />}
        </div>
      </div>
    </>);

}