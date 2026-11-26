/**
 * Real Offline Download Engine, File System Access API (OPFS + Device Folder Picker),
 * Phone Gallery Exporter, and Web Storage API Device Storage Inspector.
 *
 * Storage layers:
 * 1. Origin Private File System (OPFS via navigator.storage.getDirectory) when writable file handles
 *    are supported — stores real native-backed video files and reads exact File.size directly from disk.
 * 2. IndexedDB fallback (moviekart_offline_media_v1) for browsers without OPFS createWritable() (e.g. older iOS).
 * 3. Optional User Device Folder via File System Access API (window.showDirectoryPicker) to scan & save
 *    downloaded movies directly into a chosen phone/device folder and count actual folder usage.
 * 4. Web Storage API (navigator.storage.estimate + usageDetails + localStorage byte measurement)
 *    to report real phone storage quota, free space, app usage, and persistent storage protection.
 */

const DB_NAME = 'moviekart_offline_media_v1';
const DB_VERSION = 1;
const BLOBS_STORE = 'video_blobs';
const META_STORE = 'video_meta';
const OPFS_DIR_NAME = 'moviekart_offline_videos';

interface ExtendedStorageEstimate extends StorageEstimate {
  usageDetails?: {
    indexedDB?: number;
    caches?: number;
    fileSystem?: number;
    serviceWorkerRegistrations?: number;
  };
}

interface FSFileHandleLike {
  kind: 'file';
  name: string;
  getFile: () => Promise<File>;
  createWritable?: () => Promise<{
    write: (data: Blob) => Promise<void>;
    close: () => Promise<void>;
  }>;
}

interface FSDirectoryHandleLike {
  kind: 'directory';
  name: string;
  getDirectoryHandle: (name: string, options?: { create?: boolean }) => Promise<FSDirectoryHandleLike>;
  getFileHandle: (name: string, options?: { create?: boolean }) => Promise<FSFileHandleLike>;
  removeEntry: (name: string) => Promise<void>;
  entries?: () => AsyncIterableIterator<[string, FSFileHandleLike | FSDirectoryHandleLike]>;
  values?: () => AsyncIterableIterator<FSFileHandleLike | FSDirectoryHandleLike>;
  queryPermission?: (desc?: { mode?: 'read' | 'readwrite' }) => Promise<'granted' | 'denied' | 'prompt'>;
  requestPermission?: (desc?: { mode?: 'read' | 'readwrite' }) => Promise<'granted' | 'denied' | 'prompt'>;
}

interface FileSystemWindow extends Window {
  showDirectoryPicker?: (options?: {
    id?: string;
    mode?: 'read' | 'readwrite';
    startIn?: 'downloads' | 'videos' | 'documents';
  }) => Promise<FSDirectoryHandleLike>;
  showSaveFilePicker?: (options?: {
    suggestedName?: string;
    types?: Array<{
      description?: string;
      accept: Record<string, string[]>;
    }>;
  }) => Promise<FSFileHandleLike>;
}

export type OfflineStorageBackend = 'opfs' | 'indexeddb';

export interface OfflineVideoMeta {
  id: string;
  sizeBytes: number;
  mimeType: string;
  fileName: string;
  savedAt: number;
  storageBackend?: OfflineStorageBackend;
  opfsKey?: string;
}

export interface OfflineVideoRecord extends OfflineVideoMeta {
  blob: Blob;
}

export interface LinkedDeviceFolderInfo {
  folderName: string;
  videoFilesCount: number;
  videoBytes: number;
  totalFilesCount: number;
  totalBytes: number;
  scannedAt: number;
}

