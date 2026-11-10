import { useCallback, useSyncExternalStore } from 'react';
import type { PortalUser } from '../types/user';

export interface ProfileDetails {
  firstName: string;
  lastName: string;
  dob: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  postalCode: string;
  /** Square JPEG data URL, or null to show initials. */
  avatar: string | null;
}

const storageKey = (userId: string) => `accrevia_profile_${userId}`;
const cache = new Map<string, ProfileDetails>();
const listeners = new Set<() => void>();

function defaultsFor(user: PortalUser): ProfileDetails {
  const parts = user.name.trim().split(/\s+/);
  const lastName = parts.length > 1 ? parts.pop() ?? '' : '';
  return {
    firstName: parts.join(' '),
    lastName,
    dob: '',
    email: user.email,
    phone: '+63 917 555 0142',
    country: 'Philippines',
    city: 'Tandag City, Surigao del Sur',
    postalCode: '8300',
    avatar: null,
  };
}

function read(user: PortalUser): ProfileDetails {
  const cached = cache.get(user.id);
  if (cached) return cached;
  let stored: Partial<ProfileDetails> = {};
  try {
    stored = JSON.parse(localStorage.getItem(storageKey(user.id)) ?? '{}');
  } catch {
    stored = {};
  }
  const profile = { ...defaultsFor(user), ...stored };
  cache.set(user.id, profile);
  return profile;
}

function write(userId: string, profile: ProfileDetails) {
  cache.set(userId, profile);
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(profile));
  } catch {
    // Storage quota (e.g. a large avatar) — keep the in-memory value for this session.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useProfile(user: PortalUser) {
  const profile = useSyncExternalStore(subscribe, () => read(user));
  const saveProfile = useCallback(
    (patch: Partial<ProfileDetails>) => write(user.id, { ...read(user), ...patch }),
    [user],
  );
  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || user.name;
  return { profile, fullName, saveProfile };
}

/** Center-crops an image file to a square and scales it down to `size` pixels. */
export function resizeAvatar(file: File, size = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const side = Math.min(img.width, img.height);
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('Canvas is not supported'));
        return;
      }
      ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read image'));
    };
    img.src = url;
  });
}
