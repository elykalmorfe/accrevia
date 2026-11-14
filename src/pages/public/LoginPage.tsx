import React, { useState } from 'react';
import { Eye, EyeOff, ArrowLeft, LoaderCircle, LockKeyhole, Mail } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { PublicBrandingPanel } from '../../components/layout/PublicBrandingPanel';

type LoginFormState = {
  email: string;
  password: string;
};

type LoginErrors = Partial<Record<'email' | 'password' | 'general', string>>;

function getStoredUsers(): Array<Record<string, unknown>> {
  if (typeof window === 'undefined') {
    return [] as Array<Record<string, unknown>>;
  }

  try {
    const raw = window.localStorage.getItem('accrevia-users');
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed as Array<Record<string, unknown>> : []; 
  } catch {
    return [];
  }
}

export function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<LoginFormState>({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    window.setTimeout(() => {
      const users = getStoredUsers();
      const matchedUser = users.find(
        (user) => {
          const email = String(user.email ?? '').toLowerCase();
          return email === form.email.trim().toLowerCase() && String(user.password ?? '') === form.password;
        }
      );

      if (!matchedUser) {
        setErrors({ general: 'We could not find an account matching these credentials.' });
        setIsSubmitting(false);
        return;
      }

      window.localStorage.setItem('accrevia-auth', 'true');
      window.localStorage.setItem('accrevia-current-user', JSON.stringify(matchedUser));
      setIsSubmitting(false);
      navigate('/dashboard', { replace: true });
    }, 900);
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_35px_90px_-30px_rgba(15,23,42,0.28)]">
        <div className="grid min-h-[760px] lg:grid-cols-[1.1fr_0.9fr]">
          <PublicBrandingPanel />
          <div className="flex items-center justify-center p-6 sm:p-10">
            <div className="w-full max-w-md">
              <div className="mb-8 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-700">Welcome back</p>
                  <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900">Login to Accrevia</h2>
                </div>
                <Link to="/" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900">
                  <ArrowLeft className="h-4 w-4" />
                  Home
                </Link>
              </div>

              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">Email address</label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={form.email}
                      onChange={(event) => handleChange('email', event.target.value)}
                      className="block w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100"
                      placeholder="name@nemsu.edu.ph"
                      aria-invalid={Boolean(errors.email)}
                    />
                  </div>
                  {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email}</p>}
                </div>

                <div>
                  <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">Password</label>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={form.password}
                      onChange={(event) => handleChange('password', event.target.value)}
                      className="block w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-11 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100"
                      placeholder="Enter your password"
                      aria-invalid={Boolean(errors.password)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="mt-2 text-sm text-red-600">{errors.password}</p>}
                </div>

                <div className="flex items-center justify-between gap-3">
                  <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                    <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    Remember Me
                  </label>
                  <button type="button" className="text-sm font-semibold text-blue-700 transition hover:text-blue-800">
                    Forgot Password?
                  </button>
                </div>

                {errors.general && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {errors.general}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-700 px-4 py-3 text-base font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <LoaderCircle className="h-5 w-5 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    'Login'
                  )}
                </button>
              </form>

              <p className="mt-8 text-center text-sm text-slate-600">
                New to Accrevia?{' '}
                <Link to="/signup" className="font-semibold text-blue-700 transition hover:text-blue-800">
                  Create an account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
