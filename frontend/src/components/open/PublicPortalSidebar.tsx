import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDownIcon, ClipboardCheckIcon, LayoutDashboardIcon, LogOutIcon } from 'lucide-react';
import {
  isOpenNavItemActive,
  openNavIconTone,
  openNavSections,
  openNavigation,
  OpenNavItem
} from '../../data/openNavigation';
import { LogoutConfirmModal } from '../layout/LogoutConfirmModal';
import { isPrivilegedAuthRole, useSessionAccount } from '../../utils/auth';

export function PublicPortalSidebar({
  collapsed = false,
  onNavigate
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const { pathname } = useLocation();
  const session = useSessionAccount();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const canOpenQa = isPrivilegedAuthRole(session?.role);
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      openNavigation.filter((n) => n.children).map((n) => [n.label, isOpenNavItemActive(n, pathname)])
    )
  );

  useEffect(() => {
    const activeGroup = openNavigation.find((n) => n.children && isOpenNavItemActive(n, pathname));
    if (activeGroup) {
      setExpanded((prev) => (prev[activeGroup.label] ? prev : { ...prev, [activeGroup.label]: true }));
    }
  }, [pathname]);

  const renderItem = (item: OpenNavItem) => {
    const hasActiveChild = item.children?.some((c) => pathname === c.to);
    const active = !item.preview && isOpenNavItemActive(item, pathname);
    const isOpen = !!expanded[item.label];
    const Icon = item.icon;
    const tone = openNavIconTone;

    const iconTile = (
      <div
        className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg border transition-all duration-200 ${
          active && (!item.children || collapsed)
            ? 'bg-brand-600 text-white border-brand-600'
            : active && item.children
            ? 'bg-brand-tint text-brand-700 border-brand-200'
            : `${tone.iconBg} ${tone.iconColor} ${tone.border}`
        }`}
      >
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      </div>
    );

    const indicator = active && (
      <span className="absolute -left-2 top-2 bottom-2 z-10 w-1 rounded-r-full bg-brand-600" aria-hidden="true" />
    );

    if (item.preview) {
      return (
        <li key={item.label} className="relative">
          {collapsed ? (
            <div
              title={`${item.label} (coming soon)`}
              aria-label={`${item.label} (coming soon)`}
              className="relative mx-auto flex h-10 w-10 cursor-default items-center justify-center rounded-xl border border-dashed border-line opacity-70"
            >
              {iconTile}
            </div>
          ) : (
            <div
              className="flex cursor-default items-center gap-3 rounded-xl border border-dashed border-line px-2 py-1.5 opacity-70"
              title="Coming soon"
              aria-disabled="true"
            >
              {iconTile}
              <span className="min-w-0 flex-1 truncate text-[13px] font-semibold leading-tight text-ink-muted">
                {item.label}
              </span>
              <span className="shrink-0 rounded-full bg-canvas px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-ink-subtle">
                Soon
              </span>
            </div>
          )}
        </li>
      );
    }

    if (collapsed) {
      return (
        <li key={item.label} className="relative">
          {indicator}
          <Link
            to={item.to}
            title={item.label}
            aria-label={item.label}
            aria-current={active ? 'page' : undefined}
            onClick={() => {
              if (item.children) setExpanded((prev) => ({ ...prev, [item.label]: true }));
              onNavigate?.();
            }}
            className={`relative mx-auto flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-150 ${
              active ? 'bg-brand-tint border-brand-200/80 shadow-2xs' : 'border-transparent hover:bg-canvas'
            }`}
          >
            {iconTile}
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
              if (item.children) setExpanded((prev) => ({ ...prev, [item.label]: true }));
              onNavigate?.();
            }}
            aria-current={active && !hasActiveChild ? 'page' : undefined}
            className="flex min-w-0 flex-1 items-center gap-3 py-1 text-sm"
          >
            {iconTile}
            <span className="truncate text-[13px] font-semibold leading-tight text-ink/90 transition-colors group-hover:text-ink">
              {item.label}
            </span>
          </Link>

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
              className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-ink-subtle transition-colors hover:bg-line-subtle hover:text-ink"
            >
              <ChevronDownIcon
                className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180 text-brand-600' : '-rotate-90'}`}
              />
            </button>
          )}
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
                    onClick={() => onNavigate?.()}
                    className={`block rounded-lg px-2.5 py-1.5 text-[12px] transition-all duration-150 ${
                      childActive
                        ? 'border border-brand-200/60 bg-brand-tint font-bold text-brand-700 shadow-2xs'
                        : 'border border-transparent font-medium text-ink-muted hover:bg-canvas hover:text-ink'
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
      aria-label="Faculty and staff portal navigation"
    >
      {openNavSections.map((section) => {
        const items = openNavigation.filter((i) => i.section === section.id);
        if (items.length === 0) return null;
        return (
          <div key={section.id} className={section.id === 'main' ? 'mb-4' : 'mb-4 border-t border-line-subtle pt-4'}>
            {!collapsed && (
              <p className="mb-2 px-2 text-[10.5px] font-semibold uppercase tracking-wider text-ink-subtle">{section.label}</p>
            )}
            <ul className="space-y-1">{items.map(renderItem)}</ul>
          </div>
        );
      })}

      <div className="mt-auto space-y-1 border-t border-line-subtle pt-3">
        {canOpenQa ? (
          <>
            <Link
              to="/technical-review-access"
              title={collapsed ? 'TR Access Management' : undefined}
              aria-label="Technical Review Access Management"
              onClick={() => onNavigate?.()}
              className={`group flex items-center rounded-xl border border-transparent text-ink transition-all duration-150 hover:border-brand-100 hover:bg-brand-50 hover:text-brand-700 ${
                collapsed ? 'mx-auto h-10 w-10 justify-center' : 'w-full gap-3 px-2 py-2.5'
              }`}
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-brand-100 bg-brand-50 text-brand-600">
                <ClipboardCheckIcon className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              {!collapsed && <span className="text-[13px] font-semibold leading-tight">TR Access Management</span>}
            </Link>
            <Link
              to="/dashboard"
              title={collapsed ? 'QA Dashboard' : undefined}
              aria-label="QA Dashboard"
              onClick={() => onNavigate?.()}
              className={`group flex items-center rounded-xl border border-transparent text-ink transition-all duration-150 hover:border-brand-100 hover:bg-brand-50 hover:text-brand-700 ${
                collapsed ? 'mx-auto h-10 w-10 justify-center' : 'w-full gap-3 px-2 py-2.5'
              }`}
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-brand-100 bg-brand-50 text-brand-600">
                <LayoutDashboardIcon className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              {!collapsed && <span className="text-[13px] font-semibold leading-tight">QA Dashboard</span>}
            </Link>
          </>
        ) : null}
        <button
          type="button"
          title={collapsed ? 'Logout' : undefined}
          aria-label="Logout"
          onClick={() => setLogoutOpen(true)}
          className={`group flex items-center rounded-xl border border-transparent text-ink transition-all duration-150 hover:border-brand-100 hover:bg-brand-50 hover:text-brand-700 ${
            collapsed ? 'mx-auto h-10 w-10 justify-center' : 'w-full gap-3 px-2 py-2.5'
          }`}
        >
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-brand-100 bg-brand-50 text-brand-600">
            <LogOutIcon className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          {!collapsed && <span className="text-[13px] font-semibold leading-tight">Logout</span>}
        </button>
      </div>

      <LogoutConfirmModal open={logoutOpen} onClose={() => setLogoutOpen(false)} />
    </nav>
  );
}
