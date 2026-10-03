import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { usePortal } from '../../contexts/PortalContext';
import { Indicator } from '../../types/evidence';
import { Modal } from '../ui/Modal';
import { TextField } from '../ui/TextField';
import { SelectField } from '../ui/SelectField';

interface IndicatorFormModalProps {
  open: boolean;
  indicator: Indicator | null;
  defaultCriterionId?: string;
  onClose: () => void;
}

export function IndicatorFormModal({ open, indicator, defaultCriterionId = '', onClose }: IndicatorFormModalProps) {
  const { criteria, frameworks, saveIndicator } = usePortal();
  const [form, setForm] = useState({ criterionId: defaultCriterionId, code: '', name: '', requirement: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setForm(
      indicator ?
      { criterionId: indicator.criterionId, code: indicator.code, name: indicator.name, requirement: '' } :
      { criterionId: defaultCriterionId, code: '', name: '', requirement: '' }
    );
  }, [open, indicator, defaultCriterionId]);

  const save = () => {
    if (!form.criterionId || !form.code.trim() || !form.name.trim()) return setError('Criterion, code, and name are required.');
    const id = indicator?.id ?? `i-${Date.now()}`;
    saveIndicator({
      id,
      criterionId: form.criterionId,
      code: form.code.trim(),
      name: form.name.trim(),
      requirements: indicator?.requirements ?? (form.requirement.trim() ? [{ id: `r-${Date.now()}`, name: form.requirement.trim(), description: '' }] : [])
    });
    toast.success(indicator ? 'Indicator updated' : 'Indicator added');
    onClose();
  };

  const criterionOptions = criteria.map((c) => ({
    value: c.id,
    label: `${frameworks.find((f) => f.id === c.frameworkId)?.shortName ?? ''} · ${c.code} – ${c.name}`
  }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={indicator ? 'Edit indicator' : 'Add indicator'}
      footer={
      <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={save}>{indicator ? 'Save changes' : 'Add indicator'}</button>
        </>
      }>
      
      <div className="grid gap-4 sm:grid-cols-[140px_minmax(0,1fr)]">
        {error && <p role="alert" className="text-[13px] text-danger-700 sm:col-span-2">{error}</p>}
        <SelectField label="Criterion" value={form.criterionId} placeholder="Select criterion" onChange={(criterionId) => setForm((f) => ({ ...f, criterionId }))} options={criterionOptions} className="sm:col-span-2" />
        <TextField label="Code" required value={form.code} onChange={(code) => setForm((f) => ({ ...f, code }))} placeholder="e.g. 2.4" />
        <TextField label="Indicator name" required value={form.name} onChange={(name) => setForm((f) => ({ ...f, name }))} />
        {!indicator &&
        <TextField
          label="First evidence requirement"
          value={form.requirement}
          onChange={(requirement) => setForm((f) => ({ ...f, requirement }))}
          placeholder="e.g. Faculty research mentoring records"
          hint="Optional. You can define more requirements later."
          className="sm:col-span-2" />

        }
      </div>
    </Modal>);

}