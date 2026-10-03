import React, { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDownIcon, LogOutIcon, UserCogIcon, UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import { usePortal } from '../../contexts/PortalContext';
import { useDismiss } from '../../hooks/useDismiss';
import { popoverMotion } from '../../utils/motion';
import { initials } from '../../utils/format';

export function ProfileMenu() {
  const { currentUser } = usePortal();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const ref = useDismiss<HTMLDivElement>(open, close);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2.5 rounded-md py-1 pl-1 pr-1.5 transition-colors duration-150 hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
        
        <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-700 text-xs font-semibold text-white" aria-hidden="true">
          {initials(currentUser.name)}
        </span>
        <span className="hidden text-left leading-tight md:block">
          <span className="block whitespace-nowrap text-[13px] font-medium text-ink">{currentUser.name}</span>
          <span className="block text-[11px] text-ink-muted">{currentUser.role}</span>
        </span>
        <ChevronDownIcon className="hidden h-4 w-4 text-ink-subtle md:block" aria-hidden="true" />
        <span className="sr-only">Open profile menu</span>
      </button>
      <AnimatePresence>
        {open &&
        <motion.div {...popoverMotion} role="menu" className="absolute right-0 top-full z-40 mt-2 w-60 rounded-lg border border-line bg-white py-1 shadow-lg">
            <div className="border-b border-line px-4 py-3">
              <p className="text-[13px] font-medium text-ink">{currentUser.name}</p>
              <p className="text-xs text-ink-muted">{currentUser.email}</p>
            </div>
            <Link to="/account" role="menuitem" onClick={close} className="flex h-9 items-center gap-2.5 px-4 text-[13px] text-ink hover:bg-canvas">
              <UserIcon className="h-4 w-4 text-ink-subtle" aria-hidden="true" /> My Profile
            </Link>
            <Link to="/account?tab=settings" role="menuitem" onClick={close} className="flex h-9 items-center gap-2.5 px-4 text-[13px] text-ink hover:bg-canvas">
              <UserCogIcon className="h-4 w-4 text-ink-subtle" aria-hidden="true" /> Account Settings
            </Link>
            <div className="my-1 border-t border-line" />
            <button
            type="button"
            role="menuitem"
            onClick={() => {close();toast('You have been signed out of the prototype session.');}}
            className="flex h-9 w-full items-center gap-2.5 px-4 text-left text-[13px] text-danger-700 hover:bg-canvas">
            
              <LogOutIcon className="h-4 w-4" aria-hidden="true" /> Logout
            </button>
          </motion.div>
        }
      </AnimatePresence>
    </div>);

}