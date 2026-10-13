import React, { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  XIcon,
  LayoutDashboardIcon,
  FolderIcon,
  ShieldCheckIcon,
  CloudUploadIcon,
  MenuIcon,
  SearchIcon,
  Share2Icon
} from 'lucide-react';
import { Toaster } from 'sonner';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Brand } from './Brand';
import { easeOut } from '../../utils/motion';
import { usePortal } from '../../contexts/PortalContext';

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();
  const { isAdmin, pending } = usePortal();

  useEffect(() => {
    setMobileOpen(false);
    window.scrollTo(0, 0);
  }, [pathname]);

  // Lock background scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [mobileOpen]);

  // Close on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileOpen) setMobileOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  const isTabActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen w-full bg-canvas overflow-x-hidden">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:shadow"
      >
        Skip to content
      </a>
      <Header onOpenMenu={() => setMobileOpen(true)} />

      <div className="flex">
        {/* DESKTOP STICKY SIDEBAR */}
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 xl:w-72 shrink-0 overflow-y-auto border-r border-slate-100 bg-white lg:block">
          <Sidebar />
        </aside>

        {/* MOBILE DRAWER */}
        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                className="fixed inset-0 z-40 bg-ink/50 backdrop-blur-xs lg:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setMobileOpen(false)}
                aria-hidden="true"
              />

              <motion.aside
                role="dialog"
                aria-modal="true"
                aria-label="Navigation drawer"
                className="fixed inset-y-0 left-0 z-50 flex w-[280px] max-w-[85vw] flex-col overflow-y-auto bg-white shadow-2xl lg:hidden pb-safe"
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ duration: 0.25, ease: easeOut }}
              >
                <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-4">
                  <Brand showSubtitle={false} />
                  <button
                    type="button"
                    onClick={() => setMobileOpen(false)}
                    className="btn btn-ghost btn-icon h-10 w-10 text-ink-muted hover:text-ink"
                    aria-label="Close navigation"
                  >
                    <XIcon className="h-5 w-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <Sidebar />
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* MAIN APPLICATION CONTAINER */}
        <main id="main" className="min-w-0 flex-1 overflow-x-hidden pb-24 lg:pb-8">
          <div className="mx-auto max-w-[1440px] px-3.5 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
            <Outlet />
          </div>
        </main>
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR FOR ONE-THUMB ERGONOMICS */}
      <nav
        aria-label="Mobile quick navigation"
        className="fixed bottom-0 inset-x-0 z-30 border-t border-slate-200/90 bg-white/95 backdrop-blur-md pb-safe lg:hidden shadow-lg"
      >
        <div className="grid grid-cols-5 h-14 items-center">
          <Link
            to="/"
            className={`flex flex-col items-center justify-center h-full py-1 transition-colors ${
              isTabActive('/') ? 'text-brand-600 font-bold' : 'text-slate-500 hover:text-ink'
            }`}
          >
            <LayoutDashboardIcon className="h-5 w-5" />
            <span className="text-[10px] mt-0.5 tracking-tight">Home</span>
          </Link>

          <Link
            to={isAdmin ? '/evidence' : '/shared-with-me'}
            className={`relative flex flex-col items-center justify-center h-full py-1 transition-colors ${
              isTabActive(isAdmin ? '/evidence' : '/shared-with-me')
                ? 'text-brand-600 font-bold'
                : 'text-slate-500 hover:text-ink'
            }`}
          >
            {isAdmin ? <FolderIcon className="h-5 w-5" /> : <Share2Icon className="h-5 w-5" />}
            <span className="text-[10px] mt-0.5 tracking-tight">{isAdmin ? 'Evidence' : 'Shared'}</span>
            {isAdmin && pending.length > 0 && (
              <span className="absolute top-1.5 right-4 h-2 w-2 rounded-full bg-brand-600" />
            )}
          </Link>

          <Link
            to="/frameworks"
            className={`flex flex-col items-center justify-center h-full py-1 transition-colors ${
              isTabActive('/frameworks') ? 'text-brand-600 font-bold' : 'text-slate-500 hover:text-ink'
            }`}
          >
            <ShieldCheckIcon className="h-5 w-5" />
            <span className="text-[10px] mt-0.5 tracking-tight">QA Hub</span>
          </Link>

          {isAdmin ? (
            <Link
              to="/evidence/upload"
              className={`flex flex-col items-center justify-center h-full py-1 transition-colors ${
                isTabActive('/evidence/upload') ? 'text-brand-600 font-bold' : 'text-slate-500 hover:text-ink'
              }`}
            >
              <CloudUploadIcon className="h-5 w-5" />
              <span className="text-[10px] mt-0.5 tracking-tight">Upload</span>
            </Link>
          ) : (
            <Link
              to="/search"
              className={`flex flex-col items-center justify-center h-full py-1 transition-colors ${
                isTabActive('/search') ? 'text-brand-600 font-bold' : 'text-slate-500 hover:text-ink'
              }`}
            >
              <SearchIcon className="h-5 w-5" />
              <span className="text-[10px] mt-0.5 tracking-tight">Search</span>
            </Link>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex flex-col items-center justify-center h-full py-1 text-slate-500 hover:text-ink transition-colors"
            aria-label="Open full menu"
          >
            <MenuIcon className="h-5 w-5" />
            <span className="text-[10px] mt-0.5 tracking-tight">Menu</span>
          </button>
        </div>
      </nav>

      <Toaster position="bottom-right" closeButton toastOptions={{ className: 'font-sans text-[13px]' }} />
    </div>
  );
}