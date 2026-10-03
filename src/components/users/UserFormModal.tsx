import React, { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { TextField } from '../ui/TextField';
import { SelectField } from '../ui/SelectField';
import { PortalUser, UserRole } from '../../types/user';
import { offices, userRoles } from '../../data/options';

interface UserFormModalProps {
  open: boolean;
  user: PortalUser | null;
  onClose: () => void;
  onSave: (user: PortalUser) => void;
}

const roleDescriptions: Record<UserRole, string> = {
  Administrator: 'Full access, including users, frameworks, and system settings.',
  'QA Personnel': 'Upload, classify, and manage evidence and criteria.',
  Faculty: 'Sees only evidence explicitly shared with them.',
  Staff: 'Sees only evidence explicitly shared with them.',
  Accreditor: 'Read-only access to evidence shared for a survey visit.'
};

export function UserFormModal({ open, user, onClose, onSave }: UserFormModalProps) {
  const [form, setForm] = useState({ name: '', email: '', role: 'QA Personnel' as UserRole, office: offices[0] });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setForm(user ? { name: user.name, email: user.email, role: user.role, office: user.office } : { name: '', email: '', role: 'QA Personnel', office: offices[0] });
  }, [open, user]);

  const save = () => {
    if (!form.name.trim() || !/^\S+@\S+\.\S+$/.test(form.email)) return setError('Enter a name and a valid email address.');
    onSave({
      id: user?.id ?? `u-${Date.now()}`,
      status: user?.status ?? 'Invited',
      lastLogin: user?.lastLogin ?? null,
      ...form,
      name: form.name.trim(),
      email: form.email.trim()
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={user ? 'Edit user' : 'Add user'}
      description={user ? undefined : 'An invitation email will be sent to set up their account.'}
      footer={
      <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={save}>{user ? 'Save changes' : 'Send invitation'}</button>
        </>
      }>
      
      <div className="grid gap-4">
        {error && <p role="alert" className="text-[13px] text-danger-700">{error}</p>}
        <TextField label="Full name" required value={form.name} onChange={(name) => setForm((f) => ({ ...f, name }))} />
        <TextField label="Email" type="email" required value={form.email} onChange={(email) => setForm((f) => ({ ...f, email }))} placeholder="name@nemsu.edu.ph" />
        <SelectField label="Department / Office" value={form.office} onChange={(office) => setForm((f) => ({ ...f, office }))} options={[...offices, 'AACCUP (External)']} />
        <fieldset>
          <legend className="label">Role</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {userRoles.map((role) =>
            <label
              key={role}
              className={`flex cursor-pointer gap-2.5 rounded-md border p-3 transition-colors duration-150 ${form.role === role ? 'border-brand-500 bg-brand-50' : 'border-line hover:bg-canvas'}`}>
              
                <input type="radio" name="role" checked={form.role === role} onChange={() => setForm((f) => ({ ...f, role }))} className="mt-0.5 accent-brand-600" />
                <span>
                  <span className="block text-[13px] font-medium text-ink">{role}</span>
                  <span className="block text-xs text-ink-muted">{roleDescriptions[role]}</span>
                </span>
              </label>
            )}
          </div>
        </fieldset>
      </div>
    </Modal>);

}