import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { GlobeIcon, LockIcon, MoreVerticalIcon } from 'lucide-react';
import { AttachmentAccess, AttachmentRole } from '../../types/request';

const ACCESS: { id: AttachmentAccess; label: string }[] = [
  { id: 'restricted', label: 'Restricted' },
  { id: 'anyone', label: 'Anyone' }
];

const ROLES: { id: AttachmentRole; label: string; hint: string }[] = [
  { id: 'viewer', label: 'Viewer', hint: 'Can open the file' },
  { id: 'commenter', label: 'Commenter', hint: 'Can open and reply' },
  { id: 'editor', label: 'Editor', hint: 'Can open and download' }
];

function explain(access: AttachmentAccess, role: AttachmentRole, requesterName: string, everyFile: boolean) {
  const who = access === 'anyone' ? 'Anyone signed in' : `Only ${requesterName}`;
  const files = everyFile ? 'these files' : 'this file';
  if (role === 'editor') return `${who} can open and download ${files}.`;
  if (role === 'commenter' && access === 'anyone') {
    return `Anyone signed in can open ${files}. ${requesterName} can also reply on this request.`;
  }
  if (role === 'commenter') return `${who} can open ${files} and reply on this request.`;
  return `${who} can open ${files}.`;
}

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: T;
  options: { id: T; label: string; hint?: string }[];
  onChange: (id: T) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-subtle">{label}</p>
      <div
        role="group"
        aria-label={label}
        className="grid rounded-lg border border-line-subtle bg-canvas p-0.5"
        style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      >
        {options.map((option) => {
          const active = value === option.id;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={active}
              title={option.hint ?? option.label}
              onClick={() => onChange(option.id)}
              className={`truncate rounded-md px-1.5 py-1.5 text-[12px] font-semibold transition-colors ${
                active ? 'bg-white text-brand-800 shadow-sm' : 'text-ink-muted hover:text-ink'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const MENU_WIDTH = 280;
const MENU_HEIGHT = 250;

interface ShareMenuProps {
  title: string;
  label: string;
  access: AttachmentAccess;
  role: AttachmentRole;
  requesterName: string;
  everyFile?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (next: { access: AttachmentAccess; role: AttachmentRole }) => void;
}

export function ShareMenu({
  title,
  label,
  access,
  role,
  requesterName,
  everyFile = false,
  open,
  onOpenChange,
  onChange
}: ShareMenuProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ top: number; left: number } | null>(null);

  const toggle = () => {
    if (open) {
      onOpenChange(false);
      return;
    }
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const below = rect.bottom + MENU_HEIGHT + 8 <= window.innerHeight;
    const top = below ? rect.bottom + 4 : Math.max(8, rect.top - MENU_HEIGHT - 4);
    const left = Math.max(8, Math.min(rect.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 8));
    setBox({ top, left });
    onOpenChange(true);
  };

  useEffect(() => {
    if (!open) return;
    const close = () => onOpenChange(false);
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target) && !buttonRef.current?.contains(target)) close();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
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
  }, [open, onOpenChange]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={label}
        title={label}
        onClick={toggle}
        className={`grid h-7 w-7 shrink-0 place-items-center rounded-md transition-colors ${
          open ? 'bg-brand-50 text-brand-700' : 'text-ink-subtle hover:bg-canvas hover:text-ink'
        }`}
      >
        <MoreVerticalIcon className="h-4 w-4" />
      </button>
      {open &&
        box &&
        createPortal(
          <div
            ref={menuRef}
            role="dialog"
            aria-label={title}
            style={{ top: box.top, left: box.left, width: MENU_WIDTH }}
            className="fixed z-50 rounded-xl border border-line bg-white p-3 shadow-lg"
          >
            <p className="mb-2.5 truncate text-[12px] font-semibold text-ink">{title}</p>
            <div className="space-y-3">
              <Segmented label="Who can open" value={access} options={ACCESS} onChange={(next) => onChange({ access: next, role })} />
              <Segmented label="What they can do" value={role} options={ROLES} onChange={(next) => onChange({ access, role: next })} />
              <p className="flex items-start gap-1.5 text-[12px] leading-relaxed text-ink-muted">
                {access === 'anyone' ? (
                  <GlobeIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" aria-hidden="true" />
                ) : (
                  <LockIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" aria-hidden="true" />
                )}
                <span>{explain(access, role, requesterName, everyFile)}</span>
              </p>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
