import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { MenuIcon, SearchIcon, XIcon } from 'lucide-react';
import { usePortal } from '../../contexts/PortalContext';
import { Brand } from './Brand';
import { GlobalSearch } from './GlobalSearch';
import { NotificationsMenu } from './NotificationsMenu';
import { ProfileMenu } from './ProfileMenu';
export function Header({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { isAdmin } = usePortal();
  const [searchOpen, setSearchOpen] = useState(false);
  const { pathname } = useLocation();
  // The admin Dashboard and Search Results render their own search in the page; All Documents relies on its repository search.
  const hideHeaderSearch =
    (isAdmin && pathname === '/dashboard') || pathname === '/search' || pathname === '/evidence';

  useEffect(() => setSearchOpen(false), [pathname]);

  return (
    <header className="glass sticky top-0 z-30 border-b">
      <div className="flex h-16 items-center justify-between gap-2 px-3 xs:px-4 sm:gap-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3 lg:hidden">
          <button
            type="button"
            className="btn btn-ghost btn-icon h-9 w-9 min-h-0 min-w-0"
            aria-label="Open navigation"
            onClick={onOpenMenu}
          >
            <MenuIcon className="h-5 w-5" />
          </button>
          <span className="hidden xs:block">
            <Brand showSubtitle={false} />
          </span>
          <span className="xs:hidden">
            <Brand showSubtitle={false} compact />
          </span>
        </div>

        {!hideHeaderSearch && (
          <div className="hidden min-w-0 max-w-lg flex-1 px-2 sm:flex">
            <GlobalSearch />
          </div>
        )}

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          {!hideHeaderSearch && (
            <button
              type="button"
              onClick={() => setSearchOpen((v) => !v)}
              className="btn btn-ghost btn-icon h-9 w-9 min-h-0 min-w-0 text-ink-muted hover:text-ink sm:hidden"
              aria-label={searchOpen ? 'Close search' : 'Search'}
              aria-expanded={searchOpen}
            >
              {searchOpen ? <XIcon className="h-[18px] w-[18px]" /> : <SearchIcon className="h-[18px] w-[18px]" />}
            </button>
          )}
          {isAdmin && <NotificationsMenu />}
          <ProfileMenu />
        </div>
      </div>

      <AnimatePresence>
        {searchOpen && !hideHeaderSearch && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="border-t border-line-subtle px-3 pb-3 pt-2 sm:hidden"
          >
            <GlobalSearch variant="overlay" onDone={() => setSearchOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
