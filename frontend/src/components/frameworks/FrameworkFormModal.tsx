import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { LayersIcon, CheckIcon, Building2Icon, ShieldCheckIcon } from 'lucide-react';
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

const blank = {
  name: '',
  shortName: '',
  category: 'Accreditation' as FrameworkCategory,
  body: '',
  description: '',
  active: true
};

export function FrameworkFormModal({ open, framework, onClose }: FrameworkFormModalProps) {
  const { saveFramework } = usePortal();
  const [form, setForm] = useState(blank);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setForm(
      framework
        ? {
            name: framework.name,
            shortName: framework.shortName,
            category: framework.category,
            body: framework.body,
            description: framework.description,
            active: framework.active
          }
        : blank
    );
  }, [open, framework]);

  const save = () => {
    if (!form.name.trim() || !form.shortName.trim()) {
      setError('Please enter a framework name and short identifier.');
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
    toast.success(framework ? 'Framework updated successfully' : 'New framework added successfully');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={framework ? 'Edit Accreditation Framework' : 'Add Accreditation Framework'}
      description="Frameworks organize institution-wide compliance criteria, evidence areas, and benchmarks."
      footer={
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 w-full">
          <button
            type="button"
            className="btn btn-secondary w-full sm:w-auto text-xs font-semibold h-9 px-4"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary w-full sm:w-auto text-xs font-semibold h-9 px-4 gap-1.5 shadow-xs"
            onClick={save}
          >
            <CheckIcon className="h-3.5 w-3.5" />
            <span>{framework ? 'Save Changes' : 'Add Framework'}</span>
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="rounded-xl border border-danger-200 bg-danger-50 p-3 text-xs text-danger-700 shadow-2xs">
            {error}
          </div>
        )}

        <div className="grid gap-3.5 sm:grid-cols-2">
          <TextField
            label="Framework Name"
            required
            value={form.name}
            onChange={(name) => setForm((f) => ({ ...f, name }))}
            placeholder="e.g. Institutional Accreditation (IA), Philippine Quality Award"
            className="sm:col-span-2"
          />

          <TextField
            label="Short Name / Code"
            required
            value={form.shortName}
            onChange={(shortName) => setForm((f) => ({ ...f, shortName: shortName.toUpperCase() }))}
            placeholder="e.g. IA, COPC, ISO"
          />

          <SelectField
            label="Category"
            value={form.category}
            onChange={(c) => setForm((f) => ({ ...f, category: c as FrameworkCategory }))}
            options={frameworkCategories.map((c) => c.category)}
          />

          <TextField
            label="Accrediting or Regulatory Body"
            value={form.body}
            onChange={(body) => setForm((f) => ({ ...f, body }))}
            placeholder="e.g. AACCUP, CHED, DTI, ISO"
            className="sm:col-span-2"
          />

          <TextField
            label="Framework Description & Purpose"
            multiline
            value={form.description}
            onChange={(description) => setForm((f) => ({ ...f, description }))}
            placeholder="Summarize the core objective and institutional scope of this framework..."
            className="sm:col-span-2"
          />

          {/* Active Status Card */}
          <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 sm:col-span-2 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white border border-slate-200 text-brand-600 shadow-2xs shrink-0">
                <ShieldCheckIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Framework Status: {form.active ? 'Active' : 'Inactive'}</p>
                <p className="text-[11px] text-slate-500">
                  {form.active
                    ? 'Active frameworks appear in evidence tagging, audit scoring, and filter options.'
                    : 'Inactive frameworks are archived and hidden from primary selection menus.'}
                </p>
              </div>
            </div>
            <Switch
              checked={form.active}
              onChange={(active) => setForm((f) => ({ ...f, active }))}
              label="Framework active"
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
