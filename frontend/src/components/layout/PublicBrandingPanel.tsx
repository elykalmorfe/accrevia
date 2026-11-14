import { Link } from 'react-router-dom';

type PublicBrandingPanelProps = {
  /** @deprecated Kept for call-site compatibility; branding copy is now shared. */
  showSignupSubtext?: boolean;
};

export function PublicBrandingPanel({ showSignupSubtext: _showSignupSubtext = false }: PublicBrandingPanelProps) {
  return (
    <div className="relative flex h-full min-h-[18rem] items-center justify-center overflow-hidden bg-[#0B1B47] p-8 lg:min-h-0 lg:p-9">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-35"
        style={{ backgroundImage: "url('/nemsu-background.png')" }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(160deg,_rgba(11,27,71,0.92)_0%,_rgba(22,58,117,0.78)_48%,_rgba(29,78,216,0.45)_100%)]" />

      {/* Simplified decorative curves */}
      <svg
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 1000 800"
        preserveAspectRatio="xMidYMid slice"
        className="login-brand-waves pointer-events-none absolute inset-0 h-full w-full opacity-70"
      >
        <defs>
          <linearGradient id="login-wave-blue" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1D4ED8" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#0B1B47" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="login-wave-cyan" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#163A75" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g className="login-brand-wave-drift">
          <path d="M-40 -20 H480 C420 40 360 90 280 120 C160 160 60 210 -40 300 Z" fill="url(#login-wave-blue)" />
          <path d="M1040 40 C920 90 860 150 840 220 C810 300 860 360 1040 430 Z" fill="url(#login-wave-blue)" opacity="0.4" />
        </g>
        <g className="login-brand-wave-drift-reverse">
          <path d="M1040 480 C920 510 840 560 800 620 C750 700 820 780 960 860 H1040 Z" fill="url(#login-wave-cyan)" opacity="0.55" />
        </g>
      </svg>

      <div className="relative flex max-w-[22rem] flex-col items-center text-center text-white">
        <Link
          to="/"
          className="flex flex-col items-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        >
          <img
            src="/nemsu-logo.png"
            alt="North Eastern Mindanao State University seal"
            className="h-[148px] w-[148px] object-contain sm:h-[160px] sm:w-[160px]"
          />
          <span className="mt-5 text-[1.75rem] font-bold tracking-tight sm:text-[1.9rem]">ACCREVIA</span>
          <span className="mt-2 max-w-[16rem] text-[10px] font-semibold uppercase leading-relaxed tracking-[0.14em] text-blue-100/90 sm:max-w-none sm:text-[11px]">
            Institutional Accreditation Document Retrieval
          </span>
          <span aria-hidden="true" className="mt-4 flex items-center gap-2">
            <span className="h-px w-6 bg-blue-100/50" />
            <span className="h-1.5 w-1.5 rotate-45 bg-blue-100/80" />
            <span className="h-px w-6 bg-blue-100/50" />
          </span>
          <span className="mt-3 text-sm italic tracking-[0.06em] text-blue-100">
            Search Smarter. Work Better.
          </span>
          <span className="mt-4 max-w-[17.5rem] text-[12px] leading-relaxed text-blue-100/80 sm:text-[13px]">
            A centralized platform for organizing, accessing, and retrieving institutional accreditation documents.
          </span>
        </Link>
      </div>
    </div>
  );
}
