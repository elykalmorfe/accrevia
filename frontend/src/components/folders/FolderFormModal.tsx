import React, { useEffect, useState } from 'react';
import { EvidenceFolder, FolderColor, FrameworkCategory } from '../../types/evidence';
import { Modal } from '../ui/Modal';
import { TextField } from '../ui/TextField';
import { SelectField } from '../ui/SelectField';

interface FolderFormModalProps {
  open: boolean;
  folder?: EvidenceFolder | null;
  parentId?: string;
  initialAreaId?: string;
  initialName?: string;
  initialCode?: string;
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

export function FolderFormModal({
  open,
  folder,
  parentId,
  initialAreaId,
  initialName,
  initialCode,
  onClose,
  onSave
}: FolderFormModalProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState<FrameworkCategory | 'General / Custom'>('Accreditation');
  const [frameworkId, setFrameworkId] = useState('ia');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState<FolderColor>('blue');
  const [startDate, setStartDate] = useState('');
  const [expiredDate, setExpiredDate] = useState('');
  const [hasNoDeadline, setHasNoDeadline] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (folder) {
      setName(folder.name);
      setCode(folder.code);
      setCategory(folder.category);
      setFrameworkId(folder.frameworkId);
      setDescription(folder.description);
      setColor(folder.color);
      setStartDate(folder.startDate || folder.createdAt || new Date().toISOString().slice(0, 10));
      setExpiredDate(folder.expiredDate || '');
      setHasNoDeadline(folder.hasNoDeadline ?? (folder.expiredDate === null));
    } else {
      setName(initialName || '');
      setCode(initialCode || '');
      setCategory('Accreditation');
      setFrameworkId('ia');
      setDescription('');
      setColor('blue');
      setStartDate(new Date().toISOString().slice(0, 10));
      setExpiredDate('');
      setHasNoDeadline(false);
    }
    setError('');
  }, [folder, open, initialName, initialCode]);

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
      createdAt: folder?.createdAt || new Date().toISOString().slice(0, 10),
      parentId: folder?.parentId ?? parentId,
      areaId: folder?.areaId ?? initialAreaId,
      startDate: startDate || new Date().toISOString().slice(0, 10),
      expiredDate: hasNoDeadline ? null : expiredDate || null,
      hasNoDeadline
    };
    onSave(folderToSave);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={folder ? `Edit Folder: ${folder.name}` : 'Create Evidence Folder'}
      description="Organize institutional accreditation portfolios with specific start dates and audit deadlines."
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
          placeholder="e.g. Governance & Administrative Operations Manual, OBE Syllabi Matrix"
          required
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <TextField
            label="Folder Code / Tag"
            value={code}
            onChange={(val) => setCode(val)}
            placeholder="e.g. AREA-I, GOV, OBE"
            hint="Used in badges"
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

        {/* Start Date & Expired Date / No Deadline Section */}
        <div className="rounded-lg border border-line bg-canvas/40 p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-ink">Timeline & Expiration</span>
            <label className="flex items-center gap-1.5 text-xs text-ink cursor-pointer select-none font-medium">
              <input
                type="checkbox"
                checked={hasNoDeadline}
                onChange={(e) => setHasNoDeadline(e.target.checked)}
                className="rounded border-line text-brand-600 focus:ring-brand-500 h-4 w-4"
              />
              <span>No Due Date / No Deadline</span>
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input text-xs"
                required
              />
            </div>

            <div>
              <label className="label">
                Expired Date / Deadline
                {hasNoDeadline && <span className="text-ink-subtle ml-1 font-normal">(None)</span>}
              </label>
              <input
                type="date"
                value={hasNoDeadline ? '' : expiredDate}
                disabled={hasNoDeadline}
                onChange={(e) => setExpiredDate(e.target.value)}
                className={`input text-xs ${hasNoDeadline ? 'bg-slate-100 text-ink-subtle cursor-not-allowed border-dashed' : ''}`}
                placeholder={hasNoDeadline ? 'No deadline' : ''}
              />
              {hasNoDeadline && (
                <p className="text-[10px] text-emerald-700 font-medium mt-1">
                  ✓ Folder remains active indefinitely with no deadline.
                </p>
              )}
            </div>
          </div>
        </div>

        <div>
          <label className="label">Folder Description & Guidelines</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="textarea"
            placeholder="Explain what documents belong to this specific folder (e.g. BOR resolutions, approved policies, annual accomplishment reports)..."
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
