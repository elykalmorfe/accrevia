import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { PreferenceSettings } from '../../components/settings/PreferenceSettings';
import { SearchSettings } from '../../components/settings/SearchSettings';

/**
 * Faculty/Staff settings — same layout pattern as SystemSettings,
 * limited to controls appropriate for Faculty/Staff (no admin-only setup).
 */
type FacultySettingsTab = 'preferences' | 'search';

const groups: { title: string; sections: { id: FacultySettingsTab; label: string; hint: string }[] }[] = [
  {
    title: 'Portal',
    sections: [{ id: 'preferences', label: 'Preferences', hint: 'Campus, sidebar, dates, density' }]
  },
  {
    title: 'Search',
    sections: [{ id: 'search', label: 'Search preferences', hint: 'Display options for this browser' }]
  }
];

const panels: Record<FacultySettingsTab, React.ComponentType> = {
  preferences: PreferenceSettings,
  search: SearchSettings
};

export function FacultySettings() {
  const [params, setParams] = useSearchParams();
  const requested = params.get('tab') as FacultySettingsTab | null;
  const tab: FacultySettingsTab = requested && requested in panels ? requested : 'preferences';
  const Panel = panels[tab];

  return (
    <>
      <PageHeader
        title="Settings"
        description="Personal portal preferences for your Faculty/Staff account (campus, sidebar, dates, density, search display). Institutional configuration, user management, and document permissions are not available here."
      />
      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <nav aria-label="Settings sections" className="lg:sticky lg:top-24 lg:self-start">
          <div className="flex gap-1 overflow-x-auto lg:flex-col lg:gap-4">
            {groups.map((group) => (
              <div key={group.title} className="flex shrink-0 gap-1 lg:flex-col">
                <p className="hidden px-3 pb-1 text-[10.5px] font-semibold uppercase tracking-wider text-ink-subtle lg:block">
                  {group.title}
                </p>
                <ul className="flex gap-1 lg:flex-col">
                  {group.sections.map((s) => {
                    const active = s.id === tab;
                    return (
                      <li key={s.id} className="shrink-0">
                        <button
                          type="button"
                          onClick={() => setParams({ tab: s.id }, { replace: true })}
                          aria-current={active ? 'page' : undefined}
                          className={`w-full whitespace-nowrap rounded-md px-3 py-2 text-left transition-colors duration-150 ${
                            active ? 'bg-white shadow-sm ring-1 ring-line' : 'hover:bg-white/70'
                          }`}
                        >
                          <span
                            className={`block text-[13px] ${active ? 'font-semibold text-brand-700' : 'font-medium text-ink'}`}
                          >
                            {s.label}
                          </span>
                          <span className="hidden text-xs text-ink-muted lg:block">{s.hint}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </nav>
        <div className="min-w-0">
          <Panel key={tab} />
        </div>
      </div>
    </>
  );
}
