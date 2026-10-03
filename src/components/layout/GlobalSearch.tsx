import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CornerDownLeftIcon, FileTextIcon, HistoryIcon, SearchIcon, XIcon } from 'lucide-react';
import { usePortal } from '../../contexts/PortalContext';
import { useLookup } from '../../hooks/useLookup';
import { useDismiss } from '../../hooks/useDismiss';
import { useAccess } from '../../hooks/useAccess';
import { searchSuggestions } from '../../data/options';
import { searchEvidence } from '../../utils/search';
import { popoverMotion } from '../../utils/motion';

type SuggestionItem =
{kind: 'query' | 'recent' | 'example';label: string;} |
{kind: 'doc';label: string;id: string;score: number;meta: string;};

const placeholders = [
'Search accreditation evidence...',
'Search documents, criteria, indicators, or evidence...',
'Search “faculty qualifications”',
'Search “research accomplishment report”',
'Search by criterion or document type'];


export function GlobalSearch() {
  const navigate = useNavigate();
  const location = useLocation();
  const { recentSearches, addRecentSearch } = usePortal();
  const { accessibleDocuments: documents } = useAccess();
  const lookup = useLookup();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [focused, setFocused] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const close = useCallback(() => {
    setOpen(false);
    setActive(-1);
  }, []);
  const wrapRef = useDismiss<HTMLDivElement>(open, close);

  useEffect(() => {
    if (location.pathname === '/search') setQuery(new URLSearchParams(location.search).get('q') ?? '');
  }, [location.pathname, location.search]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (focused || query) return;
    const timer = setInterval(() => setPlaceholderIndex((i) => (i + 1) % placeholders.length), 4000);
    return () => clearInterval(timer);
  }, [focused, query]);

  const trimmed = query.trim();

  const items = useMemo<SuggestionItem[]>(() => {
    if (trimmed) {
      const matches = trimmed.length > 1 ? searchEvidence(trimmed, documents, lookup).slice(0, 4) : [];
      return [
      { kind: 'query', label: trimmed },
      ...matches.map((r) => ({
        kind: 'doc' as const,
        label: r.doc.title,
        id: r.doc.id,
        score: r.score,
        meta: [lookup.framework(r.doc.frameworkId)?.shortName, lookup.criterion(r.doc.criterionId)?.code, r.doc.docType].
        filter(Boolean).
        join(' · ')
      }))];

    }
    const recent = recentSearches.slice(0, 4).map((label) => ({ kind: 'recent' as const, label }));
    const examples = searchSuggestions.
    filter((s) => !recentSearches.slice(0, 4).includes(s)).
    slice(0, 3).
    map((label) => ({ kind: 'example' as const, label }));
    return [...recent, ...examples];
  }, [trimmed, documents, lookup, recentSearches]);

  useEffect(() => setActive(-1), [trimmed]);

  const runSearch = (value: string) => {
    const q = value.trim();
    if (!q) return;
    addRecentSearch(q);
    close();
    inputRef.current?.blur();
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  const select = (item: SuggestionItem) => {
    if (item.kind === 'doc') {
      addRecentSearch(trimmed);
      close();
      inputRef.current?.blur();
      navigate(`/documents/${item.id}?q=${encodeURIComponent(trimmed)}`);
      return;
    }
    runSearch(item.label);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (active >= 0 && items[active]) select(items[active]);else
      runSearch(query);
    } else if (e.key === 'Escape') {
      close();
      inputRef.current?.blur();
    }
  };

  const renderItem = (item: SuggestionItem) => {
    const index = items.indexOf(item);
    const isActive = active === index;
    return (
      <li key={`${item.kind}-${item.label}`} id={`${listId}-${index}`} role="option" aria-selected={isActive}>
        <button
          type="button"
          tabIndex={-1}
          onMouseDown={(e) => e.preventDefault()}
          onMouseEnter={() => setActive(index)}
          onClick={() => select(item)}
          className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm ${isActive ? 'bg-brand-50' : ''}`}>
          
          {item.kind === 'doc' ?
          <>
              <FileTextIcon className="h-4 w-4 shrink-0 text-ink-subtle" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-ink">{item.label}</span>
                <span className="block truncate text-xs text-ink-muted">{item.meta}</span>
              </span>
              <span className="shrink-0 text-xs font-semibold tabular-nums text-brand-700">{item.score}% Match</span>
            </> :
          item.kind === 'query' ?
          <>
              <SearchIcon className="h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate text-ink">
                Search evidence for <span className="font-semibold">“{item.label}”</span>
              </span>
              <CornerDownLeftIcon className="h-3.5 w-3.5 shrink-0 text-ink-subtle" aria-hidden="true" />
            </> :

          <>
              {item.kind === 'recent' ?
            <HistoryIcon className="h-4 w-4 shrink-0 text-ink-subtle" aria-hidden="true" /> :

            <SearchIcon className="h-4 w-4 shrink-0 text-ink-subtle" aria-hidden="true" />
            }
              <span className="min-w-0 flex-1 truncate text-ink">{item.label}</span>
            </>
          }
        </button>
      </li>);

  };

  const docItems = items.filter((i) => i.kind === 'doc');
  const recentItems = items.filter((i) => i.kind === 'recent');
  const exampleItems = items.filter((i) => i.kind === 'example');

  return (
    <div ref={wrapRef} className="relative w-full max-w-2xl">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          runSearch(query);
        }}>
        
        <label htmlFor="global-search" className="sr-only">
          Search accreditation evidence
        </label>
        <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-subtle" aria-hidden="true" />
        <input
          ref={inputRef}
          id="global-search"
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          autoComplete="off"
          value={query}
          placeholder={placeholders[placeholderIndex]}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setFocused(true);
            setOpen(true);
          }}
          onBlur={() => setFocused(false)}
          onKeyDown={onKeyDown}
          className="h-10 w-full rounded-lg border border-line-strong bg-canvas pl-10 pr-20 text-[15px] text-ink placeholder:text-ink-subtle transition-colors duration-150 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/15" />
        
        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {query ?
          <button
            type="button"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="grid h-7 w-7 place-items-center rounded text-ink-subtle hover:bg-line hover:text-ink"
            aria-label="Clear search">
            
              <XIcon className="h-4 w-4" />
            </button> :

          <span className="hidden items-center gap-0.5 sm:flex" aria-hidden="true">
              <kbd className="kbd">Ctrl</kbd>
              <kbd className="kbd">K</kbd>
            </span>
          }
        </div>
      </form>

      <AnimatePresence>
        {open &&
        <motion.div
          {...popoverMotion}
          className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-lg border border-line bg-white shadow-lg">
          
            <ul id={listId} role="listbox" aria-label="Search suggestions" className="max-h-[60vh] overflow-y-auto py-1.5">
              {trimmed ?
            <>
                  {renderItem(items[0])}
                  {docItems.length > 0 &&
              <li role="presentation" className="px-3 pb-1 pt-3 text-xs font-medium text-ink-muted">
                      Top evidence matches
                    </li>
              }
                  {docItems.map(renderItem)}
                  {trimmed.length > 1 && docItems.length === 0 &&
              <li role="presentation" className="px-3 py-2 text-[13px] text-ink-muted">
                      No direct matches yet — press Enter to run a full search.
                    </li>
              }
                </> :

            <>
                  {recentItems.length > 0 &&
              <li role="presentation" className="px-3 pb-1 pt-2 text-xs font-medium text-ink-muted">
                      Recent searches
                    </li>
              }
                  {recentItems.map(renderItem)}
                  {exampleItems.length > 0 &&
              <li role="presentation" className="px-3 pb-1 pt-3 text-xs font-medium text-ink-muted">
                      Try natural-language, criterion, or framework searches
                    </li>
              }
                  {exampleItems.map(renderItem)}
                </>
            }
            </ul>
            <div className="hidden items-center gap-4 border-t border-line bg-canvas px-3 py-2 text-[11px] text-ink-muted sm:flex">
              <span className="flex items-center gap-1">
                <kbd className="kbd">↑</kbd>
                <kbd className="kbd">↓</kbd> navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="kbd">Enter</kbd> search
              </span>
              <span className="flex items-center gap-1">
                <kbd className="kbd">Esc</kbd> close
              </span>
            </div>
          </motion.div>
        }
      </AnimatePresence>
    </div>);

}