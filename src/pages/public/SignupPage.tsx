import React, { useMemo, useState } from 'react';
import { ArrowLeft, Check, Eye, EyeOff, LoaderCircle, UserRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { PublicBrandingPanel } from '../../components/layout/PublicBrandingPanel';

type SignupFormState = {
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
};

type SignupErrors = Partial<Record<'firstName' | 'lastName' | 'email' | 'password' | 'confirmPassword' | 'role' | 'general', string>>;

const ROLE_OPTIONS = ['Faculty', 'Staff', 'Accreditor', 'Administrator'];
const TERMS_VERSION = 'v1.0';

function safeReadUsers(): Array<Record<string, unknown>> {
  if (typeof window === 'undefined') {
    return [] as Array<Record<string, unknown>>;
  }

  try {
    const value = window.localStorage.getItem('accrevia-users');
    const parsed: unknown = value ? JSON.parse(value) : [];
    return Array.isArray(parsed) ? parsed as Array<Record<string, unknown>> : [];
  } catch {
    return [];
  }
}

export function SignupPage() {
  const navigate = useNavigate();
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
      { label: 'At least 8 characters', passed: form.password.length >= 8 },
      { label: 'One uppercase letter', passed: /[A-Z]/.test(form.password) },
      { label: 'One lowercase letter', passed: /[a-z]/.test(form.password) },
      { label: 'One number', passed: /\d/.test(form.password) }
    ],
    [form.password]
  );
  const showPasswordRequirements =
    form.password.length > 0 && passwordRequirements.some(({ passed }) => !passed);

  const allValid =
    form.firstName.trim() &&
    form.lastName.trim() &&
    form.email.trim() &&
    form.password &&
    form.confirmPassword &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) &&
    form.password.length >= 8 &&
    /[A-Z]/.test(form.password) &&
    /[a-z]/.test(form.password) &&
    /\d/.test(form.password) &&
    form.password === form.confirmPassword &&
    acceptedTerms;

  const handleChange = (field: keyof SignupFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined, general: undefined }));
  };

  const validate = () => {
    const nextErrors: SignupErrors = {};

    if (!form.firstName.trim()) {
      nextErrors.firstName = 'First name is required.';
    }
    if (!form.lastName.trim()) {
      nextErrors.lastName = 'Last name is required.';
    }
    if (!form.email.trim()) {
      nextErrors.email = 'Institutional email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = 'Please enter a valid email address.';
    }
    if (!form.password) {
      nextErrors.password = 'Password is required.';
    } else if (form.password.length < 8 || !/[A-Z]/.test(form.password) || !/[a-z]/.test(form.password) || !/\d/.test(form.password)) {
      nextErrors.password = 'Password must meet the security requirements.';
    }
    if (!form.confirmPassword) {
      nextErrors.confirmPassword = 'Please confirm your password.';
    } else if (form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }
    if (!form.role.trim()) {
      nextErrors.role = 'Please select a user role.';
    }

    if (!acceptedTerms) {
      nextErrors.general = 'You must agree to the Terms and Conditions and Privacy Policy before continuing.';
    }

    return nextErrors;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const users = safeReadUsers();
    const normalizedEmail = form.email.trim().toLowerCase();
    const duplicate = users.some((user) => String(user.email ?? '').toLowerCase() === normalizedEmail);

    if (duplicate) {
      setErrors({ general: 'An account with this institutional email already exists.' });
      return;
    }

    setIsSubmitting(true);
    window.setTimeout(() => {
      const userRecord = {
        firstName: form.firstName.trim(),
        middleName: form.middleName.trim(),
        lastName: form.lastName.trim(),
        email: normalizedEmail,
        password: form.password,
        role: form.role,
        acceptedTermsVersion: TERMS_VERSION,
        acceptedTermsTimestamp: new Date().toISOString()
      };

      const updatedUsers = [...users, userRecord];
      window.localStorage.setItem('accrevia-users', JSON.stringify(updatedUsers));
      window.localStorage.setItem('accrevia-auth', 'true');
      window.localStorage.setItem('accrevia-current-user', JSON.stringify(userRecord));
      setIsSubmitting(false);
      navigate('/dashboard', { replace: true });
    }, 900);
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_35px_90px_-30px_rgba(15,23,42,0.28)]">
        <div className="grid min-h-[760px] lg:grid-cols-[1.1fr_0.9fr]">
          <PublicBrandingPanel showSignupSubtext />

          <div className="flex items-center justify-center p-6 sm:p-10 lg:max-h-[760px] lg:overflow-y-auto">
            <div className="w-full max-w-md">
              <div className="mb-8 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-700">Sign Up</p>
                  <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900">Create your account</h2>
                </div>
                <Link to="/" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Link>
              </div>

              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="firstName" className="mb-2 block text-sm font-semibold text-slate-700">First Name</label>
                    <input id="firstName" value={form.firstName} onChange={(e) => handleChange('firstName', e.target.value)} className="block w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100" placeholder="Juan" aria-invalid={Boolean(errors.firstName)} />
                    {errors.firstName && <p className="mt-2 text-sm text-red-600">{errors.firstName}</p>}
                  </div>

                  <div>
                    <label htmlFor="lastName" className="mb-2 block text-sm font-semibold text-slate-700">Last Name</label>
                    <input id="lastName" value={form.lastName} onChange={(e) => handleChange('lastName', e.target.value)} className="block w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100" placeholder="Dela Cruz" aria-invalid={Boolean(errors.lastName)} />
                    {errors.lastName && <p className="mt-2 text-sm text-red-600">{errors.lastName}</p>}
                  </div>
                </div>

                <div>
                  <label htmlFor="middleName" className="mb-2 block text-sm font-semibold text-slate-700">Middle Name (optional)</label>
                  <input id="middleName" value={form.middleName} onChange={(e) => handleChange('middleName', e.target.value)} className="block w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100" placeholder="Optional" />
                </div>

                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">Institutional Email Address</label>
                  <input id="email" type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} className="block w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100" placeholder="name@nemsu.edu.ph" aria-invalid={Boolean(errors.email)} />
                  {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email}</p>}
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">Password</label>
                    <div className="relative">
                      <input id="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => handleChange('password', e.target.value)} className="block w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 pr-11 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100" placeholder="Create password" aria-invalid={Boolean(errors.password)} />
                      <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="mt-2 text-sm text-red-600">{errors.password}</p>}
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="mb-2 block text-sm font-semibold text-slate-700">Confirm Password</label>
                    <div className="relative">
                      <input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} value={form.confirmPassword} onChange={(e) => handleChange('confirmPassword', e.target.value)} className="block w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 pr-11 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100" placeholder="Repeat password" aria-invalid={Boolean(errors.confirmPassword)} />
                      <button type="button" onClick={() => setShowConfirmPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700" aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}>
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="mt-2 text-sm text-red-600">{errors.confirmPassword}</p>}
                  </div>
                </div>

                <div>
                  <label htmlFor="role" className="mb-2 block text-sm font-semibold text-slate-700">User Role</label>
                  <select id="role" value={form.role} onChange={(e) => handleChange('role', e.target.value)} className="block w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100">
                    {ROLE_OPTIONS.map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                  {errors.role && <p className="mt-2 text-sm text-red-600">{errors.role}</p>}
                </div>

                {showPasswordRequirements && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-700">Password requirements</p>
                      <div className="mt-3 space-y-2">
                        {passwordRequirements.map(({ label, passed }) => (
                          <div key={label} className="flex items-center gap-2 text-sm text-slate-600">
                            <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full ${passed ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                              {passed ? <Check className="h-3.5 w-3.5" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                            </span>
                            {label}
                          </div>
                        ))}
                      </div>
                  </div>
                )}

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <label className="flex items-start gap-3 text-sm text-slate-700">
                    <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    <span>
                      I have read and agree to the <button type="button" onClick={() => setShowTermsModal(true)} className="font-semibold text-blue-700 underline underline-offset-2">Terms and Conditions</button> and <button type="button" onClick={() => setShowTermsModal(true)} className="font-semibold text-blue-700 underline underline-offset-2">Privacy Policy</button>.
                    </span>
                  </label>
                </div>

                {errors.general && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {errors.general}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!allValid || isSubmitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-700 px-4 py-3 text-base font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
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
              </form>

              <p className="mt-8 text-center text-sm text-slate-600">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-blue-700 transition hover:text-blue-800">
                  Login here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">Terms & Privacy</p>
                <h3 className="mt-2 text-2xl font-black text-slate-900">Accrevia Terms and Conditions</h3>
              </div>
              <button type="button" onClick={() => setShowTermsModal(false)} className="rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900">
                Close
              </button>
            </div>

            <div className="mt-6 space-y-5 text-sm leading-7 text-slate-600">
              <p><strong>Version:</strong> {TERMS_VERSION}</p>
              <p><strong>Effective Date:</strong> {new Date().toLocaleDateString()}</p>

              <div>
                <p className="font-semibold text-slate-900">1. Account Registration and Eligibility</p>
                <p>Users must be authorized personnel, faculty members, staff, or designated institutional evaluators of North Eastern Mindanao State University (NEMSU), or other approved stakeholders involved in accreditation and quality assurance work.</p>
              </div>

              <div>
                <p className="font-semibold text-slate-900">2. User Responsibilities</p>
                <p>Users are responsible for maintaining the integrity of their account credentials, ensuring accurate information, and using the platform for authorized institutional purposes only.</p>
              </div>

              <div>
                <p className="font-semibold text-slate-900">3. Acceptable Use of the System</p>
                <p>Accrevia must be used only for institutional accreditation evidence management, document retrieval, and other quality assurance functions approved by NEMSU.</p>
              </div>

              <div>
                <p className="font-semibold text-slate-900">4. Document Uploading and Management</p>
                <p>Users may upload and manage documents related to accreditation and institutional quality assurance, provided such materials are accurate, relevant, and aligned with official policies.</p>
              </div>

              <div>
                <p className="font-semibold text-slate-900">5. Confidentiality of Accreditation Evidence</p>
                <p>Accreditation documents and supporting records may contain institutional, personal, or sensitive information. Users must handle them in accordance with relevant institutional rules and confidentiality expectations.</p>
              </div>

              <div>
                <p className="font-semibold text-slate-900">6. Data Privacy and Personal Information</p>
                <p>Accrevia is designed to support the secure management of accreditation-related information in compliance with the Data Privacy Act of 2012 (Republic Act No. 10173) and related implementing rules and regulations. Personal data shall be collected, processed, stored, and disclosed only for legitimate institutional purposes, with access limited to authorized users.</p>
              </div>

              <div>
                <p className="font-semibold text-slate-900">7. Account Security</p>
                <p>Users must not share their credentials, allow unauthorized access, or attempt to circumvent system security controls. NEMSU reserves the right to suspend or revoke access for policy violations.</p>
              </div>

              <div>
                <p className="font-semibold text-slate-900">8. Intellectual Property</p>
                <p>Documents, templates, and records uploaded to Accrevia remain subject to applicable institutional ownership, data governance, and intellectual property policies unless otherwise indicated.</p>
              </div>

              <div>
                <p className="font-semibold text-slate-900">9. Unauthorized Access and Prohibited Activities</p>
                <p>Any attempt to access, modify, or distribute evidence outside authorized roles, or to interfere with system services, is strictly prohibited.</p>
              </div>

              <div>
                <p className="font-semibold text-slate-900">10. Account Suspension or Termination</p>
                <p>NEMSU may suspend, restrict, or terminate an account when there is evidence of misuse, non-compliance, or reports of unauthorized access.</p>
              </div>

              <div>
                <p className="font-semibold text-slate-900">11. System Availability and Limitations</p>
                <p>The system is provided on an as-available basis, and while reasonable service levels are maintained, NEMSU does not guarantee uninterrupted access or error-free operation.</p>
              </div>

              <div>
                <p className="font-semibold text-slate-900">12. Amendments to the Terms and Conditions</p>
                <p>These terms may be updated from time to time to reflect institutional policy, legal requirements, system changes, or user needs. Continued use of the platform after updates constitutes acceptance of the revised agreement.</p>
              </div>

              <div>
                <p className="font-semibold text-slate-900">13. Contact Information</p>
                <p>For privacy concerns, account support, or policy clarification, contact the NEMSU Quality Assurance Office at qa-office@nemsu.edu.ph or the designated institutional admin contact.</p>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button type="button" onClick={() => { setAcceptedTerms(true); setShowTermsModal(false); }} className="inline-flex items-center gap-2 rounded-full bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-800">
                <UserRound className="h-4 w-4" />
                I agree to these terms
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
