import { PortalUser } from '../types/user';
import { DEFAULT_SUPERADMIN_EMAIL, DEFAULT_SUPERADMIN_ID } from '../utils/auth';

/** Seeded portal directory — Superadmin only. Admins are created in User Management. */
export const users: PortalUser[] = [
  {
    id: DEFAULT_SUPERADMIN_ID,
    name: 'System Superadmin',
    email: DEFAULT_SUPERADMIN_EMAIL,
    role: 'Superadmin',
    office: 'Office of the University President',
    status: 'Active',
    lastLogin: null,
    employeeId: 'NEMSU-SUPERADMIN',
    personnelClassification: 'Staff (Administrative)',
    affiliationVerified: true
  }
];

/** Bump to force localStorage `portal_users` to reload from this seed. */
export const PORTAL_USERS_SEED_VERSION = 'users-v4-superadmin-approval';
