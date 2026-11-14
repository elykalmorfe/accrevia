import React, { useId, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  BadgeCheckIcon,
  BriefcaseIcon,
  CameraIcon,
  CheckIcon,
  EyeIcon,
  EyeOffIcon,
  MapPinIcon,
  MonitorIcon,
  MoonIcon,
  PencilIcon,
  ShieldCheckIcon,
  SunIcon,
  Trash2Icon,
  type LucideIcon,
} from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Tabs } from '../components/ui/Tabs';
import { InfoField, ProfileCard } from '../components/profile/ProfileCard';
import { usePortal } from '../contexts/PortalContext';
import { resizeAvatar, useProfile, type ProfileDetails } from '../hooks/useProfile';
import { useTheme, type ThemeMode } from '../hooks/useTheme';
import { formatDate, formatDateTime, initials } from '../utils/format';
import { changePassword, useSessionAccount } from '../utils/auth';

type AccountTab = 'profile' | 'settings';

export function Account() {
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as AccountTab) || 'profile';

  return (
    <div className="w-full">
      <PageHeader title="My Profile" description="Your personal details, address and how the portal looks for you." />
      <Tabs<AccountTab>
        label="Account sections"
        value={tab}
        onChange={(t) => setParams({ tab: t }, { replace: true })}
        className="mb-5"
        tabs={[{ id: 'profile', label: 'My Profile' }, { id: 'settings', label: 'Account Settings' }]}
      />
      {tab === 'profile' ? <ProfileTab /> : <SettingsTab />}
    </div>
  );
}

function ProfileTab() {
  return (
    <div className="space-y-5">
      <ProfileHeaderCard />
      <PersonalInfoCard />
      <AddressCard />
      <AppearanceCard />
    </div>
  );
}

function ProfileHeaderCard() {
  const { currentUser } = usePortal();
  const { profile, fullName, saveProfile } = useProfile(currentUser);
  const fileRef = useRef<HTMLInputElement>(null);
  const location = [profile.city, profile.country].filter(Boolean).join(', ');

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file.');
      return;
    }
    try {
      saveProfile({ avatar: await resizeAvatar(file) });
      toast.success('Profile photo updated');
    } catch {
      toast.error('Could not read that image.');
    }
  };

  return (
    <ProfileCard>
      <div className="flex flex-col flex-wrap items-center gap-5 text-center sm:flex-row sm:text-left">
        <div className="relative shrink-0">
          {profile.avatar ? (
            <img src={profile.avatar} alt="" className="h-24 w-24 rounded-full object-cover shadow-md ring-4 ring-white" />
          ) : (
            <span
              className="grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-2xl font-bold text-white shadow-md ring-4 ring-white"
              aria-hidden="true">
              {initials(fullName)}
            </span>
          )}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="absolute bottom-0 right-0 grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-brand-600 text-white shadow transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            aria-label="Change profile photo"
            title="Change photo">
            <CameraIcon className="h-4 w-4" />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              handleFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <h2 className="text-xl font-bold tracking-tight text-brand-700">{fullName}</h2>
            {currentUser.affiliationVerified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
                <BadgeCheckIcon className="h-3.5 w-3.5" />
                Verified
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm font-medium text-ink">{currentUser.role}</p>
          <div className="mt-2 flex flex-col items-center gap-1 text-[13px] text-ink-muted sm:items-start">
            <span className="inline-flex items-center gap-1.5">
              <BriefcaseIcon className="h-3.5 w-3.5 shrink-0" />
              {currentUser.office}
            </span>
            {location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPinIcon className="h-3.5 w-3.5 shrink-0" />
                {location}
              </span>
            )}
              </div>
            </div>

        <dl className="grid w-full grid-cols-3 divide-x divide-line rounded-xl border border-line bg-slate-50 text-center lg:w-auto lg:min-w-[420px]">
          {[
            { label: 'Employee ID', value: currentUser.employeeId ?? '—' },
            { label: 'Member Since', value: currentUser.registeredAt ? formatDate(currentUser.registeredAt) : '—' },
            { label: 'Last Login', value: currentUser.lastLogin ? formatDate(currentUser.lastLogin) : '—' },
          ].map((item) => (
            <div key={item.label} className="min-w-0 px-3 py-3">
              <dt className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">{item.label}</dt>
              <dd className="mt-1 truncate text-sm font-semibold text-ink" title={item.value}>{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>
      {profile.avatar && (
        <div className="mt-4 flex justify-center border-t border-line pt-3 sm:justify-start">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => saveProfile({ avatar: null })}>
            <Trash2Icon className="h-4 w-4" />
            Remove photo
          </button>
        </div>
      )}
    </ProfileCard>
  );
}

type EditableKey = Exclude<keyof ProfileDetails, 'avatar'>;

/** Draft state for a card that toggles between read and edit mode. */
function useEditableSection(keys: EditableKey[]) {
  const { currentUser } = usePortal();
  const { profile, saveProfile } = useProfile(currentUser);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Partial<ProfileDetails>>({});

  const start = () => {
    setDraft(Object.fromEntries(keys.map((k) => [k, profile[k]])));
    setEditing(true);
  };
  const cancel = () => setEditing(false);
  const value = (key: EditableKey) => (editing ? (draft[key] as string) ?? '' : profile[key]);
  const set = (key: EditableKey) => (v: string) => setDraft((d) => ({ ...d, [key]: v }));
  const save = (message: string) => {
    const trimmed = Object.fromEntries(Object.entries(draft).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v]));
    saveProfile(trimmed);
    setEditing(false);
    toast.success(message);
  };

  return { editing, draft, start, cancel, value, set, save };
}

