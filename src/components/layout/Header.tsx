import React from 'react';
import { MenuIcon } from 'lucide-react';
import { usePortal } from '../../contexts/PortalContext';
import { Brand } from './Brand';
import { GlobalSearch } from './GlobalSearch';
import { NotificationsMenu } from './NotificationsMenu';
import { ProfileMenu } from './ProfileMenu';

export function Header({ onOpenMenu }: {onOpenMenu: () => void;}) {
  const { isAdmin } = usePortal();
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-line bg-white px-3 sm:gap-4 sm:px-4 lg:px-5">
      <button type="button" className="btn btn-ghost btn-icon h-9 w-9 lg:hidden" aria-label="Open navigation" onClick={onOpenMenu}>
        <MenuIcon className="h-5 w-5" />
      </button>
      <Brand />
      <div className="flex min-w-0 flex-1 justify-center lg:px-6">
        <GlobalSearch />
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {isAdmin && <NotificationsMenu />}
        <ProfileMenu />
      </div>
    </header>);

}