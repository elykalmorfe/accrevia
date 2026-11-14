import { ReactNode } from 'react';
import { LockIcon, ShieldAlertIcon } from 'lucide-react';

type RestrictedAccessNoticeProps = {
  title?: string;
  description?: string;
  badge?: string;
  action?: ReactNode;
};

export function RestrictedAccessNotice({
  title = 'Restricted accreditation materials',
  description = 'Access to these documents requires authorization from Quality Assurance personnel. File names, previews, and Drive links remain hidden until approval is granted.',
  badge = 'QA Approval Required',
  action
}: RestrictedAccessNoticeProps) {
  return (
    <div className="panel overflow-hidden p-0">
      <div className="border-b border-amber-200/80 bg-amber-50 px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-surface px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-900">
            <ShieldAlertIcon className="h-3.5 w-3.5" aria-hidden="true" />
            {badge}
          </span>
        </div>
        <h2 className="mt-3 text-base font-extrabold tracking-tight text-ink sm:text-lg">{title}</h2>
        <p className="mt-1.5 max-w-2xl text-[13px] font-medium leading-relaxed text-ink-muted">{description}</p>
      </div>

      <div className="flex flex-col items-center px-6 py-10 text-center sm:py-12">
        <span className="grid h-12 w-12 place-items-center rounded-full border border-line bg-canvas text-ink-muted">
          <LockIcon className="h-5 w-5" aria-hidden="true" />
        </span>
        <p className="mt-4 max-w-md text-[13px] font-medium text-ink-muted">
          Document titles and contents are not shown in this view. After QA approval is implemented, authorized
          faculty and staff will be able to request and open approved technical reviews here.
        </p>
        {action ? <div className="mt-6">{action}</div> : null}
      </div>
    </div>
  );
}
