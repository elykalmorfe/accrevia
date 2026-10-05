import { useEffect, useState } from 'react';
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

  // Segment items into Main Menu vs Account / System to match reference image
  const mainMenu = items.filter((i) => !['User Management', 'System Settings'].includes(i.label));
  const accountMenu = items.filter((i) => ['User Management', 'System Settings'].includes(i.label));

  return (
    <nav className="flex min-h-full flex-col px-4 py-5" aria-label={isAdmin ? 'Administrator navigation' : 'User navigation'}>
      {/* SECTION: MAIN MENU */}
      <div className="mb-6">
        <p className="px-3 pb-2 text-[11px] font-bold tracking-wider text-ink-subtle uppercase">
          Main Menu
        </p>
        <ul className="space-y-1">
          {mainMenu.map((item) => {
            const active = isItemActive(item, pathname);
            const isOpen = !!expanded[item.label];
            const Icon = item.icon;
            return (
              <li key={item.label}>
                <div
                  className={`group flex items-center rounded-xl transition-all duration-150 ${
                    active && !item.children
                      ? 'bg-brand-50 text-brand-600 font-semibold shadow-sm shadow-brand-500/10'
                      : 'text-ink-muted hover:bg-slate-50 hover:text-ink font-medium'
                  }`}
                >
                  <Link
                    to={item.to}
                    onClick={() => item.children && setExpanded((prev) => ({ ...prev, [item.label]: true }))}
                    aria-current={active && !item.children ? 'page' : undefined}
                    className="flex min-w-0 flex-1 items-center gap-3 px-3.5 py-2.5 text-sm"
                  >
                    <Icon
                      className={`h-[18px] w-[18px] shrink-0 transition-colors ${
                        active && !item.children ? 'text-brand-600' : 'text-ink-subtle group-hover:text-ink'
                      }`}
                      aria-hidden="true"
                    />
                    <span className="truncate whitespace-nowrap">{item.label}</span>
                  </Link>
                  {item.children && (
                    <button
                      type="button"
                      onClick={() => setExpanded((prev) => ({ ...prev, [item.label]: !isOpen }))}
                      aria-expanded={isOpen}
                      aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${item.label}`}
                      className="mr-1.5 grid h-7 w-7 place-items-center rounded-lg text-ink-subtle hover:bg-slate-200/60 hover:text-ink transition-colors"
                    >
                      <ChevronDownIcon
                        className={`h-4 w-4 transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`}
                      />
                    </button>
                  )}
                </div>
                {item.children && isOpen && (
                  <ul className="my-1 ml-5 space-y-1 border-l-2 border-slate-100 pl-3">
                    {item.children.map((child) => {
                      const childActive = pathname === child.to;
                      return (
                        <li key={child.to}>
                          <Link
                            to={child.to}
                            aria-current={childActive ? 'page' : undefined}
                            className={`flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-[13px] transition-all duration-150 ${
                              childActive
                                ? 'bg-brand-50 font-bold text-brand-600'
                                : 'text-ink-muted hover:bg-slate-50 hover:text-ink'
                            }`}
                          >
                            <span className="truncate whitespace-nowrap">{child.label}</span>
                            {child.showPendingCount && pending.length > 0 && (
                              <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-bold tabular-nums text-brand-700">
                                {pending.length}
                              </span>
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* SECTION: ACCOUNT & SYSTEM (Reference's "ACCOUNT" section) */}
      {accountMenu.length > 0 && (
        <div className="mb-4">
          <p className="px-3 pb-2 text-[11px] font-bold tracking-wider text-ink-subtle uppercase">
            Account & System
          </p>
          <ul className="space-y-1">
            {accountMenu.map((item) => {
              const active = isItemActive(item, pathname);
              const Icon = item.icon;
              return (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    aria-current={active ? 'page' : undefined}
                    className={`group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-all duration-150 ${
                      active
                        ? 'bg-brand-50 text-brand-600 font-semibold shadow-sm shadow-brand-500/10'
                        : 'text-ink-muted hover:bg-slate-50 hover:text-ink font-medium'
                    }`}
                  >
                    <Icon
                      className={`h-[18px] w-[18px] shrink-0 transition-colors ${
                        active ? 'text-brand-600' : 'text-ink-subtle group-hover:text-ink'
                      }`}
                      aria-hidden="true"
                    />
                    <span className="truncate whitespace-nowrap">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* BOTTOM USER PROFILE CARD (Directly matching reference "Peaky Blinders / Sales Marketing") */}
      <div className="mt-auto pt-4 border-t border-slate-100">
        <div className="flex items-center gap-3 rounded-2xl p-2 hover:bg-slate-50 transition-colors cursor-pointer group">
          <div className="relative">
            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-brand-600 to-sky-400 p-[2px] shadow-sm">
              <div className="h-full w-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                <span className="text-xs font-black text-brand-700">
                  {currentUser?.name?.split(' ').map((n: string) => n[0]).slice(0, 2).join('') || 'QA'}
                </span>
              </div>
            </div>
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-success-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-ink group-hover:text-brand-600 transition-colors">
              {currentUser?.name || 'Director Roberto M.'}
            </p>
            <p className="truncate text-[11px] text-ink-subtle">
              {currentUser?.role || 'QA Director'} · NEMSU
            </p>
          </div>
          <ChevronDownIcon className="h-4 w-4 text-ink-subtle group-hover:text-ink transition-colors" />
        </div>
      </div>
    </nav>
  );
}