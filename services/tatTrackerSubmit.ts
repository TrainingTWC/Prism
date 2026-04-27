/**
 * TAT Tracker submission client.
 *
 * Mirrors `trainingAuditSubmit.ts`:
 *   - Idempotency key (`vacancyId` UUID)
 *   - AbortController timeout
 *   - Exponential-backoff retry (3 attempts: 0s / 4s / 16s)
 *   - Offline queue in localStorage (auto-flush on reconnect)
 *
 * Endpoint set in `services/tatTrackerData.ts`.
 */

const QUEUE_KEY = 'tat_tracker_queue_v1';
const DEFAULT_TIMEOUT_MS = 60_000;
const MAX_ATTEMPTS = 3;
const BACKOFF_BASE_MS = 4_000;

export interface QueuedTATSubmission {
  vacancyId: string;
  endpoint: string;
  body: Record<string, string>;
  queuedAt: number;
  attempts: number;
}

export interface TATSubmitResult {
  ok: boolean;
  vacancyId: string;
  duplicate?: boolean;
  queued?: boolean;
  error?: string;
  computed?: { positionTime?: number; tatStatus?: string; vacancyStatus?: string };
}

export function generateVacancyId(): string {
  try {
    if (typeof crypto !== 'undefined' && (crypto as any).randomUUID) {
      return (crypto as any).randomUUID();
    }
  } catch {}
  return 'vac-' + Date.now().toString(36) + '-' +
    Math.random().toString(36).slice(2, 10) +
    Math.random().toString(36).slice(2, 6);
}

function readQueue(): QueuedTATSubmission[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function writeQueue(q: QueuedTATSubmission[]): void {
  try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q)); } catch {}
}

export function getPendingTATCount(): number { return readQueue().length; }

function enqueue(item: QueuedTATSubmission): void {
  const q = readQueue();
  if (q.some(i => i.vacancyId === item.vacancyId)) return;
  q.push(item); writeQueue(q);
}

function removeFromQueue(vacancyId: string): void {
  writeQueue(readQueue().filter(i => i.vacancyId !== vacancyId));
}

async function postOnce(endpoint: string, body: Record<string, string>, timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const form = new URLSearchParams(body);
    const resp = await fetch(endpoint, { method: 'POST', body: form, signal: controller.signal });
    let json: any = null;
    try { json = await resp.json(); } catch {}
    return { ok: resp.ok, status: resp.status, json };
  } catch (err: any) {
    return { ok: false, error: err?.name === 'AbortError' ? 'timeout' : (err?.message || 'network') };
  } finally { clearTimeout(timer); }
}

async function submitWithRetry(endpoint: string, body: Record<string, string>, timeoutMs: number) {
  let lastError = '';
  let computed: TATSubmitResult['computed'];
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) {
      await new Promise(r => setTimeout(r, BACKOFF_BASE_MS * Math.pow(2, attempt - 1)));
    }
    const r = await postOnce(endpoint, body, timeoutMs);
    if (r.ok) {
      if (r.json?.status === 'ERROR') {
        lastError = r.json.message || 'server error';
        if (r.json.code === 'LOCK_TIMEOUT') continue;
        return { ok: false, error: lastError, computed };
      }
      return { ok: true, duplicate: !!r.json?.duplicate, computed: r.json?.computed };
    }
    lastError = r.error || ('HTTP ' + (r.status || '?'));
  }
  return { ok: false, error: lastError, computed };
}

export async function submitTATVacancy(
  endpoint: string,
  body: Record<string, string>,
  opts: { timeoutMs?: number } = {}
): Promise<TATSubmitResult> {
  const vacancyId = body.vacancyId || generateVacancyId();
  const payload = { ...body, vacancyId };
  const online = typeof navigator === 'undefined' ? true : navigator.onLine !== false;
  if (!online) {
    enqueue({ vacancyId, endpoint, body: payload, queuedAt: Date.now(), attempts: 0 });
    return { ok: false, vacancyId, queued: true, error: 'offline' };
  }
  const r = await submitWithRetry(endpoint, payload, opts.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  if (r.ok) {
    removeFromQueue(vacancyId);
    return { ok: true, vacancyId, duplicate: r.duplicate, computed: r.computed };
  }
  enqueue({ vacancyId, endpoint, body: payload, queuedAt: Date.now(), attempts: MAX_ATTEMPTS });
  return { ok: false, vacancyId, queued: true, error: r.error };
}

export async function deleteTATVacancy(endpoint: string, vacancyId: string): Promise<TATSubmitResult> {
  return submitTATVacancy(endpoint, { vacancyId, action: 'delete' });
}

let flushing = false;
export async function flushTATQueue(): Promise<{ flushed: number; remaining: number }> {
  if (flushing) return { flushed: 0, remaining: readQueue().length };
  flushing = true;
  let flushed = 0;
  try {
    const q = readQueue();
    for (const item of q) {
      const online = typeof navigator === 'undefined' ? true : navigator.onLine !== false;
      if (!online) break;
      const r = await submitWithRetry(item.endpoint, item.body, DEFAULT_TIMEOUT_MS);
      if (r.ok) { removeFromQueue(item.vacancyId); flushed++; } else break;
    }
  } finally { flushing = false; }
  return { flushed, remaining: readQueue().length };
}

let listenersRegistered = false;
export function registerTATQueueListeners(): void {
  if (listenersRegistered || typeof window === 'undefined') return;
  listenersRegistered = true;
  window.addEventListener('online', () => { flushTATQueue(); });
  setTimeout(() => { flushTATQueue(); }, 5_000);
  setInterval(() => { flushTATQueue(); }, 120_000);
}
