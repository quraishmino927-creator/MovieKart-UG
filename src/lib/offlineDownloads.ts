/**
 * In-Website Offline Download Engine (Netlify Google Drive Proxy + IndexedDB + Web Storage API).
 *
 * - Google Drive movies are ALWAYS fetched via /.netlify/functions/drive-download?fileId=XXX
 *   (never directly from drive.google.com, bypassing CORS + >100MB virus-scan pages).
 * - Rejects Drive quota errors and HTML responses cleanly — never stores fake video bytes.
 * - Saves the real video Blob directly inside IndexedDB (key = movieId) for 100% in-website
 *   offline playback via URL.createObjectURL(blob) in <video> — no Chrome download, no Files app, no Drive app.
 * - Tracks actual phone storage via navigator.storage.estimate() + exact IndexedDB byte totals,
 *   and flags low phone storage (< 1 GB free).
 */

const DB_NAME = 'moviekart_offline_media_v1';
const DB_VERSION = 1;
const BLOBS_STORE = 'video_blobs';
const META_STORE = 'video_meta';

export const LOW_STORAGE_THRESHOLD_BYTES = 1024 * 1024 * 1024; // 1 GB

interface ExtendedStorageEstimate extends StorageEstimate {
  usageDetails?: {
    indexedDB?: number;
    caches?: number;
    fileSystem?: number;
    serviceWorkerRegistrations?: number;
  };
}

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
  /** Exact bytes used by MovieKart downloaded movies stored in IndexedDB */
  moviesBytes: number;
  /** Exact MB used by downloaded movies */
  moviesUsedMb: number;
  /** Number of real offline video files currently stored on this phone */
  moviesCount: number;
  /** Exact bytes used by Web Storage API (localStorage) */
  webStorageBytes: number;
  /** Cache Storage bytes reported by StorageManager usageDetails (if exposed) */
  cacheStorageBytes: number;
  /** Total bytes reported by navigator.storage.estimate().usage */
  appUsageBytes: number;
  /** Real storage quota reported by the phone's browser/OS in bytes */
  deviceQuotaBytes: number;
  /** Remaining free space available to the app on the phone */
  availableBytes: number;
  /** Percentage of phone quota currently used (0-100) */
  percentUsed: number;
  /** True when the phone reports less than 1 GB of free space */
  isLowStorage: boolean;
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

export function formatMegabytes(bytes?: number | null): string {
  if (!bytes || !Number.isFinite(bytes) || bytes <= 0) return '0 MB';
  const mb = bytes / (1024 * 1024);
  if (mb < 1) return `${Math.max(0.1, mb).toFixed(1)} MB`;
  if (mb < 100) return `${mb.toFixed(1)} MB`;
  return `${Math.round(mb)} MB`;
}

export function buildSafeVideoFileName(title: string, mimeType = 'video/mp4'): string {
  const cleanBase =
    (title || 'MovieKart_Video')
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

/**
 * Extracts a Google Drive File ID from any Google Drive URL format:
 * - https://drive.google.com/file/d/FILE_ID/view
 * - https://drive.google.com/file/d/FILE_ID/preview
 * - https://drive.google.com/uc?export=download&id=FILE_ID
 * - https://drive.google.com/open?id=FILE_ID
 * - https://drive.usercontent.google.com/download?id=FILE_ID...
 */
export function extractGoogleDriveFileId(rawUrl: string): string | null {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();
  if (!lower.includes('drive.google.com') && !lower.includes('drive.usercontent.google.com')) {
    return null;
  }

  const pathMatch = trimmed.match(/\/file\/(?:u\/\d+\/)?d\/([A-Za-z0-9_-]{10,120})/i);
  if (pathMatch?.[1]) return pathMatch[1];

  const queryMatch = trimmed.match(/[?&]id=([A-Za-z0-9_-]{10,120})/i);
  if (queryMatch?.[1]) return queryMatch[1];

  return null;
}

export function buildNetlifyDriveDownloadUrl(fileId: string): string {
  return `/.netlify/functions/drive-download?fileId=${encodeURIComponent(fileId)}`;
}

export function measureWebLocalStorageBytes(): number {
  if (typeof window === 'undefined' || !window.localStorage) return 0;
  try {
    let totalBytes = 0;
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key) continue;
      const val = window.localStorage.getItem(key) || '';
      totalBytes += (key.length + val.length) * 2;
    }
    return totalBytes;
  } catch {
    return 0;
  }
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

/**
 * Saves the real video Blob in IndexedDB keyed by movieId.
 */
