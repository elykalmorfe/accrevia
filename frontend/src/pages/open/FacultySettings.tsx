import { PageHeader } from '../../components/ui/PageHeader';
import { PreferenceSettings } from '../../components/settings/PreferenceSettings';

/** Personal display choices only. Search ranking stays with the QA Office. */
export function FacultySettings() {
  return (
    <>
      <PageHeader
        title="Settings"
        description="Optional. Choose the campus, sidebar, date format, and table density for this browser."
      />
      <PreferenceSettings />
    </>
  );
}
