import { EvidenceDocument, Lookup } from '../types/evidence';

export interface SearchResult {
  doc: EvidenceDocument;
  score: number;
  terms: string[];
  passages: string[];
  reason: string;
}

export interface QueryIntent {
  frameworkId?: string;
  criterionNumber?: string;
  indicatorCode?: string;
  year?: string;
}

const STOP_WORDS = new Set([
'the', 'of', 'for', 'and', 'a', 'an', 'in', 'on', 'to', 'showing', 'show', 'shows', 'documents', 'document',
'evidence', 'with', 'that', 'about', 'by', 'is', 'are', 'from', 'criterion', 'indicator', 'any', 'all', 'our',
'find', 'need', 'what', 'which', 'related', 'institutional', 'accreditation']
);

const RELATED_TERMS: Record<string, string[]> = {
  development: ['training', 'seminar', 'scholarship', 'capability'],
  professional: ['development', 'training'],
  qualification: ['credentials', 'profile', 'degrees'],
  qualifications: ['qualification', 'credentials', 'profile'],
  research: ['publications', 'studies'],
  productivity: ['outputs', 'publications', 'completed'],
  audit: ['nonconformities', 'auditors', 'corrective'],
  extension: ['community', 'outreach', 'beneficiaries'],
  services: ['welfare', 'guidance', 'support'],
  library: ['holdings', 'volumes', 'collection'],
  planning: ['strategic', 'plan', 'targets'],
  plan: ['planning', 'strategic'],
  accomplishment: ['completed', 'implemented'],
  activities: ['activity', 'workshops', 'trainings'],
  governance: ['board', 'resolutions', 'policies'],
  curriculum: ['syllabus', 'outcomes'],
  facilities: ['buildings', 'classrooms', 'maintenance']
};

const FRAMEWORK_CUES: [RegExp, string][] = [
[/\biso\b/i, 'iso'],
[/\bcopc\b|certificate of program compliance/i, 'copc'],
[/\bpqa\b|quality award/i, 'pqa'],
[/program accreditation/i, 'pa'],
[/institutional accreditation/i, 'ia']];


