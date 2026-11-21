import React from 'react';
import { Link } from 'react-router-dom';
import { PublicBrandingPanel } from '../layout/PublicBrandingPanel';

type AuthLayoutProps = {
  children: React.ReactNode;
  /** When true, form panel scrolls if content exceeds the card height. */
  scrollableForm?: boolean;
  /** Vertical alignment of the form column content. */
  formAlign?: 'center' | 'start';
};

export const authLabelClass =
  'mb-1.5 block text-[13px] font-semibold text-ink';

export const authFieldClass =
  'input h-11 rounded-[11px] border-line bg-canvas px-3 text-sm text-ink placeholder:text-ink-subtle focus:bg-surface disabled:cursor-not-allowed disabled:opacity-60';

export const authFieldWithIconClass =
  'input h-11 rounded-[11px] border-line bg-canvas py-0 pl-10 pr-3 text-sm text-ink placeholder:text-ink-subtle focus:bg-surface disabled:cursor-not-allowed disabled:opacity-60';

export const authFieldWithToggleClass =
  'input h-11 rounded-[11px] border-line bg-canvas py-0 pl-10 pr-11 text-sm text-ink placeholder:text-ink-subtle focus:bg-surface disabled:cursor-not-allowed disabled:opacity-60';

export const authPrimaryButtonClass =
  'btn btn-primary inline-flex h-12 w-full items-center justify-center gap-2 rounded-[12px] text-[15px] font-semibold disabled:cursor-not-allowed disabled:opacity-60';

export const authSectionTitleClass =
  'text-[11px] font-bold uppercase tracking-[0.14em] text-brand-700';

/**
 * Shared authentication shell for Login and Sign Up.
 * Caps desktop card size and centers it to avoid unnecessary page scroll.
 */
export function AuthLayout({
  children,
  scrollableForm = false,
  formAlign = 'center'
}: AuthLayoutProps) {
  const alignStart = scrollableForm || formAlign === 'start';

  return (
    <div className="relative flex min-h-dvh items-center justify-center bg-canvas px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex w-full max-w-[1100px] flex-col overflow-hidden rounded-[22px] border border-line bg-surface shadow-soft-lg lg:h-[min(720px,calc(100dvh-48px))] lg:max-h-[720px] lg:flex-row">
        {/* Compact mobile branding header */}
        <div className="flex items-center gap-3 border-b border-line bg-[#0B1B47] px-4 py-3 lg:hidden">
          <Link
            to="/"
            className="flex min-w-0 items-center gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <img
              src="/nemsu-landing-logo.png"
              alt="North Eastern Mindanao State University seal"
              className="h-16 w-16 shrink-0 rounded-full object-cover"
            />
            <div className="min-w-0 text-left text-white">
              <p className="truncate text-base font-bold tracking-tight">ACCREVIA</p>
              <p className="truncate text-[10px] font-medium uppercase tracking-[0.12em] text-blue-100/85">
                Institutional Accreditation Document Retrieval
              </p>
            </div>
          </Link>
        </div>

        {/* Desktop branding panel (~42%) */}
        <div className="hidden min-h-0 w-full shrink-0 lg:block lg:w-[42%]">
          <PublicBrandingPanel />
        </div>

        {/* Form panel (~58%) */}
        <div
          className={`flex min-h-0 w-full flex-1 flex-col bg-surface lg:w-[58%] ${
            scrollableForm ? 'lg:overflow-y-auto' : 'lg:overflow-hidden'
          }`}
        >
          <div
            className={`mx-auto flex w-full max-w-[480px] flex-1 flex-col px-5 py-6 sm:px-8 sm:py-7 ${
              alignStart ? 'justify-start lg:py-6' : 'justify-center'
            }`}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
