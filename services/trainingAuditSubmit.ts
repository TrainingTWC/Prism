/**
 * Training Audit submission client with:
 *   - Idempotency key (submissionId — UUID per audit)
 *   - AbortController timeout
 *   - Exponential-backoff retry
 *   - Offline queue in localStorage (auto-flush on reconnect)
 *
 * Usage:
 *   import { submitTrainingAudit, flushTrainingQueue, getPendingTrainingCount }
 *     from './trainingAuditSubmit';
 *
 *   const { ok, submissionId, duplicate, queued } =
 *     await submitTrainingAudit(endpoint, formData);
 */

const QUEUE_KEY = 'training_audit_queue_v1';
const DEFAULT_TIMEOUT_MS = 90_000;       // 90s — cold-start + 10K-row append
const MAX_ATTEMPTS = 3;                  // 3 attempts: 0s, 4s, 16s
const BACKOFF_BASE_MS = 4_000;

export interface QueuedSubmission {
  submissionId: string;
  endpoint: string;
  body: Record<string, string>;          // URLSearchParams entries
  queuedAt: number;
  attempts: number;
}

export interface SubmitResult {
  ok: boolean;
  submissionId: string;
  duplicate?: boolean;
  queued?: boolean;           // true if we couldn't reach server and put it in the queue
  error?: string;
}

// ---- UUID (crypto.randomUUID on modern browsers, fallback otherwise) ----
export function generateSubmissionId(): string {
  try {
    if (typeof crypto !== 'undefined' && (crypto as any).randomUUID) {
      return (crypto as any).randomUUID();
    }
  } catch {}
  return 'sub-' + Date.now().toString(36) + '-' +
    Math.random().toString(36).slice(2, 10) +
    Math.random().toString(36).slice(2, 6);
}

// ---- Queue persistence ----
function readQueue(): QueuedSubmission[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(q: QueuedSubmission[]): void {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
  } catch (e) {
    // localStorage may be full (unlikely with URLs-only payloads after Drive migration)
    console.error('[TrainingQueue] persist failed', e);
  }
}

export function getPendingTrainingCount(): number {
  return readQueue().length;
}

function enqueue(item: QueuedSubmission): void {
  const q = readQueue();
  // Dedupe by submissionId (never enqueue the same audit twice)
  if (q.some(i => i.submissionId === item.submissionId)) return;
  q.push(item);
  writeQueue(q);
}

function removeFromQueue(submissionId: string): void {
  writeQueue(readQueue().filter(i => i.submissionId !== submissionId));
}

// ---- Low-level POST with timeout ----
async function postOnce(
  endpoint: string,
  body: Record<string, string>,
  timeoutMs: number
): Promise<{ ok: boolean; status?: number; json?: any; error?: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const form = new URLSearchParams(body);
    const resp = await fetch(endpoint, {
      method: 'POST',
      body: form,
      signal: controller.signal,
    });
    let json: any = null;
    try { json = await resp.json(); } catch {}
    return { ok: resp.ok, status: resp.status, json };
  } catch (err: any) {
    const aborted = err?.name === 'AbortError';
    return { ok: false, error: aborted ? 'timeout' : (err?.message || 'network') };
  } finally {
    clearTimeout(timer);
  }
}

// ---- Retry wrapper ----
async function submitWithRetry(
  endpoint: string,
  body: Record<string, string>,
  timeoutMs: number
): Promise<{ ok: boolean; duplicate?: boolean; error?: string }> {
  let lastError = '';
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) {
      const delay = BACKOFF_BASE_MS * Math.pow(2, attempt - 1);
      await new Promise(r => setTimeout(r, delay));
    }
    const r = await postOnce(endpoint, body, timeoutMs);
    if (r.ok) {
      // Apps Script returns 200 even on its internal {status:'ERROR'}; inspect json.
      if (r.json && r.json.status === 'ERROR') {
        lastError = r.json.message || 'server error';
        // Lock-timeout / transient server errors are worth retrying
        if (r.json.code === 'LOCK_TIMEOUT') continue;
        return { ok: false, error: lastError };
      }
      return { ok: true, duplicate: !!(r.json && r.json.duplicate) };
    }
    lastError = r.error || ('HTTP ' + (r.status || '?'));
  }
  return { ok: false, error: lastError };
}

// ---- Public API ----
export async function submitTrainingAudit(
  endpoint: string,
  body: Record<string, string>,
  opts: { timeoutMs?: number } = {}
): Promise<SubmitResult> {
  const submissionId = body.submissionId || generateSubmissionId();
  const payload = { ...body, submissionId };

  const online = typeof navigator === 'undefined' ? true : navigator.onLine !== false;
  if (!online) {
    enqueue({
      submissionId, endpoint, body: payload,
      queuedAt: Date.now(), attempts: 0,
    });
    return { ok: false, submissionId, queued: true, error: 'offline' };
  }

  const r = await submitWithRetry(endpoint, payload, opts.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  if (r.ok) {
    removeFromQueue(submissionId);
    return { ok: true, submissionId, duplicate: r.duplicate };
  }

  // All retries failed → queue for later
  enqueue({
    submissionId, endpoint, body: payload,
    queuedAt: Date.now(), attempts: MAX_ATTEMPTS,
  });
  return { ok: false, submissionId, queued: true, error: r.error };
}

// ---- Background flusher ----
let flushing = false;

export async function flushTrainingQueue(): Promise<{ flushed: number; remaining: number }> {
  if (flushing) return { flushed: 0, remaining: readQueue().length };
  flushing = true;
  let flushed = 0;
  try {
    const queue = readQueue();
    for (const item of queue) {
      const online = typeof navigator === 'undefined' ? true : navigator.onLine !== false;
      if (!online) break;
      const r = await submitWithRetry(item.endpoint, item.body, DEFAULT_TIMEOUT_MS);
      if (r.ok) {
        removeFromQueue(item.submissionId);
        flushed++;
      } else {
        // Stop on first failure; we'll retry on next trigger.
        break;
      }
    }
  } finally {
    flushing = false;
  }
  return { flushed, remaining: readQueue().length };
}

// Auto-register listeners once per page load.
let listenersRegistered = false;
export function registerTrainingQueueListeners(): void {
  if (listenersRegistered || typeof window === 'undefined') return;
  listenersRegistered = true;
  window.addEventListener('online', () => { flushTrainingQueue(); });
  // Also try on page load and every 2 minutes.
  setTimeout(() => { flushTrainingQueue(); }, 5_000);
  setInterval(() => { flushTrainingQueue(); }, 120_000);
}
