import React from 'react';
import { ChevronRightIcon } from 'lucide-react';

export interface HierarchyStep {
  label: string;
  value?: string;
}

export function HierarchyPath({ steps }: {steps: HierarchyStep[];}) {
  return (
    <nav aria-label="Requirement hierarchy" className="panel overflow-x-auto px-4 py-3">
      <ol className="flex min-w-max items-center gap-2">
        {steps.map((step, i) =>
        <li key={step.label} className="flex items-center gap-2">
            <div className="leading-tight">
              <p className="text-[11px] text-ink-subtle">{step.label}</p>
              <p className={`max-w-[200px] truncate text-[13px] font-medium ${step.value ? 'text-ink' : 'text-ink-subtle'}`} title={step.value}>
                {step.value ?? '—'}
              </p>
            </div>
            {i < steps.length - 1 && <ChevronRightIcon className="h-4 w-4 shrink-0 text-ink-subtle" aria-hidden="true" />}
          </li>
        )}
      </ol>
    </nav>);

}