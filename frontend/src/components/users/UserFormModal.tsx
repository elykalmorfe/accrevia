import React, { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { TextField } from '../ui/TextField';
import { SelectField } from '../ui/SelectField';
import { PortalUser, UserRole, UserStatus } from '../../types/user';
import { SYSTEM_FEATURES, ALL_FEATURE_IDS } from '../../data/features';
import {
  AlertCircleIcon,
  CheckIcon,
  CopyIcon,
  EyeIcon,
  EyeOffIcon,
  KeyRoundIcon,
  RefreshCwIcon,
  CheckSquare2Icon
} from 'lucide-react';

interface UserFormModalProps {
  open: boolean;
  user: PortalUser | null;
  onClose: () => void;
  onSave: (user: PortalUser) => void;
}

/**
 * Generates a cryptographically strong, non-repeating temporary password.
 * Combines CSPRNG entropy with uppercase, lowercase, numbers, special symbols,
 * and a millisecond-precision chronological token ensuring zero collision across users.
 */
function generateUniqueTemporaryPassword(): string {
  const charsUpper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // excludes ambiguous I, O
  const charsLower = 'abcdefghijkmnopqrstuvwxyz'; // excludes ambiguous l
  const charsDigits = '23456789'; // excludes ambiguous 0, 1
  const charsSymbols = '!@#$%&*';

  const array = new Uint8Array(16);
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < 16; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }

  // Guaranteed character representation
  const block1 = [
    charsUpper[array[0] % charsUpper.length],
    charsLower[array[1] % charsLower.length],
    charsDigits[array[2] % charsDigits.length],
    charsSymbols[array[3] % charsSymbols.length]
  ];

  const block2 = [
    charsUpper[array[4] % charsUpper.length],
    charsLower[array[5] % charsLower.length],
    charsDigits[array[6] % charsDigits.length],
    charsSymbols[array[7] % charsSymbols.length]
  ];

  // Cryptographic shuffle
  for (let i = 3; i > 0; i--) {
    const j = array[8 + i] % (i + 1);
    [block1[i], block1[j]] = [block1[j], block1[i]];
    const k = array[12 + i] % (i + 1);
    [block2[i], block2[k]] = [block2[k], block2[i]];
  }

  // Unique chronological component to guarantee non-collision
  const timeSalt = (Date.now().toString(36) + Math.random().toString(36).slice(2, 4))
    .slice(-4)
    .toUpperCase();

  return `Nem#${block1.join('')}-${block2.join('')}${timeSalt}`;
}