export interface RealDeviceStorageInfo {
  /** Exact bytes used by MovieKart offline videos (OPFS files + IndexedDB blobs) */
  moviesBytes: number;
  /** Number of real offline video files currently stored on this device */
  moviesCount: number;
  /** Exact bytes stored in OPFS (Origin Private File System) */
  opfsBytes: number;
  /** Exact bytes stored in IndexedDB video store (non-OPFS fallback) */
  indexedDbMoviesBytes: number;
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
  /** Active primary storage engine */
  activeEngine: 'File System API (OPFS)' | 'Web Storage (IndexedDB)';
  /** Whether Origin Private File System (OPFS) is supported */
  opfsSupported: boolean;
  /** Whether interactive Device Folder Picker (showDirectoryPicker) is supported */
  directoryPickerSupported: boolean;
  /** Whether the browser granted persistent storage protection */
  isPersisted: boolean;
  /** Whether navigator.storage.estimate() is supported on this device */
  estimateSupported: boolean;
  /** Optional user-linked phone/device folder stats via File System Access API */
  linkedFolder: LinkedDeviceFolderInfo | null;
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

// Holds an optional user-selected device folder handle (via File System Access API) for the current session
let linkedDirectoryHandle: FSDirectoryHandleLike | null = null;

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

function buildOpfsKey(id: string): string {
  const safeId = (id || 'video').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);
  return `${safeId}.bin`;
}

export function isDirectoryPickerSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return typeof (window as FileSystemWindow).showDirectoryPicker === 'function';
}

export function isOpfsSupported(): boolean {
  if (typeof navigator === 'undefined') return false;
  return typeof navigator.storage?.getDirectory === 'function';
}

async function getOpfsOfflineDir(create = false): Promise<FSDirectoryHandleLike | null> {
  if (!isOpfsSupported()) return null;
  try {
    const root = (await navigator.storage.getDirectory()) as unknown as FSDirectoryHandleLike;
    return await root.getDirectoryHandle(OPFS_DIR_NAME, { create });
  } catch {
    return null;
  }
}

async function writeBlobToOpfs(id: string, blob: Blob): Promise<string | null> {
  const dir = await getOpfsOfflineDir(true);
  if (!dir) return null;
  const key = buildOpfsKey(id);
  try {
    const fileHandle = await dir.getFileHandle(key, { create: true });
    if (typeof fileHandle.createWritable !== 'function') {
      return null;
    }
    const writable = await fileHandle.createWritable();
    await writable.write(blob);
    await writable.close();
    return key;
  } catch {
    return null;
  }
}

async function readBlobFromOpfs(opfsKey: string, mimeType: string): Promise<Blob | null> {
  const dir = await getOpfsOfflineDir(false);
  if (!dir) return null;
  try {
    const fileHandle = await dir.getFileHandle(opfsKey);
    const file = await fileHandle.getFile();
    if (!file || file.size === 0) return null;
    if (file.type && file.type.startsWith('video/')) return file;
    return new Blob([file], { type: mimeType || 'video/mp4' });
  } catch {
    return null;
  }
}

async function deleteFromOpfs(opfsKey: string): Promise<void> {
  const dir = await getOpfsOfflineDir(false);
  if (!dir) return;
  try {
    await dir.removeEntry(opfsKey);
  } catch {
    // ignore if missing
  }
}

async function clearOpfsDir(): Promise<void> {
  const dir = await getOpfsOfflineDir(false);
  if (!dir) return;
  try {
    if (typeof dir.entries === 'function') {
      for await (const [name] of dir.entries()) {
        try {
          await dir.removeEntry(name);
        } catch {
          // ignore
        }
      }
    }
  } catch {
    // ignore
  }
}

/**
 * Inspects actual on-disk file sizes inside the Origin Private File System directory.
 */
async function measureOpfsDirectory(): Promise<{ totalBytes: number; fileSizesByKey: Record<string, number> }> {
  const fileSizesByKey: Record<string, number> = {};
  let totalBytes = 0;

  const dir = await getOpfsOfflineDir(false);
  if (!dir) return { totalBytes: 0, fileSizesByKey };

  try {
    if (typeof dir.entries === 'function') {
      for await (const [name, handle] of dir.entries()) {
        if (handle.kind === 'file') {
          try {
            const file = await handle.getFile();
            fileSizesByKey[name] = file.size;
            totalBytes += file.size;
          } catch {
            // ignore unreadable handle
          }
        }
      }
    } else if (typeof dir.values === 'function') {
      for await (const handle of dir.values()) {
        if (handle.kind === 'file') {
          try {
            const file = await handle.getFile();
            fileSizesByKey[handle.name] = file.size;
            totalBytes += file.size;
          } catch {
            // ignore
          }
        }
      }
    }
  } catch {
    // ignore
  }

  return { totalBytes, fileSizesByKey };
}

