/**
 * Real Offline Download Engine, Phone Gallery Exporter, and Real Device Storage Reader.
 * - Stores real video Blob binaries in IndexedDB for genuine offline playback (even in Airplane Mode).
 * - Saves real .mp4 video files into phone storage / Gallery (Android MediaStore Downloads & iOS Photos Share Sheet).
 * - Reads real phone storage quota and usage via navigator.storage.estimate() + exact IndexedDB byte totals.
 */

const DB_NAME = 'moviekart_offline_media_v1';
const DB_VERSION = 1;
const BLOBS_STORE = 'video_blobs';
const META_STORE = 'video_meta';

export interface OfflineVideoMeta {
  id: string;
  sizeBytes: number;
  mimeType: string;
  fileName: string;
  savedAt: number;
}

export interface OfflineVideoRecord extends OfflineVideoMeta {
  blob: Blob;
}

export interface RealDeviceStorageInfo {
  /** Exact bytes used by MovieKart offline videos stored in IndexedDB */
  moviesBytes: number;
  /** Number of real offline video files currently stored on this device */
  moviesCount: number;
  /** Total bytes reported by navigator.storage.estimate().usage */
  appUsageBytes: number;
  /** Real storage quota reported by the phone's browser/OS in bytes */
  deviceQuotaBytes: number;
  /** Remaining free space available to the app on the phone */
  availableBytes: number;
  /** Percentage of phone quota currently used (0-100) */
  percentUsed: number;
  /** Whether the browser granted persistent storage protection */
  isPersisted: boolean;
  /** Whether navigator.storage.estimate() is supported on this device */
  estimateSupported: boolean;
  /** Timestamp of the last real storage measurement */
  measuredAt: number;
}

export interface DownloadProgressInfo {
  downloadedBytes: number;
  totalBytes: number | null;
  progress: number;
  speedMbps: number;
}

export interface RealDownloadResult {
  blob: Blob;
  sizeBytes: number;
  mimeType: string;
  fileName: string;
}

export function formatBytes(bytes?: number | null): string {
  if (!bytes || !Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unitIdx = 0;
  while (value >= 1024 && unitIdx < units.length - 1) {
    value /= 1024;
    unitIdx++;
  }
  if (unitIdx === 0) return `${Math.round(value)} B`;
  if (unitIdx === 1) return `${Math.round(value)} KB`;
  return `${value >= 100 ? value.toFixed(0) : value >= 10 ? value.toFixed(1) : value.toFixed(2)} ${units[unitIdx]}`;
}

export function buildSafeVideoFileName(title: string, mimeType = 'video/mp4'): string {
  const cleanBase = (title || 'MovieKart_Video')
    .replace(/[^a-zA-Z0-9\s_-]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 64) || 'MovieKart_Video';

  let ext = 'mp4';
  const lowerMime = mimeType.toLowerCase();
  if (lowerMime.includes('webm')) ext = 'webm';
  else if (lowerMime.includes('quicktime') || lowerMime.includes('mov')) ext = 'mov';
  else if (lowerMime.includes('x-matroska') || lowerMime.includes('mkv')) ext = 'mkv';

  return `MovieKart_${cleanBase}.${ext}`;
}

function openOfflineDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('Offline storage (IndexedDB) is not available on this device.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(BLOBS_STORE)) {
        db.createObjectStore(BLOBS_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open offline storage.'));
  });
}

export async function saveOfflineVideoBlob(record: OfflineVideoRecord): Promise<void> {
  const db = await openOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([BLOBS_STORE, META_STORE], 'readwrite');
    tx.objectStore(BLOBS_STORE).put({ id: record.id, blob: record.blob });
    const meta: OfflineVideoMeta = {
      id: record.id,
      sizeBytes: record.sizeBytes,
      mimeType: record.mimeType,
      fileName: record.fileName,
      savedAt: record.savedAt
    };
    tx.objectStore(META_STORE).put(meta);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error || new Error('Failed to write video to phone storage.'));
    };
    tx.onabort = () => {
      db.close();
      reject(tx.error || new Error('Storage write aborted (device storage may be full).'));
    };
  });
}

