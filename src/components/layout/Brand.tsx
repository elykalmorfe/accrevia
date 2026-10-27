import { Link } from 'react-router-dom';

export function Brand({ showSubtitle = true }: { showSubtitle?: boolean }) {
  return (
    <Link
      to="/"
      className="group flex shrink-0 items-center gap-2.5 sm:gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      title="Accrevia - North Eastern Mindanao State University"
    >
      <div className="relative h-9 w-9 sm:h-10 sm:w-10 shrink-0 overflow-hidden rounded-full ring-2 ring-brand-200/90 shadow-xs transition-transform duration-200 group-hover:scale-105 flex items-center justify-center">
        <img
          src="/nemsu-logo.png"
          alt="NEMSU Official Seal"
          className="h-full w-full object-cover rounded-full select-none"
        />
      </div>
      <div className="leading-tight">
        <div className="flex items-center gap-1.5">
          <span className="block font-sans text-base sm:text-[17px] font-extrabold tracking-tight text-ink group-hover:text-brand-600 transition-colors">
            Accrevia
          </span>
          <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-brand-700 hidden xs:inline-block border border-brand-100">
            NEMSU
          </span>
        </div>
        {showSubtitle && (
          <span className="hidden md:block text-[11px] font-medium text-ink-subtle whitespace-nowrap">
            QA & Accreditation Portal
          </span>
        )}
      </div>
    </Link>
  );
}