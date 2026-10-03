import React from 'react';

interface SwitchProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}

export function Switch({ checked, onChange, label }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 ${
      checked ? 'bg-brand-600' : 'bg-line-strong'}`
      }>
      
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-150 ${
        checked ? 'translate-x-[18px]' : 'translate-x-0.5'}`
        } />
      
    </button>);

}