/**
 * IndexedDB-backed image draft store for checklist photo uploads.
 *
 * Why this exists:
 *   - localStorage is hard-capped at ~5–10 MB by browsers. A QA Store audit can
 *     accumulate up to 230 photos (115 questions × 2). Even at aggressive
 *     compression that easily blows past the localStorage budget and triggers
 *     "Storage limit reached" alerts mid-audit.
 *   - IndexedDB provides effectively unlimited storage (typically 50% of free
 *     disk on modern browsers) and is async, so it doesn't block the UI thread.
 *
 * Public API:
 *   saveImages(key, map)     -> Promise<void>
 *   loadImages(key)          -> Promise<Record<string, string[]>>
 *   removeImages(key)        -> Promise<void>
 *   estimateSize(map)        -> number    (bytes, base64-decoded)
 *
 * Each entry stores a `Record<questionId, string[]>` of base64 data URLs.
 * Falls back gracefully if IndexedDB is unavailable (private mode, etc.).
 */

const DB_NAME = 'prism_image_store';
const STORE = 'images';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not available'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  // If open fails, allow a future retry.
  dbPromise.catch(() => { dbPromise = null; });
  return dbPromise;
}

export async function saveImages(
  key: string,
  map: Record<string, string[]>
): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(map, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } catch (err) {
    // Last-resort: try localStorage so a tiny draft still persists.
    try {
      localStorage.setItem(key, JSON.stringify(map));
    } catch { /* swallow */ }
    throw err;
  }
}

export async function loadImages(
  key: string
): Promise<Record<string, string[]>> {
  try {
    const db = await openDb();
    const result = await new Promise<unknown>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    if (result && typeof result === 'object') {
      return result as Record<string, string[]>;
    }
  } catch { /* fall through to localStorage */ }
  // Migration / fallback path.
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {};
}

export async function removeImages(key: string): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch { /* ignore */ }
  try { localStorage.removeItem(key); } catch { /* ignore */ }
}

/** Decoded byte size of a base64 image map. */
export function estimateSize(map: Record<string, string[]> | null | undefined): number {
  if (!map) return 0;
  let n = 0;
  for (const arr of Object.values(map)) {
    if (!Array.isArray(arr)) continue;
    for (const s of arr) {
      if (!s) continue;
      const comma = s.indexOf(',');
      const b64 = comma >= 0 ? s.slice(comma + 1) : s;
      const padding = b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0;
      n += Math.floor((b64.length * 3) / 4) - padding;
    }
  }
  return n;
}
