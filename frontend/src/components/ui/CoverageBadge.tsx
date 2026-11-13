import React from 'react';
import { CoverageLevel, coverageHints, coverageLabels } from '../../utils/coverage';
import { Badge, BadgeTone } from './Badge';

const coverageTone: Record<CoverageLevel, BadgeTone> = {
  Multiple: 'success',
  Available: 'brand',
  Limited: 'warning',
  None: 'danger'
};

export function CoverageBadge({ level }: {level: CoverageLevel;}) {
  return (
    <Badge tone={coverageTone[level]} dot className="cursor-help" title={coverageHints[level]}>
      {coverageLabels[level]}
    </Badge>);

}