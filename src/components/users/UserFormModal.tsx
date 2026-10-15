import React, { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { TextField } from '../ui/TextField';
import { SelectField } from '../ui/SelectField';
import { PersonnelClassification, PortalUser, UserRole } from '../../types/user';
import { offices, userRoles } from '../../data/options';
import { ShieldCheckIcon, AlertTriangleIcon } from 'lucide-react';

interface UserFormModalProps {
  open: boolean;
  user: PortalUser | null;
  onClose: () => void;
  onSave: (user: PortalUser) => void;
}

const roleDescriptions: Record<UserRole, string> = {
  Superadmin: 'Highest authority: complete system configuration, security policies, and overrides.',
  Administrator: 'Full administrative access: user approvals, frameworks, and documents.',
  'QA Personnel': 'Upload, classify, and audit accreditation documents and criteria.',
  User: 'General user access to permitted public/internal accreditation records.',
  Faculty: 'Teaching & non-teaching faculty involved in program and institutional accreditation.',
  Staff: 'Non-academic support personnel with access to designated departmental documents.',
  Accreditor: 'Read-only access to evidence shared for official accreditation survey visits.'
};

const personnelClassifications: PersonnelClassification[] = [
  'Faculty (Teaching - Accreditation Committee)',
  'Faculty (Non-Teaching Coordinator)',
  'Staff (Administrative)',
  'Staff (Technical)',
  'Accreditor (External)'
];

export function UserFormModal({ open, user, onClose, onSave }: UserFormModalProps) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'QA Personnel' as UserRole,
    office: offices[0],
    employeeId: '',
    personnelClassification: 'Faculty (Teaching - Accreditation Committee)' as PersonnelClassification,
    affiliationVerified: true
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setForm(
      user
        ? {
            name: user.name,
            email: user.email,
            role: user.role,
            office: user.office,
            employeeId: user.employeeId || '',
            personnelClassification: user.personnelClassification || 'Faculty (Teaching - Accreditation Committee)',
            affiliationVerified: user.affiliationVerified ?? true
          }
        : {
            name: '',
            email: '',
            role: 'QA Personnel',
            office: offices[0],
            employeeId: '',
            personnelClassification: 'Faculty (Teaching - Accreditation Committee)',
            affiliationVerified: true
          }
    );
  }, [open, user]);

  const save = () => {
    if (!form.name.trim() || !/^\S+@\S+\.\S+$/.test(form.email)) {
      return setError('Enter a valid name and email address.');
    }

    // NEMSU Workspace Restriction: Enforce @nemsu.edu.ph for all university personnel
    const isExternal = form.role === 'Accreditor';
    if (!isExternal && !form.email.toLowerCase().endsWith('@nemsu.edu.ph')) {
      return setError('NEMSU Workspace Restriction: University accounts must use an official @nemsu.edu.ph email address to verify institutional affiliation.');
    }

    onSave({
      id: user?.id ?? `u-${Date.now()}`,
      status: user?.status ?? 'Active',
      lastLogin: user?.lastLogin ?? null,
      ...form,
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      employeeId: form.employeeId.trim() || undefined,
      affiliationVerified: form.affiliationVerified,
      approvedAt: user?.approvedAt || new Date().toISOString()
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={user ? 'Edit User & Affiliation' : 'Register / Add User'}
      description={
        user
          ? 'Update user roles, personnel classification, and verified NEMSU credentials.'
          : 'Create a new user with NEMSU affiliation verification and access tier.'
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
      <div className="grid gap-4 max-h-[75vh] overflow-y-auto pr-1">
        {error && (
          <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 flex items-start gap-2.5 text-xs text-rose-800">
            <AlertTriangleIcon className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            <div>
              <p className="font-semibold">Validation Notice</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        <div className="rounded-lg bg-brand-50/60 border border-brand-200/60 p-3 text-xs text-brand-900 flex items-center gap-2">
          <ShieldCheckIcon className="h-4 w-4 text-brand-600 shrink-0" />
          <span>
            <strong>NEMSU Workspace Security:</strong> User credentials must be verified with active NEMSU employee affiliation.
          </span>
        </div>

        <TextField
          label="Full Name"
          required
          value={form.name}
          onChange={(name) => setForm((f) => ({ ...f, name }))}
          placeholder="e.g. Dr. Maria Elena Santos"
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <TextField
            label="Email Address"
            type="email"
            required
            value={form.email}
            onChange={(email) => setForm((f) => ({ ...f, email }))}
            placeholder="username@nemsu.edu.ph"
          />

          <TextField
            label="NEMSU Employee ID"
            value={form.employeeId}
            onChange={(employeeId) => setForm((f) => ({ ...f, employeeId }))}
            placeholder="e.g. NEMSU-EMP-2024-0492"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <SelectField
            label="Department / College / Office"
            value={form.office}
            onChange={(office) => setForm((f) => ({ ...f, office }))}
            options={[...offices, 'AACCUP Accrediting Team (External)']}
          />

          <SelectField
            label="Personnel Classification"
            value={form.personnelClassification}
            onChange={(personnelClassification) =>
              setForm((f) => ({ ...f, personnelClassification: personnelClassification as PersonnelClassification }))
            }
            options={personnelClassifications}
          />
        </div>

        <fieldset>
          <legend className="label mb-1.5">Role-Based Permission Tier</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {userRoles.map((role) => (
              <label
                key={role}
                className={`flex cursor-pointer gap-2.5 rounded-lg border p-2.5 transition-colors duration-150 ${
                  form.role === role ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500/20' : 'border-line hover:bg-canvas'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  checked={form.role === role}
                  onChange={() => setForm((f) => ({ ...f, role }))}
                  className="mt-0.5 accent-brand-600"
                />
                <span className="min-w-0">
                  <span className="block text-xs font-semibold text-ink">{role}</span>
                  <span className="block text-[11px] text-ink-muted leading-tight mt-0.5">{roleDescriptions[role]}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="flex items-center gap-2 text-xs font-medium text-ink cursor-pointer bg-canvas/70 p-2.5 rounded-lg border border-line">
          <input
            type="checkbox"
            checked={form.affiliationVerified}
            onChange={(e) => setForm((f) => ({ ...f, affiliationVerified: e.target.checked }))}
            className="rounded text-brand-600 focus:ring-brand-500 h-4 w-4"
          />
          <span>
            <strong>Verified NEMSU Institutional Affiliation</strong> (Identity and faculty/staff appointment confirmed)
          </span>
        </label>
      </div>
    </Modal>
  );
}