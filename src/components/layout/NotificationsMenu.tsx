import React, { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { BellIcon } from 'lucide-react';
import { useDismiss } from '../../hooks/useDismiss';
import { notifications } from '../../data/analytics';
import { popoverMotion } from '../../utils/motion';

export function NotificationsMenu() {
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
        aria-label={`Notifications, ${notifications.length} new`}
        className="btn btn-ghost btn-icon relative h-9 w-9">
        
        <BellIcon className="h-[18px] w-[18px]" />
        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger-600 ring-2 ring-white" aria-hidden="true" />
      </button>
      <AnimatePresence>
        {open &&
        <motion.div
          {...popoverMotion}
          role="menu"
          className="absolute right-0 top-full z-40 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-lg border border-line bg-white shadow-lg">
          
            <div className="border-b border-line px-4 py-3 text-sm font-semibold text-ink">Notifications</div>
            <ul className="divide-y divide-line">
              {notifications.map((n) =>
            <li key={n.id}>
                  <Link to={n.to} role="menuitem" onClick={close} className="block px-4 py-3 hover:bg-canvas">
                    <p className="text-[13px] font-medium text-ink">{n.title}</p>
                    <p className="mt-0.5 text-xs text-ink-muted">{n.detail}</p>
                    <p className="mt-1 text-[11px] text-ink-subtle">{n.time}</p>
                  </Link>
                </li>
            )}
            </ul>
          </motion.div>
        }
      </AnimatePresence>
    </div>);

}