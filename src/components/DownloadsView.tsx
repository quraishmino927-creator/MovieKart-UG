import React, { useEffect, useState } from 'react';
import { useMovieContext } from '../context/MovieContext';
import {
  formatBytes,
  pickAndLinkDeviceFolder,
  unlinkDeviceFolder,
  requestPersistentStorage
} from '../lib/offlineDownloads';
import {
  DownloadCloud,
  Play,
  Trash2,
  Pause,
  RotateCw,
  HardDrive,
  Wifi,
  WifiOff,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  FolderDown,
  FolderOpen,
  RefreshCw,
  ShieldCheck,
  Database,
  X
} from 'lucide-react';

export const DownloadsView: React.FC = () => {
  const {
    downloads,
    deviceStorage,
    offlineMode,
    setOfflineMode,
    pauseDownload,
    resumeDownload,
    deleteDownload,
    clearAllDownloads,
    saveDownloadToGallery,
    refreshDeviceStorage,
    playOfflineDownload,
    setActiveTab,
    showToast
  } = useMovieContext();

  const [refreshingStorage, setRefreshingStorage] = useState(false);
  const [linkingFolder, setLinkingFolder] = useState(false);
  const [requestingPersist, setRequestingPersist] = useState(false);
  const [exportingId, setExportingId] = useState<string | null>(null);

  // Measure real phone storage whenever DownloadsView mounts or completed downloads change
  useEffect(() => {
    void refreshDeviceStorage();
  }, [refreshDeviceStorage, downloads.length]);

  const completedDownloads = downloads.filter((d) => d.status === 'completed');
  const verifiedOfflineDownloads = completedDownloads.filter((d) => d.hasLocalBlob);
  const activeDownloads = downloads.filter(
    (d) => d.status === 'downloading' || d.status === 'paused' || d.status === 'error'
  );

  // Real File System Access API (OPFS) + Web Storage API readings
  const moviesBytes = deviceStorage?.moviesBytes ?? 0;
  const webAndCacheBytes =
    (deviceStorage?.webStorageBytes ?? 0) + (deviceStorage?.cacheStorageBytes ?? 0);
  const appUsageBytes = deviceStorage?.appUsageBytes ?? moviesBytes;
  const deviceQuotaBytes = deviceStorage?.deviceQuotaBytes ?? 0;
  const availableBytes = deviceStorage?.availableBytes ?? 0;
  const percentUsed = deviceStorage?.percentUsed ?? 0;
  const linkedFolder = deviceStorage?.linkedFolder ?? null;

  const moviesQuotaPercent =
    deviceQuotaBytes > 0 ? Math.min(100, (moviesBytes / deviceQuotaBytes) * 100) : 0;
  const otherAppBytes = Math.max(0, appUsageBytes - moviesBytes);
  const otherQuotaPercent =
    deviceQuotaBytes > 0
      ? Math.min(Math.max(0, 100 - moviesQuotaPercent), (otherAppBytes / deviceQuotaBytes) * 100)
      : 0;

  const handleRefreshStorage = async () => {
    setRefreshingStorage(true);
    try {
      await refreshDeviceStorage();
      showToast('Phone storage usage refreshed');
    } finally {
      setRefreshingStorage(false);
    }
  };

  const handleLinkDeviceFolder = async () => {
    setLinkingFolder(true);
    try {
      const folderInfo = await pickAndLinkDeviceFolder();
      if (folderInfo) {
        await refreshDeviceStorage();
        showToast(
          `Linked "${folderInfo.folderName}" — ${folderInfo.videoFilesCount} video${
            folderInfo.videoFilesCount === 1 ? '' : 's'
          } (${formatBytes(folderInfo.videoBytes)})`
        );
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not access device folder.');
    } finally {
      setLinkingFolder(false);
    }
  };

  const handleUnlinkFolder = async () => {
    unlinkDeviceFolder();
    await refreshDeviceStorage();
    showToast('Device folder unlinked');
  };

  const handleProtectStorage = async () => {
    setRequestingPersist(true);
    try {
      const granted = await requestPersistentStorage();
      await refreshDeviceStorage();
      showToast(
        granted
          ? 'Persistent phone storage enabled — OS will protect your offline movies.'
          : 'Browser manages storage persistence automatically on this device.'
      );
    } finally {
      setRequestingPersist(false);
    }
  };

  const handleSaveToGallery = async (movieId: string) => {
    setExportingId(movieId);
    try {
      await saveDownloadToGallery(movieId);
      await refreshDeviceStorage();
    } finally {
      setExportingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <DownloadCloud className="w-6 h-6 text-red-500" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit'] tracking-tight">
              Offline Downloads
            </h1>
          </div>
          <p className="text-sm text-gray-400">
            Real video files saved directly to your phone storage &amp; gallery for true zero-data playback.
          </p>
        </div>

        {/* Offline Mode Switch */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const next = !offlineMode;
              setOfflineMode(next);
              showToast(next ? 'Offline Mode Active' : 'Online Mode Enabled');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all cursor-pointer ${
              offlineMode
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
            }`}
          >
            {offlineMode ? (
              <WifiOff className="w-4 h-4 text-amber-400" />
            ) : (
              <Wifi className="w-4 h-4 text-emerald-400" />
            )}
            <span>{offlineMode ? 'Offline Mode: ON' : 'Offline Mode: OFF'}</span>
          </button>

          {downloads.length > 0 && (
            <button
              onClick={clearAllDownloads}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-red-600/20 text-gray-400 hover:text-red-400 border border-white/10 transition-colors cursor-pointer"
              title="Clear all downloaded files from phone"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Real Phone Storage Tracker (File System Access API + Web Storage API) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#121217] border border-white/5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2 text-gray-200">
            <HardDrive className="w-4 h-4 text-red-500 shrink-0" />
            <span className="text-xs sm:text-sm font-bold">Real Phone Storage Usage</span>
            {deviceStorage && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-300 bg-white/5 border border-white/10 px-2 py-0.5 rounded-md">
                <Database className="w-3 h-3 text-red-400" />
                {deviceStorage.activeEngine}
              </span>
            )}
            {deviceStorage?.isPersisted ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-md">
                <ShieldCheck className="w-3 h-3" />
                Protected
              </span>
            ) : (
              <button
                type="button"
                onClick={handleProtectStorage}
                disabled={requestingPersist}
                className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                title="Ask the phone OS to keep downloaded movies protected from automatic cleanup"
              >
                <ShieldCheck className="w-3 h-3" />
                {requestingPersist ? 'Requesting...' : 'Protect Storage'}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {deviceStorage?.directoryPickerSupported && !linkedFolder && (
              <button
                type="button"
                onClick={handleLinkDeviceFolder}
                disabled={linkingFolder}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 text-[11px] font-semibold transition-colors cursor-pointer"
                title="Select a real folder on your phone/device using the File System Access API"
              >
                <FolderOpen className="w-3.5 h-3.5 text-red-400" />
                <span>{linkingFolder ? 'Opening...' : 'Scan Phone Folder'}</span>
              </button>
            )}

            <span className="text-white font-bold font-mono text-xs sm:text-sm">
              {formatBytes(appUsageBytes)}
              {deviceQuotaBytes > 0 ? ` / ${formatBytes(deviceQuotaBytes)}` : ' used'}
            </span>

            <button
              type="button"
              onClick={handleRefreshStorage}
              disabled={refreshingStorage}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
              title="Re-scan actual phone storage usage"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${refreshingStorage ? 'animate-spin text-red-400' : ''}`}
              />
            </button>
          </div>
        </div>

        {/* Multi-segment Storage Bar (Downloaded Movies vs App Web Storage vs Free Phone Space) */}
        <div className="space-y-1.5">
          <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden flex">
            {moviesBytes > 0 && (
              <div
                className="h-full bg-[#E50914] transition-all duration-500"
                style={{ width: `${Math.max(2, moviesQuotaPercent)}%` }}
                title={`Downloaded Movies: ${formatBytes(moviesBytes)}`}
              />
            )}
            {otherAppBytes > 0 && (
              <div
                className="h-full bg-amber-500/80 transition-all duration-500"
                style={{ width: `${Math.max(1, otherQuotaPercent)}%` }}
                title={`App Cache & Web Storage: ${formatBytes(otherAppBytes)}`}
              />
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-400">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#E50914]" />
                Movies ({formatBytes(moviesBytes)})
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Web &amp; App Data ({formatBytes(Math.max(webAndCacheBytes, otherAppBytes))})
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-white/20" />
                Free ({deviceQuotaBytes > 0 ? formatBytes(availableBytes) : '—'})
              </span>
            </div>
            {deviceStorage?.measuredAt && (
              <span className="text-[10px] text-gray-500 font-mono">
                Measured {new Date(deviceStorage.measuredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>

        {/* 4-Metric Real Storage Breakdown Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          <div className="px-3 py-2.5 rounded-xl bg-black/35 border border-white/5 space-y-0.5">
            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
              Downloaded Movies
            </p>
            <p className="text-sm font-bold font-mono text-white">
              {formatBytes(moviesBytes)}
            </p>
            <p className="text-[10px] text-gray-500">
              {verifiedOfflineDownloads.length}{' '}
              {verifiedOfflineDownloads.length === 1 ? 'file' : 'files'} on phone
            </p>
          </div>

          <div className="px-3 py-2.5 rounded-xl bg-black/35 border border-white/5 space-y-0.5">
            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
              Free Phone Space
            </p>
            <p className="text-sm font-bold font-mono text-emerald-400">
              {deviceQuotaBytes > 0 ? formatBytes(availableBytes) : 'Measuring...'}
            </p>
            <p className="text-[10px] text-gray-500">
              {deviceQuotaBytes > 0 ? `of ${formatBytes(deviceQuotaBytes)} quota` : 'Web Storage API'}
            </p>
          </div>

          <div className="px-3 py-2.5 rounded-xl bg-black/35 border border-white/5 space-y-0.5">
            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
              Web Storage Data
            </p>
            <p className="text-sm font-bold font-mono text-amber-400">
              {formatBytes(Math.max(webAndCacheBytes, otherAppBytes))}
            </p>
            <p className="text-[10px] text-gray-500">
              Cache &amp; local metadata
            </p>
          </div>

          <div className="px-3 py-2.5 rounded-xl bg-black/35 border border-white/5 space-y-0.5">
            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
              Phone Quota Used
            </p>
            <p className="text-sm font-bold font-mono text-white">
              {deviceQuotaBytes > 0 ? `${percentUsed.toFixed(2)}%` : '0.00%'}
            </p>
            <p className="text-[10px] text-gray-500">
              {deviceStorage?.estimateSupported ? 'Live StorageManager' : 'Direct file count'}
            </p>
          </div>
        </div>

        {/* Linked Phone Folder Summary (File System Access API showDirectoryPicker) */}
        {linkedFolder && (
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-emerald-950/25 border border-emerald-500/25 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <FolderOpen className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-white font-semibold truncate">
                  Linked Folder: <span className="text-emerald-300 font-mono">{linkedFolder.folderName}</span>
                </p>
                <p className="text-[11px] text-gray-400">
                  {linkedFolder.videoFilesCount} video{linkedFolder.videoFilesCount === 1 ? '' : 's'} ({formatBytes(linkedFolder.videoBytes)}) · {linkedFolder.totalFilesCount} total files ({formatBytes(linkedFolder.totalBytes)})
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleUnlinkFolder}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer"
              title="Unlink folder"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Per-Movie Actual Storage Footprint Breakdown */}
        {verifiedOfflineDownloads.length > 0 && moviesBytes > 0 && (
          <div className="pt-2 border-t border-white/5 space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Storage Breakdown by Movie
            </p>
            <div className="space-y-1.5">
              {verifiedOfflineDownloads.map((item) => {
                const itemBytes = item.fileSizeBytes || Math.round((item.fileSizeMb || 0) * 1024 * 1024);
                const sharePct = moviesBytes > 0 ? Math.min(100, Math.round((itemBytes / moviesBytes) * 100)) : 0;
                return (
                  <div key={`usage_${item.movieId}`} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] gap-2">
                      <span className="text-gray-200 font-medium truncate">{item.movieTitle}</span>
                      <span className="text-gray-300 font-mono shrink-0">
                        {formatBytes(itemBytes)} ({sharePct}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#E50914] to-amber-500 rounded-full"
                        style={{ width: `${Math.max(2, sharePct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <p className="text-[11px] text-gray-400 flex items-center gap-1.5">
          <Smartphone className="w-3.5 h-3.5 text-red-400 shrink-0" />
          <span>
            Videos are stored inside your phone for offline playback and exported as MP4 files so they appear in your Phone Gallery / Downloads folder.
          </span>
        </p>
      </div>

      {/* Active / Paused / Failed Downloads Section */}
      {activeDownloads.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <RotateCw
              className={`w-4 h-4 text-amber-400 ${
                activeDownloads.some((d) => d.status === 'downloading') ? 'animate-spin' : ''
              }`}
            />
            Transfer Queue ({activeDownloads.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeDownloads.map((item) => {
              const isError = item.status === 'error';
              const isDownloading = item.status === 'downloading';

              return (
                <div
                  key={item.movieId}
                  className={`flex items-center gap-3 p-3 rounded-2xl bg-[#161622] border shadow-md ${
                    isError ? 'border-red-500/40' : 'border-amber-500/20'
                  }`}
                >
                  <img
                    src={item.posterUrl}
                    alt={item.movieTitle}
                    className="w-16 h-22 object-cover rounded-xl shrink-0 bg-black"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="font-bold text-sm text-white truncate">{item.movieTitle}</h3>
                      <span
                        className={`text-xs font-mono font-bold shrink-0 ${
                          isError ? 'text-red-400' : 'text-amber-400'
                        }`}
                      >
                        {isError ? 'Failed' : `${item.progress}%`}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden mb-1.5">
                      <div
                        className={`h-full transition-all duration-300 rounded-full ${
                          isError ? 'bg-red-600' : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.max(isDownloading ? 3 : 0, item.progress)}%` }}
                      />
                    </div>

                    {isError && item.errorMessage && (
                      <p className="text-[11px] text-red-400 flex items-center gap-1 mb-1.5 line-clamp-2">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        <span>{item.errorMessage}</span>
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-gray-400 gap-2">
                      <span className="truncate font-mono">
                        {isDownloading ? (
                          <>
                            {formatBytes(item.downloadedBytes || 0)}
                            {item.totalBytes ? ` / ${formatBytes(item.totalBytes)}` : ''}
                            {item.speedMbps > 0 ? ` • ${item.speedMbps} MB/s` : ''}
                          </>
                        ) : isError ? (
                          'Tap retry to download again'
                        ) : (
                          `Paused • ${formatBytes(item.downloadedBytes || 0)}`
                        )}
                      </span>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {isDownloading ? (
                          <button
                            onClick={() => pauseDownload(item.movieId)}
                            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-200 cursor-pointer"
                            title="Pause download"
                          >
                            <Pause className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => resumeDownload(item.movieId)}
                            className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                            title={isError ? 'Retry download' : 'Resume download'}
                          >
                            <Play className="w-3 h-3" />
                            <span>{isError ? 'Retry' : 'Resume'}</span>
                          </button>
                        )}
                        <button
                          onClick={() => deleteDownload(item.movieId)}
                          className="p-1.5 rounded-lg bg-white/10 hover:bg-red-600/30 text-gray-400 hover:text-red-400 cursor-pointer"
                          title="Cancel and remove"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed Downloads List */}
      <div className="space-y-4">
        <h2 className="text-base sm:text-lg font-bold text-white font-['Outfit']">
          Downloaded Videos ({completedDownloads.length})
        </h2>

        {completedDownloads.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedDownloads.map((item) => {
              const hasRealFile = Boolean(item.hasLocalBlob);
              const realSizeLabel =
                item.fileSizeBytes && item.fileSizeBytes > 0
                  ? formatBytes(item.fileSizeBytes)
                  : item.fileSizeMb > 0
                  ? `${item.fileSizeMb} MB`
                  : 'Size unavailable';

              return (
                <div
                  key={item.movieId}
                  className="group flex gap-3.5 p-3.5 rounded-2xl bg-[#121217] border border-white/5 hover:border-white/20 transition-all shadow-md hover:shadow-xl"
                >
                  <div className="relative w-20 h-28 shrink-0 rounded-xl overflow-hidden bg-black/40">
                    <img
                      src={item.posterUrl}
                      alt={item.movieTitle}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div
                      className={`absolute top-1 left-1 text-white rounded p-0.5 ${
                        hasRealFile ? 'bg-emerald-600' : 'bg-amber-600'
                      }`}
                      title={hasRealFile ? 'Saved locally on phone' : 'Needs real re-download'}
                    >
                      {hasRealFile ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <AlertTriangle className="w-3 h-3" />
                      )}
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] uppercase font-bold text-red-500 truncate">
                          {item.genre}
                        </span>
                        {hasRealFile && item.savedToGallery && (
                          <span className="text-[9px] font-bold text-emerald-400 shrink-0">
                            In Gallery
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-sm text-white truncate group-hover:text-red-400 transition-colors">
                        {item.movieTitle}
                      </h3>
                      {item.episodeTitle && (
                        <p className="text-[11px] text-gray-300 truncate">{item.episodeTitle}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5 font-mono">
                        {item.quality} · {realSizeLabel}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {hasRealFile
                          ? `Saved on phone ${item.downloadedAt || 'Recently'}`
                          : 'Old entry — re-download to save real file'}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 pt-2.5">
                      {hasRealFile ? (
                        <>
                          <button
                            onClick={() => playOfflineDownload(item)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm shadow-red-600/30 cursor-pointer whitespace-nowrap"
                          >
                            <Play className="w-3.5 h-3.5 fill-white shrink-0" />
                            <span>Play Offline</span>
                          </button>

                          <button
                            onClick={() => handleSaveToGallery(item.movieId)}
                            disabled={exportingId === item.movieId}
                            className="flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl bg-white/10 hover:bg-emerald-600/25 text-gray-200 hover:text-emerald-300 border border-white/10 text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap"
                            title="Save MP4 video to Phone Gallery / Photos"
                          >
                            <FolderDown className="w-3.5 h-3.5 shrink-0" />
                            <span>{exportingId === item.movieId ? '...' : 'Gallery'}</span>
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => resumeDownload(item.movieId)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                        >
                          <DownloadCloud className="w-3.5 h-3.5 shrink-0" />
                          <span>Re-download File</span>
                        </button>
                      )}

                      <button
                        onClick={() => deleteDownload(item.movieId)}
                        className="p-2 rounded-xl bg-white/5 hover:bg-red-600/20 text-gray-400 hover:text-red-400 border border-white/5 transition-colors cursor-pointer shrink-0"
                        title="Delete file from phone storage"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-16 text-center bg-[#101017] rounded-3xl border border-white/5 p-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center text-gray-500">
              <DownloadCloud className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">No Offline Videos Saved</h3>
            <p className="text-sm text-gray-400 max-w-sm mx-auto mb-6">
              Download any movie or episode to store the real video file on your phone storage and save it straight to your Phone Gallery.
            </p>
            <button
              onClick={() => setActiveTab('home')}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-lg shadow-red-600/30 cursor-pointer"
            >
              Browse Movies to Download
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
