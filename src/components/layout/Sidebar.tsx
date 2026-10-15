import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  XIcon
} from 'lucide-react';
import { navigation, NavItem, userNavigation } from '../../data/navigation';
import { usePortal } from '../../contexts/PortalContext';

function isItemActive(item: NavItem, pathname: string) {
  if (item.matchPrefix) return pathname.startsWith(item.matchPrefix);
  return pathname === item.to;
}

interface HoveredMenuState {
  item: NavItem;
  top: number;
}

interface SidebarProps {
  isMobile?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isMobile = false, onClose }: SidebarProps) {
  const { pathname } = useLocation();
  const { pending, isAdmin, currentUser, sidebarCollapsed, toggleSidebar } = usePortal();
  const items = isAdmin ? navigation : userNavigation;

  // In mobile view, sidebar is always expanded; on desktop, it respects sidebarCollapsed
  const collapsed = !isMobile && sidebarCollapsed;

  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const active = items.find((n) => n.children && isItemActive(n, pathname));
    return active ? { [active.label]: true } : {};
  });

  const [hoveredMenu, setHoveredMenu] = useState<HoveredMenuState | null>(null);
  const [hoveredProfile, setHoveredProfile] = useState<{ top: number } | null>(null);
  const hoverTimeoutRef = useRef<number | null>(null);

  // Sync expanded section with active route
  useEffect(() => {
    const activeGroup = items.find((n) => n.children && isItemActive(n, pathname));
    if (activeGroup) {
      setExpanded((prev) => (prev[activeGroup.label] ? prev : { [activeGroup.label]: true }));
    }
  }, [pathname, items]);

  const toggleAccordion = (label: string) => {
    setExpanded((prev) => {
      const isOpen = !!prev[label];
      // Keep only one accordion open at a time to keep sidebar compact and non-scrollable
      return isOpen ? {} : { [label]: true };
    });
  };

  const handleMouseEnterItem = (e: React.MouseEvent<HTMLElement>, item: NavItem) => {
    if (!collapsed) return;
    if (hoverTimeoutRef.current) {
      window.clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredMenu({ item, top: rect.top });
  };

  const handleMouseLeaveItem = () => {
    if (!collapsed) return;
    hoverTimeoutRef.current = window.setTimeout(() => {
      setHoveredMenu(null);
    }, 150);
  };

  const handleMouseEnterFlyout = () => {
    if (hoverTimeoutRef.current) {
      window.clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  };

  const handleMouseLeaveFlyout = () => {
    setHoveredMenu(null);
  };

  const mainMenu = items.filter((i) => !['User Management', 'System Settings'].includes(i.label));
  const accountMenu = items.filter((i) => ['User Management', 'System Settings'].includes(i.label));

  return (
    <nav
      className={`flex h-full flex-col justify-between overflow-hidden select-none bg-white transition-all duration-300 ${
        collapsed ? 'px-2 py-3' : 'px-3.5 py-3.5'
      }`}
      aria-label={isAdmin ? 'Administrator navigation' : 'User navigation'}
    >
      {/* ─────────────────────────────────────────────────────────────────
          TOP SECTION (Brand Header & Menu Groups)
          ───────────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        
        {/* BRAND HEADER (Matches exact attached screenshot) */}
        {!collapsed ? (
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-2">
            <Link
              to="/"
              onClick={() => isMobile && onClose && onClose()}
              className="flex items-center gap-3 min-w-0 group"
            >
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full ring-2 ring-brand-200/90 shadow-xs flex items-center justify-center">
                <img
                  src="/nemsu-logo.png"
                  alt="NEMSU Official Seal"
                  className="h-full w-full object-cover rounded-full select-none"
                />
              </div>
              <div className="leading-tight min-w-0">
                <span className="block font-sans text-base font-extrabold tracking-tight text-ink group-hover:text-brand-600 transition-colors">
                  Accrevia
                </span>
                <span className="block text-[11px] font-medium text-slate-400 whitespace-nowrap">
                  QA & Accreditation Portal
                </span>
              </div>
            </Link>

            {!isMobile ? (
              <button
                type="button"
                onClick={toggleSidebar}
                className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:text-ink hover:bg-slate-100 transition-colors ml-1"
                title="Collapse sidebar (Ctrl+B)"
                aria-label="Collapse sidebar"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
            ) : (
              onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:text-ink hover:bg-slate-100"
                  aria-label="Close navigation"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              )
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 pb-3 border-b border-slate-100 mb-2">
            <Link to="/" title="Accrevia - QA & Accreditation Portal" className="flex justify-center">
              <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full ring-2 ring-brand-200/90 shadow-xs flex items-center justify-center">
                <img
                  src="/nemsu-logo.png"
                  alt="NEMSU Official Seal"
                  className="h-full w-full object-cover rounded-full select-none"
                />
              </div>
            </Link>
            <button
              type="button"
              onClick={toggleSidebar}
              className="grid h-6 w-6 place-items-center rounded-md text-slate-400 hover:text-ink hover:bg-slate-100 transition-colors"
              title="Expand sidebar (Ctrl+B)"
              aria-label="Expand sidebar"
            >
              <ChevronRightIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────
            MAIN MENU SECTION (Matches exact screenshot layout)
            ───────────────────────────────────────────────────────────────── */}
        <div>
          {!collapsed && (
            <div className="px-2.5 pt-2 pb-1.5">
              <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                MAIN MENU
              </span>
            </div>
          )}

          <div className="space-y-0.5">
            {mainMenu.map((item) => {
              const active = isItemActive(item, pathname);
              const isOpen = !collapsed && !!expanded[item.label];
              const Icon = item.icon;
              const hasChildren = !!item.children;
              const hasPending = item.label === 'Document Management' && pending.length > 0;

              if (collapsed) {
                return (
                  <div
                    key={item.label}
                    className="relative flex justify-center py-0.5"
                    onMouseEnter={(e) => handleMouseEnterItem(e, item)}
                    onMouseLeave={handleMouseLeaveItem}
                  >
                    <Link
                      to={item.to}
                      aria-label={item.label}
                      className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-150 ${
                        active
                          ? 'bg-blue-50/80 text-blue-600 font-bold shadow-xs'
                          : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
                      }`}
                    >
                      <Icon className={`h-[19px] w-[19px] ${active ? 'text-blue-600' : 'text-slate-400'}`} />
                      {hasPending && (
                        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white" />
                      )}
                    </Link>
                  </div>
                );
              }

              return (
                <div key={item.label}>
                  <div
                    className={`group flex items-center justify-between rounded-xl transition-all duration-150 px-3 py-2 cursor-pointer ${
                      active
                        ? 'bg-blue-50/80 text-blue-600 font-semibold shadow-xs'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-ink font-medium'
                    }`}
                    onClick={() => {
                      if (hasChildren) {
                        toggleAccordion(item.label);
                      }
                    }}
                  >
                    <Link
                      to={item.to}
                      onClick={(e) => {
                        if (hasChildren) {
                          e.preventDefault();
                          toggleAccordion(item.label);
                        } else if (isMobile && onClose) {
                          onClose();
                        }
                      }}
                      aria-current={active && !hasChildren ? 'page' : undefined}
                      className="flex min-w-0 flex-1 items-center gap-3 text-sm"
                    >
                      <Icon
                        className={`h-[18px] w-[18px] shrink-0 transition-colors ${
                          active ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                        }`}
                        aria-hidden="true"
                      />
                      <span className="truncate whitespace-nowrap">{item.label}</span>
                    </Link>

                    {hasChildren && (
                      <ChevronRightIcon
                        className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${
                          isOpen ? 'rotate-90 text-slate-600' : 'group-hover:text-slate-600'
                        }`}
                      />
                    )}
                  </div>

                  {item.children && isOpen && (
                    <ul className="my-1 ml-5 space-y-0.5 border-l-2 border-slate-100 pl-3">
                      {item.children.map((child) => {
                        const childActive = pathname === child.to;
                        return (
                          <li key={child.to}>
                            <Link
                              to={child.to}
                              onClick={() => isMobile && onClose && onClose()}
                              aria-current={childActive ? 'page' : undefined}
                              className={`flex items-center justify-between gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
                                childActive
                                  ? 'bg-blue-50 font-bold text-blue-600'
                                  : 'text-slate-500 hover:bg-slate-50 hover:text-ink'
                              }`}
                            >
                              <span className="truncate whitespace-nowrap">{child.label}</span>
                              {child.showPendingCount && pending.length > 0 && (
                                <span className="rounded-full bg-blue-100 px-1.5 py-0.2 text-[10px] font-bold text-blue-700">
                                  {pending.length}
                                </span>
                              )}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* HORIZONTAL DIVIDER UNDER MAIN MENU */}
        {!collapsed && <div className="my-3 border-b border-slate-100" />}

        {/* ─────────────────────────────────────────────────────────────────
            ACCOUNT & SYSTEM SECTION (Matches screenshot)
            ───────────────────────────────────────────────────────────────── */}
        {accountMenu.length > 0 && (
          <div>
            {!collapsed && (
              <div className="px-2.5 pt-1 pb-1.5">
                <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                  ACCOUNT & SYSTEM
                </span>
              </div>
            )}
            <div className="space-y-0.5">
              {accountMenu.map((item) => {
                const active = isItemActive(item, pathname);
                const Icon = item.icon;

                if (collapsed) {
                  return (
                    <div
                      key={item.label}
                      className="relative flex justify-center py-0.5"
                      onMouseEnter={(e) => handleMouseEnterItem(e, item)}
                      onMouseLeave={handleMouseLeaveItem}
                    >
                      <Link
                        to={item.to}
                        aria-label={item.label}
                        className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-150 ${
                          active
                            ? 'bg-blue-50/80 text-blue-600 font-bold shadow-xs'
                            : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
                        }`}
                      >
                        <Icon className={`h-[19px] w-[19px] ${active ? 'text-blue-600' : 'text-slate-400'}`} />
                      </Link>
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.label}
                    to={item.to}
                    onClick={() => isMobile && onClose && onClose()}
                    aria-current={active ? 'page' : undefined}
                    className={`group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all duration-150 ${
                      active
                        ? 'bg-blue-50/80 text-blue-600 font-semibold shadow-xs'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-ink font-medium'
                    }`}
                  >
                    <Icon
                      className={`h-[18px] w-[18px] shrink-0 transition-colors ${
                        active ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                      aria-hidden="true"
                    />
                    <span className="truncate whitespace-nowrap">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────────
          BOTTOM SECTION: USER PROFILE
          ───────────────────────────────────────────────────────────────── */}
      <div className="mt-auto shrink-0 pt-2 border-t border-slate-100">
        {/* User Profile Card (Matches exact screenshot: DM Avatar, green dot, name, role, right chevron) */}
        <Link
          to="/account"
          onClick={() => isMobile && onClose && onClose()}
          onMouseEnter={(e) => {
            if (collapsed) {
              const rect = e.currentTarget.getBoundingClientRect();
              setHoveredProfile({ top: rect.top });
            }
          }}
          onMouseLeave={() => setHoveredProfile(null)}
          className={`flex items-center rounded-2xl transition-colors cursor-pointer group ${
            collapsed ? 'justify-center p-1 hover:bg-slate-100' : 'justify-between p-1.5 hover:bg-slate-50'
          }`}
          title={collapsed ? `${currentUser?.name || 'Dr. Maria L. Santos'} (Administrator · NEMSU)` : undefined}
        >
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar with blue ring border and green online dot */}
            <div className="relative shrink-0">
              <div className="h-10 w-10 rounded-full border-2 border-blue-500 bg-white flex items-center justify-center shadow-xs">
                <span className="text-xs font-bold text-blue-600">DM</span>
              </div>
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
            </div>

            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-ink group-hover:text-blue-600 transition-colors">
                  {currentUser?.name || 'Dr. Maria L. Santos'}
                </p>
                <p className="truncate text-[11px] text-slate-400">
                  {currentUser?.role ? `${currentUser.role} · NEMSU` : 'Administrator · NEMSU'}
                </p>
              </div>
            )}
          </div>

          {!collapsed && (
            <ChevronRightIcon className="h-4 w-4 text-slate-400 group-hover:text-ink transition-colors shrink-0" />
          )}
        </Link>
      </div>

      {/* ─────────────────────────────────────────────────────────────────
          COLLAPSED MODE: FIXED FLOATING SUBMENU FLYOUT
          ───────────────────────────────────────────────────────────────── */}
      {collapsed && hoveredMenu && (
        <div
          style={{ top: hoveredMenu.top }}
          className="fixed left-[68px] z-50 -translate-y-2 pointer-events-auto"
          onMouseEnter={handleMouseEnterFlyout}
          onMouseLeave={handleMouseLeaveFlyout}
        >
          <div className="rounded-xl border border-slate-200/90 bg-white/95 backdrop-blur-md p-2 shadow-xl min-w-[210px] text-xs animate-in fade-in zoom-in-95 duration-100">
            <div className="font-bold text-ink px-2.5 py-1.5 border-b border-slate-100 mb-1 flex items-center justify-between">
              <span>{hoveredMenu.item.label}</span>
            </div>
            {hoveredMenu.item.children ? (
              <div className="space-y-0.5">
                {hoveredMenu.item.children.map((child) => {
                  const childActive = pathname === child.to;
                  return (
                    <Link
                      key={child.to}
                      to={child.to}
                      onClick={() => setHoveredMenu(null)}
                      className={`flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
                        childActive
                          ? 'bg-blue-50 font-bold text-blue-600'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-ink'
                      }`}
                    >
                      <span>{child.label}</span>
                      {child.showPendingCount && pending.length > 0 && (
                        <span className="rounded-full bg-blue-100 px-1.5 py-0.2 text-[10px] font-bold text-blue-700">
                          {pending.length}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 px-2.5 py-1">Quick navigation</p>
            )}
          </div>
        </div>
      )}

      {/* COLLAPSED MODE: USER PROFILE TOOLTIP */}
      {collapsed && hoveredProfile && !hoveredMenu && (
        <div
          style={{ top: hoveredProfile.top }}
          className="fixed left-[68px] z-50 -translate-y-1 pointer-events-none"
        >
          <div className="rounded-xl border border-slate-200/90 bg-white/95 backdrop-blur-md px-3 py-2 shadow-xl min-w-[180px] text-xs">
            <p className="font-bold text-ink">{currentUser?.name || 'Dr. Maria L. Santos'}</p>
            <p className="text-[11px] text-slate-400">
              {currentUser?.role ? `${currentUser.role} · NEMSU` : 'Administrator · NEMSU'}
            </p>
          </div>
        </div>
      )}
    </nav>
  );
}