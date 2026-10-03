import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { usePortal } from '../../contexts/PortalContext';
import { Framework, FrameworkCategory } from '../../types/evidence';
import { frameworkCategories } from '../../data/frameworks';
import { Modal } from '../ui/Modal';
import { TextField } from '../ui/TextField';
import { SelectField } from '../ui/SelectField';
import { Switch } from '../ui/Switch';

interface FrameworkFormModalProps {
  open: boolean;
  framework: Framework | null;
  onClose: () => void;
}

const blank = { name: '', shortName: '', category: 'Accreditation' as FrameworkCategory, body: '', description: '', active: true };

export function FrameworkFormModal({ open, framework, onClose }: FrameworkFormModalProps) {
  const { saveFramework } = usePortal();
  const [form, setForm] = useState(blank);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setForm(framework ? { name: framework.name, shortName: framework.shortName, category: framework.category, body: framework.body, description: framework.description, active: framework.active } : blank);
  }, [open, framework]);

  const save = () => {
    if (!form.name.trim() || !form.shortName.trim()) {
      setError('Enter a framework name and short name.');
      return;
    }
    saveFramework({
      id: framework?.id ?? form.shortName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      documentCount: framework?.documentCount ?? 0,
      lastUpdated: new Date().toISOString().slice(0, 10),
      ...form,
      name: form.name.trim(),
      shortName: form.shortName.trim()
    });
    toast.success(framework ? 'Framework updated' : 'Framework added');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={framework ? 'Edit framework' : 'Add framework'}
      description="Frameworks classify evidence and own their own areas, criteria, and indicators."
      footer={
      <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={save}>{framework ? 'Save changes' : 'Add framework'}</button>
        </>
      }>
      
      <div className="grid gap-4 sm:grid-cols-2">
        {error && <p role="alert" className="text-[13px] text-danger-700 sm:col-span-2">{error}</p>}
        <TextField label="Framework name" required value={form.name} onChange={(name) => setForm((f) => ({ ...f, name }))} className="sm:col-span-2" />
        <TextField label="Short name" required value={form.shortName} onChange={(shortName) => setForm((f) => ({ ...f, shortName }))} placeholder="e.g. COPC" />
        <SelectField label="Category" value={form.category} onChange={(c) => setForm((f) => ({ ...f, category: c as FrameworkCategory }))} options={frameworkCategories.map((c) => c.category)} />
        <TextField label="Standard or accrediting body" value={form.body} onChange={(body) => setForm((f) => ({ ...f, body }))} className="sm:col-span-2" />
        <TextField label="Description" multiline value={form.description} onChange={(description) => setForm((f) => ({ ...f, description }))} className="sm:col-span-2" />
        <div className="flex items-center justify-between gap-4 rounded-md border border-line p-3 sm:col-span-2">
          <div>
            <p className="text-[13px] font-medium text-ink">Active</p>
            <p className="text-xs text-ink-muted">Inactive frameworks are hidden from classification options.</p>
          </div>
          <Switch checked={form.active} onChange={(active) => setForm((f) => ({ ...f, active }))} label="Framework active" />
        </div>
      </div>
    </Modal>);

}