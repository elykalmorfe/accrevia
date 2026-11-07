import React, { useState } from 'react';
import { PencilIcon } from 'lucide-react';
import { toast } from 'sonner';
import { ListEditor, SaveBar, SettingRow, SettingsGroup } from './SettingsLayout';
import { usePortal } from '../../contexts/PortalContext';
import { Campus } from '../../types/accreditation';
import { Badge } from '../ui/Badge';
import { useSettingsDraft, ValidityLevel } from '../../settings/portalSettings';

const VALIDITY_LEVELS: ValidityLevel[] = ['Level 1', 'Level 2', 'Level 3', 'Level 4'];
const ROMAN: Record<ValidityLevel, string> = { 'Level 1': 'I', 'Level 2': 'II', 'Level 3': 'III', 'Level 4': 'IV' };

const CAMPUS_FIELDS: { key: keyof Campus; label: string }[] = [
{ key: 'name', label: 'Campus name' },
{ key: 'shortName', label: 'Short name' },
{ key: 'director', label: 'Campus director' },
{ key: 'location', label: 'Location' },
{ key: 'email', label: 'Email' },
{ key: 'phone', label: 'Phone' }];


function CampusRow({ campus, onSave }: {campus: Campus;onSave: (c: Campus) => void;}) {
  const [editing, setEditing] = useState<Campus | null>(null);

  if (!editing) {
    return (
      <li className="flex items-center justify-between gap-3 py-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[13px] font-medium text-ink">
            {campus.name}
            {campus.isMain && <Badge tone="brand">Main</Badge>}
          </p>
          <p className="truncate text-xs text-ink-muted">
            {[campus.director || 'No director set', campus.location].filter(Boolean).join(' · ')}
          </p>
        </div>
        <button type="button" className="btn btn-ghost btn-sm shrink-0" onClick={() => setEditing(campus)}>
          <PencilIcon className="h-3.5 w-3.5" /> Edit
        </button>
      </li>);

  }

  return (
    <li className="space-y-3 py-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {CAMPUS_FIELDS.map((f) =>
        <label key={f.key} className="block">
            <span className="mb-1 block text-xs font-medium text-ink-muted">{f.label}</span>
            <input
            className="input"
            value={String(editing[f.key] ?? '')}
            onChange={(e) => setEditing({ ...editing, [f.key]: e.target.value })} />
          </label>
        )}
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditing(null)}>Cancel</button>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={!editing.name.trim()}
          onClick={() => {
            onSave({ ...editing, name: editing.name.trim(), shortName: editing.shortName.trim() || editing.name.trim() });
            setEditing(null);
            toast.success(`${editing.name.trim()} updated`);
          }}>
          Save campus
        </button>
      </div>
    </li>);

}

export function AccreditationSetupSettings() {
  const { campuses, saveCampus } = usePortal();
  const { value, set, dirty, save, discard, reset } = useSettingsDraft('accreditation');

  return (
    <div className="space-y-4">
      <SettingsGroup title="Campuses" description="Names and contacts used on campus pages, filters, and reports. Changes save immediately.">
        <ul className="divide-y divide-line">
          {campuses.map((c) => <CampusRow key={c.id} campus={c} onSave={saveCampus} />)}
        </ul>
      </SettingsGroup>

      <SettingsGroup title="Academic years and cycles" description="Options offered when classifying evidence. The newest entry should be at the top.">
        <SettingRow label="Academic years">
          <ListEditor label="academic years" items={value.academicYears} onChange={(academicYears) => set({ academicYears })} placeholder="e.g. 2026–2027" />
        </SettingRow>
        <SettingRow label="Accreditation cycles">
          <ListEditor label="cycles" items={value.cycles} onChange={(cycles) => set({ cycles })} placeholder="e.g. 2026 ISO Surveillance Audit" />
        </SettingRow>
      </SettingsGroup>

      <SettingsGroup title="Institutional Accreditation areas" description="The nine AACCUP IA areas shown as folders on every campus page. Area numbers are fixed.">
        <ul className="divide-y divide-line">
          {value.iaAreas.map((area, i) =>
          <li key={area.code} className="grid gap-2 py-3 sm:grid-cols-[72px_minmax(0,1fr)_minmax(0,1fr)] sm:items-center">
              <span className="text-xs font-semibold text-ink-muted">Area {area.number}</span>
              <input
              aria-label={`Area ${area.number} name`}
              className="input"
              value={area.name}
              onChange={(e) => set({ iaAreas: value.iaAreas.map((a, j) => j === i ? { ...a, name: e.target.value } : a) })} />
              <input
              aria-label={`Area ${area.number} description`}
              className="input"
              value={area.shortDesc}
              placeholder="Short description"
              onChange={(e) => set({ iaAreas: value.iaAreas.map((a, j) => j === i ? { ...a, shortDesc: e.target.value } : a) })} />
            </li>
          )}
        </ul>
      </SettingsGroup>

      <SettingsGroup title="Program survey areas" description="The ten AACCUP program areas. Used for the checklist of newly added programs; existing programs keep their current areas.">
        <ul className="grid gap-2 py-3 sm:grid-cols-2">
          {value.programAreas.map((area, i) =>
          <li key={i}>
              <input
              aria-label={`Program area ${i + 1}`}
              className="input"
              value={area}
              onChange={(e) => set({ programAreas: value.programAreas.map((a, j) => j === i ? e.target.value : a) })} />
            </li>
          )}
        </ul>
      </SettingsGroup>

      <SettingsGroup title="Validity and compliance rules">
        <SettingRow label="Accreditation validity" description="Years an accreditation level stays valid. Used to suggest the validity end date when recording a program.">
          <div className="grid grid-cols-4 gap-2">
            {VALIDITY_LEVELS.map((level) =>
            <label key={level} className="block">
                <span className="mb-1 block text-center text-[11px] font-semibold text-ink-muted">Level {ROMAN[level]}</span>
                <input
                type="number"
                min={1}
                max={10}
                className="input text-center"
                value={value.levelValidityYears[level]}
                onChange={(e) => set({ levelValidityYears: { ...value.levelValidityYears, [level]: Math.max(1, Number(e.target.value) || 1) } })} />
              </label>
            )}
          </div>
        </SettingRow>
        <SettingRow label="Default COPC CMO reference" description="Pre-filled on new program records.">
          <input aria-label="Default COPC CMO reference" className="input" value={value.copcCmoDefault} onChange={(e) => set({ copcCmoDefault: e.target.value })} />
        </SettingRow>
      </SettingsGroup>

      <SaveBar dirty={dirty} onSave={save} onDiscard={discard} onReset={reset} label="Accreditation setup saved" />
    </div>);

}
