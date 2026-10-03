import React from 'react';
import { Link } from 'react-router-dom';
import { LockIcon } from 'lucide-react';

export function AccessRestricted() {
  return (
    <div className="panel mx-auto max-w-xl px-6 py-14 text-center" role="alert">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-canvas text-ink-muted">
        <LockIcon className="h-5 w-5" aria-hidden="true" />
      </span>
      <h1 className="mt-4 font-serif text-xl font-semibold text-ink">Access Restricted</h1>
      <p className="mt-1.5 text-sm text-ink-muted">You do not have permission to view this evidence document.</p>
      <p className="mt-1 text-xs text-ink-subtle">If you need it, ask the Quality Assurance Office to share it with you.</p>
      <Link to="/shared-with-me" className="btn btn-primary mt-6">
        Go to Shared with Me
      </Link>
    </div>);

}