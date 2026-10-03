import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { usePortal } from '../../contexts/PortalContext';
import { Modal } from '../ui/Modal';
import { TextField } from '../ui/TextField';
import { SelectField } from '../ui/SelectField';

interface RequirementFormModalProps {
  open: boolean;
  defaultIndicatorId?: string;
  onClose: () => void;
}

export function RequirementFormModal({ open, defaultIndicatorId = '', onClose }: RequirementFormModalProps) {
  const { indicators, criteria, frameworks, addRequirement } = usePortal();
  const [form, setForm] = useState({ indicatorId: defaultIndicatorId, name: '', description: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setForm({ indicatorId: defaultIndicatorId, name: '', description: '' });
  }, [open, defaultIndicatorId]);

  const save = () => {
    if (!form.indicatorId || !form.name.trim()) return setError('Select an indicator and enter a requirement name.');
    addRequirement(form.indicatorId, { id: `r-${Date.now()}`, name: form.name.trim(), description: form.description.trim() });
    toast.success('Evidence requirement defined');
    onClose();
  };

  const options = indicators.map((i) => {
    const c = criteria.find((x) => x.id === i.criterionId);
    const f = frameworks.find((x) => x.id === c?.frameworkId);
    return { value: i.id, label: `${f?.shortName ?? ''} · ${i.code} – ${i.name}` };
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Define evidence requirement"
      description="Describe the kind of evidence an indicator needs. Documents are then linked to it."
      footer={
      <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={save}>Save requirement</button>
        </>
      }>
      
      <div className="grid gap-4">
        {error && <p role="alert" className="text-[13px] text-danger-700">{error}</p>}
        <SelectField label="Indicator" value={form.indicatorId} placeholder="Select indicator" onChange={(indicatorId) => setForm((f) => ({ ...f, indicatorId }))} options={options} />
        <TextField label="Requirement name" required value={form.name} onChange={(name) => setForm((f) => ({ ...f, name }))} placeholder="e.g. Faculty qualification evidence" />
        <TextField
          label="Expected documents"
          multiline
          value={form.description}
          onChange={(description) => setForm((f) => ({ ...f, description }))}
          placeholder="e.g. Faculty profiles, credentials, faculty records, and faculty development reports." />
        
      </div>
    </Modal>);

}