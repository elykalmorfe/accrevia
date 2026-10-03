import React from 'react';
import { processingStages } from '../../data/processing';

interface StageTrackProps {
  stage: number;
  failed?: boolean;
  queued?: boolean;
}

export function StageTrack({ stage, failed = false, queued = false }: StageTrackProps) {
  const last = processingStages.length - 1;
  const label = queued ? 'Queued' : processingStages[stage]?.label ?? '';
  return (
    <div>
      <div className="flex gap-0.5" role="img" aria-label={`Stage ${stage + 1} of ${processingStages.length}: ${label}`}>
        {processingStages.map((s, i) => {
          let color = 'bg-line';
          if (i < stage || stage === last && i === last) color = 'bg-success-600';else
          if (i === stage && failed) color = 'bg-danger-600';else
          if (i === stage && !queued) color = 'bg-brand-500';
          return <span key={s.key} className={`h-1.5 w-5 rounded-full ${color}`} />;
        })}
      </div>
      <p className={`mt-1 text-xs ${failed ? 'text-danger-700' : 'text-ink-muted'}`}>{label}</p>
    </div>);

}