export function tokenize(text: string): string[] {
  return text.
  toLowerCase().
  replace(/[“”"'’]/g, ' ').
  split(/[^a-z0-9.]+/).
  map((t) => t.replace(/^\.+|\.+$/g, '')).
  filter((t) => t.length > 1 && !STOP_WORDS.has(t));
}

export function parseIntent(query: string): QueryIntent {
  const intent: QueryIntent = {};
  const framework = FRAMEWORK_CUES.find(([re]) => re.test(query));
  if (framework) intent.frameworkId = framework[1];
  const crit = query.match(/criterion\s*(\d+)(?:\.(\d+))?/i);
  if (crit) {
    intent.criterionNumber = crit[1];
    if (crit[2]) intent.indicatorCode = `${crit[1]}.${crit[2]}`;
  } else {
    const ind = query.match(/\b(\d{1,2}\.\d{1,2})\b/);
    if (ind) {
      intent.indicatorCode = ind[1];
      intent.criterionNumber = ind[1].split('.')[0];
    }
  }
  const year = query.match(/\b(20\d{2})\b/);
  if (year) intent.year = year[1];
  return intent;
}

export function searchEvidence(query: string, docs: EvidenceDocument[], lookup: Lookup): SearchResult[] {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const intent = parseIntent(trimmed);
  const terms = Array.from(new Set(tokenize(trimmed).filter((t) => !/^\d+(\.\d+)*$/.test(t))));
  const results: SearchResult[] = [];

  for (const doc of docs) {
    if (doc.status !== 'Indexed') continue;
    const criterion = lookup.criterion(doc.criterionId);
    const indicator = lookup.indicator(doc.indicatorId);
    const area = lookup.area(doc.areaId);
    const framework = lookup.framework(doc.frameworkId);
    const title = doc.title.toLowerCase();
    const keywords = doc.keywords.join(' | ').toLowerCase();
    const description = doc.description.toLowerCase();
    const passages = doc.passages.map((p) => p.toLowerCase());
    const context = `${area?.name ?? ''} ${criterion?.name ?? ''} ${indicator?.name ?? ''} ${doc.docType} ${framework?.name ?? ''}`.toLowerCase();

    let score = 0;
    const fields = new Set<string>();
    const matched = new Set<string>();
    const primaryMatched = new Set<string>();

    const weigh = (term: string, weight: number, primary: boolean) => {
      let s = 0;
      if (title.includes(term)) {s += 3;fields.add('title');}
      if (keywords.includes(term)) {s += 2.5;fields.add('keywords');}
      if (description.includes(term)) {s += 1.5;fields.add('summary');}
      const hits = passages.filter((p) => p.includes(term)).length;
      if (hits) {s += Math.min(hits, 2);fields.add('document text');}
      if (context.includes(term)) {s += 1.2;fields.add('classification');}
      if (s > 0) {
        matched.add(term);
        if (primary) primaryMatched.add(term);
      }
      score += s * weight;
    };

    terms.forEach((t) => {
      weigh(t, 1, true);
      (RELATED_TERMS[t] ?? []).forEach((r) => {
        if (!terms.includes(r)) weigh(r, 0.4, false);
      });
    });

    for (let i = 0; i < terms.length - 1; i++) {
      const bigram = `${terms[i]} ${terms[i + 1]}`;
      if (title.includes(bigram) || keywords.includes(bigram)) score += 3;else
      if (description.includes(bigram) || passages.some((p) => p.includes(bigram))) score += 1.5;
    }

    if (intent.criterionNumber && criterion && /^Criterion/.test(criterion.code)) {
      const num = criterion.code.match(/(\d+)/)?.[1];
      if (num === intent.criterionNumber && (!intent.frameworkId || intent.frameworkId === doc.frameworkId)) score += 5;
    }
    if (intent.indicatorCode && indicator?.code === intent.indicatorCode) score += 6;
    if (intent.frameworkId) score = intent.frameworkId === doc.frameworkId ? score + 3 : score * 0.55;
    if (intent.year && (doc.academicYear.includes(intent.year) || doc.documentDate.startsWith(intent.year))) score += 1.5;

    if (score < 2.5) continue;
    const pct = Math.min(98, Math.round(100 * (1 - Math.exp(-score / 9))));
    if (pct < 25) continue;

    const matchedTerms = Array.from(matched);
    const rankedPassages = doc.passages.
    map((p) => ({ p, hits: matchedTerms.filter((t) => p.toLowerCase().includes(t)).length })).
    filter((x) => x.hits > 0).
    sort((a, b) => b.hits - a.hits).
    slice(0, 2).
    map((x) => x.p);

    results.push({
      doc,
      score: pct,
      terms: matchedTerms,
      passages: rankedPassages,
      reason: buildReason(Array.from(primaryMatched), Array.from(fields), doc, lookup)
    });
  }

  return results.sort((a, b) => b.score - a.score);
}

function buildReason(terms: string[], fields: string[], doc: EvidenceDocument, lookup: Lookup): string {
  const criterion = lookup.criterion(doc.criterionId);
  const indicator = lookup.indicator(doc.indicatorId);
  const framework = lookup.framework(doc.frameworkId);
  const termText = terms.slice(0, 3).map((t) => `“${t}”`).join(', ');
  const where = joinNatural(fields.slice(0, 3));
  const lead = termText ? `Matches ${termText} in the ${where}.` : 'Matched through its accreditation classification.';
  const support = criterion ?
  ` Supports ${criterion.code}${indicator ? `, Indicator ${indicator.code}` : ''} (${indicator?.name ?? criterion.name}) under ${framework?.shortName ?? 'its framework'}.` :
  '';
  return lead + support;
}

function joinNatural(items: string[]): string {
  if (items.length <= 1) return items[0] ?? 'document';
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}