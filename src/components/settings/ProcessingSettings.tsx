import React, { useState } from 'react';
import { RefreshCwIcon } from 'lucide-react';
import { toast } from 'sonner';
import { RangeField, SaveBar, SettingRow, SettingsGroup } from './SettingsLayout';
import { Switch } from '../ui/Switch';
import { repositoryStats } from '../../data/analytics';
import { formatNumber } from '../../utils/format';

export function ProcessingSettings() {
  const [s, setS] = useState({
    engine: 'Tesseract 5',
    languages: 'English + Filipino',
    autoDetect: true,
    dpi: '300',
    minConfidence: 60,
    keepTables: true,
    stripHeaders: true,
    chunkSize: 512,
    overlap: 64
  });
  const set = <K extends keyof typeof s,>(key: K, value: (typeof s)[K]) => setS((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-4">
      <SettingsGroup title="OCR configuration" description="Applied to scanned documents and images.">
        <SettingRow label="OCR engine">
          <select aria-label="OCR engine" className="input" value={s.engine} onChange={(e) => set('engine', e.target.value)}>
            {['Tesseract 5', 'PaddleOCR'].map((o) => <option key={o}>{o}</option>)}
          </select>
        </SettingRow>
        <SettingRow label="Recognition languages">
          <select aria-label="Recognition languages" className="input" value={s.languages} onChange={(e) => set('languages', e.target.value)}>
            {['English', 'English + Filipino'].map((o) => <option key={o}>{o}</option>)}
          </select>
        </SettingRow>
        <SettingRow label="Detect scanned documents automatically">
          <Switch checked={s.autoDetect} onChange={(v) => set('autoDetect', v)} label="Detect scanned documents automatically" />
        </SettingRow>
        <SettingRow label="Rasterization resolution">
          <select aria-label="Rasterization resolution" className="input" value={s.dpi} onChange={(e) => set('dpi', e.target.value)}>
            {['200', '300', '400'].map((o) => <option key={o} value={o}>{o} DPI</option>)}
          </select>
        </SettingRow>
        <SettingRow label="Minimum OCR confidence" description="Pages below this are flagged as failed for review.">
          <RangeField label="Minimum OCR confidence" value={s.minConfidence} onChange={(v) => set('minConfidence', v)} min={30} max={90} step={5} format={(v) => `${v}%`} />
        </SettingRow>
      </SettingsGroup>

      <SettingsGroup title="Text extraction and chunking">
        <SettingRow label="Preserve tables as structured text">
          <Switch checked={s.keepTables} onChange={(v) => set('keepTables', v)} label="Preserve tables" />
        </SettingRow>
        <SettingRow label="Remove repeated headers and footers">
          <Switch checked={s.stripHeaders} onChange={(v) => set('stripHeaders', v)} label="Remove headers and footers" />
        </SettingRow>
        <SettingRow label="Chunk size" description="Tokens per passage.">
          <input aria-label="Chunk size" type="number" min={128} max={1024} step={64} className="input" value={s.chunkSize} onChange={(e) => set('chunkSize', Number(e.target.value))} />
        </SettingRow>
        <SettingRow label="Chunk overlap" description="Tokens shared between neighbouring passages.">
          <input aria-label="Chunk overlap" type="number" min={0} max={256} step={16} className="input" value={s.overlap} onChange={(e) => set('overlap', Number(e.target.value))} />
        </SettingRow>
      </SettingsGroup>

      <SettingsGroup title="Embedding and indexing status">
        <SettingRow label="Indexed passages" description={`Across ${formatNumber(repositoryStats.total)} documents · ${repositoryStats.processing} currently processing`}>
          <p className="text-xl font-semibold tabular-nums text-ink">{formatNumber(repositoryStats.chunks)}</p>
        </SettingRow>
        <SettingRow label="Rebuild index" description="Re-embeds all passages. Takes about 40 minutes; search stays available.">
          <button type="button" className="btn btn-secondary" onClick={() => toast('Index rebuild scheduled for 11:00 PM tonight')}>
            <RefreshCwIcon className="h-4 w-4" /> Schedule rebuild
          </button>
        </SettingRow>
      </SettingsGroup>
      <SaveBar label="Processing settings saved" />
    </div>);

}