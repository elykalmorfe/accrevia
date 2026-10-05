import React, { ReactNode } from 'react';

export type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'gold';

const toneClasses: Record<BadgeTone, string> = {
  neutral: 'bg-slate-100/80 text-slate-700 border-slate-200/60',
  brand: 'bg-brand-50 text-brand-600 border-brand-100',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  warning: 'bg-amber-50 text-amber-700 border-amber-100',
  danger: 'bg-rose-50 text-rose-700 border-rose-100',
  gold: 'bg-amber-50 text-amber-800 border-amber-200/80'
};

const dotClasses: Record<BadgeTone, string> = {
  neutral: 'bg-slate-400',
  brand: 'bg-brand-600',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
  gold: 'bg-amber-500'
};

interface BadgeProps {
  tone?: BadgeTone;
  dot?: boolean;
  children: ReactNode;
  className?: string;
}

export function Badge({ tone = 'neutral', dot = false, children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11.5px] font-semibold tracking-wide ${toneClasses[tone]} ${className}`}>
      
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dotClasses[tone]}`} aria-hidden="true" />}
      {children}
    </span>);

}