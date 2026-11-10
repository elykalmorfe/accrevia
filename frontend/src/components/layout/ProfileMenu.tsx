import { Link, useLocation } from 'react-router-dom';
import { usePortal } from '../../contexts/PortalContext';
import { useProfile } from '../../hooks/useProfile';
import { initials } from '../../utils/format';

export function ProfileMenu() {
  const { currentUser } = usePortal();
  const { profile, fullName } = useProfile(currentUser);
  const { pathname } = useLocation();
  const active = pathname.startsWith('/account');

  return (
    <Link
      to="/account"
      title="My Profile"
      aria-current={active ? 'page' : undefined}
      className={`flex items-center gap-2.5 rounded-md py-1 pl-1 pr-2 transition-colors duration-150 hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
        active ? 'bg-canvas' : ''
      }`}
    >
      {profile.avatar ? (
        <img src={profile.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
      ) : (
        <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-700 text-xs font-semibold text-white" aria-hidden="true">
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
