import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon, XIcon } from 'lucide-react';
import { Toaster } from 'sonner';
import { Brand } from '../layout/Brand';
import { easeOut } from '../../utils/motion';
import { useTheme } from '../../hooks/useTheme';
import { PublicPortalHeader } from './PublicPortalHeader';
import { PublicPortalSidebar } from './PublicPortalSidebar';
import { FacultyPortalProvider } from '../../contexts/FacultyPortalContext';

export function PublicPortalShell() {
  const { resolved: theme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    setMobileOpen(false);
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [mobileOpen]);

  return (
    <FacultyPortalProvider>
    <div className="min-h-screen w-full">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-surface focus:px-3 focus:py-2 focus:text-sm focus:shadow"
      >
        Skip to content
      </a>

      <div className="flex min-h-screen">
        <div
          className={`sticky top-0 z-40 hidden h-screen shrink-0 transition-[width] duration-200 ease-out lg:block ${
            sidebarCollapsed ? 'w-[76px]' : 'w-[280px] xl:w-[300px]'
          }`}
        >
          <aside className="glass flex h-full flex-col border-r shadow-[1px_0_12px_0_rgb(var(--shadow-color)/0.04)]">
            <div
              className={`flex h-16 shrink-0 items-center overflow-hidden border-b border-line-subtle ${
                sidebarCollapsed ? 'justify-center px-2' : 'px-5'
              }`}
            >
              <Brand to="/open" compact={sidebarCollapsed} />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
              <PublicPortalSidebar collapsed={sidebarCollapsed} />
            </div>
          </aside>
          <button
            type="button"
            onClick={() => setSidebarCollapsed((v) => !v)}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="absolute -right-3 top-5 grid h-6 w-6 place-items-center rounded-full border border-line bg-surface text-ink-muted shadow-sm transition hover:border-brand-300 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            {sidebarCollapsed ? <ChevronRightIcon className="h-3.5 w-3.5" /> : <ChevronLeftIcon className="h-3.5 w-3.5" />}
          </button>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setMobileOpen(false)}
                aria-hidden="true"
              />
              <motion.aside
                className="fixed left-0 top-0 z-50 flex h-dvh w-[86vw] max-w-[300px] flex-col overflow-y-auto border-r border-line-subtle bg-surface shadow-soft-lg lg:hidden"
                role="dialog"
                aria-modal="true"
                aria-label="Faculty and staff portal navigation"
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ duration: 0.25, ease: easeOut }}
              >
                <div className="flex h-16 shrink-0 items-center justify-between border-b border-line-subtle px-4">
                  <Brand to="/open" showSubtitle={false} />
                  <button
                    type="button"
                    onClick={() => setMobileOpen(false)}
                    className="btn btn-ghost btn-icon"
                    aria-label="Close navigation"
                  >
                    <XIcon className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex-1">
                  <PublicPortalSidebar collapsed={false} onNavigate={() => setMobileOpen(false)} />
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        <div className="flex min-w-0 flex-1 flex-col">
          <PublicPortalHeader onOpenMenu={() => setMobileOpen(true)} />
          <main id="main" className="min-w-0 flex-1 overflow-x-hidden">
            <div className="mx-auto max-w-[1440px] px-3.5 py-5 xs:px-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      <Toaster theme={theme} position="bottom-right" closeButton toastOptions={{ className: 'font-sans text-[13px]' }} />
    </div>
    </FacultyPortalProvider>
  );
}
