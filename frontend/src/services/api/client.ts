/**
 * Thin HTTP client for the Django document-intelligence API.
 * When VITE_API_BASE_URL is unset or health fails, callers should use local fallbacks.
 */

const DEFAULT_TIMEOUT_MS = 12_000;

export function getApiBaseUrl(): string {
  const raw = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ?? '';
  return raw.replace(/\/$/, '');
}

export function isApiConfigured(): boolean {
  return Boolean(getApiBaseUrl());
}

let cachedHealth: { ok: boolean; checkedAt: number } | null = null;
const HEALTH_TTL_MS = 15_000;

export async function checkApiHealth(force = false): Promise<boolean> {
  const base = getApiBaseUrl();
  if (!base) return false;
  const now = Date.now();
  if (!force && cachedHealth && now - cachedHealth.checkedAt < HEALTH_TTL_MS) {
    return cachedHealth.ok;
  }
  try {
    const res = await fetch(`${base}/api/health/`, {
      method: 'GET',
      signal: AbortSignal.timeout(4000)
    });
    const ok = res.ok;
    cachedHealth = { ok, checkedAt: now };
    return ok;
  } catch {
    cachedHealth = { ok: false, checkedAt: now };
    return false;
  }
}

export async function apiFetch(path: string, init: RequestInit = {}, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<Response> {
  const base = getApiBaseUrl();
  if (!base) throw new Error('API base URL is not configured.');
  const url = path.startsWith('http') ? path : `${base}${path.startsWith('/') ? '' : '/'}${path}`;
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: init.signal ?? controller.signal });
  } finally {
    window.clearTimeout(timer);
  }
}