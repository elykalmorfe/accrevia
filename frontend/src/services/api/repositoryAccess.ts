import { useSyncExternalStore } from 'react';
import { useSessionAccount } from '../../utils/auth';

export type AreaScope = {campus: string; framework: string; area: string; program?: string};
export type AccessLevel = 'none' | 'viewer' | 'editor';
export type AreaAssignment = AreaScope & {level: AccessLevel};
type AccessState = {assignments: AreaAssignment[]; officialAreas: {framework: string; code: string; name: string; position: number}[]};
let state: AccessState = {assignments: [], officialAreas: []};
const listeners = new Set<() => void>();
let certificateAccount='';
const revokedCertificates=new Set<string>();
export function setCertificateVisibility(accountId:string,visibleIds:string[],previousIds:string[]){
  if(certificateAccount!==accountId){certificateAccount=accountId;revokedCertificates.clear();}
  const visible=new Set(visibleIds);
  previousIds.forEach(id=>{if(!visible.has(id))revokedCertificates.add(id);});
  visibleIds.forEach(id=>revokedCertificates.delete(id));
}
export const isRevokedCertificate=(id:string)=>revokedCertificates.has(id);
export function setRepositoryAccess(value?: AccessState) {
  state = value || {assignments: [], officialAreas: []};
  listeners.forEach(listener => listener());
}
export function useAreaAccess() {
  const session = useSessionAccount();
  const access = useSyncExternalStore(callback => {listeners.add(callback); return () => {listeners.delete(callback);};}, () => state);
  const member = session?.role === 'Faculty' || session?.role === 'Staff';
  const level = (scope: AreaScope): AccessLevel => {
    if (!session) return 'none';
    if (!member) return ['Superadmin', 'Administrator'].includes(session.role) ? 'editor' : 'viewer';
    return access.assignments.find(a => a.campus === scope.campus && a.framework === scope.framework &&
      a.area.toLowerCase() === scope.area.toLowerCase() && (a.program || '') === (scope.program || ''))?.level || 'none';
  };
  return {level, member, isSuperadmin: session?.role === 'Superadmin', assignments: access.assignments,
    officialAreas: access.officialAreas, canView: (scope: AreaScope) => level(scope) !== 'none',
    canEdit: (scope: AreaScope) => level(scope) === 'editor'};
}
