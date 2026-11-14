import React, { useMemo, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Eye, EyeOff, LoaderCircle, UserRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AuthLayout,
  authFieldClass,
  authLabelClass,
  authPrimaryButtonClass
} from '../../components/auth/AuthLayout';
import {
  addAccount,
  defaultPostLoginPath,
  findAccountByEmail,
  hashPassword,
  initializeAuthStore,
  isSelfRegisterRole,
  sanitizeSelfRegisterRole,
  SELF_REGISTER_ROLES,
  startSession,
  upsertPortalUserFromAccount
} from '../../utils/auth';

type SignupFormState = {
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
};

type SignupErrors = Partial<
  Record<'firstName' | 'lastName' | 'email' | 'password' | 'confirmPassword' | 'role' | 'general', string>
>;

type StepId = 0 | 1 | 2;

/** Self-registration may only create faculty/staff accounts — never QA/admin. */
const ROLE_OPTIONS = [...SELF_REGISTER_ROLES];
const TERMS_VERSION = 'v1.0';

const STEPS = [
  { id: 0 as StepId, label: 'Personal', short: '1' },
  { id: 1 as StepId, label: 'Credentials', short: '2' },
  { id: 2 as StepId, label: 'Access', short: '3' }
] as const;

const passwordFieldClass =
  'block h-11 w-full rounded-[11px] border border-slate-200 bg-slate-50 py-0 pl-3 pr-11 text-sm text-[#0F172A] placeholder:text-slate-400 transition focus:border-[#1D4ED8] focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100';

const secondaryButtonClass =
  'inline-flex h-12 flex-1 items-center justify-center gap-1.5 rounded-[12px] border border-slate-200 bg-white px-4 text-[15px] font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50';

