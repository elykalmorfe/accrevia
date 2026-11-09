import React, { ReactNode, useEffect, useId, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { XIcon } from 'lucide-react';
import { easeOut } from '../../utils/motion';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'md' | 'lg' | 'xl';
  zIndex?: string;
}

const sizes = { md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

// Stacked modals: Escape only closes the most recently opened one.
const openModalStack: string[] = [];

export function Modal({ open, onClose, title, description, children, footer, size = 'md', zIndex = 'z-50' }: ModalProps) {
  const titleId = useId();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    openModalStack.push(titleId);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && openModalStack[openModalStack.length - 1] === titleId) onCloseRef.current();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      const idx = openModalStack.lastIndexOf(titleId);
      if (idx !== -1) openModalStack.splice(idx, 1);
      // Reliably restore body scroll whenever all stacked modals are closed
      if (openModalStack.length === 0) {
        document.body.style.overflow = '';
      }
    };
  }, [open, titleId]);

  return (
    <AnimatePresence>
      {open && (
        <div className={`fixed inset-0 ${zIndex} flex items-end justify-center overflow-y-auto p-0 sm:items-center sm:p-4`}>
          <motion.div
            className="fixed inset-0 bg-ink/50 backdrop-blur-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className={`relative flex max-h-[92vh] sm:max-h-[calc(100vh-4rem)] w-full min-h-0 flex-col overflow-hidden rounded-t-3xl sm:rounded-2xl border border-line bg-white shadow-2xl pb-safe sm:pb-0 ${sizes[size]}`}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.22, ease: easeOut }}
          >
            {/* Mobile Sheet Pull Bar */}
            <div className="flex sm:hidden justify-center pt-2.5 pb-1">
              <div className="h-1.5 w-12 rounded-full bg-slate-300/80" />
            </div>

            {(title || description) ? (
              <div className="flex items-start justify-between gap-3 border-b border-line px-4 sm:px-6 py-3.5 sm:py-4">
                <div className="min-w-0 flex-1">
                  {title && (
                    <h2 id={titleId} className="text-base sm:text-lg font-bold text-ink truncate">
                      {title}
                    </h2>
                  )}
                  {description && <p className="mt-0.5 text-xs sm:text-[13px] text-ink-muted line-clamp-2">{description}</p>}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-ghost btn-icon -mr-1.5 h-10 w-10 sm:h-9 sm:w-9 shrink-0 text-ink-muted hover:text-ink"
                  aria-label="Close dialog"
                >
                  <XIcon className="h-4.5 w-4.5 sm:h-4 sm:w-4" />
                </button>
              </div>
            ) : (
              <div className="flex justify-end px-4 pt-3 pb-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-ghost btn-icon text-ink-muted hover:text-ink"
                  aria-label="Close dialog"
                >
                  <XIcon className="h-4.5 w-4.5 sm:h-4 sm:w-4" />
                </button>
              </div>
            )}
            <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5 overscroll-contain">{children}</div>
            {footer && (
              <div className="flex flex-col-reverse sm:flex-row flex-wrap sm:justify-end gap-2 border-t border-line px-4 py-3 sm:px-6 sm:py-4 bg-slate-50/60 sm:bg-transparent">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>);

}