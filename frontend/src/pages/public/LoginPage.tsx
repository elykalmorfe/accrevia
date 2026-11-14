import React, { useState } from 'react';
import { Eye, EyeOff, LoaderCircle, LockKeyhole, Mail } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  AuthLayout,
  authFieldWithIconClass,
  authFieldWithToggleClass,
  authLabelClass,
  authPrimaryButtonClass
} from '../../components/auth/AuthLayout';
import { authenticate, defaultPostLoginPath, startSession } from '../../utils/auth';

type LoginFormState = {
  email: string;
  password: string;
};

type LoginErrors = Partial<Record<'email' | 'password' | 'general', string>>;

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState<LoginFormState>({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const redirectFrom = (location.state as { from?: { pathname?: string; search?: string } } | null)?.from;

  const handleChange = (field: keyof LoginFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined, general: undefined }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: LoginErrors = {};
    if (!form.email.trim()) {
      nextErrors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = 'Please enter a valid email address.';
    }

    if (!form.password) {
      nextErrors.password = 'Password is required.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);

    window.setTimeout(async () => {
      let matchedUser;
      try {
        matchedUser = await authenticate(form.email, form.password);
      } catch {
        setErrors({ general: 'Sign-in is temporarily unavailable. Please try again.' });
        setIsSubmitting(false);
        return;
      }

      if (!matchedUser) {
        setErrors({ general: 'We could not find an account matching these credentials.' });
        setIsSubmitting(false);
        return;
      }

      startSession(matchedUser);
      setIsSubmitting(false);
      const fallback = defaultPostLoginPath(matchedUser.role);
      const requested =
        redirectFrom?.pathname && redirectFrom.pathname !== '/login' && redirectFrom.pathname !== '/register'
          ? `${redirectFrom.pathname}${redirectFrom.search || ''}`
          : fallback;
      navigate(requested, { replace: true });
    }, 900);
  };

  return (
    <AuthLayout>
      <header className="mb-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#1D4ED8]">Welcome back</p>
        <h1 className="mt-1.5 text-[1.75rem] font-bold tracking-tight text-[#0F172A] sm:text-[1.9rem]">
          Sign in to ACCREVIA
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[#64748B]">
          Access and manage institutional accreditation documents securely.
        </p>
      </header>

      <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
        <div>
          <label htmlFor="email" className={authLabelClass}>
            Enter Email Address
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(event) => handleChange('email', event.target.value)}
              className={authFieldWithIconClass}
              placeholder="name@nemsu.edu.ph"
              aria-invalid={Boolean(errors.email)}
            />
          </div>
          {errors.email && <p className="mt-1.5 text-[13px] text-red-600">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="password" className={authLabelClass}>
            Password
          </label>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={form.password}
              onChange={(event) => handleChange('password', event.target.value)}
              className={authFieldWithToggleClass}
              placeholder="Enter your password"
              aria-invalid={Boolean(errors.password)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-200/80 hover:text-slate-700"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="mt-1.5 text-[13px] text-red-600">{errors.password}</p>}
        </div>

        <div className="flex items-center justify-between gap-3 pt-0.5">
          <label className="inline-flex items-center gap-2 text-[13px] text-[#64748B]">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-[#1D4ED8] focus:ring-[#1D4ED8]"
            />
            Remember Me
          </label>
          <button
            type="button"
            className="text-[13px] font-semibold text-[#1D4ED8] transition hover:text-[#163A75]"
          >
            Forgot Password?
          </button>
        </div>

        {errors.general && (
          <div className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
            {errors.general}
          </div>
        )}

        <button type="submit" disabled={isSubmitting} className={`${authPrimaryButtonClass} mt-1`}>
          {isSubmitting ? (
            <>
              <LoaderCircle className="h-5 w-5 animate-spin" />
              Signing in...
            </>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      <p className="mt-5 text-center text-[13px] text-[#64748B]">
        New to ACCREVIA?{' '}
        <Link to="/register" className="font-semibold text-[#1D4ED8] transition hover:text-[#163A75]">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
}
