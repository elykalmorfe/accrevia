import React, { useId } from 'react';

type Option = string | { value: string; label: string; disabled?: boolean };

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
  required?: boolean;
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
  compact = false,
  required = false
}: SelectFieldProps) {
  const id = useId();
  const normalized = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
  const empty = !value;

  return (
    <div className={className}>
      <label htmlFor={id} className={hideLabel ? 'sr-only' : 'label'}>
        {label}
        {required && <span className="ml-0.5 text-brand-700">*</span>}
      </label>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={[
          'input select w-full',
          compact ? 'select-sm h-9 text-xs' : 'text-base sm:text-sm',
          empty ? 'text-ink-muted' : 'text-ink',
          disabled ? '' : 'hover:border-brand-300'
        ].join(' ')}
      >
        {placeholder !== undefined && (
          <option value="" disabled={required}>
            {placeholder}
          </option>
        )}
        {normalized.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
