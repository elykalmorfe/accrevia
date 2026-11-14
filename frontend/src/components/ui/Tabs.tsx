import React, { ReactNode, useId } from 'react';
import { motion } from 'framer-motion';

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
  const underlineId = useId();
  const activeIndex = Math.max(
    0,
    tabs.findIndex((t) => t.id === value)
  );

  const move = (delta: number) => {
    if (tabs.length === 0) return;
    const next = (activeIndex + delta + tabs.length) % tabs.length;
    onChange(tabs[next].id);
  };

  return (
    <div
      role="tablist"
      aria-label={label}
      className={`flex gap-1 overflow-x-auto no-scrollbar border-b border-line ${className}`}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          move(1);
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          move(-1);
        } else if (e.key === 'Home') {
          e.preventDefault();
          onChange(tabs[0].id);
        } else if (e.key === 'End') {
          e.preventDefault();
          onChange(tabs[tabs.length - 1].id);
        }
      }}
    >
      {tabs.map((tab) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(tab.id)}
            className={`relative -mb-px inline-flex items-center gap-2 whitespace-nowrap rounded-t-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 ${
              active ? 'text-brand-700' : 'text-ink-muted hover:bg-canvas hover:text-ink'
            }`}
          >
            {tab.label}
            {tab.adornment}
            {active && (
              <motion.span
                layoutId={underlineId}
                className="absolute inset-x-1 -bottom-px h-0.5 rounded-full bg-brand-600"
                transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                aria-hidden="true"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