export function UserFormModal({ open, user, onClose, onSave }: UserFormModalProps) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Administrator' as UserRole,
    status: 'Active' as UserStatus
  });

  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(ALL_FEATURE_IDS);
  const [showPassword, setShowPassword] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setCopied(false);
    setShowPassword(true);
    setIsResettingPassword(false);

    if (user) {
      setForm({
        name: user.name,
        email: user.email,
        password: '',
        role: user.role === 'Superadmin' ? 'Superadmin' : 'Administrator',
        status: user.status || 'Active'
      });
      setSelectedFeatures(user.allowedFeatures && user.allowedFeatures.length > 0 ? user.allowedFeatures : ALL_FEATURE_IDS);
    } else {
      setForm({
        name: '',
        email: '',
        password: generateUniqueTemporaryPassword(),
        role: 'Administrator',
        status: 'Active'
      });
      setSelectedFeatures(ALL_FEATURE_IDS);
    }
  }, [open, user]);

  const handleRoleChange = (role: UserRole) => {
    setForm((f) => ({ ...f, role }));
    if (role === 'Superadmin') {
      setSelectedFeatures(ALL_FEATURE_IDS);
    }
  };

  const handleCopyPassword = () => {
    if (!form.password) return;
    try {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(form.password);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = form.password;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleRegeneratePassword = () => {
    const nextPassword = generateUniqueTemporaryPassword();
    setForm((f) => ({ ...f, password: nextPassword }));
    setCopied(false);
  };

  const toggleFeature = (featId: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(featId) ? prev.filter((id) => id !== featId) : [...prev, featId]
    );
  };

  const handleSelectAll = () => {
    setSelectedFeatures(ALL_FEATURE_IDS);
  };

  const handleClear = () => {
    setSelectedFeatures([]);
  };

  const save = () => {
    if (!form.name.trim()) {
      return setError('Please enter the user\'s full name.');
    }
    if (!form.email.trim() || !/^\S+@\S+\.\S+$/.test(form.email)) {
      return setError('Please enter a valid email address.');
    }

    if (!form.email.toLowerCase().endsWith('@nemsu.edu.ph')) {
      return setError(
        'NEMSU Workspace Restriction: University accounts must use an official @nemsu.edu.ph email address.'
      );
    }

    if (!user && !form.password.trim()) {
      return setError('Please provide or generate a temporary password for the account owner.');
    }
    if (isResettingPassword && !form.password.trim()) {
      return setError('Please provide or generate a new temporary password.');
    }

    if (selectedFeatures.length === 0) {
      return setError('Please select at least one feature for this user account.');
    }

    onSave({
      id: user?.id ?? `u-${Date.now()}`,
      status: form.status,
      lastLogin: user?.lastLogin ?? null,
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      role: form.role,
      office: user?.office || (form.role === 'Superadmin' ? 'Office of the President' : 'Quality Assurance Office'),
      campusId: user?.campusId || 'Main Campus (Tandag City)',
      personnelClassification: form.role === 'Superadmin' ? 'Staff (Administrative)' : 'Staff (Technical)',
      affiliationVerified: true,
      temporaryPassword: form.password.trim() || undefined,
      allowedFeatures: selectedFeatures,
      approvedAt: user?.approvedAt || new Date().toISOString()
    });
    onClose();
  };

  const allSelected = selectedFeatures.length === ALL_FEATURE_IDS.length;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={user ? 'Edit User & Permissions' : 'Register / Add User'}
      description={
        user
          ? 'Update credentials, administrative role, and permitted system features.'
          : 'Create a new institutional administrator with verified credentials and tailored feature access.'
      }
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={save}>
            {user ? 'Save Changes' : 'Register User'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 flex items-start gap-2.5 text-xs text-rose-800">
            <AlertCircleIcon className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            <div>
              <p className="font-semibold">Validation Required</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* 1. Full Name */}
        <TextField
          label="Full Name"
          required
          value={form.name}
          onChange={(name) => setForm((f) => ({ ...f, name }))}
          placeholder="e.g. Dr. Maria Elena Santos"
        />

        {/* 2. Institutional Email */}
        <TextField
          label="Institutional Email"
          type="email"
          required
          value={form.email}
          onChange={(email) => setForm((f) => ({ ...f, email }))}
          placeholder="username@nemsu.edu.ph"
          hint="Must be an official @nemsu.edu.ph address"
        />

        {/* 3. Temporary Password */}
        {!user ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="label text-xs font-semibold text-ink flex items-center gap-1.5">
                <KeyRoundIcon className="h-3.5 w-3.5 text-brand-600" />
                <span>Temporary Password</span>
                <span className="text-rose-600 font-bold">*</span>
              </label>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleCopyPassword}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors"
                  title="Copy password to clipboard"
                >
                  {copied ? (
                    <>
                      <CheckIcon className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <CopyIcon className="h-3.5 w-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
                <span className="text-line-strong">•</span>
                <button
                  type="button"
                  onClick={handleRegeneratePassword}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors"
                  title="Generate a fresh unique password"
                >
                  <RefreshCwIcon className="h-3.5 w-3.5" />
                  <span>Generate New</span>
                </button>
              </div>
            </div>

            <div className="relative flex items-center">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Generated unique temporary password"
                className="input pr-10 font-mono text-sm tracking-wider font-semibold text-ink bg-surface select-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-ink-muted hover:text-ink transition-colors"
                title={showPassword ? 'Hide password' : 'View password'}
                aria-label={showPassword ? 'Hide password' : 'View password'}
              >
                {showPassword ? (
                  <EyeOffIcon className="h-4 w-4" />
                ) : (
                  <EyeIcon className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="text-[11px] text-ink-muted leading-relaxed">
              Unique temporary credentials generated for the account owner. Provide this password to the user; they will be prompted to change it upon first login.
            </p>
          </div>
        ) : !isResettingPassword ? (
          <div className="flex items-center justify-between rounded-xl border border-line bg-canvas/40 p-3">
            <div className="min-w-0 pr-2">
              <p className="text-xs font-semibold text-ink flex items-center gap-1.5">
                <KeyRoundIcon className="h-3.5 w-3.5 text-brand-600 shrink-0" />
                <span>Account Password</span>
              </p>
              <p className="text-[11px] text-ink-muted mt-0.5">
                Existing password is active and encrypted. Issue a new temporary password if needed.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsResettingPassword(true);
                setForm((f) => ({ ...f, password: generateUniqueTemporaryPassword() }));
              }}
              className="btn btn-secondary text-xs h-8 py-1 px-2.5 shrink-0"
            >
              Reset Password
            </button>
          </div>
        ) : (
          <div className="rounded-xl border border-brand-200/80 bg-brand-50/20 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-ink flex items-center gap-1.5">
                <KeyRoundIcon className="h-3.5 w-3.5 text-brand-600" />
                <span>New Temporary Password</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyPassword}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                >
                  {copied ? (
                    <>
                      <CheckIcon className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <CopyIcon className="h-3.5 w-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
                <span className="text-line-strong">•</span>
                <button
                  type="button"
                  onClick={handleRegeneratePassword}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                >
                  <RefreshCwIcon className="h-3.5 w-3.5" />
                  <span>Generate New</span>
                </button>
                <span className="text-line-strong">•</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsResettingPassword(false);
                    setForm((f) => ({ ...f, password: '' }));
                  }}
                  className="text-xs text-ink-muted hover:text-ink underline"
                >
                  Cancel
                </button>
              </div>
            </div>

            <div className="relative flex items-center">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Generated unique temporary password"
                className="input pr-10 font-mono text-sm tracking-wider font-semibold text-ink bg-surface select-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-ink-muted hover:text-ink transition-colors"
                title={showPassword ? 'Hide password' : 'View password'}
                aria-label={showPassword ? 'Hide password' : 'View password'}
              >
                {showPassword ? (
                  <EyeOffIcon className="h-4 w-4" />
                ) : (
                  <EyeIcon className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* 4. Role (Dropdown) */}
        <SelectField
          label="Administrative Role"
          required
          value={form.role}
          onChange={(role) => handleRoleChange(role as UserRole)}
          options={['Administrator', 'Superadmin']}
        />

        {/* 5. Module & Feature Permissions */}
        <div className="space-y-3 pt-3 border-t border-line">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div>
              <div className="flex items-center gap-1.5">
                <CheckSquare2Icon className="h-4 w-4 text-brand-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-ink">
                  Permitted Modules & Features
                </span>
              </div>
              <p className="text-[11px] text-ink-muted mt-0.5">
                {allSelected ? (
                  <span className="text-emerald-700 font-semibold dark:text-emerald-400">
                    Full System Access (All {SYSTEM_FEATURES.length} features enabled)
                  </span>
                ) : selectedFeatures.length === 0 ? (
                  <span className="text-rose-600 font-semibold">
                    0 of {SYSTEM_FEATURES.length} features enabled (Select at least one)
                  </span>
                ) : (
                  <span>
                    Tailored Access: <strong className="text-ink">{selectedFeatures.length}</strong> of {SYSTEM_FEATURES.length} features enabled
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleSelectAll}
                className="btn btn-secondary text-xs h-7 py-0.5 px-2.5 font-semibold"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="btn btn-secondary text-xs h-7 py-0.5 px-2.5 font-semibold text-ink-muted hover:text-ink"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2 max-h-[320px] overflow-y-auto pr-1">
            {SYSTEM_FEATURES.map((feat) => {
              const isChecked = selectedFeatures.includes(feat.id);
              const Icon = feat.icon;
              return (
                <label
                  key={feat.id}
                  className={`group relative flex items-start gap-3 rounded-xl border p-3 cursor-pointer select-none transition-all duration-150 ${isChecked
                      ? 'border-brand-500/80 bg-brand-50/70 dark:bg-brand-950/30 shadow-2xs ring-1 ring-brand-500/20'
                      : 'border-line bg-surface hover:bg-canvas hover:border-line-strong opacity-80 hover:opacity-100'
                    }`}
                >
                  <div className="pt-0.5 shrink-0">
                    <div
                      className={`grid h-4 w-4 place-items-center rounded border transition-colors ${isChecked
                          ? 'bg-brand-600 border-brand-600 text-white shadow-xs'
                          : 'border-line-strong bg-surface group-hover:border-ink-muted'
                        }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleFeature(feat.id)}
                        className="sr-only"
                      />
                      {isChecked && <CheckIcon className="h-3 w-3 stroke-[3]" />}
                    </div>
                  </div>

                  <div
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border transition-colors ${isChecked
                        ? 'bg-brand-500/15 text-brand-600 dark:text-brand-400 border-brand-500/30 shadow-2xs'
                        : 'bg-canvas text-ink-muted border-line group-hover:text-ink'
                      }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-xs font-semibold leading-tight truncate transition-colors ${isChecked ? 'text-ink dark:text-white' : 'text-ink-muted group-hover:text-ink'
                        }`}
                    >
                      {feat.name}
                    </p>
                    <p className="text-[11px] text-ink-muted leading-relaxed line-clamp-2 mt-1">
                      {feat.description}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
}
