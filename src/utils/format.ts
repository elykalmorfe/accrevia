import { format, parseISO } from 'date-fns';

export function formatDate(iso: string): string {
  return format(parseISO(iso), 'MMM d, yyyy');
}

export function formatDateTime(iso: string): string {
  return format(parseISO(iso), "MMM d, yyyy 'at' h:mm a");
}

export function formatTime(iso: string): string {
  return format(parseISO(iso), 'h:mm a');
}

export function formatNumber(value: number): string {
  return value.toLocaleString('en-US');
}

export function initials(name: string): string {
  const parts = name.
  replace(/^(Dr\.|Prof\.|Engr\.)\s+/i, '').
  split(' ').
  filter((p) => p && !p.endsWith('.'));
  return ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase();
}

export function uniqueValues<T>(items: T[], pick: (item: T) => string): string[] {
  return Array.from(new Set(items.map(pick))).filter(Boolean).sort();
}