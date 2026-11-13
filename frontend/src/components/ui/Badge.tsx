import React, { ReactNode } from 'react';

export type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'gold' | 'purple';

/** All tones stay on the ocean brand scale so badges match system buttons/icons. */
const toneClasses: Record<BadgeTone, string> = {
  neutral: 'bg-slate-100/80 text-slate-700 border-slate-200/60',
  brand: 'bg-brand-50 text-brand-700 border-brand-200',
  success: 'bg-brand-50 text-brand-700 border-brand-200',
  warning: 'bg-brand-100 text-brand-800 border-brand-200',
  danger: 'bg-brand-100 text-brand-900 border-brand-300',
  gold: 'bg-brand-50 text-brand-800 border-brand-200',
  purple: 'bg-brand-50 text-brand-800 border-brand-200'
};

const dotClasses: Record<BadgeTone, string> = {
  neutral: 'bg-slate-400',
  brand: 'bg-brand-600',
  success: 'bg-brand-600',
  warning: 'bg-brand-500',
  danger: 'bg-brand-800',
  gold: 'bg-brand-500',
  purple: 'bg-brand-600'
};

interface BadgeProps {
  tone?: BadgeTone;
  dot?: boolean;
  children: ReactNode;
  className?: string;
  title?: string;
}

export function Badge({ tone = 'neutral', dot = false, children, className = '', title }: BadgeProps) {
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11.5px] font-semibold tracking-wide ${toneClasses[tone]} ${className}`}>
      
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dotClasses[tone]}`} aria-hidden="true" />}
      {children}
    </span>);

}
