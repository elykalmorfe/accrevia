import { AlertTriangleIcon } from 'lucide-react';
import { ProgramAccreditation } from '../../types/accreditation';
import { describeDaysRemaining, formatReportDate, getExpiryInfo } from '../../utils/programAccreditation';

export function ExpiryIndicator({ program }: { program: ProgramAccreditation }) {
  const info = getExpiryInfo(program);
  if (info.state === 'expiring') {
    return (
      <span
        className="mt-1 inline-flex items-center gap-1 rounded bg-brand-50 px-1.5 py-0.5 text-[10.5px] font-bold text-brand-800 border border-brand-200"
        title={`Validity ends ${formatReportDate(info.endDate)} · ${describeDaysRemaining(info)}`}
      >
        <AlertTriangleIcon className="h-3 w-3" /> Expiring Soon
      </span>
    );
  }
  if (info.state === 'expired') {
    return (
      <span
        className="mt-1 inline-flex items-center gap-1 rounded bg-brand-50 px-1.5 py-0.5 text-[10.5px] font-bold text-brand-900 border border-brand-200"
        title={`Validity ended ${formatReportDate(info.endDate)}`}
      >
        Expired
      </span>
    );
  }
  return null;
}
