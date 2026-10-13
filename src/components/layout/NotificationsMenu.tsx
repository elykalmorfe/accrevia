import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { BellIcon, XIcon } from 'lucide-react';
import { useDismiss } from '../../hooks/useDismiss';
import { usePortal } from '../../contexts/PortalContext';
import { popoverMotion } from '../../utils/motion';

export function NotificationsMenu() {
  const { notifications, dismissNotification } = usePortal();
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
        {notifications.length > 0 && (
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger-600 ring-2 ring-white" aria-hidden="true" />
        )}
      </button>
      <AnimatePresence>
        {open &&
        <motion.div
          {...popoverMotion}
          role="menu"
          className="absolute right-0 top-full z-40 mt-2 w-[min(24rem,calc(100vw-2rem))] rounded-lg border border-line bg-white shadow-lg">
          
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <span className="text-sm font-semibold text-ink">Notifications ({notifications.length})</span>
              {notifications.length > 0 && (
                <span className="text-[11px] text-ink-subtle">Real-time alerts</span>
              )}
            </div>
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-ink-muted">
                No new notifications.
              </div>
            ) : (
              <ul className="max-h-80 overflow-y-auto divide-y divide-line">
                {notifications.map((n) =>
                  <li key={n.id} className="group relative flex items-start justify-between p-3.5 hover:bg-canvas">
                    <Link to={n.to} role="menuitem" onClick={close} className="flex-1 pr-2">
                      <p className="text-[13px] font-semibold text-ink group-hover:text-brand-700">{n.title}</p>
                      <p className="mt-0.5 text-xs text-ink-muted leading-relaxed">{n.detail}</p>
                      <p className="mt-1 text-[11px] text-brand-600 font-medium">{n.time}</p>
                    </Link>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        dismissNotification(n.id);
                      }}
                      className="text-ink-subtle hover:text-ink p-1 rounded"
                      title="Dismiss notification"
                    >
                      <XIcon className="h-3.5 w-3.5" />
                    </button>
                  </li>
                )}
              </ul>
            )}
          </motion.div>
        }
      </AnimatePresence>
    </div>);
}