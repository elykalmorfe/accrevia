import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { RowAction } from './RowActionsMenu';

const MENU_WIDTH = 200;
const VIEWPORT_GAP = 8;

export interface ContextMenuAnchor {
  /** Preferred top-left corner of the menu, in viewport coordinates. */
  x: number;
  y: number;
  /** Bottom edge to use when there is no room below and the menu opens upward; defaults to `y`. */
  flipY?: number;
  /** Element that opened the menu; clicks on it are left to its own toggle handler. */
  trigger?: HTMLElement | null;
}

/**
 * Floating action menu opened at a point (right-click) or below a trigger button.
 * Shares the look of RowActionsMenu and flips/clamps itself to stay inside the viewport.
 */
export function ContextActionsMenu({
  anchor,
  actions,
  label,
  onClose
}: {anchor: ContextMenuAnchor | null;actions: RowAction[];label: string;onClose: () => void;}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{top: number;left: number;} | null>(null);

  useLayoutEffect(() => {
    if (!anchor || !menuRef.current) {
      setPosition(null);
      return;
    }
    const { offsetWidth: width, offsetHeight: height } = menuRef.current;
    const maxLeft = window.innerWidth - width - VIEWPORT_GAP;
    const maxTop = window.innerHeight - height - VIEWPORT_GAP;
    const left = Math.max(VIEWPORT_GAP, Math.min(anchor.x, maxLeft));
    const top = anchor.y > maxTop ? Math.max(VIEWPORT_GAP, (anchor.flipY ?? anchor.y) - height) : anchor.y;
    setPosition({ top, left });
  }, [anchor]);

  useEffect(() => {
    if (position) menuRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus({ preventScroll: true });
  }, [position]);

  useEffect(() => {
    if (!anchor) return;
    const onPointer = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuRef.current?.contains(target) || anchor.trigger?.contains(target)) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        anchor.trigger?.focus();
        return;
      }
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      const items = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? []);
      if (!items.length) return;
      e.preventDefault();
      const current = items.indexOf(document.activeElement as HTMLButtonElement);
      const next = e.key === 'ArrowDown' ? (current + 1) % items.length : (current - 1 + items.length) % items.length;
      items[next].focus();
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onClose, true);
    window.addEventListener('resize', onClose);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onClose, true);
      window.removeEventListener('resize', onClose);
    };
  }, [anchor, onClose]);

  if (!anchor) return null;
  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      aria-label={label}
      style={{ top: position?.top ?? anchor.y, left: position?.left ?? anchor.x, width: MENU_WIDTH, visibility: position ? 'visible' : 'hidden' }}
      className="fixed z-50 rounded-md border border-line bg-white py-1 shadow-lg"
      onContextMenu={(e) => e.preventDefault()}>
      
      {actions.map((action) =>
      <button
        key={action.label}
        type="button"
        role="menuitem"
        onClick={() => {
          onClose();
          action.onSelect();
        }}
        className={`flex h-9 w-full items-center gap-2.5 px-3 text-left text-[13px] hover:bg-canvas focus:bg-canvas focus:outline-none ${action.tone === 'danger' ? 'text-danger-700' : 'text-ink'}`}>
        
          <action.icon className="h-4 w-4 opacity-70" aria-hidden="true" />
          {action.label}
        </button>
      )}
    </div>,
    document.body
  );
}
