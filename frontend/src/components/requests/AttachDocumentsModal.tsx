import { useEffect, useMemo, useState } from 'react';
import { CheckIcon, LibraryIcon, SearchIcon, XIcon } from 'lucide-react';
import { usePortal } from '../../contexts/PortalContext';
import { EvidenceDocument } from '../../types/evidence';
import { RequestAttachment } from '../../types/request';
import { Modal } from '../ui/Modal';
import { EmptyState } from '../ui/EmptyState';

interface AttachDocumentsModalProps {
  open: boolean;
  onClose: () => void;
  onAttach: (attachments: RequestAttachment[]) => void;
  /** What the requester asked for. The search starts here. */
  need?: { subject: string; reference?: string };
  /** Repository documents already attached to the draft. */
  excludeIds?: string[];
}

const RESULT_LIMIT = 12;

const STOP_WORDS = new Set(['the', 'of', 'for', 'and', 'a', 'an', 'in', 'on', 'to', 'or', 'at', 'with']);

const FIELD_LABEL: Record<string, string> = {
  title: 'file name',
  program: 'program',
  campus: 'campus',
  year: 'year',
  area: 'area',
  keyword: 'keyword'
};

function toAttachment(doc: EvidenceDocument): RequestAttachment {
  return {
    id: `ratt-doc-${doc.id}-${Date.now()}`,
    kind: 'document',
    name: doc.title,
    fileType: doc.fileType,
    sizeMb: doc.sizeMb,
    documentId: doc.id
  };
}

function suggestedQuery(need?: { subject: string; reference?: string }) {
  const reference = need?.reference?.replace(/[·•|/]/g, ' ').replace(/\s+/g, ' ').trim();
  if (reference) return reference;
  return need?.subject?.trim() ?? '';
}

function searchWords(query: string) {
  return [
    ...new Set(
      query
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((word) => word.length > 1 && !STOP_WORDS.has(word))
    )
  ];
}

function fileFields(doc: EvidenceDocument, areaName: string) {
  return {
    title: doc.title.toLowerCase(),
    program: doc.program.toLowerCase(),
    campus: doc.campus.toLowerCase(),
    year: doc.academicYear.toLowerCase(),
    area: areaName.toLowerCase(),
    keyword: doc.keywords.join(' ').toLowerCase()
  };
}

function identityLine(doc: EvidenceDocument, areaName: string) {
  return [doc.program, doc.campus, doc.academicYear, areaName].filter(Boolean).join(' · ');
}

interface RankedFile {
  doc: EvidenceDocument;
  areaName: string;
  score: number;
  matched: string[];
  complete: boolean;
}

function rankFile(doc: EvidenceDocument, areaName: string, words: string[]): RankedFile | null {
  const fields = fileFields(doc, areaName);
  const matched = new Set<string>();
  let score = 0;
  let hits = 0;

  for (const word of words) {
    let wordHit = false;
    (Object.keys(fields) as (keyof typeof fields)[]).forEach((key) => {
      if (!fields[key].includes(word)) return;
      wordHit = true;
      matched.add(key);
      score += key === 'title' ? 40 : key === 'program' || key === 'campus' || key === 'year' ? 18 : 8;
    });
    if (wordHit) hits += 1;
  }
  if (fields.title === words.join(' ')) score += 80;

  if (hits === 0) return null;
  return { doc, areaName, score, matched: [...matched], complete: hits === words.length };
}

