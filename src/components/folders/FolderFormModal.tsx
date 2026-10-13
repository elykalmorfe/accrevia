import React, { useEffect, useState } from 'react';
import { EvidenceFolder, FolderColor, FrameworkCategory } from '../../types/evidence';
import { Modal } from '../ui/Modal';
import { TextField } from '../ui/TextField';
import { SelectField } from '../ui/SelectField';

interface FolderFormModalProps {
  open: boolean;
  folder?: EvidenceFolder | null;
  onClose: () => void;
  onSave: (folder: EvidenceFolder) => void;
}

const COLOR_OPTIONS: { value: FolderColor; label: string; bg: string; border: string }[] = [
  { value: 'blue', label: 'Blue (IA)', bg: 'bg-blue-500', border: 'border-blue-500' },
  { value: 'purple', label: 'Purple (PA)', bg: 'bg-purple-500', border: 'border-purple-500' },
  { value: 'emerald', label: 'Emerald (COPC)', bg: 'bg-emerald-500', border: 'border-emerald-500' },
  { value: 'amber', label: 'Amber (PQA)', bg: 'bg-amber-500', border: 'border-amber-500' },
  { value: 'indigo', label: 'Indigo (ISO)', bg: 'bg-indigo-500', border: 'border-indigo-500' },
  { value: 'rose', label: 'Rose', bg: 'bg-rose-500', border: 'border-rose-500' },
  { value: 'cyan', label: 'Cyan', bg: 'bg-cyan-500', border: 'border-cyan-500' },
  { value: 'slate', label: 'Slate', bg: 'bg-slate-500', border: 'border-slate-500' }
];

export function FolderFormModal({ open, folder, onClose, onSave }: FolderFormModalProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState<FrameworkCategory | 'General / Custom'>('Accreditation');
  const [frameworkId, setFrameworkId] = useState('ia');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState<FolderColor>('blue');
  const [error, setError] = useState('');

  useEffect(() => {
    if (folder) {
      setName(folder.name);
      setCode(folder.code);
      setCategory(folder.category);
      setFrameworkId(folder.frameworkId);
      setDescription(folder.description);
      setColor(folder.color);
    } else {
      setName('');
      setCode('');
      setCategory('Accreditation');
      setFrameworkId('ia');
      setDescription('');
      setColor('blue');
    }
    setError('');
  }, [folder, open]);

  const handleCategoryChange = (val: string) => {
    setCategory(val as FrameworkCategory | 'General / Custom');
    if (val === 'Accreditation') setFrameworkId('ia');
    else if (val === 'Compliance') setFrameworkId('copc');
    else if (val === 'Quality Excellence') setFrameworkId('pqa');
    else if (val === 'Quality Management') setFrameworkId('iso');
    else setFrameworkId('custom');
  };

  const handleSave = () => {
    if (!name.trim()) {
      setError('Please enter a folder name.');
      return;
    }
    const safeCode = code.trim() || name.slice(0, 4).toUpperCase();
    const folderToSave: EvidenceFolder = {
      id: folder ? folder.id : `folder-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim(),
      code: safeCode,
      frameworkId: frameworkId || 'ia',
      category,
      description: description.trim(),
      isSystem: folder?.isSystem ?? false,
      color,
      createdAt: folder?.createdAt || new Date().toISOString().slice(0, 10)
    };
    onSave(folderToSave);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={folder ? `Edit Folder: ${folder.name}` : 'Create New Accreditation Folder'}
      description="Organize accreditation evidence into dedicated categories for streamlined verification and search indexing."
      size="md"
      footer={
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 w-full">
          <button type="button" onClick={onClose} className="btn btn-secondary w-full sm:w-auto">
            Cancel
          </button>
          <button type="button" onClick={handleSave} className="btn btn-primary w-full sm:w-auto">
            {folder ? 'Save Changes' : 'Create Folder'}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="rounded-md border border-danger-200 bg-danger-50 p-3 text-xs text-danger-700">
            {error}
          </div>
        )}

        <TextField
          label="Folder Name"
          value={name}
          onChange={(val) => {
            setName(val);
            if (error) setError('');
          }}
          placeholder="e.g. Institutional Accreditation, ISO Surveillance Audit, or COE Portfolios"
          required
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <TextField
            label="Folder Code / Short Tag"
            value={code}
            onChange={(val) => setCode(val)}
            placeholder="e.g. IA, PA, COPC, PQA, ISO"
            hint="2-5 letters used in badges"
          />

          <SelectField
            label="Accreditation Category"
            value={category}
            onChange={handleCategoryChange}
            options={[
              { value: 'Accreditation', label: 'Accreditation (AACCUP IA / PA)' },
              { value: 'Compliance', label: 'Compliance (CHED / COPC)' },
              { value: 'Quality Excellence', label: 'Quality Excellence (PQA)' },
              { value: 'Quality Management', label: 'Quality Management (ISO 9001)' },
              { value: 'General / Custom', label: 'General / Custom Category' }
            ]}
            required
          />
        </div>

        <div>
          <label className="label">Folder Description & Upload Guidelines</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="textarea"
            placeholder="Explain what documents belong to this specific folder (e.g. AACCUP area survey instruments, certificates, meeting minutes)..."
          />
        </div>

        <div>
          <label className="label">Color Accent</label>
          <div className="mt-2 flex flex-wrap gap-2.5">
            {COLOR_OPTIONS.map((c) => {
              const selected = color === c.value;
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                    selected
                      ? `${c.border} ring-2 ring-brand-500 bg-white font-semibold shadow-sm`
                      : 'border-line hover:border-line-strong bg-canvas'
                  }`}
                >
                  <span className={`h-3 w-3 rounded-full ${c.bg}`} />
                  <span>{c.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
}
