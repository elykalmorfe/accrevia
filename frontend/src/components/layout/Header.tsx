import { MenuIcon } from 'lucide-react';
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

      {/* RIGHT ACTIONS: NOTIFICATIONS, PROFILE */}
      <div className="flex shrink-0 items-center gap-2.5">
        {isAdmin && <NotificationsMenu />}
        <ProfileMenu />
      </div>
    </header>
  );
}
