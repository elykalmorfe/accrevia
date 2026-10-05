import { useState } from 'react';
import { MenuIcon, SlidersHorizontalIcon, CheckIcon } from 'lucide-react';
import { usePortal } from '../../contexts/PortalContext';
import { Brand } from './Brand';
import { GlobalSearch } from './GlobalSearch';
import { NotificationsMenu } from './NotificationsMenu';
import { ProfileMenu } from './ProfileMenu';

export function Header({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { isAdmin } = usePortal();
  const [startYear] = useState(2021);
  const [endYear] = useState(2026);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [selectedCampus, setSelectedCampus] = useState('All Campuses');

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-slate-100 bg-white/95 backdrop-blur-md px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="btn btn-ghost btn-icon h-9 w-9 lg:hidden text-ink-muted hover:text-ink"
          aria-label="Open navigation"
          onClick={onOpenMenu}
        >
          <MenuIcon className="h-5 w-5" />
        </button>
        <Brand />
      </div>

      {/* SEARCH BAR (from reference: Fund Name...) */}
      <div className="flex min-w-0 flex-1 max-w-md px-2">
        <GlobalSearch />
      </div>

      {/* REFERENCE DESIGN SIGNATURE FEATURES: Academic Cycle Slider & Filter Button */}
      <div className="hidden xl:flex items-center gap-6">
        {/* Slider: UW Year : [ 2012 ] ─────── [ 2017 ] */}
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

        {/* Filter Button with Dropdown (from reference: [ Filter ]) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-ink hover:bg-slate-50 hover:border-slate-300 shadow-sm transition-all"
          >
            <SlidersHorizontalIcon className="h-3.5 w-3.5 text-brand-600" />
            <span>Filter</span>
            {selectedCampus !== 'All Campuses' && (
              <span className="h-2 w-2 rounded-full bg-brand-600" />
            )}
          </button>

          {showFilterDropdown && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-100 bg-white p-3 shadow-soft-lg z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-ink">Campus Filter</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCampus('All Campuses');
                    setShowFilterDropdown(false);
                  }}
                  className="text-[11px] text-brand-600 hover:underline font-semibold"
                >
                  Reset
                </button>
              </div>
              <div className="space-y-1">
                {[
                  'All Campuses',
                  'Main Campus (Tandag)',
                  'Cantilan Campus',
                  'Lianga Campus',
                  'Tagbina Campus',
                  'San Miguel Campus',
                  'Bislig Campus',
                  'Cagwait Campus'
                ].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setSelectedCampus(c);
                      setShowFilterDropdown(false);
                    }}
                    className={`w-full flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs transition-colors ${
                      selectedCampus === c
                        ? 'bg-brand-50 font-bold text-brand-700'
                        : 'text-ink-muted hover:bg-slate-50 hover:text-ink'
                    }`}
                  >
                    <span>{c}</span>
                    {selectedCampus === c && <CheckIcon className="h-3.5 w-3.5 text-brand-600" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT ACTIONS: NOTIFICATIONS & PROFILE */}
      <div className="flex shrink-0 items-center gap-2">
        {isAdmin && <NotificationsMenu />}
        <ProfileMenu />
      </div>
    </header>
  );
}