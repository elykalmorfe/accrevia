import { Link } from 'react-router-dom';
import { ShieldAlertIcon } from 'lucide-react';
import { EmptyState } from '../components/ui/EmptyState';
import { FACULTY_STAFF_CAPABILITY_NOTE } from '../config/facultyStaffCapabilities';

export function AccessDenied({
  title = 'Access denied',
  description = 'This page is for administrative management and is not available to Faculty/Staff users.',
  homeTo = '/open',
  homeLabel = 'Back to Faculty/Staff dashboard'
}: {
  title?: string;
  description?: string;
  homeTo?: string;
  homeLabel?: string;
}) {
  return (
    <div className="mx-auto max-w-lg py-16">
      <EmptyState
        icon={ShieldAlertIcon}
        title={title}
        description={description}
        action={
          <Link to={homeTo} className="btn btn-primary">
            {homeLabel}
          </Link>
        }
      />
      <p className="mt-6 text-center text-[11px] leading-relaxed text-ink-subtle">{FACULTY_STAFF_CAPABILITY_NOTE}</p>
    </div>
  );
}
