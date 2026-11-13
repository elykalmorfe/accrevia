import React from 'react';
import { RangeField, SaveBar, ServerNotice, SettingRow, SettingsGroup } from './SettingsLayout';
import { Switch } from '../ui/Switch';
import { usePortal } from '../../contexts/PortalContext';
import { formatNumber } from '../../utils/format';
import { PortalSettings, useSettingsDraft } from '../../settings/portalSettings';

type ProcessingConfig = PortalSettings['processing'];

export function ProcessingSettings() {
  const { documents } = usePortal();
  const passageCount = documents.reduce((sum, d) => sum + (d.passages?.length ?? 0), 0);
  const processingCount = documents.filter((d) => d.status === 'Processing').length;
  const { value: s, set: patch, dirty, save, discard, reset } = useSettingsDraft('processing');
  const set = <K extends keyof ProcessingConfig,>(key: K, value: ProcessingConfig[K]) => patch({ [key]: value } as Partial<ProcessingConfig>);

  return (
    <div className="space-y-4">
      <ServerNotice>
        OCR, chunking, and indexing run on the processing server, which is not connected yet. Your values are saved now and take effect once the server is online.
      </ServerNotice>
      <SettingsGroup title="OCR configuration" description="Applied to scanned documents and images.">
        <SettingRow label="OCR engine">
          <select aria-label="OCR engine" className="input select" value={s.engine} onChange={(e) => set('engine', e.target.value)}>
            {['Tesseract 5', 'PaddleOCR'].map((o) => <option key={o}>{o}</option>)}
          </select>
        </SettingRow>
        <SettingRow label="Recognition languages">
          <select aria-label="Recognition languages" className="input select" value={s.languages} onChange={(e) => set('languages', e.target.value)}>
            {['English', 'English + Filipino'].map((o) => <option key={o}>{o}</option>)}
          </select>
        </SettingRow>
        <SettingRow label="Detect scanned documents automatically">
          <Switch checked={s.autoDetect} onChange={(v) => set('autoDetect', v)} label="Detect scanned documents automatically" />
        </SettingRow>
        <SettingRow label="Rasterization resolution">
          <select aria-label="Rasterization resolution" className="input select" value={s.dpi} onChange={(e) => set('dpi', e.target.value)}>
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
        <SettingRow label="Indexed passages" description={`Across ${formatNumber(documents.length)} documents · ${processingCount} currently processing`}>
          <p className="text-xl font-semibold tabular-nums text-ink">{formatNumber(passageCount)}</p>
        </SettingRow>
        <SettingRow label="Rebuild index" description="Re-embeds all passages. Available when the processing server is connected.">
          <button type="button" className="btn btn-secondary" disabled>
            Schedule rebuild
          </button>
        </SettingRow>
      </SettingsGroup>
      <SaveBar dirty={dirty} onSave={save} onDiscard={discard} onReset={reset} label="Processing settings saved" />
    </div>);

}