export async function getOfflineVideoRecord(id: string): Promise<OfflineVideoRecord | null> {
  try {
    const db = await openOfflineDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction([BLOBS_STORE, META_STORE], 'readonly');
      const blobReq = tx.objectStore(BLOBS_STORE).get(id);
      const metaReq = tx.objectStore(META_STORE).get(id);

      let blobResult: { id: string; blob: Blob } | undefined;
      let metaResult: OfflineVideoMeta | undefined;

      blobReq.onsuccess = () => {
        blobResult = blobReq.result;
      };
      metaReq.onsuccess = () => {
        metaResult = metaReq.result;
      };

      tx.oncomplete = () => {
        db.close();
        if (!blobResult?.blob) {
          resolve(null);
          return;
        }
        resolve({
          id,
          blob: blobResult.blob,
          sizeBytes: metaResult?.sizeBytes || blobResult.blob.size,
          mimeType: metaResult?.mimeType || blobResult.blob.type || 'video/mp4',
          fileName: metaResult?.fileName || buildSafeVideoFileName(id, blobResult.blob.type),
          savedAt: metaResult?.savedAt || Date.now()
        });
      };

      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  } catch {
    return null;
  }
}

export async function getAllOfflineVideoMeta(): Promise<Record<string, OfflineVideoMeta>> {
  try {
    const db = await openOfflineDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction([META_STORE], 'readonly');
      const req = tx.objectStore(META_STORE).getAll();
      req.onsuccess = () => {
        const list = (req.result || []) as OfflineVideoMeta[];
        const map: Record<string, OfflineVideoMeta> = {};
        for (const item of list) {
          if (item?.id) map[item.id] = item;
        }
        db.close();
        resolve(map);
      };
      req.onerror = () => {
        db.close();
        reject(req.error);
      };
    });
  } catch {
    return {};
  }
}

export async function deleteOfflineVideoBlob(id: string): Promise<void> {
  try {
    const db = await openOfflineDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction([BLOBS_STORE, META_STORE], 'readwrite');
      tx.objectStore(BLOBS_STORE).delete(id);
      tx.objectStore(META_STORE).delete(id);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  } catch {
    // ignore if db not created yet
  }
}

export async function clearAllOfflineVideoBlobs(): Promise<void> {
  try {
    const db = await openOfflineDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction([BLOBS_STORE, META_STORE], 'readwrite');
      tx.objectStore(BLOBS_STORE).clear();
      tx.objectStore(META_STORE).clear();
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  } catch {
    // ignore
  }
}

export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.storage?.persist) {
      return await navigator.storage.persist();
    }
  } catch {
    // ignore
  }
  return false;
}

export async function getRealDeviceStorageInfo(): Promise<RealDeviceStorageInfo> {
  const metaMap = await getAllOfflineVideoMeta();
  const entries = Object.values(metaMap);
  const moviesBytes = entries.reduce((sum, item) => sum + Math.max(0, item.sizeBytes || 0), 0);
  const moviesCount = entries.length;

  let appUsageBytes = moviesBytes;
  let deviceQuotaBytes = 0;
  let estimateSupported = false;
  let isPersisted = false;

  if (typeof navigator !== 'undefined' && navigator.storage) {
    try {
      if (typeof navigator.storage.persisted === 'function') {
        isPersisted = await navigator.storage.persisted();
      }
    } catch {
      // ignore
    }

    try {
      if (typeof navigator.storage.estimate === 'function') {
        const estimate = await navigator.storage.estimate();
        estimateSupported = true;
        if (typeof estimate.usage === 'number' && Number.isFinite(estimate.usage)) {
          appUsageBytes = Math.max(estimate.usage, moviesBytes);
        }
        if (typeof estimate.quota === 'number' && Number.isFinite(estimate.quota) && estimate.quota > 0) {
          deviceQuotaBytes = estimate.quota;
        }
      }
    } catch {
      // ignore
    }
  }

  const availableBytes = deviceQuotaBytes > 0 ? Math.max(0, deviceQuotaBytes - appUsageBytes) : 0;
  const percentUsed =
    deviceQuotaBytes > 0
      ? Math.min(100, Number(((appUsageBytes / deviceQuotaBytes) * 100).toFixed(2)))
      : 0;

  return {
    moviesBytes,
    moviesCount,
    appUsageBytes,
    deviceQuotaBytes,
    availableBytes,
    percentUsed,
    isPersisted,
    estimateSupported,
    measuredAt: Date.now()
  };
}

