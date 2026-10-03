import React, { ReactNode } from 'react';

interface TabItem<T extends string> {
  id: T;
  label: string;
  adornment?: ReactNode;
}

interface TabsProps<T extends string> {
  tabs: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  className?: string;
}

export function Tabs<T extends string>({ tabs, value, onChange, label, className = '' }: TabsProps<T>) {
  return (
    <div role="tablist" aria-label={label} className={`flex gap-1 overflow-x-auto border-b border-line ${className}`}>
      {tabs.map((tab) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={`-mb-px inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
            active ? 'border-brand-600 text-brand-700' : 'border-transparent text-ink-muted hover:text-ink'}`
            }>
            
            {tab.label}
            {tab.adornment}
          </button>);

      })}
    </div>);

}