export function SignupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<StepId>(0);
  const [maxReached, setMaxReached] = useState<StepId>(0);
  const [form, setForm] = useState<SignupFormState>({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'Faculty'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [errors, setErrors] = useState<SignupErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordRequirements = useMemo(
    () => [
      { label: '8+ characters', passed: form.password.length >= 8 },
      { label: 'Uppercase', passed: /[A-Z]/.test(form.password) },
      { label: 'Lowercase', passed: /[a-z]/.test(form.password) },
      { label: 'Number', passed: /\d/.test(form.password) }
    ],
    [form.password]
  );
  const showPasswordRequirements =
    form.password.length > 0 && passwordRequirements.some(({ passed }) => !passed);

  const canSubmitFinal =
    Boolean(form.firstName.trim()) &&
    Boolean(form.lastName.trim()) &&
    Boolean(form.email.trim()) &&
    Boolean(form.password) &&
    Boolean(form.confirmPassword) &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) &&
    form.password.length >= 8 &&
    /[A-Z]/.test(form.password) &&
    /[a-z]/.test(form.password) &&
    /\d/.test(form.password) &&
    form.password === form.confirmPassword &&
    acceptedTerms &&
    isSelfRegisterRole(form.role);

  const handleChange = (field: keyof SignupFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined, general: undefined }));
  };

  const validateStep = (target: StepId): SignupErrors => {
    const nextErrors: SignupErrors = {};

    if (target === 0) {
      if (!form.firstName.trim()) nextErrors.firstName = 'First name is required.';
      if (!form.lastName.trim()) nextErrors.lastName = 'Last name is required.';
    }

    if (target === 1) {
      if (!form.email.trim()) {
        nextErrors.email = 'Institutional email is required.';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        nextErrors.email = 'Please enter a valid email address.';
      }
      if (!form.password) {
        nextErrors.password = 'Password is required.';
      } else if (
        form.password.length < 8 ||
        !/[A-Z]/.test(form.password) ||
        !/[a-z]/.test(form.password) ||
        !/\d/.test(form.password)
      ) {
        nextErrors.password = 'Password must meet the security requirements.';
      }
      if (!form.confirmPassword) {
        nextErrors.confirmPassword = 'Please confirm your password.';
      } else if (form.password !== form.confirmPassword) {
        nextErrors.confirmPassword = 'Passwords do not match.';
      }
    }

    if (target === 2) {
      if (!form.role.trim()) {
        nextErrors.role = 'Please select an account type.';
      } else if (!isSelfRegisterRole(form.role)) {
        nextErrors.role = 'Self-registration is limited to Faculty or Staff accounts.';
      }
      if (!acceptedTerms) {
        nextErrors.general = 'You must agree to the Terms and Conditions and Privacy Policy before continuing.';
      }
    }

    return nextErrors;
  };

  const goToStep = (next: StepId) => {
    if (next === step) return;
    if (next > step) {
      // Must validate every intermediate step before skipping ahead.
      for (let i = step; i < next; i += 1) {
        const stepErrors = validateStep(i as StepId);
        if (Object.keys(stepErrors).length > 0) {
          setErrors(stepErrors);
          setStep(i as StepId);
          return;
        }
      }
    }
    setErrors({});
    setStep(next);
    setMaxReached((current) => (next > current ? next : current));
  };

  const handleContinue = () => {
    const stepErrors = validateStep(step);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    if (step < 2) {
      const next = (step + 1) as StepId;
      setErrors({});
      setStep(next);
      setMaxReached((current) => (next > current ? next : current));
    }
  };

  const handleBack = () => {
    if (step === 0) return;
    setErrors({});
    setStep((current) => (current - 1) as StepId);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (step !== 2) {
      handleContinue();
      return;
    }

    const stepErrors = validateStep(2);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }

    const normalizedEmail = form.email.trim().toLowerCase();

    setIsSubmitting(true);
    window.setTimeout(async () => {
      try {
        await initializeAuthStore();
        if (findAccountByEmail(normalizedEmail)) {
          setErrors({ general: 'An account with this institutional email already exists.' });
          setIsSubmitting(false);
          return;
        }

        const role = sanitizeSelfRegisterRole(form.role);
        const userRecord = {
          id: `u-reg-${Date.now()}`,
          firstName: form.firstName.trim(),
          middleName: form.middleName.trim(),
          lastName: form.lastName.trim(),
          email: normalizedEmail,
          passwordHash: await hashPassword(form.password),
          role,
          createdAt: new Date().toISOString(),
          acceptedTermsVersion: TERMS_VERSION,
          acceptedTermsTimestamp: new Date().toISOString()
        };

        addAccount(userRecord);
        upsertPortalUserFromAccount(userRecord);
        startSession(userRecord);
        setIsSubmitting(false);
        navigate(defaultPostLoginPath(role), { replace: true });
      } catch {
        setErrors({ general: 'We could not create your account right now. Please try again.' });
        setIsSubmitting(false);
      }
    }, 900);
  };

  return (
    <AuthLayout>
      <header className="mb-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#1D4ED8]">Join ACCREVIA</p>
        <h1 className="mt-1.5 text-[1.65rem] font-bold tracking-tight text-[#0F172A] sm:text-[1.8rem]">
          Create your account
        </h1>
        <p className="mt-1.5 text-[13px] leading-relaxed text-[#64748B] sm:text-sm">
          Register using your official NEMSU institutional email to access accreditation resources.
        </p>
      </header>

      {/* Progress indicator */}
      <nav aria-label="Registration steps" className="mb-6">
        <ol className="flex items-center justify-between gap-1">
          {STEPS.map((item, index) => {
            const completed = item.id < step;
            const active = item.id === step;
            const reachable = item.id <= maxReached;
            return (
              <li key={item.id} className="flex min-w-0 flex-1 items-center">
                <button
                  type="button"
                  disabled={!reachable}
                  onClick={() => goToStep(item.id)}
                  className={`group flex min-w-0 flex-1 flex-col items-center gap-1.5 ${
                    reachable ? 'cursor-pointer' : 'cursor-not-allowed opacity-55'
                  }`}
                  aria-current={active ? 'step' : undefined}
                >
                  <span
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-bold transition ${
                      completed
                        ? 'bg-[#1D4ED8] text-white'
                        : active
                          ? 'bg-[#1D4ED8] text-white ring-4 ring-blue-100'
                          : 'border border-slate-200 bg-slate-50 text-slate-500'
                    }`}
                  >
                    {completed ? <Check className="h-4 w-4" strokeWidth={2.5} /> : item.short}
                  </span>
                  <span
                    className={`truncate text-[11px] font-semibold ${
                      active || completed ? 'text-[#1D4ED8]' : 'text-slate-500'
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
                {index < STEPS.length - 1 && (
                  <span
                    aria-hidden="true"
                    className={`mx-1 mb-5 h-0.5 w-full max-w-[2.75rem] shrink rounded-full sm:max-w-[3.5rem] ${
                      item.id < step ? 'bg-[#1D4ED8]' : 'bg-slate-200'
                    }`}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      <form onSubmit={handleSubmit} noValidate className="flex flex-1 flex-col">
        <div className="min-h-[14.5rem]">
          {step === 0 && (
            <div className="space-y-3.5 animate-[auth-step-in_220ms_ease-out]">
              <div className="grid gap-3.5 sm:grid-cols-2">
                <div>
                  <label htmlFor="firstName" className={authLabelClass}>
                    First Name
                  </label>
                  <input
                    id="firstName"
                    value={form.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    className={authFieldClass}
                    placeholder="Juan"
                    autoComplete="given-name"
                    aria-invalid={Boolean(errors.firstName)}
                  />
                  {errors.firstName && <p className="mt-1.5 text-[12px] text-red-600">{errors.firstName}</p>}
                </div>
                <div>
                  <label htmlFor="lastName" className={authLabelClass}>
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    value={form.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    className={authFieldClass}
                    placeholder="Dela Cruz"
                    autoComplete="family-name"
                    aria-invalid={Boolean(errors.lastName)}
                  />
                  {errors.lastName && <p className="mt-1.5 text-[12px] text-red-600">{errors.lastName}</p>}
                </div>
              </div>
              <div>
                <label htmlFor="middleName" className={authLabelClass}>
                  Middle Name <span className="font-normal text-slate-400">(Optional)</span>
                </label>
                <input
                  id="middleName"
                  value={form.middleName}
                  onChange={(e) => handleChange('middleName', e.target.value)}
                  className={authFieldClass}
                  placeholder="Optional"
                  autoComplete="additional-name"
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3.5 animate-[auth-step-in_220ms_ease-out]">
              <div>
                <label htmlFor="email" className={authLabelClass}>
                  Enter Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className={authFieldClass}
                  placeholder="name@nemsu.edu.ph"
                  autoComplete="email"
                  aria-invalid={Boolean(errors.email)}
                />
                {errors.email && <p className="mt-1.5 text-[12px] text-red-600">{errors.email}</p>}
              </div>

              <div className="grid gap-3.5 sm:grid-cols-2">
                <div>
                  <label htmlFor="password" className={authLabelClass}>
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      className={passwordFieldClass}
                      placeholder="Create password"
                      autoComplete="new-password"
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
                  {errors.password && <p className="mt-1.5 text-[12px] text-red-600">{errors.password}</p>}
                </div>
                <div>
                  <label htmlFor="confirmPassword" className={authLabelClass}>
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={form.confirmPassword}
                      onChange={(e) => handleChange('confirmPassword', e.target.value)}
                      className={passwordFieldClass}
                      placeholder="Repeat password"
                      autoComplete="new-password"
                      aria-invalid={Boolean(errors.confirmPassword)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((value) => !value)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-200/80 hover:text-slate-700"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1.5 text-[12px] text-red-600">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>

              {showPasswordRequirements && (
                <div className="flex flex-wrap gap-x-3 gap-y-1.5 rounded-[10px] border border-slate-200 bg-slate-50 px-3 py-2">
                  {passwordRequirements.map(({ label, passed }) => (
                    <div key={label} className="inline-flex items-center gap-1.5 text-[11px] text-slate-600">
                      <span
                        className={`inline-flex h-4 w-4 items-center justify-center rounded-full ${
                          passed ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {passed ? (
                          <Check className="h-2.5 w-2.5" />
                        ) : (
                          <span className="h-1 w-1 rounded-full bg-current" />
                        )}
                      </span>
                      {label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3.5 animate-[auth-step-in_220ms_ease-out]">
              <div>
                <label htmlFor="role" className={authLabelClass}>
                  Account Type
                </label>
                <select
                  id="role"
                  value={form.role}
                  onChange={(e) => handleChange('role', e.target.value)}
                  className={authFieldClass}
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                {errors.role && <p className="mt-1.5 text-[12px] text-red-600">{errors.role}</p>}
              </div>

              <label className="flex items-start gap-2.5 rounded-[10px] border border-slate-200 bg-slate-50 px-3 py-2.5 text-[12px] leading-snug text-slate-700">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => {
                    setAcceptedTerms(e.target.checked);
                    setErrors((current) => ({ ...current, general: undefined }));
                  }}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-[#1D4ED8] focus:ring-[#1D4ED8]"
                />
                <span>
                  I agree to the{' '}
                  <button
                    type="button"
                    onClick={() => setShowTermsModal(true)}
                    className="font-semibold text-[#1D4ED8] underline underline-offset-2"
                  >
                    Terms and Conditions
                  </button>{' '}
                  and{' '}
                  <button
                    type="button"
                    onClick={() => setShowTermsModal(true)}
                    className="font-semibold text-[#1D4ED8] underline underline-offset-2"
                  >
                    Privacy Policy
                  </button>
                  .
                </span>
              </label>
            </div>
          )}
        </div>

        {errors.general && (
          <div className="mt-3 rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
            {errors.general}
          </div>
        )}

        <div className="mt-6 flex items-center gap-2.5">
          {step > 0 ? (
            <button type="button" onClick={handleBack} disabled={isSubmitting} className={secondaryButtonClass}>
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
          ) : null}

          {step < 2 ? (
            <button
              type="button"
              onClick={handleContinue}
              className={`${authPrimaryButtonClass} ${step > 0 ? 'flex-1' : ''}`}
            >
              Continue
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!canSubmitFinal || isSubmitting}
              className={`${authPrimaryButtonClass} flex-1`}
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          )}
        </div>
      </form>

      <p className="mt-5 text-center text-[13px] text-[#64748B]">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-[#1D4ED8] transition hover:text-[#163A75]">
          Sign In
        </Link>
      </p>

      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-[1.25rem] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#1D4ED8]">Terms & Privacy</p>
                <h3 className="mt-2 text-2xl font-bold text-[#0F172A]">Accrevia Terms and Conditions</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
              >
                Close
              </button>
            </div>

            <div className="mt-6 space-y-5 text-sm leading-7 text-slate-600">
              <p>
                <strong>Version:</strong> {TERMS_VERSION}
              </p>
              <p>
                <strong>Effective Date:</strong> {new Date().toLocaleDateString()}
              </p>

              <div>
                <p className="font-semibold text-slate-900">1. Account Registration and Eligibility</p>
                <p>
                  Users must be authorized personnel, faculty members, staff, or designated institutional evaluators of
                  North Eastern Mindanao State University (NEMSU), or other approved stakeholders involved in
                  accreditation and quality assurance work.
                </p>
              </div>

              <div>
                <p className="font-semibold text-slate-900">2. User Responsibilities</p>
                <p>
                  Users are responsible for maintaining the integrity of their account credentials, ensuring accurate
                  information, and using the platform for authorized institutional purposes only.
                </p>
              </div>

              <div>
                <p className="font-semibold text-slate-900">3. Acceptable Use of the System</p>
                <p>
                  Accrevia must be used only for institutional accreditation evidence management, document retrieval, and
                  other quality assurance functions approved by NEMSU.
                </p>
              </div>

              <div>
                <p className="font-semibold text-slate-900">4. Document Uploading and Management</p>
                <p>
                  Users may upload and manage documents related to accreditation and institutional quality assurance,
                  provided such materials are accurate, relevant, and aligned with official policies.
                </p>
              </div>

              <div>
                <p className="font-semibold text-slate-900">5. Confidentiality of Accreditation Evidence</p>
                <p>
                  Accreditation documents and supporting records may contain institutional, personal, or sensitive
                  information. Users must handle them in accordance with relevant institutional rules and confidentiality
                  expectations.
                </p>
              </div>

              <div>
                <p className="font-semibold text-slate-900">6. Data Privacy and Personal Information</p>
                <p>
                  Accrevia is designed to support the secure management of accreditation-related information in compliance
                  with the Data Privacy Act of 2012 (Republic Act No. 10173) and related implementing rules and
                  regulations. Personal data shall be collected, processed, stored, and disclosed only for legitimate
                  institutional purposes, with access limited to authorized users.
                </p>
              </div>

              <div>
                <p className="font-semibold text-slate-900">7. Account Security</p>
                <p>
                  Users must not share their credentials, allow unauthorized access, or attempt to circumvent system
                  security controls. NEMSU reserves the right to suspend or revoke access for policy violations.
                </p>
              </div>

              <div>
                <p className="font-semibold text-slate-900">8. Intellectual Property</p>
                <p>
                  Documents, templates, and records uploaded to Accrevia remain subject to applicable institutional
                  ownership, data governance, and intellectual property policies unless otherwise indicated.
                </p>
              </div>

              <div>
                <p className="font-semibold text-slate-900">9. Unauthorized Access and Prohibited Activities</p>
                <p>
                  Any attempt to access, modify, or distribute evidence outside authorized roles, or to interfere with
                  system services, is strictly prohibited.
                </p>
              </div>

              <div>
                <p className="font-semibold text-slate-900">10. Account Suspension or Termination</p>
                <p>
                  NEMSU may suspend, restrict, or terminate an account when there is evidence of misuse, non-compliance,
                  or reports of unauthorized access.
                </p>
              </div>

              <div>
                <p className="font-semibold text-slate-900">11. System Availability and Limitations</p>
                <p>
                  The system is provided on an as-available basis, and while reasonable service levels are maintained,
                  NEMSU does not guarantee uninterrupted access or error-free operation.
                </p>
              </div>

              <div>
                <p className="font-semibold text-slate-900">12. Amendments to the Terms and Conditions</p>
                <p>
                  These terms may be updated from time to time to reflect institutional policy, legal requirements, system
                  changes, or user needs. Continued use of the platform after updates constitutes acceptance of the
                  revised agreement.
                </p>
              </div>

              <div>
                <p className="font-semibold text-slate-900">13. Contact Information</p>
                <p>
                  For privacy concerns, account support, or policy clarification, contact the NEMSU Quality Assurance
                  Office at qa-office@nemsu.edu.ph or the designated institutional admin contact.
                </p>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setAcceptedTerms(true);
                  setErrors((current) => ({ ...current, general: undefined }));
                  setShowTermsModal(false);
                }}
                className="inline-flex items-center gap-2 rounded-full bg-[#1D4ED8] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/15 transition hover:bg-[#163A75]"
              >
                <UserRound className="h-4 w-4" />
                I agree to these terms
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthLayout>
  );
}
