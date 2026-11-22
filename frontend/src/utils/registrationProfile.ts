import { campuses } from '../data/accreditationData';
import { PersonnelClassification } from '../types/user';

/** Office written when a signup did not collect a real department. */
export const SIGNUP_OFFICE_PLACEHOLDER = 'Academic / Administrative Unit';

/** Official employee or appointment number: 3–40 letters, numbers, or hyphens. */
export const EMPLOYEE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9-]{2,39}$/;

export const ROLE_CLASSIFICATIONS: Record<'Faculty' | 'Staff', PersonnelClassification[]> = {
  Faculty: ['Faculty (Teaching - Accreditation Committee)', 'Faculty (Non-Teaching Coordinator)'],
  Staff: ['Staff (Administrative)', 'Staff (Technical)']
};

export function registrationRole(role: string): 'Faculty' | 'Staff' {
  return role === 'Staff' ? 'Staff' : 'Faculty';
}

export function classificationsForRole(role: string): PersonnelClassification[] {
  return ROLE_CLASSIFICATIONS[registrationRole(role)];
}

export function isEmployeeId(value: string): boolean {
  return EMPLOYEE_ID_PATTERN.test(value.trim());
}

export function isKnownCampus(campusId: string): boolean {
  return campuses.some((campus) => campus.id === campusId);
}

export function isFinalizedOffice(value: string): boolean {
  const office = value.trim();
  return office.length > 0 && office !== SIGNUP_OFFICE_PLACEHOLDER;
}

export function isRoleClassification(role: string, classification: string): boolean {
  return classificationsForRole(role).includes(classification as PersonnelClassification);
}
