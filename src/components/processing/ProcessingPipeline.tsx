import React from 'react';
import { CheckIcon, LoaderCircleIcon, XIcon } from 'lucide-react';
import { processingStages } from '../../data/processing';

interface ProcessingPipelineProps {
  stage: number;
  ocr: boolean;
  failed?: boolean;
  queued?: boolean;
}

type StageState = 'done' | 'current' | 'failed' | 'pending';

const LAST = processingStages.length - 1;

export function ProcessingPipeline({ stage, ocr, failed = false, queued = false }: ProcessingPipelineProps) {
  return (
    <ol className="space-y-0" aria-label="Document processing pipeline">
      {processingStages.map((s, i) => {
        let state: StageState = 'pending';
        if (failed && i === stage) state = 'failed';else
        if (i < stage || i === LAST && stage === LAST) state = 'done';else
        if (i === stage && !queued) state = 'current';

        const description =
        s.key === 'extract' ? ocr ? 'Scanned pages are read with OCR text recognition' : 'Text layer extracted directly from the file' : s.description;
        const statusText = { done: 'Completed', current: 'In progress', failed: 'Failed', pending: 'Waiting' }[state];

        return (
          <li key={s.key} className="relative flex gap-3 pb-5 last:pb-0">
            {i < LAST &&
            <span className={`absolute bottom-0 left-[11px] top-6 w-px ${i < stage ? 'bg-success-600' : 'bg-line'}`} aria-hidden="true" />
            }
            <span
              className={`relative z-10 grid h-6 w-6 shrink-0 place-items-center rounded-full ${
              state === 'done' ?
              'bg-success-600 text-white' :
              state === 'current' ?
              'border-2 border-brand-600 bg-white text-brand-600' :
              state === 'failed' ?
              'bg-danger-600 text-white' :
              'border border-line-strong bg-white'}`
              }
              aria-hidden="true">
              
              {state === 'done' && <CheckIcon className="h-3.5 w-3.5" strokeWidth={3} />}
              {state === 'current' && <LoaderCircleIcon className="h-3.5 w-3.5 motion-safe:animate-spin" />}
              {state === 'failed' && <XIcon className="h-3.5 w-3.5" strokeWidth={3} />}
            </span>
            <div className="min-w-0 pt-0.5">
              <p className={`text-[13px] font-medium ${state === 'pending' ? 'text-ink-muted' : 'text-ink'}`}>
                {s.label}
                <span
                  className={`ml-2 text-xs font-normal ${
                  state === 'done' ? 'text-success-700' : state === 'failed' ? 'text-danger-700' : state === 'current' ? 'text-brand-600' : 'text-ink-subtle'}`
                  }>
                  
                  {statusText}
                </span>
              </p>
              <p className="mt-0.5 text-xs text-ink-muted">{description}</p>
            </div>
          </li>);

      })}
    </ol>);

}