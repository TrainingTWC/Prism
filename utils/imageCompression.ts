/**
 * Client-side image compression for checklist photo uploads.
 *
 * Why this exists:
 *   - Google Apps Script web apps cap a single POST body around ~10 MB total,
 *     and base64-encoding inflates raw image bytes by ~33%. A handful of full-
 *     resolution phone photos are enough to cross that limit, which previously
 *     caused QAChecklist to silently drop ALL images on submit.
 *   - Compressing to <= 500 KB per image at <= 1280 px on the long edge keeps
 *     visual quality acceptable for audit evidence while ensuring the entire
 *     submission fits in a single POST.
 *
 * Public API:
 *   compressImage(input, opts?)        -> Promise<string>  (base64 data URL)
 *   compressImageMap(map, opts?)       -> Promise<Record<string, string[]>>
 *   estimateBase64Bytes(dataUrl)       -> number
 */

export interface CompressOptions {
  /** Max width OR height in pixels. Default 1280. */
  maxDimension?: number;
  /** Initial JPEG quality (0..1). Default 0.75. */
  quality?: number;
  /** Hard cap per image in bytes. Default 500 KB. Will iteratively re-encode at lower quality if exceeded. */
  maxBytes?: number;
  /** Output mime. Default 'image/jpeg'. */
  mimeType?: 'image/jpeg' | 'image/webp';
}

const DEFAULTS: Required<CompressOptions> = {
  maxDimension: 1280,
  quality: 0.75,
  maxBytes: 500 * 1024,
  mimeType: 'image/jpeg',
};

/**
 * Estimate the decoded byte size of a data: URL.
 */
export function estimateBase64Bytes(dataUrl: string): number {
  if (!dataUrl) return 0;
  const comma = dataUrl.indexOf(',');
  const base64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  // base64 length * 0.75 = decoded bytes (minus padding)
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

function fileToDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Compress one image. Accepts a File/Blob or an existing base64 data URL.
 * Returns a base64 data URL guaranteed to be <= maxBytes (best-effort).
 *
 * If the input is already a small data URL, it is returned unchanged.
 */
export async function compressImage(
  input: File | Blob | string,
  opts: CompressOptions = {}
): Promise<string> {
  const o = { ...DEFAULTS, ...opts };
  let dataUrl: string;
  if (typeof input === 'string') {
    // Already a data URL — bail out cheaply if it's already small enough.
    if (input.startsWith('data:') && estimateBase64Bytes(input) <= o.maxBytes) {
      return input;
    }
    dataUrl = input;
  } else {
    dataUrl = await fileToDataUrl(input);
  }

  let img: HTMLImageElement;
  try {
    img = await loadImage(dataUrl);
  } catch {
    // Could not decode — return as-is rather than failing the whole submission.
    return typeof input === 'string' ? input : dataUrl;
  }

  // Compute target dimensions preserving aspect ratio.
  const longEdge = Math.max(img.width, img.height);
  const scale = longEdge > o.maxDimension ? o.maxDimension / longEdge : 1;
  const targetW = Math.max(1, Math.round(img.width * scale));
  const targetH = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;

  // White matte for JPEG transparency safety.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, targetW, targetH);
  ctx.drawImage(img, 0, 0, targetW, targetH);

  // Iteratively reduce quality until under the byte budget.
  let quality = o.quality;
  let out = canvas.toDataURL(o.mimeType, quality);
  let attempts = 0;
  while (estimateBase64Bytes(out) > o.maxBytes && quality > 0.35 && attempts < 6) {
    quality -= 0.1;
    out = canvas.toDataURL(o.mimeType, quality);
    attempts++;
  }

  // If still oversized, downscale the canvas in 80% steps.
  if (estimateBase64Bytes(out) > o.maxBytes) {
    let w = targetW;
    let h = targetH;
    let safetyHops = 0;
    while (estimateBase64Bytes(out) > o.maxBytes && safetyHops < 4) {
      w = Math.max(1, Math.round(w * 0.8));
      h = Math.max(1, Math.round(h * 0.8));
      const c2 = document.createElement('canvas');
      c2.width = w;
      c2.height = h;
      const cx = c2.getContext('2d');
      if (!cx) break;
      cx.fillStyle = '#ffffff';
      cx.fillRect(0, 0, w, h);
      cx.drawImage(img, 0, 0, w, h);
      out = c2.toDataURL(o.mimeType, Math.max(0.5, quality));
      safetyHops++;
    }
  }

  return out;
}

/**
 * Compress every image in a question/section -> images[] map.
 * Resilient: if one image fails, it is kept as-is rather than dropped.
 */
export async function compressImageMap(
  map: Record<string, string[]> | undefined | null,
  opts: CompressOptions = {}
): Promise<Record<string, string[]>> {
  if (!map) return {};
  const out: Record<string, string[]> = {};
  for (const [k, arr] of Object.entries(map)) {
    if (!Array.isArray(arr) || arr.length === 0) {
      out[k] = [];
      continue;
    }
    const compressed: string[] = [];
    for (const img of arr) {
      if (!img) continue;
      try {
        compressed.push(await compressImage(img, opts));
      } catch {
        compressed.push(img);
      }
    }
    out[k] = compressed;
  }
  return out;
}

/**
 * Total estimated byte size of a stringified image map.
 */
export function imageMapByteSize(map: Record<string, string[]> | undefined | null): number {
  if (!map) return 0;
  let n = 0;
  for (const arr of Object.values(map)) {
    if (!Array.isArray(arr)) continue;
    for (const img of arr) n += estimateBase64Bytes(img);
  }
  return n;
}