/**
 * Measures real byte usage of Web Storage API (localStorage) on this device.
 */
export function measureWebLocalStorageBytes(): number {
  if (typeof window === 'undefined' || !window.localStorage) return 0;
  try {
    let totalBytes = 0;
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key) continue;
      const val = window.localStorage.getItem(key) || '';
      // UTF-16 strings take 2 bytes per code unit in browser localStorage
      totalBytes += (key.length + val.length) * 2;
    }
    return totalBytes;
  } catch {
    return 0;
  }
}

/**
 * Scans a user-linked File System Access API folder on the phone/device and counts real video bytes.
 */
async function scanDirectoryHandle(handle: FSDirectoryHandleLike): Promise<LinkedDeviceFolderInfo> {
  const VIDEO_EXT_RE = /\.(mp4|m4v|mov|webm|mkv|avi|3gp)$/i;
  let videoFilesCount = 0;
  let videoBytes = 0;
  let totalFilesCount = 0;
  let totalBytes = 0;

  const iterator =
    typeof handle.values === 'function'
      ? handle.values()
      : null;

  if (iterator) {
    for await (const entry of iterator) {
      if (entry.kind === 'file') {
        try {
          const file = await entry.getFile();
          totalFilesCount++;
          totalBytes += file.size;
          if (VIDEO_EXT_RE.test(entry.name) || file.type.startsWith('video/')) {
            videoFilesCount++;
            videoBytes += file.size;
          }
        } catch {
          // skip unreadable file
        }
      }
    }
  }

  return {
    folderName: handle.name || 'Phone Folder',
    videoFilesCount,
    videoBytes,
    totalFilesCount,
    totalBytes,
    scannedAt: Date.now()
  };
}

/**
 * Opens the native File System Access API folder picker so the user can link a real device folder
 * (e.g., Downloads or Movies) for accurate folder storage tracking and direct MP4 saving.
 */
export async function pickAndLinkDeviceFolder(): Promise<LinkedDeviceFolderInfo | null> {
  const fsWin = typeof window !== 'undefined' ? (window as FileSystemWindow) : null;
  if (!fsWin || typeof fsWin.showDirectoryPicker !== 'function') {
    throw new Error('Device folder picker is not supported in this browser.');
  }

  try {
    const dirHandle = await fsWin.showDirectoryPicker({
      id: 'moviekart-offline-folder',
      mode: 'readwrite',
      startIn: 'downloads'
    });
    linkedDirectoryHandle = dirHandle;
    return await scanDirectoryHandle(dirHandle);
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return null;
    }
    throw err;
  }
}

export function unlinkDeviceFolder(): void {
  linkedDirectoryHandle = null;
}

