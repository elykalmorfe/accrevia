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
  UsersIcon,
  LockIcon,
  CheckIcon,
  FileCheck2Icon
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
import { UserFormModal } from '../components/users/UserFormModal';

const statusTone: Record<UserStatus, BadgeTone> = {
  Active: 'success',
  Invited: 'brand',
  'Pending Approval': 'warning',
  Deactivated: 'neutral',
  Rejected: 'danger'
};

export function UserManagement() {
  const { users: list, saveUser, setUserStatus: updateUserStatus } = usePortal();
  const [activeTab, setActiveTab] = useState<'users' | 'approvals' | 'permissions'>('users');
  const [text, setText] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [modal, setModal] = useState<{ open: boolean; user: PortalUser | null }>({ open: false, user: null });

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
    toast.success(exists ? `User "${user.name}" updated` : `User account for ${user.email} registered successfully`);
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

  const handleApproveAllPending = () => {
    if (pendingApprovals.length === 0) return;
    pendingApprovals.forEach((u) => {
      saveUser({
        ...u,
        status: 'Active',
        affiliationVerified: true,
        approvedAt: new Date().toISOString()
      });
    });
    toast.success(`Approved and verified all ${pendingApprovals.length} pending NEMSU registrations`);
  };

  const actionsFor = (u: PortalUser): RowAction[] => {
    const actions: RowAction[] = [
      { label: 'Edit user & affiliation', icon: PencilIcon, onSelect: () => setModal({ open: true, user: u }) },
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
        onSelect: () => handleApprove(u)
      });
      actions.push({
        label: 'Reject Registration',
        icon: XCircleIcon,
        tone: 'danger',
        onSelect: () => handleReject(u)
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
        title="User Management & Security"
        description="Administer NEMSU personnel accounts, verify institutional affiliation, process registrations, and enforce role-based access tiers."
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

      {/* NEMSU Workspace Security Notice Banner */}
      <div className="mb-5 rounded-xl border border-brand-200/80 bg-gradient-to-r from-brand-50/90 via-sky-50/40 to-brand-50/70 p-4 text-xs text-brand-950 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-2.5">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-600 text-white shadow-xs">
              <ShieldCheckIcon className="h-4 w-4" />
            </div>
            <div>
              <p className="font-bold text-sm text-brand-900">
                NEMSU Workspace Security & Affiliation Enforcement
              </p>
              <p className="text-ink-muted text-xs mt-0.5">
                Restricted to verified North Eastern Mindanao State University personnel (<strong>@nemsu.edu.ph</strong>). All self-registrations require administrator approval to verify faculty/staff credentials before portal access is granted.
              </p>
            </div>
          </div>
          {pendingApprovals.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('approvals')}
              className="btn btn-sm bg-amber-500 hover:bg-amber-600 text-white border-transparent shrink-0 shadow-xs flex items-center gap-1.5"
            >
              <ClockIcon className="h-3.5 w-3.5" />
              <span>{pendingApprovals.length} Pending Approval{pendingApprovals.length > 1 ? 's' : ''}</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-5 flex border-b border-line">
        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors ${
            activeTab === 'users'
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
          onClick={() => setActiveTab('approvals')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors ${
            activeTab === 'approvals'
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

        <button
          type="button"
          onClick={() => setActiveTab('permissions')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors ${
            activeTab === 'permissions'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          <LockIcon className="h-4 w-4" />
          <span>Role-Based Access Matrix</span>
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
                  <th className="th py-3">Personnel Classification</th>
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
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${
                          u.role === 'Superadmin'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : u.role === 'Administrator'
                            ? 'bg-brand-50 text-brand-700 border-brand-200'
                            : u.role === 'QA Personnel'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : u.role === 'Faculty'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : u.role === 'Staff'
                            ? 'bg-cyan-50 text-cyan-700 border-cyan-200'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="td py-3 text-ink-muted text-[11.5px]">
                      {u.personnelClassification ? (
                        <span className="font-medium text-ink-subtle">{u.personnelClassification}</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="td py-3 text-ink-muted truncate max-w-[200px]">{u.office}</td>
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
                    <span className="text-ink-muted truncate">{u.office}</span>
                  </div>
                </div>
                <RowActionsMenu label={`Actions for ${u.name}`} actions={actionsFor(u)} />
              </li>
            ))}
          </ul>

          {rows.length === 0 && (
            <p className="px-4 py-10 text-center text-[13px] text-ink-muted">
              No users match these filters.
            </p>
          )}
        </section>
      )}

      {/* Tab 2: Pending Approvals & NEMSU Affiliation Verification */}
      {activeTab === 'approvals' && (
        <section className="space-y-4">
          <div className="panel p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50/40 border-amber-200/70">
            <div>
              <h3 className="font-bold text-sm text-amber-950 flex items-center gap-2">
                <ClockIcon className="h-4 w-4 text-amber-600" />
                Registrations Requiring Administrator Approval
              </h3>
              <p className="text-xs text-ink-muted mt-0.5">
                Verify faculty/staff appointment, employee identification, and NEMSU email validity before approving portal access.
              </p>
            </div>
            {pendingApprovals.length > 0 && (
              <button
                type="button"
                onClick={handleApproveAllPending}
                className="btn btn-sm btn-primary shrink-0 flex items-center gap-1.5"
              >
                <CheckIcon className="h-3.5 w-3.5" />
                <span>Approve All ({pendingApprovals.length})</span>
              </button>
            )}
          </div>

          {pendingApprovals.length === 0 ? (
            <div className="panel p-10 text-center">
              <CheckCircle2Icon className="mx-auto h-10 w-10 text-emerald-500 mb-2" />
              <h4 className="font-bold text-ink text-sm">All Registrations Approved</h4>
              <p className="text-xs text-ink-muted mt-1 max-w-md mx-auto">
                There are no pending accounts waiting for affiliation verification. New registrations from the NEMSU Workspace will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {pendingApprovals.map((u) => {
                const isNemsuDomain = u.email.toLowerCase().endsWith('@nemsu.edu.ph');

                return (
                  <div
                    key={u.id}
                    className="panel p-4 flex flex-col justify-between border-amber-200/80 bg-white shadow-xs"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-ink text-sm">{u.name}</p>
                          <p className="text-xs text-brand-700 font-mono mt-0.5">{u.email}</p>
                        </div>
                        <Badge tone="warning" dot>
                          Pending
                        </Badge>
                      </div>

                      <div className="mt-3 space-y-1.5 text-xs border-t border-line pt-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-ink-muted">Requested Role:</span>
                          <span className="font-semibold text-ink">{u.role}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-ink-muted">Classification:</span>
                          <span className="font-medium text-ink-subtle truncate max-w-[170px]" title={u.personnelClassification}>
                            {u.personnelClassification || 'Faculty'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-ink-muted">Employee ID:</span>
                          <span className="font-mono font-medium text-ink">{u.employeeId || 'N/A'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-ink-muted">Assigned Office:</span>
                          <span className="text-ink truncate max-w-[170px]" title={u.office}>{u.office}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-ink-muted">Domain Verified:</span>
                          {isNemsuDomain ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                              <CheckCircle2Icon className="h-3 w-3" /> @nemsu.edu.ph
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700">
                              <ShieldAlertIcon className="h-3 w-3" /> External Domain
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-line flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleApprove(u)}
                        className="btn btn-sm btn-primary flex-1 justify-center text-xs"
                      >
                        <CheckIcon className="h-3.5 w-3.5 mr-1" />
                        Verify & Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReject(u)}
                        className="btn btn-sm btn-secondary text-danger-700 hover:bg-danger-50 text-xs px-2.5"
                        title="Reject Registration"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Tab 3: Role-Based Access Matrix & Security Controls */}
      {activeTab === 'permissions' && (
        <section className="space-y-4">
          <div className="panel p-4">
            <h3 className="font-bold text-sm text-ink mb-1">
              Role-Based Access Control (RBAC) & Document Security Policy
            </h3>
            <p className="text-xs text-ink-muted">
              Security permissions are strictly partitioned across Superadmin, Administrator, and User roles to safeguard confidential institutional accreditation assets.
            </p>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead className="bg-canvas border-b border-line text-ink-muted">
                  <tr>
                    <th className="th py-3">Security Capability / Asset</th>
                    <th className="th py-3">Superadmin</th>
                    <th className="th py-3">Admin</th>
                    <th className="th py-3">QA Personnel</th>
                    <th className="th py-3">Faculty / Staff (User)</th>
                    <th className="th py-3">Accreditor (Ext.)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  <tr>
                    <td className="td py-3 font-medium text-ink">
                      Accessible Common Docs (Instruments, PPP, Findings, BOR)
                    </td>
                    <td className="td py-3 text-emerald-600 font-bold">Full Access</td>
                    <td className="td py-3 text-emerald-600 font-bold">Full Access</td>
                    <td className="td py-3 text-emerald-600 font-bold">Full Access</td>
                    <td className="td py-3 text-emerald-600 font-bold">Full Access</td>
                    <td className="td py-3 text-emerald-600 font-bold">Read-Only</td>
                  </tr>
                  <tr>
                    <td className="td py-3 font-medium text-ink">
                      Confidential Common Docs (Technical Review, COPC, Memos, Endorsements)
                    </td>
                    <td className="td py-3 text-purple-700 font-bold">Full Access</td>
                    <td className="td py-3 text-brand-700 font-bold">Authorized Only</td>
                    <td className="td py-3 text-ink-muted">Audit-Scoped</td>
                    <td className="td py-3 text-rose-600 font-bold">Restricted</td>
                    <td className="td py-3 text-rose-600 font-bold">Restricted</td>
                  </tr>
                  <tr>
                    <td className="td py-3 font-medium text-ink">
                      IA Document Folder Management (Create, Rename, Delete)
                    </td>
                    <td className="td py-3 text-emerald-600 font-bold">Yes</td>
                    <td className="td py-3 text-emerald-600 font-bold">Yes</td>
                    <td className="td py-3 text-emerald-600 font-bold">Yes</td>
                    <td className="td py-3 text-rose-600 font-bold">No</td>
                    <td className="td py-3 text-rose-600 font-bold">No</td>
                  </tr>
                  <tr>
                    <td className="td py-3 font-medium text-ink">
                      Upload Recursive Folders & Evidence Documents
                    </td>
                    <td className="td py-3 text-emerald-600 font-bold">Yes</td>
                    <td className="td py-3 text-emerald-600 font-bold">Yes</td>
                    <td className="td py-3 text-emerald-600 font-bold">Yes</td>
                    <td className="td py-3 text-ink-muted">Assigned Only</td>
                    <td className="td py-3 text-rose-600 font-bold">No</td>
                  </tr>
                  <tr>
                    <td className="td py-3 font-medium text-ink">
                      User Management & Affiliation Verification
                    </td>
                    <td className="td py-3 text-emerald-600 font-bold">Yes</td>
                    <td className="td py-3 text-emerald-600 font-bold">Yes</td>
                    <td className="td py-3 text-rose-600 font-bold">No</td>
                    <td className="td py-3 text-rose-600 font-bold">No</td>
                    <td className="td py-3 text-rose-600 font-bold">No</td>
                  </tr>
                  <tr>
                    <td className="td py-3 font-medium text-ink">
                      System Configuration & Security Overrides
                    </td>
                    <td className="td py-3 text-purple-700 font-bold">Complete</td>
                    <td className="td py-3 text-rose-600 font-bold">No</td>
                    <td className="td py-3 text-rose-600 font-bold">No</td>
                    <td className="td py-3 text-rose-600 font-bold">No</td>
                    <td className="td py-3 text-rose-600 font-bold">No</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      <UserFormModal
        open={modal.open}
        user={modal.user}
        onClose={() => setModal({ open: false, user: null })}
        onSave={save}
      />
    </>
  );
}