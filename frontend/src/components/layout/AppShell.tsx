import React, { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon, ShieldAlertIcon, XIcon } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Brand } from './Brand';
import { easeOut } from '../../utils/motion';
import { usePortal } from '../../contexts/PortalContext';
import { usePortalSettings } from '../../settings/portalSettings';
import { useTheme } from '../../hooks/useTheme';
import { useSessionAccount } from '../../utils/auth';

export function AppShell() {
  const { sidebarCollapsed, toggleSidebar, currentUser, switchUser } = usePortal();
  usePortalSettings();
  const { resolved: theme } = useTheme();
  const session = useSessionAccount();
  const [passwordBannerDismissed, setPasswordBannerDismissed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();
  const fullBleed = pathname.startsWith('/requests');

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
    <div className="min-h-screen w-full">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-surface focus:px-3 focus:py-2 focus:text-sm focus:shadow">

        Skip to content
      </a>
      <div className="flex min-h-screen">
        <div
          className={`sticky top-0 z-40 hidden h-screen shrink-0 transition-[width] duration-200 ease-out lg:block ${sidebarCollapsed ? 'w-[76px]' : 'w-[280px] xl:w-[300px]'
            }`}
        >
          <aside className="glass flex h-full flex-col border-r shadow-[1px_0_12px_0_rgb(var(--shadow-color)/0.04)]">
            <div
              className={`flex h-16 shrink-0 items-center overflow-hidden border-b border-line-subtle ${sidebarCollapsed ? 'justify-center px-2' : 'px-5'
                }`}
            >
              <Brand compact={sidebarCollapsed} />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
              <Sidebar collapsed={sidebarCollapsed} />
            </div>
          </aside>
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="absolute -right-3 top-5 grid h-6 w-6 place-items-center rounded-full border border-line bg-surface text-ink-muted shadow-sm transition hover:border-brand-300 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            {sidebarCollapsed ? <ChevronRightIcon className="h-3.5 w-3.5" /> : <ChevronLeftIcon className="h-3.5 w-3.5" />}
          </button>
        </div>

        <AnimatePresence>
          {mobileOpen &&
            <>
              <motion.div
                className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setMobileOpen(false)}
                aria-hidden="true" />

              <motion.aside
                className="fixed left-0 top-0 z-50 flex h-dvh w-[86vw] max-w-[300px] flex-col overflow-y-auto border-r border-line-subtle bg-surface shadow-soft-lg lg:hidden"
                role="dialog"
                aria-modal="true"
                aria-label="Navigation"
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ duration: 0.25, ease: easeOut }}>

                <div className="flex h-16 shrink-0 items-center justify-between border-b border-line-subtle px-4">
                  <Brand showSubtitle={false} />
                  <button type="button" onClick={() => setMobileOpen(false)} className="btn btn-ghost btn-icon" aria-label="Close navigation">
                    <XIcon className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex-1">
                  <Sidebar collapsed={false} />
                </div>
              </motion.aside>
            </>
          }
        </AnimatePresence>

        <div className="flex min-w-0 flex-1 flex-col">
          {currentUser.id !== 'u-01' && currentUser.id !== 'u-00' && (
            <div className="bg-brand-700 text-white text-xs py-1.5 px-4 flex items-center justify-between shadow-xs z-30">
              <div className="flex items-center gap-2 truncate">
                <span className="font-semibold">Active Session:</span>
                <span className="truncate">{currentUser.name} ({currentUser.role})</span>
                <span className="opacity-60 hidden sm:inline">•</span>
                <span className="text-[11px] opacity-90 hidden sm:inline">
                  {currentUser.allowedFeatures ? `${currentUser.allowedFeatures.length} system features enabled` : 'Full System Access'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  switchUser('u-01');
                  toast.success('Returned to Administrator account');
                }}
                className="text-xs py-0.5 px-2.5 rounded bg-white/15 hover:bg-white/25 text-white transition-colors shrink-0 font-medium ml-2"
              >
                Return to Admin
              </button>
            </div>
          )}
          <Header onOpenMenu={() => setMobileOpen(true)} />
          <main id="main" className="min-w-0 flex-1">
            <div className={`mx-auto px-3.5 py-5 xs:px-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8 ${fullBleed ? 'max-w-none' : 'max-w-[1440px]'}`}>
              {session?.mustChangePassword && !passwordBannerDismissed &&
              <div role="alert" className="mb-5 flex flex-wrap items-center gap-3 rounded-lg border border-warning-100 bg-warning-50 px-4 py-3 text-[13px] text-warning-700">
                  <ShieldAlertIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <p className="flex-1">You are using the default administrator password. Change it now to secure the system.</p>
                  <div className="flex items-center gap-1.5">
                    <Link to="/account?tab=settings" className="btn btn-primary btn-sm">Change password</Link>
                    <button
                      type="button"
                      onClick={() => setPasswordBannerDismissed(true)}
                      className="grid h-8 w-8 place-items-center rounded-md text-warning-700 transition-colors hover:bg-warning-100"
                      aria-label="Dismiss password reminder"
                      title="Dismiss">
                      <XIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              }
              <Outlet />
            </div>
          </main>
        </div>
      </div>
      <Toaster theme={theme} position="bottom-right" closeButton toastOptions={{ className: 'font-sans text-[13px]' }} />
    </div>);

}