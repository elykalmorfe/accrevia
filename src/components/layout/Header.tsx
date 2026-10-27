import { Link } from 'react-router-dom';
import { MenuIcon, PlusIcon } from 'lucide-react';
import { usePortal } from '../../contexts/PortalContext';
import { Brand } from './Brand';
import { GlobalSearch } from './GlobalSearch';
import { NotificationsMenu } from './NotificationsMenu';
import { ProfileMenu } from './ProfileMenu';

export function Header({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { isAdmin } = usePortal();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-slate-100 bg-white/95 backdrop-blur-md px-4 sm:px-6">
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

      {/* SEARCH BAR */}
      <div className="flex min-w-0 flex-1 max-w-lg px-2">
        <GlobalSearch />
      </div>

      {/* RIGHT ACTIONS: QUICK UPLOAD, NOTIFICATIONS, PROFILE */}
      <div className="flex shrink-0 items-center gap-2.5">
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