function EditActions({ editing, onEdit, onCancel, onSave, variant }: { editing: boolean; onEdit: () => void; onCancel: () => void; onSave: () => void; variant: 'primary' | 'secondary' }) {
  if (editing) {
    return (
      <>
        <button type="button" className="btn btn-secondary btn-sm" onClick={onCancel}>Cancel</button>
        <button type="button" className="btn btn-primary btn-sm" onClick={onSave}>
          <CheckIcon className="h-4 w-4" />
          Save
        </button>
      </>
    );
  }
  return (
    <button type="button" className={`btn btn-sm ${variant === 'primary' ? 'btn-primary' : 'btn-secondary'}`} onClick={onEdit}>
      <PencilIcon className="h-3.5 w-3.5" />
      Edit
    </button>
  );
}

function PersonalInfoCard() {
  const { currentUser } = usePortal();
  const section = useEditableSection(['firstName', 'lastName', 'dob', 'email', 'phone']);
  const { editing, value, set } = section;

  const handleSave = () => {
    if (!section.draft.firstName?.trim()) {
      toast.error('First name is required.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(section.draft.email?.trim() ?? '')) {
      toast.error('Enter a valid email address.');
      return;
    }
    section.save('Personal information saved');
  };

  const dob = value('dob');
  return (
    <ProfileCard
      title="Personal Information"
      actions={<EditActions editing={editing} onEdit={section.start} onCancel={section.cancel} onSave={handleSave} variant="primary" />}>
      <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
        <InfoField label="First Name" value={value('firstName')} editing={editing} onChange={set('firstName')} />
        <InfoField label="Last Name" value={value('lastName')} editing={editing} onChange={set('lastName')} />
        <InfoField label="Date of Birth" type="date" value={dob} editing={editing} onChange={set('dob')} display={dob ? formatDate(dob) : undefined} />
        <InfoField label="Email Address" type="email" value={value('email')} editing={editing} onChange={set('email')} />
        <InfoField label="Phone Number" type="tel" value={value('phone')} editing={editing} onChange={set('phone')} placeholder="+63 9XX XXX XXXX" />
        <InfoField label="User Role" value={currentUser.role} />
      </div>
    </ProfileCard>
  );
}

function AddressCard() {
  const section = useEditableSection(['country', 'city', 'postalCode']);
  const { editing, value, set } = section;
  return (
    <ProfileCard
      title="Address"
      actions={<EditActions editing={editing} onEdit={section.start} onCancel={section.cancel} onSave={() => section.save('Address saved')} variant="secondary" />}>
      <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
        <InfoField label="Country" value={value('country')} editing={editing} onChange={set('country')} />
        <InfoField label="City / Municipality" value={value('city')} editing={editing} onChange={set('city')} />
        <InfoField label="Postal Code" value={value('postalCode')} editing={editing} onChange={set('postalCode')} />
      </div>
    </ProfileCard>
  );
}

const THEME_OPTIONS: { id: ThemeMode; label: string; hint: string; icon: LucideIcon }[] = [
  { id: 'light', label: 'Light', hint: 'Bright and clean', icon: SunIcon },
  { id: 'dark', label: 'Dark', hint: 'Easy on the eyes', icon: MoonIcon },
  { id: 'system', label: 'System', hint: 'Match your device', icon: MonitorIcon },
];

/** Fixed colours so each preview looks the same regardless of the active theme. */
function ThemePreview({ mode }: { mode: ThemeMode }) {
  const mock = (dark: boolean) => (
    <div className={`flex h-full w-full gap-1.5 p-2 ${dark ? 'bg-[#0f172a]' : 'bg-[#f8fafc]'}`}>
      <div className={`w-1/4 rounded ${dark ? 'bg-[#1e293b]' : 'bg-[#ffffff]'}`} />
      <div className="flex flex-1 flex-col gap-1.5">
        <div className={`h-2 w-2/3 rounded-full ${dark ? 'bg-[#334155]' : 'bg-[#e2e8f0]'}`} />
        <div className={`flex-1 rounded ${dark ? 'bg-[#1e293b]' : 'bg-[#ffffff]'}`} />
        <div className="h-2 w-1/3 rounded-full bg-[#3b82f6]" />
      </div>
    </div>
  );
  return (
    <div className="relative h-20 overflow-hidden rounded-lg border border-line">
      {mode === 'system' ? (
        <>
          {mock(false)}
          <div className="absolute inset-0 [clip-path:polygon(100%_0,100%_100%,0_100%)]">{mock(true)}</div>
        </>
      ) : (
        mock(mode === 'dark')
      )}
    </div>
  );
}

function AppearanceCard() {
  const { mode, resolved, setMode } = useTheme();
  return (
    <ProfileCard title="Appearance" description={mode === 'system' ? `Following your device (currently ${resolved}).` : 'Choose how Accrevia looks on this device.'}>
      <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Theme">
        {THEME_OPTIONS.map(({ id, label, hint, icon: Icon }) => {
          const active = mode === id;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setMode(id)}
              className={`relative rounded-xl border-2 p-3 text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                active ? 'border-brand-500 shadow-sm' : 'border-line hover:border-line-strong'
              }`}>
              <ThemePreview mode={id} />
              <div className="mt-3 flex items-center gap-2.5">
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${active ? 'bg-brand-600 text-white' : 'bg-slate-100 text-ink-muted'}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-ink">{label}</span>
                  <span className="block text-xs text-ink-muted">{hint}</span>
                </span>
              </div>
              {active && (
                <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-brand-600 text-white shadow">
                  <CheckIcon className="h-3 w-3" strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </ProfileCard>
  );
}

function SettingsTab() {
  return (
    <div className="space-y-5">
      <AccountDetailsCard />
      <PasswordCard />
    </div>
  );
}

const STATUS_TONE: Record<string, string> = {
  Active: 'bg-brand-50 text-brand-700',
  'Pending Approval': 'bg-brand-50 text-brand-700',
  Invited: 'bg-brand-50 text-brand-700',
  Deactivated: 'bg-slate-100 text-slate-600',
  Rejected: 'bg-brand-50 text-brand-900',
};

function AccountDetailsCard() {
  const { currentUser } = usePortal();
  const status = (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_TONE[currentUser.status] ?? STATUS_TONE.Deactivated}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {currentUser.status}
    </span>
  );
  return (
    <ProfileCard title="Account Details" description="Managed by the QA office. Ask an administrator if any of these need to change.">
      <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
        <InfoField label="Employee ID" value={currentUser.employeeId ?? ''} />
        <InfoField label="Account Status" value={currentUser.status} display={status} />
        <InfoField label="Last Login" value={currentUser.lastLogin ? formatDateTime(currentUser.lastLogin) : ''} />
        <InfoField label="Office" value={currentUser.office} />
        <InfoField label="Classification" value={currentUser.personnelClassification ?? currentUser.role} />
        <InfoField label="Member Since" value={currentUser.registeredAt ? formatDate(currentUser.registeredAt) : ''} />
      </div>
    </ProfileCard>
  );
}

const PASSWORD_RULES: { label: string; test: (value: string) => boolean }[] = [
  { label: 'At least 12 characters', test: (v) => v.length >= 12 },
  { label: 'Upper and lowercase letters', test: (v) => /[a-z]/.test(v) && /[A-Z]/.test(v) },
  { label: 'A number', test: (v) => /\d/.test(v) },
  { label: 'A symbol', test: (v) => /[^A-Za-z0-9]/.test(v) },
];

const STRENGTH = [
  { label: 'Too weak', bar: 'bg-brand-500', text: 'text-brand-800' },
  { label: 'Weak', bar: 'bg-brand-500', text: 'text-brand-800' },
  { label: 'Fair', bar: 'bg-brand-500', text: 'text-brand-600' },
  { label: 'Good', bar: 'bg-brand-500', text: 'text-brand-600' },
  { label: 'Strong', bar: 'bg-brand-500', text: 'text-brand-600' },
];

function PasswordField({ label, value, onChange, autoComplete }: { label: string; value: string; onChange: (v: string) => void; autoComplete: string }) {
  const [visible, setVisible] = useState(false);
  const id = useId();
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="block text-xs font-medium text-ink-muted">{label}</label>
      <div className="relative mt-1.5">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          className="input pr-10"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-0 right-0 grid w-10 place-items-center text-ink-subtle transition-colors hover:text-ink"
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}>
          {visible ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

function PasswordCard() {
  const session = useSessionAccount();
  const [editing, setEditing] = useState(() => !!session?.mustChangePassword);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const passed = PASSWORD_RULES.filter((r) => r.test(form.next)).length;
  const strength = STRENGTH[form.next ? passed : 0];
  const set = (key: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [key]: v }));

  const close = () => {
    setForm({ current: '', next: '', confirm: '' });
    setEditing(false);
  };
  const handleSave = async () => {
    if (saving) return;
    if (!session) return toast.error('Your session has expired. Please sign in again.');
    if (!form.current) return toast.error('Enter your current password.');
    if (passed < PASSWORD_RULES.length) return toast.error('The new password does not meet all requirements.');
    if (form.next !== form.confirm) return toast.error('The new passwords do not match.');
    setSaving(true);
    try {
      await changePassword(session.email, form.current, form.next);
      toast.success('Password changed');
      close();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Password could not be changed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProfileCard
      title="Password"
      description="Use a strong password you don't use anywhere else."
      actions={<EditActions editing={editing} onEdit={() => setEditing(true)} onCancel={close} onSave={handleSave} variant="primary" />}>
      {session?.mustChangePassword && (
        <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-800">
          You are signed in with the default administrator password. Set a new password to secure this account.
        </p>
      )}
      {editing ? (
        <div className="space-y-4">
          <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
            <PasswordField label="Current Password" value={form.current} onChange={set('current')} autoComplete="current-password" />
            <PasswordField label="New Password" value={form.next} onChange={set('next')} autoComplete="new-password" />
            <PasswordField label="Confirm New Password" value={form.confirm} onChange={set('confirm')} autoComplete="new-password" />
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex flex-1 gap-1.5" aria-hidden="true">
                {PASSWORD_RULES.map((rule, i) => (
                  <span key={rule.label} className={`h-1.5 flex-1 rounded-full ${form.next && i < passed ? strength.bar : 'bg-slate-200'}`} />
                ))}
              </div>
              <span className={`w-16 text-right text-xs font-semibold ${form.next ? strength.text : 'text-ink-subtle'}`}>{form.next ? strength.label : '—'}</span>
            </div>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {PASSWORD_RULES.map((rule) => {
                const ok = rule.test(form.next);
                return (
                  <li key={rule.label} className={`flex items-center gap-1.5 text-xs ${ok ? 'font-medium text-brand-700' : 'text-ink-muted'}`}>
                    <span className={`grid h-4 w-4 place-items-center rounded-full ${ok ? 'bg-brand-500 text-white' : 'border border-line-strong'}`}>
                      {ok && <CheckIcon className="h-2.5 w-2.5" strokeWidth={3} />}
                    </span>
                    {rule.label}
                  </li>
                );
              })}
            </ul>
            {form.confirm && form.next !== form.confirm && <p className="mt-3 text-xs font-medium text-brand-800">The new passwords do not match.</p>}
          </div>
        </div>
      ) : (
        <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          <InfoField label="Current Password" value="••••••••••••" />
          <InfoField label="Requirements" value="12+ characters, mixed case, number and symbol" />
          <InfoField
            label="Protection"
            value="Signed in with your NEMSU account"
            display={
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheckIcon className="h-4 w-4 text-brand-600" />
                Signed in with your NEMSU account
              </span>
            }
          />
        </div>
      )}
    </ProfileCard>
  );
}