export async function saveOfflineVideoBlob(record: OfflineVideoRecord): Promise<void> {
  const db = await openOfflineDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction([BLOBS_STORE, META_STORE], 'readwrite');
    tx.objectStore(BLOBS_STORE).put({ id: record.id, blob: record.blob });
    const meta: OfflineVideoMeta = {
      id: record.id,
      sizeBytes: record.sizeBytes,
      mimeType: record.mimeType,
      fileName: record.fileName,
      savedAt: record.savedAt,
    };
    tx.objectStore(META_STORE).put(meta);

    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error || new Error('Failed to save movie in phone IndexedDB storage.'));
    };
    tx.onabort = () => {
      db.close();
      reject(tx.error || new Error('Phone storage is full — delete a movie and try again.'));
    };
  });
}

/**
 * Loads the real video Blob from IndexedDB for in-website offline playback via URL.createObjectURL(blob).
 */
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
        if (!blobResult?.blob || blobResult.blob.size === 0) {
          resolve(null);
          return;
        }
        const mimeType = metaResult?.mimeType || blobResult.blob.type || 'video/mp4';
        const playableBlob =
          blobResult.blob.type && blobResult.blob.type.startsWith('video/')
            ? blobResult.blob
            : new Blob([blobResult.blob], { type: mimeType });
        resolve({
          id,
          blob: playableBlob,
          sizeBytes: metaResult?.sizeBytes || playableBlob.size,
          mimeType,
          fileName: metaResult?.fileName || buildSafeVideoFileName(id, mimeType),
          savedAt: metaResult?.savedAt || Date.now(),
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
      const tx = db.transaction([META_STORE, BLOBS_STORE], 'readonly');
      const metaReq = tx.objectStore(META_STORE).getAll();
      const keysReq = tx.objectStore(BLOBS_STORE).getAllKeys();

      let metaList: OfflineVideoMeta[] = [];
      let blobKeys = new Set<string>();

      metaReq.onsuccess = () => {
        metaList = (metaReq.result || []) as OfflineVideoMeta[];
      };
      keysReq.onsuccess = () => {
        blobKeys = new Set((keysReq.result || []).map((k) => String(k)));
      };

      tx.oncomplete = () => {
        db.close();
        const map: Record<string, OfflineVideoMeta> = {};
        for (const item of metaList) {
          if (item?.id && blobKeys.has(item.id)) {
            map[item.id] = item;
          }
        }
        resolve(map);
      };

      tx.onerror = () => {
        db.close();
        reject(tx.error);
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
    // ignore
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
  const moviesUsedMb = +(moviesBytes / (1024 * 1024)).toFixed(1);
  const moviesCount = entries.length;
  const webStorageBytes = measureWebLocalStorageBytes();

  let appUsageBytes = moviesBytes + webStorageBytes;
  let cacheStorageBytes = 0;
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
        const estimate = (await navigator.storage.estimate()) as ExtendedStorageEstimate;
        estimateSupported = true;
        if (typeof estimate.usage === 'number' && Number.isFinite(estimate.usage)) {
          appUsageBytes = Math.max(estimate.usage, moviesBytes + webStorageBytes);
        }
        if (typeof estimate.quota === 'number' && Number.isFinite(estimate.quota) && estimate.quota > 0) {
          deviceQuotaBytes = estimate.quota;
        }
        if (estimate.usageDetails) {
          cacheStorageBytes = Math.max(0, estimate.usageDetails.caches || 0);
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
  const isLowStorage = deviceQuotaBytes > 0 && availableBytes < LOW_STORAGE_THRESHOLD_BYTES;

  return {
    moviesBytes,
    moviesUsedMb,
    moviesCount,
    webStorageBytes,
    cacheStorageBytes,
    appUsageBytes,
    deviceQuotaBytes,
    availableBytes,
    percentUsed,
    isLowStorage,
    isPersisted,
    estimateSupported,
    measuredAt: Date.now(),
  };
}

async function parseErrorResponse(res: Response): Promise<string> {
  try {
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    if (ct.includes('application/json')) {
      const data = await res.json();
      if (data && typeof data.error === 'string' && data.error.trim()) {
        return data.error.trim();
      }
    }
  } catch {
    // ignore
  }
  return `Download failed (HTTP ${res.status})`;
}

async function fetchVideoStreamForOffline(
  rawVideoUrl: string,
  fileName: string,
  signal: AbortSignal
): Promise<Response> {
  let trimmed = (rawVideoUrl || '').trim();
  if (!trimmed) {
    throw new Error('This movie does not have a video URL.');
  }
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }

  const lower = trimmed.toLowerCase();
  if (
    lower.includes('youtube.com/') ||
    lower.includes('youtu.be/') ||
    lower.includes('youtube-nocookie.com/')
  ) {
    throw new Error('YouTube videos cannot be saved offline. Use a Google Drive or MP4 link.');
  }

  // 1. Google Drive URL -> ALWAYS fetch via Netlify Function proxy (NEVER direct drive.google.com)
  const driveFileId = extractGoogleDriveFileId(trimmed);
  if (driveFileId) {
    const fnUrl = buildNetlifyDriveDownloadUrl(driveFileId);
    const res = await fetch(fnUrl, {
      method: 'GET',
      signal,
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(await parseErrorResponse(res));
    }

    const ct = (res.headers.get('content-type') || '').toLowerCase();
    if (ct.includes('application/json')) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error || 'Drive quota');
    }
    if (ct.includes('text/html')) {
      throw new Error('Drive quota');
    }

    return res;
  }

  // 2. Non-Drive direct MP4 / Firebase Storage URL -> try direct fetch first, then proxy fallback
  const tryDirect = async () => {
    const res = await fetch(trimmed, { method: 'GET', signal, cache: 'no-store' });
    if (!res.ok) {
      throw new Error(await parseErrorResponse(res));
    }
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    if (ct.includes('text/html') || ct.includes('application/json')) {
      throw new Error('Video link did not return a playable video file.');
    }
    return res;
  };

  try {
    return await tryDirect();
  } catch (directErr) {
    if (signal.aborted) throw directErr;
    const proxyUrl = `/api/download/proxy?url=${encodeURIComponent(trimmed)}&filename=${encodeURIComponent(fileName)}`;
    const res = await fetch(proxyUrl, { method: 'GET', signal, cache: 'no-store' });
    if (!res.ok) {
      throw new Error(await parseErrorResponse(res));
    }
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    if (ct.includes('text/html') || ct.includes('application/json')) {
      throw new Error('Video link did not return a playable video file.');
    }
    return res;
  }
}

/**
 * Downloads real video bytes using ReadableStream reader and reports exact progress:
 * progress = downloadedBytes / totalBytes * 100
 */
export async function downloadVideoWithProgress(params: {
  videoUrl: string;
  title: string;
  signal: AbortSignal;
  onProgress: (info: DownloadProgressInfo) => void;
}): Promise<RealDownloadResult> {
  const { videoUrl, title, signal, onProgress } = params;
  const initialFileName = buildSafeVideoFileName(title, 'video/mp4');
  const response = await fetchVideoStreamForOffline(videoUrl, initialFileName, signal);

  const rawContentType = (response.headers.get('content-type') || 'video/mp4')
    .split(';')[0]
    .trim()
    .toLowerCase();
  const mimeType = rawContentType.startsWith('video/') ? rawContentType : 'video/mp4';
  const fileName = buildSafeVideoFileName(title, mimeType);

  const contentLengthHeader = response.headers.get('content-length');
  const parsedTotal = contentLengthHeader ? Number(contentLengthHeader) : NaN;
  const totalBytes = Number.isFinite(parsedTotal) && parsedTotal > 0 ? parsedTotal : null;

  if (!response.body) {
    const blob = await response.blob();
    if (blob.size === 0) {
      throw new Error('Downloaded video file was empty.');
    }
    const videoBlob = blob.type.startsWith('video/') ? blob : new Blob([blob], { type: mimeType });
    onProgress({
      downloadedBytes: videoBlob.size,
      totalBytes: videoBlob.size,
      progress: 100,
      speedMbps: 0,
    });
    return {
      blob: videoBlob,
      sizeBytes: videoBlob.size,
      mimeType,
      fileName,
    };
  }

  const reader = response.body.getReader();
  const chunks: BlobPart[] = [];
  let downloadedBytes = 0;
  let lastReportTime = performance.now();
  let lastReportedBytes = 0;

  // Report initial totalBytes as soon as headers arrive so UI immediately shows "Downloaded 0 MB / 450 MB"
  onProgress({
    downloadedBytes: 0,
    totalBytes,
    progress: 0,
    speedMbps: 0,
  });

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        downloadedBytes += value.byteLength;

        const now = performance.now();
        const elapsedMs = now - lastReportTime;
        if (elapsedMs >= 160) {
          const bytesSince = downloadedBytes - lastReportedBytes;
          const speedMbps = +Math.max(0.1, bytesSince / (elapsedMs / 1000) / (1024 * 1024)).toFixed(1);
          const progress = totalBytes
            ? Math.min(99, Math.max(1, Math.round((downloadedBytes / totalBytes) * 100)))
            : Math.min(95, Math.max(1, Math.round(100 - 100 / (1 + downloadedBytes / (40 * 1024 * 1024)))));

          onProgress({
            downloadedBytes,
            totalBytes,
            progress,
            speedMbps,
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
    speedMbps: 0,
  });

  return {
    blob,
    sizeBytes: blob.size,
    mimeType,
    fileName,
  };
}
