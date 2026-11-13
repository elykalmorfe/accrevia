import { EvidenceDocument } from '../types/evidence';

export type CoverageLevel = 'Multiple' | 'Available' | 'Limited' | 'None';

export const coverageLabels: Record<CoverageLevel, string> = {
  Multiple: 'Complete',
  Available: 'Almost there',
  Limited: 'Needs work',
  None: 'Missing'
};

/** One-line explanation of each coverage level, shown next to the legend. */
export const coverageHints: Record<CoverageLevel, string> = {
  Multiple: '3 or more documents',
  Available: '2 documents',
  Limited: 'Only 1 document',
  None: 'No documents yet'
};

export function coverageLevel(count: number): CoverageLevel {
  if (count >= 3) return 'Multiple';
  if (count === 2) return 'Available';
  if (count === 1) return 'Limited';
  return 'None';
}

export function indexedDocs(documents: EvidenceDocument[]): EvidenceDocument[] {
  return documents.filter((d) => d.status === 'Indexed');
}

export function countForCriterion(documents: EvidenceDocument[], criterionId: string): number {
  return indexedDocs(documents).filter((d) => d.criterionId === criterionId).length;
}

export function countForIndicator(documents: EvidenceDocument[], indicatorId: string): number {
  return indexedDocs(documents).filter((d) => d.indicatorId === indicatorId).length;
}

export function countForRequirement(documents: EvidenceDocument[], indicatorId: string, requirementId: string, isFirst: boolean): number {
  return indexedDocs(documents).filter(
    (d) => d.indicatorId === indicatorId && (d.requirementId === requirementId || isFirst && !d.requirementId)
  ).length;
}