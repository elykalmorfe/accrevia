import React, { useId } from 'react';

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  hint?: string;
  multiline?: boolean;
  required?: boolean;
  className?: string;
}

export function TextField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  hint,
  multiline = false,
  required = false,
  className = ''
}: TextFieldProps) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="label">
        {label}
        {required && <span className="ml-0.5 text-danger-600">*</span>}
      </label>
      {multiline ?
      <textarea id={id} rows={3} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="textarea" /> :

      <input id={id} type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="input" />
      }
      {hint && <p className="mt-1 text-xs text-ink-subtle">{hint}</p>}
    </div>);

}