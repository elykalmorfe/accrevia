import React, { useMemo, useState } from 'react';
import {
  KeyRoundIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  UserCheckIcon,
  UserXIcon,
  ShieldCheckIcon,
  ClockIcon,
  CheckCircle2Icon,
  XCircleIcon,
  ShieldAlertIcon,
  UsersIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { usePortal } from '../contexts/PortalContext';
import { userRoles } from '../data/options';
import { PortalUser, UserStatus } from '../types/user';
import { formatDateTime, initials } from '../utils/format';
import { PageHeader } from '../components/ui/PageHeader';
import { SelectField } from '../components/ui/SelectField';
import { Badge, BadgeTone } from '../components/ui/Badge';
import { RowActionsMenu, RowAction } from '../components/ui/RowActionsMenu';
import { Modal } from '../components/ui/Modal';
import { UserFormModal } from '../components/users/UserFormModal';

const statusTone: Record<UserStatus, BadgeTone> = {
  Active: 'success',
  Invited: 'brand',
  'Pending Approval': 'warning',
  Deactivated: 'neutral',
  Rejected: 'danger'
};

export function UserManagement() {
  const { users: list, saveUser, setUserStatus: updateUserStatus, switchUser } = usePortal();
  const [activeTab, setActiveTab] = useState<'users' | 'approvals'>('users');
  const [text, setText] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [modal, setModal] = useState<{ open: boolean; user: PortalUser | null }>({ open: false, user: null });

  const [approvalSearch, setApprovalSearch] = useState('');
  const [approvalSort, setApprovalSort] = useState('oldest');
  const [review, setReview] = useState<{ users: PortalUser[]; action: 'approve' | 'reject' } | null>(null);
  const [credentialsChecked, setCredentialsChecked] = useState(false);
  const openReview = (users: PortalUser[], action: 'approve' | 'reject') => {
    setCredentialsChecked(false);
    setReview({ users, action });
  };

  // Filtered rows for all users
  const rows = useMemo(() => {
    const needle = text.trim().toLowerCase();
    return list.filter(
      (u) =>
        (!role || u.role === role) &&
        (!status || u.status === status) &&
        (!needle ||
          `${u.name} ${u.email} ${u.office} ${u.employeeId || ''} ${u.personnelClassification || ''}`
            .toLowerCase()
            .includes(needle))
    );
  }, [list, text, role, status]);

  // Pending approval registrations
  const pendingApprovals = useMemo(() => {
    return list.filter((u) => u.status === 'Pending Approval');
  }, [list]);

  const save = (user: PortalUser) => {
    const exists = list.some((u) => u.id === user.id);
    saveUser(user);
    const featureCount = user.allowedFeatures?.length ?? 13;
    toast.success(
      exists
        ? `User "${user.name}" updated`
        : `Account created for ${user.name}`,
      {
        description: user.temporaryPassword
          ? `Temporary password: ${user.temporaryPassword} · ${featureCount} features permitted`
          : `${featureCount} features permitted`,
        duration: 9000,
        action: {
          label: 'Sign In As User',
          onClick: () => {
            switchUser(user.id);
            toast.success(`Active workspace switched to ${user.name}`);
          }
        }
      }
    );
  };

  const setUserStatus = (user: PortalUser, next: UserStatus) => {
    updateUserStatus(user.id, next);
    toast(
      next === 'Deactivated'
        ? `${user.name} has been deactivated`
        : next === 'Active'
          ? `${user.name} has been approved and activated`
          : `${user.name} status updated to ${next}`
    );
  };

  const handleApprove = (user: PortalUser) => {
    const updated: PortalUser = {
      ...user,
      status: 'Active',
      affiliationVerified: true,
      approvedAt: new Date().toISOString()
    };
    saveUser(updated);
    toast.success(`NEMSU Affiliation Verified: ${user.name} is now approved and active`);
  };

  const handleReject = (user: PortalUser) => {
    const updated: PortalUser = {
      ...user,
      status: 'Rejected'
    };
    saveUser(updated);
    toast.error(`Registration for ${user.name} was rejected`);
  };

  const actionsFor = (u: PortalUser): RowAction[] => {
    const actions: RowAction[] = [
      {
        label: 'Sign in as this user',
        icon: UserCheckIcon,
        onSelect: () => {
          switchUser(u.id);
          toast.success(`Active workspace switched to ${u.name}`);
        }
      },
      { label: 'Edit user & permissions', icon: PencilIcon, onSelect: () => setModal({ open: true, user: u }) },
      {
        label: 'Reset password',
        icon: KeyRoundIcon,
        onSelect: () => toast.success(`Password reset instructions sent to ${u.email}`)
      }
    ];

    if (u.status === 'Pending Approval') {
      actions.unshift({
        label: 'Verify & Approve',
        icon: CheckCircle2Icon,
        onSelect: () => openReview([u], 'approve')
      });
      actions.push({
        label: 'Reject Registration',
        icon: XCircleIcon,
        tone: 'danger',
        onSelect: () => openReview([u], 'reject')
      });
    } else if (u.status === 'Deactivated') {
      actions.push({
        label: 'Reactivate user',
        icon: UserCheckIcon,
        onSelect: () => setUserStatus(u, 'Active')
      });
    } else if (u.status === 'Active') {
      actions.push({
        label: 'Deactivate user',
        icon: UserXIcon,
        tone: 'danger',
        onSelect: () => setUserStatus(u, 'Deactivated')
      });
    }

    return actions;
  };

  return (
    <>
      <PageHeader
        eyebrow="Workspace administration"
        title="User management"
        description="Manage your people, review registrations, and keep workspace access secure."
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setModal({ open: true, user: null })}
            >
              <PlusIcon className="h-4 w-4" /> Add User
            </button>
          </div>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Total accounts', value: list.length, icon: UsersIcon, color: 'bg-brand-50 text-brand-700' },
          { label: 'Active accounts', value: list.filter(u => u.status === 'Active').length, icon: UserCheckIcon, color: 'bg-emerald-50 text-emerald-700' },
          { label: 'Awaiting review', value: pendingApprovals.length, icon: ClockIcon, color: 'bg-amber-50 text-amber-700' },
          { label: 'Verified affiliations', value: list.filter(u => u.affiliationVerified).length, icon: ShieldCheckIcon, color: 'bg-brand-50 text-brand-700' }
        ].map(stat => (
          <div key={stat.label} className="panel flex items-center gap-3 p-4">
            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${stat.color}`}><stat.icon className="h-5 w-5" /></span>
            <div><p className="text-2xl font-bold tracking-tight text-ink">{stat.value}</p><p className="text-xs text-ink-muted">{stat.label}</p></div>
          </div>
        ))}
      </div>
      {/* Tabs */}
      <div aria-label="User management views" className="mb-5 flex overflow-x-auto border-b border-line [&>button]:shrink-0 [&>button]:focus-visible:outline-brand-600">
        <button
          type="button"
          aria-pressed={activeTab === 'users'} onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors ${activeTab === 'users'
            ? 'border-brand-600 text-brand-700'
            : 'border-transparent text-ink-muted hover:text-ink'
            }`}
        >
          <UsersIcon className="h-4 w-4" />
          <span>All Accounts</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
            {list.length}
          </span>
        </button>

        <button
          type="button"
          aria-pressed={activeTab === 'approvals'} onClick={() => setActiveTab('approvals')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors ${activeTab === 'approvals'
            ? 'border-brand-600 text-brand-700'
            : 'border-transparent text-ink-muted hover:text-ink'
            }`}
        >
          <ClockIcon className="h-4 w-4" />
          <span>Pending Approvals</span>
          {pendingApprovals.length > 0 ? (
            <span className="rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-bold border border-amber-200">
              {pendingApprovals.length}
            </span>
          ) : (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">0</span>
          )}
        </button>
      </div>

      {/* Tab 1: All Users */}
      {activeTab === 'users' && (
        <section className="panel overflow-hidden">
          <div className="flex flex-col gap-2 border-b border-line p-4 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:max-w-xs">
              <label htmlFor="user-filter" className="sr-only">
                Filter users
              </label>
              <SearchIcon
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle"
                aria-hidden="true"
              />
              <input
                id="user-filter"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Search name, email, employee ID, or office..."
                className="input h-8 pl-9 text-[13px]"
              />
            </div>
            <SelectField
              compact
              hideLabel
              label="Role"
              value={role}
              onChange={setRole}
              placeholder="All roles"
              options={userRoles}
              className="sm:w-44"
            />
            <SelectField
              compact
              hideLabel
              label="Status"
              value={status}
              onChange={setStatus}
              placeholder="All statuses"
              options={['Active', 'Pending Approval', 'Invited', 'Deactivated', 'Rejected']}
              className="sm:w-44"
            />
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[960px] text-left text-xs">
              <thead className="bg-canvas border-b border-line text-ink-muted">
                <tr>
                  <th className="th py-3">User & Affiliation</th>
                  <th className="th py-3">Role Tier</th>
                  <th className="th py-3">Feature Access</th>
                  <th className="th py-3">Department / Office</th>
                  <th className="th py-3">Status</th>
                  <th className="th py-3">Last Login</th>
                  <th className="th py-3 text-right">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((u) => (
                  <tr key={u.id} className={u.status === 'Deactivated' || u.status === 'Rejected' ? 'text-ink-muted bg-canvas/30' : ''}>
                    <td className="td py-3">
                      <div className="flex items-center gap-3">
                        <span
                          className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-semibold ${
                            u.role === 'Superadmin'
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : u.role === 'Administrator'
                                ? 'bg-brand-100 text-brand-800 border border-brand-200'
                                : 'bg-slate-100 text-ink-muted'
                            }`}
                          aria-hidden="true"
                        >
                          {initials(u.name)}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-ink truncate">{u.name}</p>
                            {u.affiliationVerified ? (
                              <span title="Verified NEMSU Affiliation">
                                <CheckCircle2Icon className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                              </span>
                            ) : (
                              <span title="Pending Affiliation Verification">
                                <ClockIcon className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-ink-muted">
                            <span className="truncate">{u.email}</span>
                            {u.employeeId && (
                              <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded">
                                {u.employeeId}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="td py-3 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${u.role === 'Superadmin'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : u.role === 'Administrator'
                              ? 'bg-brand-50 text-brand-700 border-brand-200'
                              : u.role === 'QA Personnel'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : u.role === 'Faculty'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : u.role === 'Staff'
                                    ? 'bg-cyan-50 text-cyan-700 border-cyan-200'
                                    : u.role === 'Accreditor'
                                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                                      : 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="td py-3 text-ink-muted text-[11.5px]">
                      {u.allowedFeatures ? (
                        <span className="inline-flex items-center gap-1 font-medium text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                          {u.allowedFeatures.length} of 13 features
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-medium text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                          Full Access
                        </span>
                      )}
                    </td>
                    <td className="td py-3 text-ink-muted max-w-[220px]">
                      <div className="font-medium text-ink truncate">{u.office}</div>
                      {u.campusId && (
                        <div className="text-[11px] text-ink-muted truncate mt-0.5">
                          {u.campusId}
                        </div>
                      )}
                    </td>
                    <td className="td py-3 whitespace-nowrap">
                      <Badge tone={statusTone[u.status]} dot>
                        {u.status}
                      </Badge>
                    </td>
                    <td className="td py-3 whitespace-nowrap text-ink-muted">
                      {u.lastLogin ? formatDateTime(u.lastLogin) : 'Never'}
                    </td>
                    <td className="td py-3 text-right">
                      <RowActionsMenu label={`Actions for ${u.name}`} actions={actionsFor(u)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile view */}
          <ul className="divide-y divide-line md:hidden">
            {rows.map((u) => (
              <li key={u.id} className="flex items-start justify-between gap-3 px-4 py-3.5">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[13px] font-semibold text-ink">{u.name}</p>
                    {u.affiliationVerified && (
                      <CheckCircle2Icon className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    )}
                  </div>
                  <p className="truncate text-xs text-ink-muted">{u.email}</p>
                  {u.employeeId && (
                    <p className="text-[11px] font-mono text-ink-subtle mt-0.5">ID: {u.employeeId}</p>
                  )}
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
                    <Badge tone={statusTone[u.status]} dot>
                      {u.status}
                    </Badge>
                    <span className="font-semibold text-brand-700">{u.role}</span>
                    <span className="text-ink-subtle">·</span>
                    <span className="text-ink-muted truncate">{u.allowedFeatures ? `${u.allowedFeatures.length} features` : 'Full access'}</span>
                  </div>
                </div>
                <RowActionsMenu label={`Actions for ${u.name}`} actions={actionsFor(u)} />
              </li>
            ))}
          </ul>

          {rows.length === 0 && (
            <div className="px-4 py-10 text-center">
              <p className="text-sm font-semibold text-ink">No users match these filters.</p>
              <p className="mt-1 text-xs text-ink-muted">Try another search or reset your filters.</p>
              <button type="button" className="btn btn-secondary mt-4" onClick={() => { setText(''); setRole(''); setStatus(''); }}>Reset filters</button>
            </div>
          )}
        </section>
      )}

      {activeTab === 'approvals' && (
        <section className="space-y-4" aria-label="Registration review queue">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold text-ink">Registration requests <span className="ml-1 text-sm font-medium text-ink-muted">({pendingApprovals.length})</span></h2>
              <p className="mt-1 text-sm text-ink-muted">Review each person's affiliation and requested access.</p>
            </div>
            {pendingApprovals.length > 1 && <button type="button" className="btn btn-secondary" onClick={() => openReview(pendingApprovals, 'approve')}>Review all {pendingApprovals.length} requests</button>}
          </div>
          {pendingApprovals.length > 0 && <div className="panel flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
              <label htmlFor="approval-search" className="sr-only">Search registration requests</label>
              <input id="approval-search" type="search" value={approvalSearch} onChange={e => setApprovalSearch(e.target.value)} placeholder="Search name, email, employee ID, or office" className="input pl-9" />
            </div>
            <label className="flex items-center gap-2 text-xs text-ink-muted">Sort by
              <select className="input w-auto" value={approvalSort} onChange={e => setApprovalSort(e.target.value)}>
                <option value="oldest">Oldest first</option><option value="newest">Newest first</option><option value="name">Name A?Z</option>
              </select>
            </label>
          </div>}
          {pendingApprovals.length === 0 ? (
            <div className="panel px-6 py-14 text-center">
              <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-emerald-600"><CheckCircle2Icon className="h-7 w-7" /></span>
              <h3 className="text-base font-bold text-ink">You're all caught up</h3>
              <p className="mt-2 text-sm text-ink-muted">No registrations are awaiting review. New requests will appear here.</p>
              <button type="button" className="btn btn-secondary mt-5" onClick={() => setActiveTab('users')}>View all accounts</button>
            </div>
          ) : (() => {
            const requests = pendingApprovals.filter(u => `${u.name} ${u.email} ${u.employeeId || ''} ${u.office}`.toLowerCase().includes(approvalSearch.trim().toLowerCase())).sort((a, b) => {
              if (approvalSort === 'name') return a.name.localeCompare(b.name);
              const difference = (Date.parse(a.registeredAt || '') || 0) - (Date.parse(b.registeredAt || '') || 0);
              return approvalSort === 'newest' ? -difference : difference;
            });
            return <>
              <p className="text-xs text-ink-muted" role="status">Showing {requests.length} of {pendingApprovals.length} requests</p>
              {requests.length === 0 ? <div className="panel p-10 text-center"><p className="font-semibold text-ink">No matching requests</p><button type="button" onClick={() => setApprovalSearch('')} className="btn btn-secondary mt-3">Clear search</button></div> :
                <div className="grid gap-4 xl:grid-cols-2">
                  {requests.map(u => {
                    const domainMatches = u.email.trim().toLowerCase().endsWith('@nemsu.edu.ph');
                    return <article key={u.id} className="panel overflow-hidden">
                      <div className="flex items-start gap-3 p-5">
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-sm font-bold text-brand-700" aria-hidden="true">{initials(u.name)}</span>
                        <div className="min-w-0 flex-1"><h3 className="text-sm font-bold text-ink">{u.name}</h3><p className="mt-1 break-all text-xs text-ink-muted">{u.email}</p></div>
                        <Badge tone="warning" dot>Pending</Badge>
                      </div>
                      <dl className="grid grid-cols-1 gap-x-6 gap-y-4 px-5 pb-5 sm:grid-cols-2">
                        {[
                          ['Requested role', u.role], ['Employee ID', u.employeeId || 'Not provided'],
                          ['Classification', u.personnelClassification || 'Not provided'], ['Department / office', u.office || 'Not provided'],
                          ['Registered', u.registeredAt ? formatDateTime(u.registeredAt) : 'Not recorded']
                        ].map(([label, value]) => <div key={label}><dt className="text-xs text-ink-muted">{label}</dt><dd className="mt-1 break-words text-sm font-medium text-ink">{value}</dd></div>)}
                        <div><dt className="text-xs text-ink-muted">Email domain</dt><dd className={`mt-1 flex items-center gap-1.5 text-xs font-medium ${domainMatches ? 'text-emerald-700' : 'text-amber-800'}`}>{domainMatches ? <CheckCircle2Icon className="h-4 w-4" /> : <ShieldAlertIcon className="h-4 w-4" />}{domainMatches ? 'Institutional domain matches' : 'External domain ? review required'}</dd></div>
                      </dl>
                      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-canvas/40 px-5 py-3">
                        <button type="button" className="btn btn-ghost text-rose-700" aria-label={`Reject registration for ${u.name}`} onClick={() => openReview([u], 'reject')}>Reject request</button>
                        <button type="button" className="btn btn-primary" aria-label={`Review registration for ${u.name}`} onClick={() => openReview([u], 'approve')}><UserCheckIcon className="h-4 w-4" />Review & approve</button>
                      </div>
                    </article>;
                  })}
                </div>}
            </>;
          })()}
        </section>
      )}

      <Modal open={review !== null} onClose={() => setReview(null)} title={review?.action === 'reject' ? 'Reject registration?' : 'Review workspace access'} description={review?.action === 'reject' ? 'The account will be marked as rejected and will not receive workspace access.' : 'Confirm affiliation before activating these accounts.'} footer={<>
        <button type="button" className="btn btn-secondary" onClick={() => setReview(null)}>Cancel</button>
        <button type="button" disabled={review?.action === 'approve' && !credentialsChecked} className={`btn ${review?.action === 'reject' ? 'btn-secondary text-rose-700' : 'btn-primary'} disabled:cursor-not-allowed disabled:opacity-50`} onClick={() => {
          if (!review || (review.action === 'approve' && !credentialsChecked)) return;
          review.users.forEach(u => review.action === 'approve' ? handleApprove(u) : handleReject(u));
          setReview(null);
        }}>{review?.action === 'reject' ? 'Reject request' : `Approve ${review?.users.length === 1 ? 'account' : `${review?.users.length} accounts`}`}</button>
      </>}>
        <ul className="divide-y divide-line rounded-xl border border-line">
          {review?.users.map(u => <li key={u.id} className="p-4"><p className="text-sm font-semibold text-ink">{u.name}</p><p className="mt-1 break-all text-xs text-ink-muted">{u.email}</p><p className="mt-2 text-xs text-ink">{u.employeeId || 'Employee ID not provided'} ? {u.role}</p><p className="mt-1 text-xs text-ink-muted">{u.personnelClassification || 'Classification not provided'} ? {u.office || 'Office not provided'}</p>{!u.email.trim().toLowerCase().endsWith('@nemsu.edu.ph') && <p className="mt-2 text-xs font-semibold text-amber-800">External email domain: verify eligibility before approving.</p>}</li>)}
        </ul>
        {review?.action === 'approve' && <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl bg-brand-50/50 p-4 text-sm leading-relaxed text-ink"><input type="checkbox" className="mt-1 h-4 w-4 shrink-0 accent-blue-600" checked={credentialsChecked} onChange={e => setCredentialsChecked(e.target.checked)} />I have verified the appointment, employee identification, and institutional affiliation of every account listed above.</label>}
      </Modal>

      <UserFormModal
        open={modal.open}
        user={modal.user}
        onClose={() => setModal({ open: false, user: null })}
        onSave={save}
      />
    </>
  );
}