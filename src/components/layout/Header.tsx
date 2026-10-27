import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MenuIcon,
  SlidersHorizontalIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon
} from 'lucide-react';
import { usePortal } from '../../contexts/PortalContext';
import { Brand } from './Brand';
import { GlobalSearch } from './GlobalSearch';
import { NotificationsMenu } from './NotificationsMenu';
import { ProfileMenu } from './ProfileMenu';

export function Header({ onOpenMenu }: { onOpenMenu: () => void }) {
  const {
    isAdmin,
    selectedCampus,
    setSelectedCampus,
    campuses,
    selectedCampusObj,
    sidebarCollapsed,
    toggleSidebar
  } = usePortal();
  const [startYear] = useState(2021);
  const [endYear] = useState(2026);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-2 sm:gap-3 border-b border-slate-100 bg-white/95 backdrop-blur-md px-3 sm:px-6">
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 lg:hidden">
        <button
          type="button"
          className="btn btn-ghost btn-icon h-10 w-10 text-ink-muted hover:text-ink -ml-1"
          aria-label="Open navigation drawer"
          onClick={onOpenMenu}
        >
          <MenuIcon className="h-5 w-5" />
        </button>
        <Brand />
      </div>

      {/* SEARCH BAR (Adaptive width) */}
      <div className="flex min-w-0 flex-1 max-w-xs sm:max-w-md px-1 sm:px-2">
        <GlobalSearch />
      </div>

      {/* DESKTOP ACADEMIC CYCLE SLIDER & FILTER BUTTON */}
      <div className="hidden xl:flex items-center gap-6">
        {/* Slider: UW Year : [ 2021 ] ─────── [ 2026 ] */}
        <div className="flex items-center gap-3 bg-slate-50/80 px-3.5 py-1.5 rounded-2xl border border-slate-200/60 shadow-inner">
          <span className="text-xs font-bold text-ink-muted whitespace-nowrap">
            Cycle :
          </span>
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-brand-600 px-2.5 py-0.5 text-xs font-bold text-white shadow-sm shadow-brand-500/30">
              {startYear}
            </span>
            <div className="relative w-20 flex items-center">
              <div className="h-1 w-full rounded-full bg-brand-600" />
              <div className="absolute left-1/2 -translate-x-1/2 h-3 w-3 rounded-full border-2 border-white bg-brand-600 shadow" />
            </div>
            <span className="rounded-lg bg-brand-600 px-2.5 py-0.5 text-xs font-bold text-white shadow-sm shadow-brand-500/30">
              {endYear}
            </span>
          </div>
        </div>

        {/* Filter Button with Dropdown (Desktop) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all min-h-[38px] shadow-sm ${
              selectedCampus !== 'all'
                ? 'border-brand-500 bg-brand-50/80 text-brand-900 ring-1 ring-brand-500/30'
                : 'border-slate-200 bg-white text-ink hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            <SlidersHorizontalIcon className="h-3.5 w-3.5 text-brand-600" />
            <span>{selectedCampus === 'all' ? 'Filter' : selectedCampusObj?.shortName || 'Filtered'}</span>
            {selectedCampus !== 'all' && (
              <span className="flex h-2 w-2 rounded-full bg-brand-600 animate-pulse" />
            )}
          </button>
        </div>
      </div>

      {/* MOBILE / TABLET FILTER BUTTON & DROPDOWN */}
      <div className="relative xl:hidden">
        <button
          type="button"
          onClick={() => setShowFilterDropdown(!showFilterDropdown)}
          className={`btn btn-ghost btn-icon h-10 w-10 relative ${
            selectedCampus !== 'all' ? 'text-brand-600 bg-brand-50' : 'text-ink-muted hover:text-ink'
          }`}
          aria-label="Campus filters"
          title="Campus Filter"
        >
          <SlidersHorizontalIcon className="h-4.5 w-4.5 text-brand-600" />
          {selectedCampus !== 'all' && (
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-brand-600 animate-pulse" />
          )}
        </button>
      </div>

      {showFilterDropdown && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/5"
            onClick={() => setShowFilterDropdown(false)}
            aria-hidden="true"
          />
          <div className="absolute right-2 sm:right-4 top-16 w-80 max-w-[calc(100vw-1rem)] rounded-2xl border border-slate-100 bg-white p-3 shadow-soft-lg z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-ink">Campus & Cycle Filter</span>
                <p className="text-[10px] text-ink-muted">Academic Cycle: {startYear}–{endYear}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedCampus('all');
                  setShowFilterDropdown(false);
                }}
                className="text-[11px] text-brand-600 hover:underline font-semibold"
              >
                Reset (All)
              </button>
            </div>
            <div className="space-y-1 max-h-72 overflow-y-auto">
              <button
                type="button"
                onClick={() => {
                  setSelectedCampus('all');
                  setShowFilterDropdown(false);
                }}
                className={`w-full flex items-center justify-between rounded-xl px-2.5 py-2 text-xs transition-colors min-h-[36px] ${
                  selectedCampus === 'all'
                    ? 'bg-brand-50 font-bold text-brand-700'
                    : 'text-ink-muted hover:bg-slate-50 hover:text-ink'
                }`}
              >
                <span>All Campuses (Consolidated)</span>
                {selectedCampus === 'all' && <CheckIcon className="h-3.5 w-3.5 text-brand-600" />}
              </button>

              {campuses.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setSelectedCampus(c.id);
                    setShowFilterDropdown(false);
                  }}
                  className={`w-full flex items-center justify-between rounded-xl px-2.5 py-2 text-xs transition-colors min-h-[36px] ${
                    selectedCampus === c.id
                      ? 'bg-brand-50 font-bold text-brand-700'
                      : 'text-ink-muted hover:bg-slate-50 hover:text-ink'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="truncate">{c.name}</span>
                    {c.isMain && (
                      <span className="rounded bg-brand-100 px-1 py-0.2 text-[9px] font-bold text-brand-700">
                        Main
                      </span>
                    )}
                  </div>
                  {selectedCampus === c.id && <CheckIcon className="h-3.5 w-3.5 text-brand-600 shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* RIGHT ACTIONS: QUICK UPLOAD, NOTIFICATIONS & PROFILE */}
      <div className="flex shrink-0 items-center gap-2">
        {isAdmin && (
          <Link
            to="/evidence/upload"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200/80 px-3 py-1.5 text-xs font-semibold transition-all shadow-2xs"
            title="Upload new evidence document"
          >
            <PlusIcon className="h-3.5 w-3.5 text-brand-600" />
            <span>Upload Evidence</span>
          </Link>
        )}
        {isAdmin && <NotificationsMenu />}
        <ProfileMenu />
      </div>
    </header>
  );
}