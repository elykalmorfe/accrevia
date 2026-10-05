import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { XIcon } from 'lucide-react';
import { Toaster } from 'sonner';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Brand } from './Brand';
import { easeOut } from '../../utils/motion';

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    setMobileOpen(false);
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-screen w-full bg-canvas">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:shadow">
        
        Skip to content
      </a>
      <Header onOpenMenu={() => setMobileOpen(true)} />
      <div className="flex">
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 xl:w-72 shrink-0 overflow-y-auto border-r border-slate-100 bg-white lg:block">
          <Sidebar />
        </aside>

        <AnimatePresence>
          {mobileOpen &&
          <>
              <motion.div
              className="fixed inset-0 z-40 bg-ink/40 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              aria-hidden="true" />
            
              <motion.aside
              className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col overflow-y-auto bg-white shadow-xl lg:hidden"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.25, ease: easeOut }}>
              
                <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-4">
                  <Brand showSubtitle={false} />
                  <button type="button" onClick={() => setMobileOpen(false)} className="btn btn-ghost btn-icon" aria-label="Close navigation">
                    <XIcon className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex-1">
                  <Sidebar />
                </div>
              </motion.aside>
            </>
          }
        </AnimatePresence>

        <main id="main" className="min-w-0 flex-1">
          <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <Outlet />
          </div>
        </main>
      </div>
      <Toaster position="bottom-right" closeButton toastOptions={{ className: 'font-sans text-[13px]' }} />
    </div>);

}