/**
 * Normalize a direct downloadable URL (including Google Drive share/preview links).
 */
export function resolveDownloadableVideoUrl(rawUrl: string): {
  url: string;
  isYouTube: boolean;
  preferProxy: boolean;
} {
  let trimmed = (rawUrl || '').trim();
  if (trimmed && !/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }

  const lower = trimmed.toLowerCase();
  const isYouTube =
    lower.includes('youtube.com/') ||
    lower.includes('youtu.be/') ||
    lower.includes('youtube-nocookie.com/');

  if (isYouTube) {
    return { url: trimmed, isYouTube: true, preferProxy: false };
  }

  // Convert Google Drive preview/view URLs into direct download URLs
  if (lower.includes('drive.google.com')) {
    const fileMatch = trimmed.match(/drive\.google\.com\/file\/(?:u\/\d+\/)?d\/([^/?#]+)/i);
    const idMatch = trimmed.match(/[?&]id=([^&#]+)/i);
    const fileId = fileMatch?.[1] || idMatch?.[1];
    if (fileId) {
      return {
        url: `https://drive.usercontent.google.com/download?id=${encodeURIComponent(fileId)}&export=download&confirm=t`,
        isYouTube: false,
        preferProxy: true
      };
    }
  }

  return { url: trimmed, isYouTube: false, preferProxy: false };
}

async function fetchVideoStream(
  targetUrl: string,
  fileName: string,
  preferProxy: boolean,
  signal: AbortSignal
): Promise<Response> {
  const proxyUrl = `/api/download/proxy?url=${encodeURIComponent(targetUrl)}&filename=${encodeURIComponent(fileName)}`;

  const tryFetch = async (urlToFetch: string): Promise<Response> => {
    const res = await fetch(urlToFetch, {
      method: 'GET',
      signal,
      cache: 'no-store'
    });
    if (!res.ok) {
      let detail = `HTTP ${res.status}`;
      try {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          const json = await res.json();
          if (json?.error) detail = json.error;
        }
      } catch {
        // ignore
      }
      throw new Error(detail);
    }
    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    if (contentType.includes('text/html')) {
      throw new Error('This video link returned a web page instead of a downloadable video file.');
    }
    return res;
  };

  if (preferProxy) {
    try {
      return await tryFetch(proxyUrl);
    } catch (proxyErr) {
      if (signal.aborted) throw proxyErr;
      // Fallback to direct fetch if backend proxy isn't deployed (e.g. static hosting)
      return await tryFetch(targetUrl);
    }
  }

  try {
    return await tryFetch(targetUrl);
  } catch (directErr) {
    if (signal.aborted) throw directErr;
    // Fallback to backend streaming proxy if direct fetch fails (e.g. CORS on storage bucket)
    return await tryFetch(proxyUrl);
  }
}

/**
 * Downloads the real video file byte-by-byte with live progress and speed telemetry.
 */
export async function downloadVideoWithProgress(params: {
  videoUrl: string;
  title: string;
  signal: AbortSignal;
  onProgress: (info: DownloadProgressInfo) => void;
}): Promise<RealDownloadResult> {
  const { videoUrl, title, signal, onProgress } = params;
  const resolved = resolveDownloadableVideoUrl(videoUrl);

  if (!resolved.url) {
    throw new Error('This movie does not have a valid video file URL.');
  }

  if (resolved.isYouTube) {
    throw new Error('YouTube streams cannot be downloaded directly as offline MP4 files.');
  }

  const initialFileName = buildSafeVideoFileName(title, 'video/mp4');
  const response = await fetchVideoStream(resolved.url, initialFileName, resolved.preferProxy, signal);

  const rawContentType = (response.headers.get('content-type') || 'video/mp4').split(';')[0].trim().toLowerCase();
  const mimeType = rawContentType.startsWith('video/') ? rawContentType : 'video/mp4';
  const fileName = buildSafeVideoFileName(title, mimeType);

  const contentLengthHeader = response.headers.get('content-length');
  const parsedTotal = contentLengthHeader ? Number(contentLengthHeader) : NaN;
  const totalBytes = Number.isFinite(parsedTotal) && parsedTotal > 0 ? parsedTotal : null;

  if (!response.body) {
    const blob = await response.blob();
    const typedBlob = blob.type.startsWith('video/') ? blob : new Blob([blob], { type: mimeType });
    onProgress({
      downloadedBytes: typedBlob.size,
      totalBytes: typedBlob.size,
      progress: 100,
      speedMbps: 0
    });
    return {
      blob: typedBlob,
      sizeBytes: typedBlob.size,
      mimeType,
      fileName
    };
  }

  const reader = response.body.getReader();
  const chunks: BlobPart[] = [];
  let downloadedBytes = 0;
  let lastReportTime = performance.now();
  let lastReportedBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        downloadedBytes += value.byteLength;

        const now = performance.now();
        const elapsedMs = now - lastReportTime;
        if (elapsedMs >= 180) {
          const bytesSince = downloadedBytes - lastReportedBytes;
          const speedMbps = +Math.max(0.1, bytesSince / (elapsedMs / 1000) / (1024 * 1024)).toFixed(1);
          const progress = totalBytes
            ? Math.min(99, Math.max(1, Math.round((downloadedBytes / totalBytes) * 100)))
            : Math.min(95, Math.max(5, Math.round(100 - 100 / (1 + downloadedBytes / (25 * 1024 * 1024)))));

          onProgress({
            downloadedBytes,
            totalBytes,
            progress,
            speedMbps
          });

          lastReportTime = now;
          lastReportedBytes = downloadedBytes;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  const blob = new Blob(chunks, { type: mimeType });
  if (blob.size === 0) {
    throw new Error('Downloaded video file was empty.');
  }

  onProgress({
    downloadedBytes: blob.size,
    totalBytes: blob.size,
    progress: 100,
    speedMbps: 0
  });

  return {
    blob,
    sizeBytes: blob.size,
    mimeType,
    fileName
  };
}

/**
 * Triggers a standard browser .mp4 file save (lands in Android Downloads -> auto-indexed in Phone Gallery/Photos).
 */
export function triggerBrowserFileDownload(blob: Blob, fileName: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = fileName;
  anchor.rel = 'noopener';
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  // Keep URL alive long enough for mobile browsers to finish copying the stream
  setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 60_000);
}

export type GallerySaveOutcome = 'shared_to_gallery' | 'saved_to_downloads' | 'cancelled';

function isMobileBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

/**
 * Saves a real downloaded video Blob to the phone's Gallery / Photos / Downloads.
 * - On mobile when triggered by user tap (preferNativeShare: true): uses native Web Share API
 *   with File payload so iOS shows "Save Video" directly to Photos/Gallery and Android lets users
 *   save straight to Gallery/Photos. Falls back to direct .mp4 file download if unsupported.
 * - When triggered automatically on download completion (preferNativeShare: false): triggers direct
 *   .mp4 file download so Android MediaStore automatically adds it to Phone Gallery / Downloads.
 */
export async function saveVideoToPhoneGallery(
  blob: Blob,
  fileName: string,
  title: string,
  options?: { preferNativeShare?: boolean }
): Promise<GallerySaveOutcome> {
  const preferNativeShare = options?.preferNativeShare ?? true;
  const videoMime = blob.type && blob.type.startsWith('video/') ? blob.type : 'video/mp4';

  if (
    preferNativeShare &&
    isMobileBrowser() &&
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    typeof File !== 'undefined'
  ) {
    try {
      const videoFile = new File([blob], fileName, {
        type: videoMime,
        lastModified: Date.now()
      });

      const shareData: ShareData = {
        files: [videoFile],
        title: title || 'MovieKart UG Video',
        text: `Save "${title}" to your phone gallery`
      };

      if (typeof navigator.canShare !== 'function' || navigator.canShare(shareData)) {
        await navigator.share(shareData);
        return 'shared_to_gallery';
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return 'cancelled';
      }
      // Fall through to direct MP4 file download on error
    }
  }

  triggerBrowserFileDownload(blob, fileName);
  return 'saved_to_downloads';
}