export function AttachDocumentsModal({ open, onClose, onAttach, need, excludeIds = [] }: AttachDocumentsModalProps) {
  const { documents, areas } = usePortal();
  const requestQuery = suggestedQuery(need);
  const [query, setQuery] = useState(requestQuery);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setQuery(suggestedQuery(need));
      setSelected([]);
    }
  }, [open, need?.subject, need?.reference]);

  const areaNameFor = useMemo(() => {
    const names = new Map(areas.map((area) => [area.id, area.name]));
    return (id: string) => names.get(id) ?? '';
  }, [areas]);

  const available = useMemo(
    () => documents.filter((doc) => doc.status !== 'Archived' && !excludeIds.includes(doc.id)),
    [documents, excludeIds]
  );

  const words = searchWords(query);
  const ranked = useMemo(() => {
    if (words.length === 0) return [];
    return available
      .map((doc) => rankFile(doc, areaNameFor(doc.areaId), words))
      .filter((row): row is RankedFile => !!row)
      .sort((a, b) => b.score - a.score || a.doc.title.localeCompare(b.doc.title));
  }, [available, words, areaNameFor]);

  const exact = ranked.filter((row) => row.complete);
  const showingExact = exact.length > 0;
  const visible = (showingExact ? exact : ranked).slice(0, RESULT_LIMIT);
  const hiddenCount = (showingExact ? exact.length : ranked.length) - visible.length;

  const selectedDocs = useMemo(
    () => available.filter((doc) => selected.includes(doc.id)),
    [available, selected]
  );

  const toggle = (id: string) => setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));

  const attach = () => {
    onAttach(selectedDocs.map(toAttachment));
    onClose();
  };

  const requested = [need?.subject, need?.reference].filter(Boolean).join(' · ');

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Find a file"
      description="Search by the file name, program, campus, or year. Every word has to match before a file is listed."
      size="lg"
      zIndex="z-[60]"
      footer={
        <>
          <span className="mr-auto self-center text-xs text-ink-muted">
            {selected.length === 0 ? 'Nothing selected' : `${selected.length} selected`}
          </span>
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button type="button" onClick={attach} disabled={selected.length === 0} className="btn btn-primary disabled:opacity-50">
            Attach{selected.length > 0 ? ` ${selected.length}` : ''}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        {requested && (
          <p className="rounded-lg border border-line bg-canvas px-3 py-2 text-[12px] leading-relaxed text-ink-muted">
            <span className="font-semibold text-ink">Requested: </span>
            {requested}
          </p>
        )}

        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="File name, program, campus, or year"
            className="input pl-9 pr-9"
            autoFocus
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-ink-subtle hover:bg-canvas hover:text-ink"
              aria-label="Clear search"
            >
              <XIcon className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {query !== requestQuery && requestQuery && (
          <button type="button" onClick={() => setQuery(requestQuery)} className="text-[12px] font-semibold text-brand-700 hover:underline">
            Search the request again
          </button>
        )}

        {selectedDocs.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {selectedDocs.map((doc) => (
              <li key={doc.id}>
                <button
                  type="button"
                  onClick={() => toggle(doc.id)}
                  className="inline-flex max-w-full items-center gap-1 rounded-full border border-brand-200 bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-ink"
                >
                  <span className="truncate">{doc.title}</span>
                  <XIcon className="h-3 w-3 shrink-0 text-ink-subtle" aria-hidden="true" />
                  <span className="sr-only">Remove {doc.title}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {available.length === 0 ? (
          <EmptyState
            icon={LibraryIcon}
            title="No documents in the repository yet"
            description="Upload the file first, or attach it from your computer instead."
          />
        ) : words.length === 0 ? (
          <EmptyState
            icon={SearchIcon}
            title="Type what the requester needs"
            description="Use the file name, program, campus, or academic year. The list stays empty until those words match a file."
          />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={LibraryIcon}
            title="No file matches those words"
            description="Check the spelling, or search a shorter name such as the program and campus."
          />
        ) : (
          <div className="space-y-2">
            <p className="px-1 text-[12px] text-ink-subtle">
              {showingExact
                ? `${exact.length} file${exact.length === 1 ? '' : 's'} match every word`
                : 'No file contains every word. These are the closest.'}
              {hiddenCount > 0 ? ` Showing ${visible.length}.` : ''}
            </p>
            <ul className="overflow-hidden rounded-xl border border-line">
              {visible.map((row) => {
                const checked = selected.includes(row.doc.id);
                const where = row.matched.map((field) => FIELD_LABEL[field] ?? field).join(', ');
                return (
                  <li key={row.doc.id} className="border-t border-line first:border-t-0">
                    <button
                      type="button"
                      onClick={() => toggle(row.doc.id)}
                      aria-pressed={checked}
                      className={`flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors ${
                        checked ? 'bg-brand-50/80' : 'hover:bg-canvas'
                      }`}
                    >
                      <span
                        className={`grid h-[18px] w-[18px] shrink-0 place-items-center rounded border ${
                          checked ? 'border-brand-600 bg-brand-600 text-white' : 'border-line-strong bg-white'
                        }`}
                        aria-hidden="true"
                      >
                        {checked && <CheckIcon className="h-3 w-3" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-semibold text-ink">{row.doc.title}</span>
                        <span className="block truncate text-[11px] text-ink-subtle">{identityLine(row.doc, row.areaName)}</span>
                        <span className="block truncate text-[11px] text-ink-muted">Matched {where}</span>
                      </span>
                      <span className="shrink-0 rounded-md border border-line bg-canvas px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-ink-muted">
                        {row.doc.fileType}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  );
}
