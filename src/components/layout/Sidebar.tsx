import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDownIcon } from 'lucide-react';
import { navigation, NavItem, userNavigation } from '../../data/navigation';
import { usePortal } from '../../contexts/PortalContext';

function isItemActive(item: NavItem, pathname: string) {
  if (item.matchPrefix) return pathname.startsWith(item.matchPrefix);
  return pathname === item.to;
}

export function Sidebar() {
  const { pathname } = useLocation();
  const { pending, isAdmin, currentUser } = usePortal();
  const items = isAdmin ? navigation : userNavigation;
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
  Object.fromEntries(items.filter((n) => n.children).map((n) => [n.label, isItemActive(n, pathname)]))
  );

  useEffect(() => {
    const activeGroup = items.find((n) => n.children && isItemActive(n, pathname));
    if (activeGroup) setExpanded((prev) => prev[activeGroup.label] ? prev : { ...prev, [activeGroup.label]: true });
  }, [pathname, items]);

  return (
    <nav className="flex min-h-full flex-col px-3 py-4" aria-label={isAdmin ? 'Administrator navigation' : 'My Accrevia navigation'}>
      <p className="px-3 pb-2 text-xs font-medium text-ink-subtle">{isAdmin ? 'Administrator Portal' : 'My Accrevia'}</p>
      <ul className="space-y-0.5">
        {items.map((item) => {
          const active = isItemActive(item, pathname);
          const isOpen = !!expanded[item.label];
          const Icon = item.icon;
          return (
            <li key={item.label}>
              <div className={`group flex items-center rounded-md transition-colors duration-150 ${active && !item.children ? 'bg-brand-50' : 'hover:bg-canvas'}`}>
                <Link
                  to={item.to}
                  onClick={() => item.children && setExpanded((prev) => ({ ...prev, [item.label]: true }))}
                  aria-current={active && !item.children ? 'page' : undefined}
                  className={`flex min-w-0 flex-1 items-center gap-3 px-3 py-2 text-sm ${active ? 'font-semibold text-brand-700' : 'font-medium text-ink'}`}>
                  
                  <Icon className={`h-[18px] w-[18px] shrink-0 ${active ? 'text-brand-600' : 'text-ink-subtle'}`} aria-hidden="true" />
                  <span className="truncate whitespace-nowrap">{item.label}</span>
                </Link>
                {item.children &&
                <button
                  type="button"
                  onClick={() => setExpanded((prev) => ({ ...prev, [item.label]: !isOpen }))}
                  aria-expanded={isOpen}
                  aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${item.label}`}
                  className="mr-1 grid h-7 w-7 place-items-center rounded text-ink-subtle hover:bg-line hover:text-ink">
                  
                    <ChevronDownIcon className={`h-4 w-4 transition-transform duration-150 ${isOpen ? '' : '-rotate-90'}`} />
                  </button>
                }
              </div>
              {item.children && isOpen &&
              <ul className="mb-1 ml-[22px] mt-0.5 space-y-0.5 border-l border-line pl-3">
                  {item.children.map((child) => {
                  const childActive = pathname === child.to;
                  return (
                    <li key={child.to}>
                        <Link
                        to={child.to}
                        aria-current={childActive ? 'page' : undefined}
                        className={`flex items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-[13px] transition-colors duration-150 ${
                        childActive ? 'bg-brand-50 font-medium text-brand-700' : 'text-ink-muted hover:bg-canvas hover:text-ink'}`
                        }>
                        
                          <span className="truncate whitespace-nowrap">{child.label}</span>
                          {child.showPendingCount && pending.length > 0 &&
                        <span className="rounded-full bg-warning-50 px-1.5 text-[11px] font-semibold tabular-nums text-warning-700">{pending.length}</span>
                        }
                        </Link>
                      </li>);

                })}
                </ul>
              }
            </li>);

        })}
      </ul>
      {!isAdmin &&
      <p className="mt-4 px-3 text-xs text-ink-muted">
          Use the search bar to find evidence that has been shared with you. <kbd className="kbd">Ctrl</kbd> <kbd className="kbd">K</kbd>
        </p>
      }
      <div className="mt-auto border-t border-line px-3 pt-4 text-xs text-ink-muted">
        <p className="font-medium text-ink">NEMSU – Main Campus</p>
        <p>{isAdmin ? 'Quality Assurance Office' : `${currentUser.role} · ${currentUser.office}`}</p>
      </div>
    </nav>);

}