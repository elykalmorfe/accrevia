/**
 * Thin HTTP client for the Django document-intelligence API.
 * When VITE_API_BASE_URL is unset or health fails, callers should use local fallbacks.
 */

const DEFAULT_TIMEOUT_MS = 12_000;

export function getApiBaseUrl(): string {
  const raw = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ?? '';
  if (raw && typeof window !== 'undefined') {
    const url = new URL(raw, window.location.origin);
    if (['localhost', '127.0.0.1'].includes(url.hostname) && ['localhost', '127.0.0.1'].includes(window.location.hostname)) {
      url.hostname = window.location.hostname;
      return url.href.replace(/\/$/, '');
    }
  }
  return raw.replace(/\/$/, '');
}

let csrfToken: string | undefined;
let csrfRequest: Promise<string> | undefined;

async function getCsrfToken(): Promise<string> {
  if (csrfToken) return csrfToken;
  csrfRequest ??= (async () => {
    const response = await fetch(`${getApiBaseUrl()}/api/accounts/session/`, { credentials: 'include', signal: AbortSignal.timeout(4000) });
    if (!response.ok) throw new Error('The authentication server is unavailable.');
    const body = await response.json();
    if (!body.csrfToken) throw new Error('The authentication server did not provide CSRF protection.');
    csrfToken = body.csrfToken;
    return csrfToken!;
  })().finally(() => { csrfRequest = undefined; });
  return csrfRequest;
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
    const headers = new Headers(init.headers);
    if (!['GET', 'HEAD', 'OPTIONS'].includes((init.method || 'GET').toUpperCase())) headers.set('X-CSRFToken', await getCsrfToken());
    return await fetch(url, { ...init, headers, credentials: 'include', signal: init.signal ?? controller.signal });
  } finally {
    window.clearTimeout(timer);
  }
}
