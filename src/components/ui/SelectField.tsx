import React, { useId } from 'react';

type Option = string | {value: string;label: string;};

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  hideLabel?: boolean;
  disabled?: boolean;
  className?: string;
  compact?: boolean;
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  hideLabel = false,
  disabled = false,
  className = '',
  compact = false
}: SelectFieldProps) {
  const id = useId();
  const normalized = options.map((o) => typeof o === 'string' ? { value: o, label: o } : o);
  return (
    <div className={className}>
      <label htmlFor={id} className={hideLabel ? 'sr-only' : 'label'}>
        {label}
      </label>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={`input pr-8 ${compact ? 'h-8 text-[13px]' : ''} ${value ? '' : 'text-ink-muted'}`}>
        
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {normalized.map((o) =>
        <option key={o.value} value={o.value}>
            {o.label}
          </option>
        )}
      </select>
    </div>);

}