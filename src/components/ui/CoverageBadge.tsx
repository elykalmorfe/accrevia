import React from 'react';
import { CoverageLevel, coverageLabels } from '../../utils/coverage';
import { Badge, BadgeTone } from './Badge';

const coverageTone: Record<CoverageLevel, BadgeTone> = {
  Multiple: 'success',
  Available: 'brand',
  Limited: 'warning',
  None: 'danger'
};

export function CoverageBadge({ level }: {level: CoverageLevel;}) {
  return (
    <Badge tone={coverageTone[level]} dot>
      {coverageLabels[level]}
    </Badge>);

}