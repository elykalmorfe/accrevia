import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDownIcon, LogOutIcon } from 'lucide-react';
import { navigation, NavItem, userNavigation } from '../../data/navigation';
import { usePortal } from '../../contexts/PortalContext';
import { LogoutConfirmModal } from './LogoutConfirmModal';

function isItemActive(item: NavItem, pathname: string) {
  if (item.matchPrefix) return pathname.startsWith(item.matchPrefix);
  return pathname === item.to;
}

export function Sidebar({ collapsed = false }: { collapsed?: boolean }) {
  const { pathname } = useLocation();
  const { pending, isAdmin, currentUser, documentRequests, toggleSidebar } = usePortal();
  const items = isAdmin ? navigation : userNavigation;
  const liveCounts: Record<NonNullable<NavItem['countKey']>, number> = {
    requests: documentRequests.filter((r) => (isAdmin ? r.unreadByAdmin : r.requesterId === currentUser.id && r.unreadByRequester)).length
  };
  const [logoutOpen, setLogoutOpen] = useState(false);

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

  const mainMenu = items.filter((i) => i.section !== 'account');
  const accountMenu = items.filter((i) => i.section === 'account');

  const renderItem = (item: NavItem) => {
    const hasActiveChild = item.children?.some((c) => pathname === c.to);
    const active = isItemActive(item, pathname) || hasActiveChild;
    const isOpen = !!expanded[item.label];
    const Icon = item.icon;
    const count = item.countKey ? liveCounts[item.countKey] : 0;

    const iconTile = (
      <div
        className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg border transition-all duration-200 ${
          active && (!item.children || collapsed)
            ? 'bg-brand-600 text-white border-brand-600'
            : active && item.children
            ? 'bg-brand-tint text-brand-700 border-brand-200'
            : `${item.color.iconBg} ${item.color.iconColor} ${item.color.border}`
        }`}
      >
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      </div>
    );

    const indicator = active && (
      <span className="absolute -left-2 top-2 bottom-2 z-10 w-1 rounded-r-full bg-brand-600" aria-hidden="true" />
    );

    if (collapsed) {
      return (
        <li key={item.label} className="relative">
          {indicator}
          <Link
            to={item.to}
            title={item.label}
            aria-label={count > 0 ? `${item.label} (${count} unread)` : item.label}
            aria-current={active ? 'page' : undefined}
            onClick={() => {
              if (item.children) {
                setExpanded((prev) => ({ ...prev, [item.label]: true }));
                toggleSidebar();
              }
            }}
            className={`relative mx-auto flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-150 ${
              active ? 'bg-brand-tint border-brand-200/80 shadow-2xs' : 'border-transparent hover:bg-canvas'
            }`}
          >
            {iconTile}
            {count > 0 && (
              <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-brand-600 ring-2 ring-surface" aria-hidden="true" />
            )}
          </Link>
        </li>
      );
    }

    return (
      <li key={item.label} className="relative">
        {indicator}
        <div
          className={`group flex items-center justify-between rounded-xl px-2 py-1.5 transition-all duration-150 ${
            active && !item.children
              ? 'bg-brand-tint text-ink font-bold border border-brand-200/80 shadow-2xs'
              : active && item.children
              ? 'bg-canvas text-ink font-bold border border-line-subtle'
              : 'text-ink hover:bg-canvas border border-transparent font-medium'
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
            {iconTile}
            <span className="truncate text-[13px] font-semibold leading-tight text-ink/90 transition-colors group-hover:text-ink">
              {item.label}
            </span>
          </Link>

          <div className="flex items-center gap-1.5 shrink-0">
            {count > 0 && (
              <span
                className="inline-flex min-w-[20px] justify-center rounded-full bg-brand-600 px-1.5 py-0.5 text-[10.5px] font-bold leading-none text-white"
                aria-label={`${count} unread`}
              >
                {count}
              </span>
            )}

            {item.badge && (!pending.length || item.label !== 'Documents') && (
              <span className="hidden xl:inline-flex rounded-md border border-line bg-canvas px-1.5 py-0.5 text-[9.5px] font-semibold text-ink-muted">
                {item.badge}
              </span>
            )}

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
                className="grid h-6 w-6 place-items-center rounded-md text-ink-subtle transition-colors hover:bg-line-subtle hover:text-ink"
              >
                <ChevronDownIcon
                  className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180 text-brand-600' : '-rotate-90'}`}
                />
              </button>
            )}
          </div>
        </div>

        {item.children && isOpen && (
          <ul className="my-1 ml-5 space-y-0.5 border-l border-line pl-2.5">
            {item.children.map((child) => {
              const childActive = pathname === child.to;
              return (
                <li key={child.to}>
                  <Link
                    to={child.to}
                    aria-current={childActive ? 'page' : undefined}
                    className={`group/child flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-[12px] transition-all duration-150 ${
                      childActive
                        ? 'bg-brand-tint text-brand-700 font-bold shadow-2xs border border-brand-200/60'
                        : 'text-ink-muted hover:bg-canvas hover:text-ink font-medium border border-transparent'
                    }`}
                  >
                    <span className="truncate">{child.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </li>
    );
  };

  return (
    <nav
      className={`flex min-h-full flex-col py-4 select-none ${collapsed ? 'px-2' : 'px-3.5'}`}
      aria-label={isAdmin ? 'Administrator navigation' : 'User navigation'}
    >
      <div className="mb-4">
        <ul className="space-y-1">{mainMenu.map(renderItem)}</ul>
      </div>

      {accountMenu.length > 0 && (
        <div className="mb-4 border-t border-line-subtle pt-4">
          <ul className="space-y-1">{accountMenu.map(renderItem)}</ul>
        </div>
      )}

      <div className="mt-auto border-t border-line-subtle pt-3">
        <button
          type="button"
          onClick={() => setLogoutOpen(true)}
          title={collapsed ? 'Logout' : undefined}
          aria-label="Logout"
          className={`group flex items-center rounded-xl border border-transparent text-ink transition-all duration-150 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-800 ${
            collapsed ? 'mx-auto h-10 w-10 justify-center' : 'w-full gap-3 px-2 py-2.5'
          }`}
        >
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-brand-100 bg-brand-50 text-brand-700">
            <LogOutIcon className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          {!collapsed && <span className="text-[13px] font-semibold leading-tight">Logout</span>}
        </button>
      </div>

      <LogoutConfirmModal open={logoutOpen} onClose={() => setLogoutOpen(false)} />
    </nav>
  );
}
