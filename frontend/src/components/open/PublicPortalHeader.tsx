import { Link } from 'react-router-dom';
import { MenuIcon } from 'lucide-react';
import { Brand } from '../layout/Brand';
import { NotificationsMenu } from '../layout/NotificationsMenu';
import { usePortal } from '../../contexts/PortalContext';
import { useProfile } from '../../hooks/useProfile';
import { initials } from '../../utils/format';
import { useSessionAccount } from '../../utils/auth';

/** Same visual as the System Admin profile chip; opens Faculty/Staff My Profile inside /open. */
function FacultyProfileChip() {
  const { currentUser } = usePortal();
  const { profile, fullName } = useProfile(currentUser);

  return (
    <Link
      to="/open/account"
      title="My Profile"
      className="flex items-center gap-2.5 rounded-md py-1 pl-1 pr-2 transition-colors duration-150 hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      {profile.avatar ? (
        <img src={profile.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
      ) : (
        <span
          className="grid h-8 w-8 place-items-center rounded-full bg-brand-700 text-xs font-semibold text-white"
          aria-hidden="true"
        >
          {initials(fullName)}
        </span>
      )}
      <span className="hidden text-left leading-tight md:block">
        <span className="block whitespace-nowrap text-[13px] font-medium text-ink">{fullName}</span>
        <span className="block text-[11px] text-ink-muted">{currentUser.role}</span>
      </span>
      <span className="sr-only">Open my profile</span>
    </Link>
  );
}

export function PublicPortalHeader({ onOpenMenu }: { onOpenMenu: () => void }) {
  const session = useSessionAccount();

  return (
    <header className="glass sticky top-0 z-30 border-b">
      <div className="flex h-16 items-center justify-between gap-2 px-3 xs:px-4 sm:gap-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3 lg:hidden">
          <button
            type="button"
            className="btn btn-ghost btn-icon h-9 w-9 min-h-0 min-w-0 text-ink-muted hover:text-ink"
            aria-label="Open navigation"
            onClick={onOpenMenu}
          >
            <MenuIcon className="h-5 w-5" />
          </button>
          <span className="hidden xs:block">
            <Brand to="/open" showSubtitle={false} />
          </span>
          <span className="xs:hidden">
            <Brand to="/open" showSubtitle={false} compact />
          </span>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          {session ? (
            <>
              <NotificationsMenu />
              <FacultyProfileChip />
            </>
          ) : (
            <Link
              to="/login"
              className="rounded-full border border-brand-100 bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700"
            >
              Sign in required
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
