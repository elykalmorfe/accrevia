import { Health } from '../../utils/reportMetrics';
import { BadgeTone } from '../ui/Badge';

export const healthDot: Record<Health, string> = {
  good: 'bg-success-600',
  warning: 'bg-warning-600',
  danger: 'bg-danger-600'
};

export const healthText: Record<Health, string> = {
  good: 'text-success-700',
  warning: 'text-warning-700',
  danger: 'text-danger-700'
};

export const healthTone: Record<Health, BadgeTone> = {
  good: 'success',
  warning: 'warning',
  danger: 'danger'
};
