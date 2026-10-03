import React from 'react';
import { Link } from 'react-router-dom';
import { formatNumber } from '../../utils/format';

export interface BarItem {
  label: string;
  value: number;
  to?: string;
}

interface BarListProps {
  items: BarItem[];
  unit?: string;
  tone?: 'brand' | 'gold';
}

export function BarList({ items, unit, tone = 'brand' }: BarListProps) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <ul className="space-y-3">
      {items.map((item) =>
      <li key={item.label}>
          <div className="flex items-baseline justify-between gap-3 text-[13px]">
            {item.to ?
          <Link to={item.to} className="truncate text-ink hover:text-brand-700 hover:underline" title={item.label}>
                {item.label}
              </Link> :

          <span className="truncate text-ink" title={item.label}>
                {item.label}
              </span>
          }
            <span className="shrink-0 font-medium tabular-nums text-ink">
              {formatNumber(item.value)}
              {unit && <span className="ml-1 font-normal text-ink-subtle">{unit}</span>}
            </span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-canvas">
            <div
            className={`h-full rounded-full ${tone === 'brand' ? 'bg-brand-600' : 'bg-gold-500'}`}
            style={{ width: `${item.value / max * 100}%` }} />
          
          </div>
        </li>
      )}
    </ul>);

}