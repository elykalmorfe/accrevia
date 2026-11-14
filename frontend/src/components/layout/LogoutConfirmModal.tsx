import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { LogOutIcon, XIcon } from 'lucide-react';
import { toast } from 'sonner';
import { usePortal } from '../../contexts/PortalContext';
import { initials } from '../../utils/format';
import { endSession } from '../../utils/auth';
import { easeOut } from '../../utils/motion';

export function LogoutConfirmModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { currentUser } = usePortal();
  const navigate = useNavigate();
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', onKey);

    const t = window.setTimeout(() => {
      panelRef.current?.querySelector<HTMLElement>('[data-modal-initial-focus]')?.focus();
    }, 0);

    return () => {
      window.clearTimeout(t);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  const confirm = () => {
    onClose();
    endSession();
    toast.success('You have been logged out.');
    navigate('/', { replace: true });
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4">
          <motion.div
            className="fixed inset-0 bg-slate-950/45 backdrop-blur-[6px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            className="relative w-full max-w-[400px] overflow-hidden rounded-t-3xl border border-line/80 bg-surface/90 shadow-soft-lg backdrop-blur-xl sm:rounded-2xl dark:border-white/10 dark:bg-surface/85"
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.22, ease: easeOut }}
          >
            <div className="flex items-start justify-between gap-3 px-5 pb-1 pt-5 sm:px-6 sm:pt-6">
              <div className="min-w-0">
                <h2 id={titleId} className="text-[1.15rem] font-bold tracking-tight text-ink">
                  Log out?
                </h2>
                <p id={descriptionId} className="mt-1 text-[13px] leading-relaxed text-ink-muted">
                  You will be signed out of Accrevia on this device.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                data-modal-initial-focus
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-subtle transition hover:bg-canvas hover:text-ink"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3 rounded-xl border border-line/70 bg-canvas/70 px-3.5 py-3 dark:border-white/10 dark:bg-white/[0.04]">
                <span
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-700 text-[13px] font-semibold tracking-wide text-white shadow-sm"
                  aria-hidden="true"
                >
                  {initials(currentUser.name)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-semibold text-ink">{currentUser.name}</p>
                  <p className="mt-0.5 truncate text-[12px] text-ink-muted">
                    <span className="font-medium text-ink-subtle">{currentUser.role}</span>
                    <span className="mx-1.5 text-ink-subtle/50">·</span>
                    {currentUser.email}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-line/70 px-5 py-4 sm:px-6 dark:border-white/10">
              <button type="button" onClick={onClose} className="btn btn-secondary btn-sm min-w-[5.5rem]">
                Cancel
              </button>
              <button type="button" onClick={confirm} className="btn btn-primary btn-sm min-w-[6.5rem]">
                <LogOutIcon className="h-3.5 w-3.5" />
                Log out
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
