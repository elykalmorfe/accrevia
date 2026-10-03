import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { usePortal } from '../../contexts/PortalContext';
import { Criterion } from '../../types/evidence';
import { Modal } from '../ui/Modal';
import { TextField } from '../ui/TextField';
import { SelectField } from '../ui/SelectField';

interface CriterionFormModalProps {
  open: boolean;
  criterion: Criterion | null;
  defaultFrameworkId: string;
  onClose: () => void;
  onSaved?: (criterion: Criterion) => void;
}

export function CriterionFormModal({ open, criterion, defaultFrameworkId, onClose, onSaved }: CriterionFormModalProps) {
  const { frameworks, areas, saveCriterion } = usePortal();
  const [form, setForm] = useState({ frameworkId: defaultFrameworkId, areaId: '', code: '', name: '', description: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setForm(
      criterion ?
      { frameworkId: criterion.frameworkId, areaId: criterion.areaId, code: criterion.code, name: criterion.name, description: criterion.description } :
      { frameworkId: defaultFrameworkId, areaId: '', code: '', name: '', description: '' }
    );
  }, [open, criterion, defaultFrameworkId]);

  const save = () => {
    if (!form.frameworkId || !form.areaId || !form.code.trim() || !form.name.trim()) return setError('Framework, area, code, and name are required.');
    const saved: Criterion = { id: criterion?.id ?? `c-${Date.now()}`, ...form, code: form.code.trim(), name: form.name.trim() };
    saveCriterion(saved);
    toast.success(criterion ? 'Criterion updated' : 'Criterion added');
    onSaved?.(saved);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={criterion ? 'Edit criterion' : 'Add criterion'}
      footer={
      <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={save}>{criterion ? 'Save changes' : 'Add criterion'}</button>
        </>
      }>
      
      <div className="grid gap-4 sm:grid-cols-2">
        {error && <p role="alert" className="text-[13px] text-danger-700 sm:col-span-2">{error}</p>}
        <SelectField label="Framework" value={form.frameworkId} onChange={(frameworkId) => setForm((f) => ({ ...f, frameworkId }))} options={frameworks.map((f) => ({ value: f.id, label: f.name }))} />
        <SelectField label="Accreditation area" value={form.areaId} placeholder="Select area" onChange={(areaId) => setForm((f) => ({ ...f, areaId }))} options={areas.map((a) => ({ value: a.id, label: a.name }))} />
        <TextField label="Code" required value={form.code} onChange={(code) => setForm((f) => ({ ...f, code }))} placeholder="e.g. Criterion 11" />
        <TextField label="Name" required value={form.name} onChange={(name) => setForm((f) => ({ ...f, name }))} />
        <TextField label="Description" multiline value={form.description} onChange={(description) => setForm((f) => ({ ...f, description }))} className="sm:col-span-2" />
      </div>
    </Modal>);

}