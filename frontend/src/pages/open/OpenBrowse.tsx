import { useCallback, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeftIcon, FolderOpenIcon, ShieldAlertIcon } from 'lucide-react';
import { Tabs } from '../../components/ui/Tabs';
import { SampleDocumentsPanel } from '../../components/open/repository/SampleDocumentsPanel';
import { TechnicalReviewsDemo } from '../../components/open/repository/TechnicalReviewsDemo';
import { FACULTY_ACCESS_VISIBILITY_NOTE } from '../../services/repository/facultyAccessVisibility';
import {
  isRepositoryTabId,
  type RepositoryTabId
} from '../../types/accreditationRepository';

/**
 * Faculty/Staff deep-link repository surface.
 * Verified AACCUP/COPC catalog browsers are not exposed here — catalog presence ≠ publication approval.
 * Allowed: labeled demonstration samples + Technical Review request workflow (no restricted file contents).
 */
const TABS: { id: RepositoryTabId; label: string }[] = [
  { id: 'sample-documents', label: 'Sample Documents' },
  { id: 'technical-reviews', label: 'AACCUP Technical Reviews' }
];

function isFacultyBrowseTab(id: string | null): id is 'sample-documents' | 'technical-reviews' {
  return id === 'sample-documents' || id === 'technical-reviews';
}

export function OpenBrowse() {
  const [searchParams, setSearchParams] = useSearchParams();

  const rawTab = searchParams.get('tab');
  const tab: 'sample-documents' | 'technical-reviews' = isFacultyBrowseTab(rawTab)
    ? rawTab
    : 'sample-documents';

  const urlQuery = searchParams.get('q')?.trim() ?? '';
  const focusDocId = searchParams.get('doc')?.trim() || undefined;

  const restrictedCatalogAttempt = useMemo(
    () => rawTab === 'certificates' || rawTab === 'copc' || (rawTab !== null && isRepositoryTabId(rawTab) && !isFacultyBrowseTab(rawTab)),
    [rawTab]
  );

  const setTab = useCallback(
    (next: RepositoryTabId) => {
      const allowed = isFacultyBrowseTab(next) ? next : 'sample-documents';
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          params.set('tab', allowed);
          params.delete('path');
          return params;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  useEffect(() => {
    if (isFacultyBrowseTab(rawTab)) return;
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        params.set('tab', 'sample-documents');
        params.delete('path');
        return params;
      },
      { replace: true }
    );
  }, [rawTab, setSearchParams]);

  return (
    <div className="space-y-6 sm:space-y-7">
      <header className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/open" className="btn btn-ghost btn-sm text-brand-700">
            <ArrowLeftIcon className="h-3.5 w-3.5" />
            Dashboard
          </Link>
        </div>
        <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-600">
          NEMSU · ACCREVIA
        </p>
        <div className="mt-1.5 flex items-start gap-3">
          <span className="mt-0.5 hidden h-10 w-10 shrink-0 place-items-center rounded-xl border border-brand-100 bg-brand-50 text-brand-700 xs:grid">
            <FolderOpenIcon className="h-[18px] w-[18px]" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h1 className="font-sans text-[22px] font-extrabold tracking-tight text-ink sm:text-[26px]">
              Authorized documents
            </h1>
            <p className="mt-1.5 max-w-2xl text-[13px] font-medium leading-relaxed text-ink-muted sm:text-[14px]">
              Demonstration samples and Technical Review request tracking. Full verified certificate and COPC catalog
              listings are not exposed in the Faculty/Staff portal without explicit publication authorization.
            </p>
            <p className="mt-2 text-[11px] leading-relaxed text-ink-subtle">{FACULTY_ACCESS_VISIBILITY_NOTE}</p>
          </div>
        </div>
      </header>

      {restrictedCatalogAttempt ? (
        <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-950">
          <ShieldAlertIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>
            Verified AACCUP certificate and COPC catalog rows are classified as <strong>unknown</strong> authorization
            for Faculty/Staff in this prototype and are not listed. Use sample documents or submit a request when
            required.
          </p>
        </div>
      ) : null}

      <Tabs tabs={TABS} value={tab} onChange={setTab} label="Authorized document sections" />

      <div role="tabpanel" aria-label={TABS.find((t) => t.id === tab)?.label}>
        {tab === 'technical-reviews' ? <TechnicalReviewsDemo /> : null}

        {tab === 'sample-documents' ? (
          <SampleDocumentsPanel initialQuery={urlQuery} focusDocumentId={focusDocId} />
        ) : null}
      </div>
    </div>
  );
}
