import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDownIcon, SparklesIcon } from 'lucide-react';
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
    Object.fromEntries(
      items.filter((n) => n.children).map((n) => [n.label, isItemActive(n, pathname)])
    )
  );

  useEffect(() => {
    const activeGroup = items.find((n) => n.children && isItemActive(n, pathname));
    if (activeGroup) {
      setExpanded((prev) => (prev[activeGroup.label] ? prev : { ...prev, [activeGroup.label]: true }));
    }
  }, [pathname, items]);

  // Segment items into Main Menu vs Account & System
  const mainMenu = items.filter((i) => !['Users', 'Settings'].includes(i.label));
  const accountMenu = items.filter((i) => ['Users', 'Settings'].includes(i.label));

  return (
    <nav
      className="flex min-h-full flex-col px-3.5 py-4 select-none"
      aria-label={isAdmin ? 'Administrator navigation' : 'User navigation'}
    >
      {/* SECTION: NAVIGATION */}
      <div className="mb-5">
        <div className="flex items-center justify-between px-3 pb-2 pt-1">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-600" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Menu
            </span>
          </div>
        </div>

        <ul className="space-y-1">
          {mainMenu.map((item) => {
            const hasActiveChild = item.children?.some((c) => pathname === c.to);
            const active = isItemActive(item, pathname) || hasActiveChild;
            const isOpen = !!expanded[item.label];
            const Icon = item.icon;

            return (
              <li key={item.label} className="relative">
                {active && (
                  <span
                    className="absolute -left-2 top-2 bottom-2 w-1 rounded-r-full bg-brand-600 shadow-sm shadow-brand-500/50 z-10"
                    aria-hidden="true"
                  />
                )}
                <div
                  className={`group flex items-center justify-between rounded-xl px-2 py-1.5 transition-all duration-150 ${
                    active && !item.children
                      ? 'bg-brand-50/90 text-brand-950 font-bold border border-brand-200/80 shadow-2xs'
                      : active && item.children
                      ? 'bg-slate-50/90 text-brand-900 font-bold border border-slate-200/70'
                      : 'text-slate-700 hover:bg-slate-100/70 hover:text-slate-950 border border-transparent font-medium'
                  }`}
                >
                  <Link
                    to={item.to}
                    onClick={() => {
                      if (item.children) {
                        setExpanded((prev) => ({ ...prev, [item.label]: true }));
                      }
                    }}
                    aria-current={active && !item.children ? 'page' : undefined}
                    className="flex min-w-0 flex-1 items-center gap-3 py-1 text-sm"
                  >
                    <div
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg border transition-all duration-200 ${
                        active && !item.children
                          ? 'bg-brand-600 text-white border-brand-600 shadow-sm shadow-brand-500/30'
                          : active && item.children
                          ? 'bg-brand-100 text-brand-700 border-brand-200'
                          : `${item.color.iconBg} ${item.color.iconColor} ${item.color.border}`
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    </div>

                    <span className="text-[13px] font-semibold leading-tight text-slate-800 group-hover:text-slate-950 truncate">
                      {item.label}
                    </span>
                  </Link>

                  {/* Context Badges */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.label === 'Documents' && pending.length > 0 && (
                      <span
                        className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 text-[10px] font-bold"
                        title={`${pending.length} pending review`}
                      >
                        {pending.length}
                      </span>
                    )}

                    {item.badge && (!pending.length || item.label !== 'Documents') && (
                      <span className="hidden xl:inline-flex rounded-md bg-slate-100 text-slate-600 border border-slate-200/80 px-1.5 py-0.2 text-[9.5px] font-semibold">
                        {item.badge}
                      </span>
                    )}

                    {/* Expandable Chevron Toggle Button */}
                    {item.children && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setExpanded((prev) => ({ ...prev, [item.label]: !isOpen }));
                        }}
                        aria-expanded={isOpen}
                        aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${item.label}`}
                        className="grid h-6 w-6 place-items-center rounded-md text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition-colors"
                      >
                        <ChevronDownIcon
                          className={`h-3.5 w-3.5 transition-transform duration-200 ${
                            isOpen ? 'rotate-180 text-brand-600' : '-rotate-90'
                          }`}
                        />
                      </button>
                    )}
                  </div>
                </div>

                {/* Submenu Tree Items */}
                {item.children && isOpen && (
                  <ul className="my-1 ml-5 space-y-0.5 border-l border-slate-200 pl-2.5">
                    {item.children.map((child) => {
                      const childActive = pathname === child.to;
                      return (
                        <li key={child.to}>
                          <Link
                            to={child.to}
                            aria-current={childActive ? 'page' : undefined}
                            className={`group/child flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-[12px] transition-all duration-150 ${
                              childActive
                                ? 'bg-brand-50 text-brand-700 font-bold shadow-2xs border border-brand-200/60'
                                : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-950 font-medium'
                            }`}
                          >
                            <span className="truncate">{child.label}</span>

                            {child.showPendingCount && pending.length > 0 && (
                              <span className="rounded-full bg-amber-500 text-white px-1.5 py-0.2 text-[10px] font-bold tabular-nums">
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

      {/* SECTION: SYSTEM */}
      {accountMenu.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between px-3 pb-2 pt-1">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                System
              </span>
            </div>
          </div>

          <ul className="space-y-1">
            {accountMenu.map((item) => {
              const active = isItemActive(item, pathname);
              const Icon = item.icon;

              return (
                <li key={item.label} className="relative">
                  {active && (
                    <span
                      className="absolute -left-2 top-2 bottom-2 w-1 rounded-r-full bg-brand-600 shadow-sm shadow-brand-500/50 z-10"
                      aria-hidden="true"
                    />
                  )}
                  <Link
                    to={item.to}
                    aria-current={active ? 'page' : undefined}
                    className={`group flex items-center justify-between rounded-xl px-2 py-1.5 transition-all duration-150 ${
                      active
                        ? 'bg-brand-50/90 text-brand-950 font-bold border border-brand-200/80 shadow-2xs'
                        : 'text-slate-700 hover:bg-slate-100/70 hover:text-slate-950 border border-transparent font-medium'
                    }`}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3 py-1 text-sm">
                      <div
                        className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg border transition-all duration-200 ${
                          active
                            ? 'bg-brand-600 text-white border-brand-600 shadow-sm shadow-brand-500/30'
                            : `${item.color.iconBg} ${item.color.iconColor} ${item.color.border}`
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                      </div>
                      <span className="text-[13px] font-semibold leading-tight text-slate-800 group-hover:text-slate-950 truncate">
                        {item.label}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* USER PROFILE CARD */}
      <div className="mt-auto border-t border-slate-100 pt-3">
        <Link
          to="/account"
          className="flex items-center gap-3 rounded-xl p-2 hover:bg-slate-50 transition-colors group border border-transparent hover:border-slate-200/60"
        >
          <div className="relative">
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-brand-600 to-sky-400 p-[2px] shadow-sm">
              <div className="h-full w-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                <span className="text-xs font-black text-brand-700">
                  {currentUser?.name
                    ?.split(' ')
                    .map((n: string) => n[0])
                    .slice(0, 2)
                    .join('') || 'QA'}
                </span>
              </div>
            </div>
            <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full border-2 border-white bg-emerald-600" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
              {currentUser?.name || 'Director Roberto M.'}
            </p>
            <p className="truncate text-[11px] text-slate-500 font-medium">
              {currentUser?.role || 'QA Director'}
            </p>
          </div>
        </Link>
      </div>
    </nav>
  );
}