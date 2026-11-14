import { Link } from 'react-router-dom';

type PublicBrandingPanelProps = {
  showSignupSubtext?: boolean;
};

export function PublicBrandingPanel({ showSignupSubtext = false }: PublicBrandingPanelProps) {
  return (
    <div className="relative flex min-h-[20rem] items-center justify-center overflow-hidden bg-slate-900 p-8 sm:min-h-[22rem] lg:min-h-0 lg:p-10">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-45"
        style={{ backgroundImage: "url('/nemsu-background.png')" }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,_rgba(2,6,23,0.82),_rgba(30,58,138,0.52)),radial-gradient(circle_at_top_left,_rgba(59,130,246,0.3),_transparent_40%),radial-gradient(circle_at_bottom_right,_rgba(34,211,238,0.24),_transparent_35%)]" />
      <svg
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 1000 800"
        preserveAspectRatio="xMidYMid slice"
        className="login-brand-waves pointer-events-none absolute inset-0 h-full w-full"
      >
        <defs>
          <linearGradient id="login-wave-blue" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1473c9" stopOpacity="0.72" />
            <stop offset="58%" stopColor="#0754a2" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#031a3c" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="login-wave-cyan" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1d4ed8" stopOpacity="0.04" />
            <stop offset="55%" stopColor="#1686d4" stopOpacity="0.42" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.7" />
          </linearGradient>
          <linearGradient id="login-wave-ribbon" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0d3d7a" stopOpacity="0.22" />
            <stop offset="55%" stopColor="#1265ad" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#1686d4" stopOpacity="0.16" />
          </linearGradient>
        </defs>
        <g>
          <g className="login-brand-wave-drift">
            <path d="M-55 -35 H530 C475 18 429 60 367 82 C227 132 91 172 -55 319 Z" fill="url(#login-wave-blue)" />
            <path d="M-45 -35 H329 C267 8 212 43 171 87 C109 153 48 226 -45 291 Z" fill="url(#login-wave-ribbon)" opacity="0.68" />
            <path d="M-28 282 C63 194 134 144 218 115 C317 81 404 49 487 -27" fill="none" stroke="#3197df" strokeOpacity="0.44" strokeWidth="1.5" />
            <path d="M-12 310 C75 221 147 170 229 141 C331 105 420 75 503 -8" fill="none" stroke="#2375bd" strokeOpacity="0.38" strokeWidth="1.25" />
            <path d="M314 -18 C384 18 433 62 511 78 C650 107 775 66 899 -24" fill="none" stroke="url(#login-wave-cyan)" strokeWidth="1.6" />
            <path d="M340 -20 C407 12 455 48 528 63 C669 91 790 49 918 -24" fill="none" stroke="#3b9ddc" strokeOpacity="0.32" strokeWidth="1.1" />
            <path d="M1045 20 C946 79 871 120 839 177 C790 264 838 333 1045 431 V20 Z" fill="url(#login-wave-blue)" opacity="0.38" />
          </g>
          <g className="login-brand-wave-drift-reverse">
            <path d="M1045 427 C929 446 834 482 779 537 C701 615 727 713 890 835 H1045 Z" fill="url(#login-wave-cyan)" opacity="0.68" />
            <path d="M1045 503 C957 526 883 557 839 602 C785 656 804 732 963 835 H1045 Z" fill="url(#login-wave-ribbon)" opacity="0.78" />
            <path d="M1045 420 C929 441 824 481 767 542 C701 612 721 682 800 743" fill="none" stroke="#49a9e8" strokeOpacity="0.44" strokeWidth="1.6" />
            <path d="M1043 474 C936 501 852 541 802 594 C749 650 771 713 841 768" fill="none" stroke="#71c7f1" strokeOpacity="0.34" strokeWidth="1.25" />
            <path d="M1044 550 C967 574 908 604 874 644 C838 686 857 735 916 781" fill="none" stroke="#3184c5" strokeOpacity="0.3" strokeWidth="1.1" />
          </g>
        </g>
      </svg>
      <div className="relative flex flex-col items-center text-center text-white">
        <Link to="/" className="flex -translate-y-3 flex-col items-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
          <img
            src="/nemsu-landing-logo.png"
            alt="North Eastern Mindanao State University seal"
            className="h-40 w-40 object-contain sm:h-44 sm:w-44 lg:h-60 lg:w-60"
          />
          <span className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Accrevia</span>
          <span className="mt-2 max-w-full text-xs font-medium uppercase tracking-[0.12em] text-slate-200 sm:whitespace-nowrap sm:text-sm">
            Institutional Accreditation Document Retrieval
          </span>
          <span aria-hidden="true" className="mt-5 flex items-center gap-2">
            <span className="h-px w-7 bg-blue-100/60" />
            <span className="h-1.5 w-1.5 rotate-45 bg-blue-100/90" />
            <span className="h-px w-7 bg-blue-100/60" />
          </span>
          <span className="mt-3 text-sm italic tracking-[0.08em] text-blue-100 sm:text-base">
            Search Smarter. Work Better.
          </span>
          {showSignupSubtext && (
            <span className="mt-5 max-w-xs text-center text-xs leading-5 text-blue-100/80 sm:text-sm">
              Be part of a smarter way to organize, access, and manage institutional accreditation documents.
            </span>
          )}
        </Link>
      </div>
    </div>
  );
}
