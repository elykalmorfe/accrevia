import { Link } from 'react-router-dom';

export function Brand({ showSubtitle = true }: {showSubtitle?: boolean;}) {
  return (
    <Link to="/" className="flex shrink-0 items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
      <div className="relative grid h-10 w-10 place-items-center rounded-xl bg-brand-600 text-white shadow-sm shadow-brand-500/30 transition-transform hover:scale-105" aria-hidden="true">
        <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      </div>
      <div className="leading-tight">
        <span className="block font-sans text-[17px] font-extrabold tracking-tight text-ink">Accrevia</span>
        {showSubtitle && (
          <span className="block text-[11px] font-medium text-ink-subtle">QA & Accreditation</span>
        )}
      </div>
    </Link>
  );
}