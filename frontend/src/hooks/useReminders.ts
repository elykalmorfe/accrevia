import { useCallback, useMemo, useState } from 'react';
import { usePortal } from '../contexts/PortalContext';
import { usePortalSettings } from '../settings/portalSettings';
import { EvidenceFolder } from '../types/evidence';
import { getExpiryInfo, parseAccreditationDate } from '../utils/programAccreditation';
import { pluralize } from '../utils/format';

export interface PortalReminder {
  id: string;
  title: string;
  detail: string;
  to: string;
  time: string;
}

const DISMISSED_KEY = 'accrevia_dismissed_reminders';
const DAY_MS = 24 * 60 * 60 * 1000;

function loadDismissed(): string[] {
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]');
  } catch {
    return [];
  }
}

function folderLink(folder: EvidenceFolder): string {
  if (folder.frameworkId === 'ia') return '/frameworks/ia';
  if (folder.frameworkId === 'pa') return '/frameworks/pa';
  return `/evidence/upload?folder=${folder.id}`;
}

/** Deadline and expiry reminders derived from portal records (Settings → Deadlines & Reminders). */
export function useReminders() {
  const { folders, programAccreditations, iaRecords, campuses } = usePortal();
  const { reminders } = usePortalSettings();
  const [dismissed, setDismissed] = useState<string[]>(loadDismissed);

  const all = useMemo<PortalReminder[]>(() => {
    if (!reminders.enabled) return [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const out: PortalReminder[] = [];

    for (const folder of folders) {
      if (folder.hasNoDeadline || !folder.expiredDate) continue;
      const end = parseAccreditationDate(folder.expiredDate);
      if (!end) continue;
      const days = Math.round((end.getTime() - today.getTime()) / DAY_MS);
      if (days > reminders.folderDeadlineDays) continue;
      out.push({
        id: `rem-folder-${folder.id}-${folder.expiredDate}`,
        title: days < 0 ? `Deadline passed: ${folder.name}` : `Folder due ${days === 0 ? 'today' : `in ${pluralize(days, 'day')}`}: ${folder.name}`,
        detail: [folder.campus, `Deadline ${folder.expiredDate}`].filter(Boolean).join(' · '),
        to: folderLink(folder),
        time: days < 0 ? `${pluralize(-days, 'day')} overdue` : 'Folder deadline'
      });
    }

    for (const rec of iaRecords) {
      const info = getExpiryInfo(rec);
      if (info.state !== 'expiring' && info.state !== 'expired') continue;
      const campus = campuses.find((c) => c.id === rec.campusId)?.name ?? rec.campusId;
      out.push({
        id: `rem-ia-${rec.campusId}-${rec.validityEnd}-${info.state}`,
        title: info.state === 'expired' ? `${campus}: institutional accreditation expired` : `${campus}: institutional accreditation expiring soon`,
        detail: `Validity ends ${rec.validityEnd}.`,
        to: '/frameworks/ia',
        time: 'Institutional accreditation'
      });
    }

    const expiring = programAccreditations.filter((p) => getExpiryInfo(p).state === 'expiring');
    const expired = programAccreditations.filter((p) => getExpiryInfo(p).state === 'expired');
    if (expiring.length > 0) {
      const next = [...expiring].sort(
        (a, b) => (parseAccreditationDate(a.validityEnd)?.getTime() ?? 0) - (parseAccreditationDate(b.validityEnd)?.getTime() ?? 0)
      )[0];
      out.push({
        id: `rem-pa-expiring-${expiring.length}-${reminders.expiryWarningMonths}`,
        title: `${pluralize(expiring.length, 'program accreditation')} expiring within ${reminders.expiryWarningMonths} months`,
        detail: `Next: ${next.programName} (${next.campusName}) on ${next.validityEnd}.`,
        to: '/frameworks/pa',
        time: 'Program accreditation'
      });
    }
    if (expired.length > 0) {
      out.push({
        id: `rem-pa-expired-${expired.length}`,
        title: `${pluralize(expired.length, 'program accreditation')} past validity`,
        detail: 'Schedule a re-survey or record the latest result.',
        to: '/frameworks/pa',
        time: 'Program accreditation'
      });
    }

    return out;
  }, [folders, programAccreditations, iaRecords, campuses, reminders]);

  const visible = useMemo(() => all.filter((r) => !dismissed.includes(r.id)), [all, dismissed]);

  const dismissReminder = useCallback((id: string) => {
    setDismissed((prev) => {
      const next = [...prev, id].slice(-200);
      try {
        localStorage.setItem(DISMISSED_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage quota errors
      }
      return next;
    });
  }, []);

  return { reminders: visible, dismissReminder };
}
