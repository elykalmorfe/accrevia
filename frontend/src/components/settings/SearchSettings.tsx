import React from 'react';
import { RangeField, SaveBar, ServerNotice, SettingRow, SettingsGroup } from './SettingsLayout';
import { Switch } from '../ui/Switch';
import { PortalSettings, useSettingsDraft } from '../../settings/portalSettings';

type SearchConfig = PortalSettings['search'];

export function SearchSettings() {
  const { value: s, set: patch, dirty, save, discard, reset } = useSettingsDraft('search');
  const set = <K extends keyof SearchConfig,>(key: K, value: SearchConfig[K]) => patch({ [key]: value } as Partial<SearchConfig>);

  return (
    <div className="space-y-4">
      <ServerNotice>
        Search ranking runs on the search server, which is not connected yet. Your values are saved now and take effect once the server is online.
      </ServerNotice>
      <SettingsGroup title="Lexical retrieval (BM25)" description="Keyword matching on document text and metadata.">
        <SettingRow label="Term frequency saturation (k1)" description="Higher values reward repeated terms more.">
          <RangeField label="k1" value={s.k1} onChange={(v) => set('k1', v)} min={0.5} max={2} step={0.1} format={(v) => v.toFixed(1)} />
        </SettingRow>
        <SettingRow label="Length normalization (b)" description="How strongly long documents are penalized.">
          <RangeField label="b" value={s.b} onChange={(v) => set('b', v)} min={0} max={1} step={0.05} format={(v) => v.toFixed(2)} />
        </SettingRow>
      </SettingsGroup>

      <SettingsGroup title="Semantic retrieval" description="Meaning-based matching with BGE-M3 embeddings stored in Qdrant.">
        <SettingRow label="Embedding model">
          <input aria-label="Embedding model" className="input" value="BAAI/bge-m3 · 1024 dimensions" readOnly />
        </SettingRow>
        <SettingRow label="Semantic weight" description={`Lexical weight is ${(1 - s.semanticWeight).toFixed(2)}.`}>
          <RangeField label="Semantic weight" value={s.semanticWeight} onChange={(v) => set('semanticWeight', v)} min={0} max={1} step={0.05} format={(v) => v.toFixed(2)} />
        </SettingRow>
        <SettingRow label="Vector search candidates" description="Passages retrieved from Qdrant before fusion.">
          <input aria-label="Vector search candidates" type="number" min={10} max={200} className="input" value={s.candidates} onChange={(e) => set('candidates', Number(e.target.value))} />
        </SettingRow>
        <SettingRow label="Accreditation-aware scoring" description="Boost documents whose framework, criterion, or year matches the query.">
          <div className="flex items-center gap-4">
            <Switch checked={s.accreditationBoost} onChange={(v) => set('accreditationBoost', v)} label="Accreditation-aware scoring" />
            <div className="flex-1">
              <RangeField label="Boost weight" value={s.boostWeight} onChange={(v) => set('boostWeight', v)} min={0} max={0.5} step={0.05} format={(v) => v.toFixed(2)} />
            </div>
          </div>
        </SettingRow>
      </SettingsGroup>

      <SettingsGroup title="Reranking and results">
        <SettingRow label="Cross-encoder reranking" description="Re-scores top candidates with bge-reranker-v2-m3 for higher precision.">
          <Switch checked={s.rerank} onChange={(v) => set('rerank', v)} label="Cross-encoder reranking" />
        </SettingRow>
        <SettingRow label="Candidates to rerank">
          <input aria-label="Candidates to rerank" type="number" min={5} max={100} disabled={!s.rerank} className="input" value={s.rerankTopN} onChange={(e) => set('rerankTopN', Number(e.target.value))} />
        </SettingRow>
        <SettingRow label="Results returned" description="Maximum results shown on the search results page.">
          <select aria-label="Results returned" className="input select" value={s.resultCount} onChange={(e) => set('resultCount', Number(e.target.value))}>
            {[10, 20, 50].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </SettingRow>
        <SettingRow label="Minimum match shown" description="Results below this relevance are hidden.">
          <RangeField label="Minimum match" value={s.minScore} onChange={(v) => set('minScore', v)} min={0} max={80} step={5} format={(v) => `${v}%`} />
        </SettingRow>
      </SettingsGroup>
      <SaveBar dirty={dirty} onSave={save} onDiscard={discard} onReset={reset} label="Search configuration saved" />
    </div>);

}