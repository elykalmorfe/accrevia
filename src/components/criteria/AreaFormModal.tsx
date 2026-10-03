import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { usePortal } from '../../contexts/PortalContext';
import { AccreditationArea } from '../../types/evidence';
import { Modal } from '../ui/Modal';
import { TextField } from '../ui/TextField';

interface AreaFormModalProps {
  open: boolean;
  area: AccreditationArea | null;
  onClose: () => void;
}

export function AreaFormModal({ open, area, onClose }: AreaFormModalProps) {
  const { saveArea } = usePortal();
  const [form, setForm] = useState({ name: '', shortName: '', description: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setForm(area ? { name: area.name, shortName: area.shortName, description: area.description } : { name: '', shortName: '', description: '' });
  }, [open, area]);

  const save = () => {
    if (!form.name.trim()) return setError('Enter an area name.');
    saveArea({
      id: area?.id ?? `area-${Date.now()}`,
      name: form.name.trim(),
      shortName: form.shortName.trim() || form.name.trim(),
      description: form.description.trim()
    });
    toast.success(area ? 'Area updated' : 'Area added');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={area ? 'Edit accreditation area' : 'Add accreditation area'}
      description="Areas group criteria by subject and can be shared across frameworks."
      footer={
      <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={save}>{area ? 'Save changes' : 'Add area'}</button>
        </>
      }>
      
      <div className="grid gap-4">
        {error && <p role="alert" className="text-[13px] text-danger-700">{error}</p>}
        <TextField label="Area name" required value={form.name} onChange={(name) => setForm((f) => ({ ...f, name }))} />
        <TextField label="Short label" value={form.shortName} onChange={(shortName) => setForm((f) => ({ ...f, shortName }))} hint="Used in tables and tags." />
        <TextField label="Description" multiline value={form.description} onChange={(description) => setForm((f) => ({ ...f, description }))} />
      </div>
    </Modal>);

}