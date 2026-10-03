import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { EllipsisIcon, BoxIcon } from "lucide-react";
export interface RowAction {
  label: string;
  icon: BoxIcon;
  onSelect: () => void;
  tone?: 'danger';
}
const MENU_WIDTH = 200;
export function RowActionsMenu({
  actions,
  label



}: {actions: RowAction[];label: string;}) {
  const [position, setPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setPosition(null), []);
  const toggle = () => {
    if (position) return close();
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const height = actions.length * 36 + 8;
    const top = rect.bottom + height + 8 > window.innerHeight ? rect.top - height - 4 : rect.bottom + 4;
    setPosition({
      top,
      left: Math.max(8, rect.right - MENU_WIDTH)
    });
  };
  useEffect(() => {
    if (!position) return;
    const onPointer = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!menuRef.current?.contains(target) && !buttonRef.current?.contains(target)) close();
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [position, close]);
  return <>
      <button ref={buttonRef} type="button" onClick={toggle} aria-haspopup="menu" aria-expanded={!!position} aria-label={label} className="btn btn-ghost btn-icon">
        <EllipsisIcon className="h-4 w-4" />
      </button>
      {position && createPortal(<div ref={menuRef} role="menu" style={{
      top: position.top,
      left: position.left,
      width: MENU_WIDTH
    }} className="fixed z-50 rounded-md border border-line bg-white py-1 shadow-lg">
            {actions.map((action) => <button key={action.label} type="button" role="menuitem" onClick={() => {
        close();
        action.onSelect();
      }} className={`flex h-9 w-full items-center gap-2.5 px-3 text-left text-[13px] hover:bg-canvas ${action.tone === 'danger' ? 'text-danger-700' : 'text-ink'}`}>
                <action.icon className="h-4 w-4 opacity-70" aria-hidden="true" />
                {action.label}
              </button>)}
          </div>, document.body)}
    </>;
}