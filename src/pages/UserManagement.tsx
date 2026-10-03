import React, { useMemo, useState } from 'react';
import { KeyRoundIcon, PencilIcon, PlusIcon, SearchIcon, UserCheckIcon, UserXIcon } from 'lucide-react';
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

const statusTone: Record<UserStatus, BadgeTone> = { Active: 'success', Invited: 'brand', Deactivated: 'neutral' };

export function UserManagement() {
  const { users: list, saveUser, setUserStatus: updateUserStatus } = usePortal();
  const [text, setText] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [modal, setModal] = useState<{open: boolean;user: PortalUser | null;}>({ open: false, user: null });

  const rows = useMemo(() => {
    const needle = text.trim().toLowerCase();
    return list.filter(
      (u) => (!role || u.role === role) && (!status || u.status === status) && (!needle || `${u.name} ${u.email} ${u.office}`.toLowerCase().includes(needle))
    );
  }, [list, text, role, status]);

  const save = (user: PortalUser) => {
    const exists = list.some((u) => u.id === user.id);
    saveUser(user);
    toast.success(exists ? 'User updated' : `Invitation sent to ${user.email}`);
  };

  const setUserStatus = (user: PortalUser, next: UserStatus) => {
    updateUserStatus(user.id, next);
    toast(next === 'Deactivated' ? `${user.name} has been deactivated` : `${user.name} has been reactivated`);
  };

  const actionsFor = (u: PortalUser): RowAction[] => [
  { label: 'Edit user & role', icon: PencilIcon, onSelect: () => setModal({ open: true, user: u }) },
  { label: 'Reset password', icon: KeyRoundIcon, onSelect: () => toast.success(`Password reset link sent to ${u.email}`) },
  u.status === 'Deactivated' ?
  { label: 'Reactivate user', icon: UserCheckIcon, onSelect: () => setUserStatus(u, 'Active') } :
  { label: 'Deactivate user', icon: UserXIcon, tone: 'danger', onSelect: () => setUserStatus(u, 'Deactivated') }];


  return (
    <>
      <PageHeader
        title="User Management"
        description="Control who can access the evidence repository and what each person can do."
        actions={
        <button type="button" className="btn btn-primary" onClick={() => setModal({ open: true, user: null })}>
            <PlusIcon className="h-4 w-4" /> Add User
          </button>
        } />
      
      <section className="panel overflow-hidden">
        <div className="flex flex-col gap-2 border-b border-line p-4 sm:flex-row">
          <div className="relative sm:w-72">
            <label htmlFor="user-filter" className="sr-only">Filter users</label>
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" aria-hidden="true" />
            <input id="user-filter" value={text} onChange={(e) => setText(e.target.value)} placeholder="Filter by name, email, or office" className="input h-8 pl-9 text-[13px]" />
          </div>
          <SelectField compact hideLabel label="Role" value={role} onChange={setRole} placeholder="All roles" options={userRoles} className="sm:w-44" />
          <SelectField compact hideLabel label="Status" value={status} onChange={setStatus} placeholder="All statuses" options={['Active', 'Invited', 'Deactivated']} className="sm:w-40" />
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[880px]">
            <thead className="bg-canvas">
              <tr>
                <th className="th">Name</th>
                <th className="th">Role</th>
                <th className="th">Department / Office</th>
                <th className="th">Status</th>
                <th className="th">Last login</th>
                <th className="th text-right"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((u) =>
              <tr key={u.id} className={u.status === 'Deactivated' ? 'text-ink-muted' : ''}>
                  <td className="td">
                    <div className="flex items-center gap-3">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700" aria-hidden="true">
                        {initials(u.name)}
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium text-ink">{u.name}</p>
                        <p className="text-xs text-ink-muted">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="td whitespace-nowrap">{u.role}</td>
                  <td className="td text-ink-muted">{u.office}</td>
                  <td className="td"><Badge tone={statusTone[u.status]} dot>{u.status}</Badge></td>
                  <td className="td whitespace-nowrap text-ink-muted">{u.lastLogin ? formatDateTime(u.lastLogin) : 'Never'}</td>
                  <td className="td text-right"><RowActionsMenu label={`Actions for ${u.name}`} actions={actionsFor(u)} /></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <ul className="divide-y divide-line md:hidden">
          {rows.map((u) =>
          <li key={u.id} className="flex items-start justify-between gap-3 px-4 py-3.5">
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-ink">{u.name}</p>
                <p className="truncate text-xs text-ink-muted">{u.email}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
                  <Badge tone={statusTone[u.status]} dot>{u.status}</Badge>
                  <span>{u.role}</span>·<span>{u.office}</span>
                </div>
              </div>
              <RowActionsMenu label={`Actions for ${u.name}`} actions={actionsFor(u)} />
            </li>
          )}
        </ul>
        {rows.length === 0 && <p className="px-4 py-10 text-center text-[13px] text-ink-muted">No users match these filters.</p>}
      </section>
      <UserFormModal open={modal.open} user={modal.user} onClose={() => setModal({ open: false, user: null })} onSave={save} />
    </>);

}