export async function writeBlobToLinkedDeviceFolder(blob: Blob, fileName: string): Promise<boolean> {
  if (!linkedDirectoryHandle) return false;
  try {
    if (typeof linkedDirectoryHandle.queryPermission === 'function') {
      const perm = await linkedDirectoryHandle.queryPermission({ mode: 'readwrite' });
      if (perm !== 'granted' && typeof linkedDirectoryHandle.requestPermission === 'function') {
        const requested = await linkedDirectoryHandle.requestPermission({ mode: 'readwrite' });
        if (requested !== 'granted') return false;
      }
    }
    const fileHandle = await linkedDirectoryHandle.getFileHandle(fileName, { create: true });
    if (typeof fileHandle.createWritable !== 'function') return false;
    const writable = await fileHandle.createWritable();
    await writable.write(blob);
    await writable.close();
    return true;
  } catch {
    return false;
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

export async function saveOfflineVideoBlob(record: OfflineVideoRecord): Promise<OfflineStorageBackend> {
  // 1. Prefer File System Access API (OPFS) so the movie is written as a real file on the device filesystem
  const opfsKey = await writeBlobToOpfs(record.id, record.blob);
  const backend: OfflineStorageBackend = opfsKey ? 'opfs' : 'indexeddb';

  const db = await openOfflineDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction([BLOBS_STORE, META_STORE], 'readwrite');
    if (backend === 'indexeddb') {
      tx.objectStore(BLOBS_STORE).put({ id: record.id, blob: record.blob });
    } else {
      // Avoid duplicating large video bytes in both OPFS and IndexedDB
      tx.objectStore(BLOBS_STORE).delete(record.id);
    }
    const meta: OfflineVideoMeta = {
      id: record.id,
      sizeBytes: record.sizeBytes,
      mimeType: record.mimeType,
      fileName: record.fileName,
      savedAt: record.savedAt,
      storageBackend: backend,
      opfsKey: opfsKey || undefined
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

  // Also mirror into user-linked device folder if they connected one via File System Access API
  if (linkedDirectoryHandle) {
    await writeBlobToLinkedDeviceFolder(record.blob, record.fileName);
  }

  return backend;
}

export async function getOfflineVideoRecord(id: string): Promise<OfflineVideoRecord | null> {
  try {
    const db = await openOfflineDb();
    const { blobResult, metaResult } = await new Promise<{
      blobResult?: { id: string; blob: Blob };
      metaResult?: OfflineVideoMeta;
    }>((resolve, reject) => {
      const tx = db.transaction([BLOBS_STORE, META_STORE], 'readonly');
      const blobReq = tx.objectStore(BLOBS_STORE).get(id);
      const metaReq = tx.objectStore(META_STORE).get(id);

      let bRes: { id: string; blob: Blob } | undefined;
      let mRes: OfflineVideoMeta | undefined;

      blobReq.onsuccess = () => {
        bRes = blobReq.result;
      };
      metaReq.onsuccess = () => {
        mRes = metaReq.result;
      };

      tx.oncomplete = () => {
        db.close();
        resolve({ blobResult: bRes, metaResult: mRes });
      };

      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });

    // Try OPFS file handle first if stored via File System Access API
    const opfsKey = metaResult?.opfsKey || buildOpfsKey(id);
    if (metaResult?.storageBackend === 'opfs' || !blobResult?.blob) {
      const opfsBlob = await readBlobFromOpfs(opfsKey, metaResult?.mimeType || 'video/mp4');
      if (opfsBlob) {
        return {
          id,
          blob: opfsBlob,
          sizeBytes: opfsBlob.size,
          mimeType: metaResult?.mimeType || opfsBlob.type || 'video/mp4',
          fileName: metaResult?.fileName || buildSafeVideoFileName(id, opfsBlob.type),
          savedAt: metaResult?.savedAt || Date.now(),
          storageBackend: 'opfs',
          opfsKey
        };
      }
    }

    if (!blobResult?.blob) return null;

    return {
      id,
      blob: blobResult.blob,
      sizeBytes: metaResult?.sizeBytes || blobResult.blob.size,
      mimeType: metaResult?.mimeType || blobResult.blob.type || 'video/mp4',
      fileName: metaResult?.fileName || buildSafeVideoFileName(id, blobResult.blob.type),
      savedAt: metaResult?.savedAt || Date.now(),
      storageBackend: 'indexeddb'
    };
  } catch {
    return null;
  }
}

export async function getAllOfflineVideoMeta(): Promise<Record<string, OfflineVideoMeta>> {
  try {
    const db = await openOfflineDb();
    const metaList = await new Promise<OfflineVideoMeta[]>((resolve, reject) => {
      const tx = db.transaction([META_STORE], 'readonly');
      const req = tx.objectStore(META_STORE).getAll();
      req.onsuccess = () => {
        db.close();
        resolve((req.result || []) as OfflineVideoMeta[]);
      };
      req.onerror = () => {
        db.close();
        reject(req.error);
      };
    });

    const opfsScan = await measureOpfsDirectory();
    const map: Record<string, OfflineVideoMeta> = {};

    for (const item of metaList) {
      if (!item?.id) continue;
      if (item.storageBackend === 'opfs') {
        const key = item.opfsKey || buildOpfsKey(item.id);
        const actualDiskSize = opfsScan.fileSizesByKey[key];
        if (typeof actualDiskSize === 'number' && actualDiskSize > 0) {
          map[item.id] = { ...item, sizeBytes: actualDiskSize };
        }
      } else {
        map[item.id] = item;
      }
    }
    return map;
  } catch {
    return {};
  }
}

export async function deleteOfflineVideoBlob(id: string): Promise<void> {
  await deleteFromOpfs(buildOpfsKey(id));
  try {
    const db = await openOfflineDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction([BLOBS_STORE, META_STORE], 'readwrite');
      const metaReq = tx.objectStore(META_STORE).get(id);
      metaReq.onsuccess = () => {
        const meta = metaReq.result as OfflineVideoMeta | undefined;
        if (meta?.opfsKey && meta.opfsKey !== buildOpfsKey(id)) {
          void deleteFromOpfs(meta.opfsKey);
        }
      };
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
  await clearOpfsDir();
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

/**
 * Combines File System Access API (OPFS file size scan + optional linked folder scan)
 * with Web Storage API (navigator.storage.estimate + usageDetails + localStorage bytes)
 * to report actual phone storage usage and free space.
 */
export async function getRealDeviceStorageInfo(): Promise<RealDeviceStorageInfo> {
  const [metaMap, opfsScan] = await Promise.all([
    getAllOfflineVideoMeta(),
    measureOpfsDirectory()
  ]);

  const entries = Object.values(metaMap);
  const indexedDbMoviesBytes = entries
    .filter((item) => item.storageBackend !== 'opfs')
    .reduce((sum, item) => sum + Math.max(0, item.sizeBytes || 0), 0);

  const opfsBytes = opfsScan.totalBytes;
  const moviesBytes = opfsBytes + indexedDbMoviesBytes;
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

  let linkedFolder: LinkedDeviceFolderInfo | null = null;
  if (linkedDirectoryHandle) {
    try {
      linkedFolder = await scanDirectoryHandle(linkedDirectoryHandle);
    } catch {
      linkedFolder = null;
    }
  }

  const availableBytes = deviceQuotaBytes > 0 ? Math.max(0, deviceQuotaBytes - appUsageBytes) : 0;
  const percentUsed =
    deviceQuotaBytes > 0
      ? Math.min(100, Number(((appUsageBytes / deviceQuotaBytes) * 100).toFixed(2)))
      : 0;

  const opfsCapable = isOpfsSupported();

  return {
    moviesBytes,
    moviesCount,
    opfsBytes,
    indexedDbMoviesBytes,
    webStorageBytes,
    cacheStorageBytes,
    appUsageBytes,
    deviceQuotaBytes,
    availableBytes,
    percentUsed,
    activeEngine: opfsCapable ? 'File System API (OPFS)' : 'Web Storage (IndexedDB)',
    opfsSupported: opfsCapable,
    directoryPickerSupported: isDirectoryPickerSupported(),
    isPersisted,
    estimateSupported,
    linkedFolder,
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
      return await tryFetch(targetUrl);
    }
  }

  try {
    return await tryFetch(targetUrl);
  } catch (directErr) {
    if (signal.aborted) throw directErr;
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
  setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 60_000);
}

export type GallerySaveOutcome = 'shared_to_gallery' | 'saved_to_folder' | 'saved_to_downloads' | 'cancelled';

function isMobileBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

/**
 * Saves a real downloaded video Blob to the phone's Gallery / Photos / Device Folder.
 * 1. If a File System Access API folder is linked, writes directly into that folder.
 * 2. On mobile tap (preferNativeShare: true), opens native Share Sheet so iOS shows "Save Video" to Photos.
 * 3. On desktop/supported Chrome tap (preferNativeShare: true), offers showSaveFilePicker when available.
 * 4. Always falls back cleanly to standard MP4 download (which Android Gallery auto-indexes).
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
    }
  }

  // If user tapped Save on a browser with File System Access API showSaveFilePicker
  const fsWin = typeof window !== 'undefined' ? (window as FileSystemWindow) : null;
  if (preferNativeShare && !isMobileBrowser() && fsWin && typeof fsWin.showSaveFilePicker === 'function') {
    try {
      const handle = await fsWin.showSaveFilePicker({
        suggestedName: fileName,
        types: [
          {
            description: 'MP4 Video File',
            accept: { [videoMime]: ['.mp4', '.webm', '.mov'] }
          }
        ]
      });
      if (typeof handle.createWritable === 'function') {
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        return 'saved_to_folder';
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return 'cancelled';
      }
    }
  }

  triggerBrowserFileDownload(blob, fileName);
  return 'saved_to_downloads';
}
