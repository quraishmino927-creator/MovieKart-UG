import React, { useEffect, useState } from 'react';
import { useMovieContext } from '../context/MovieContext';
import { formatBytes } from '../lib/offlineDownloads';
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
  RefreshCw,
  ShieldCheck
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
  const [exportingId, setExportingId] = useState<string | null>(null);

  // Measure real phone storage whenever the Downloads screen opens
  useEffect(() => {
    void refreshDeviceStorage();
  }, [refreshDeviceStorage]);

  const completedDownloads = downloads.filter((d) => d.status === 'completed');
  const verifiedOfflineDownloads = completedDownloads.filter((d) => d.hasLocalBlob);
  const activeDownloads = downloads.filter(
    (d) => d.status === 'downloading' || d.status === 'paused' || d.status === 'error'
  );

  // Real phone storage readings from navigator.storage.estimate() + IndexedDB exact bytes
  const moviesBytes = deviceStorage?.moviesBytes ?? 0;
  const appUsageBytes = deviceStorage?.appUsageBytes ?? moviesBytes;
  const deviceQuotaBytes = deviceStorage?.deviceQuotaBytes ?? 0;
  const availableBytes = deviceStorage?.availableBytes ?? 0;
  const percentUsed = deviceStorage?.percentUsed ?? 0;

  const handleRefreshStorage = async () => {
    setRefreshingStorage(true);
    try {
      await refreshDeviceStorage();
      showToast('Phone storage measurement updated');
    } finally {
      setRefreshingStorage(false);
    }
  };

  const handleSaveToGallery = async (movieId: string) => {
    setExportingId(movieId);
    try {
      await saveDownloadToGallery(movieId);
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

      {/* Real Phone Storage Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#121217] border border-white/5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm font-medium">
          <div className="flex items-center gap-2 text-gray-200">
            <HardDrive className="w-4 h-4 text-red-500 shrink-0" />
            <span className="font-bold">Real Phone Storage</span>
            {deviceStorage?.isPersisted && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-md">
                <ShieldCheck className="w-3 h-3" />
                Protected
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-white font-bold font-mono text-xs sm:text-sm">
              {formatBytes(appUsageBytes)}
              {deviceQuotaBytes > 0 ? ` / ${formatBytes(deviceQuotaBytes)}` : ' used'}
            </span>
            <button
              type="button"
              onClick={handleRefreshStorage}
              disabled={refreshingStorage}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
              title="Refresh real phone storage count"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshingStorage ? 'animate-spin text-red-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Real Progress Bar */}
        <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-red-600 to-amber-500 rounded-full transition-all duration-500"
            style={{ width: `${appUsageBytes > 0 ? Math.max(2, Math.min(100, percentUsed)) : 0}%` }}
          />
        </div>

        {/* Real Storage Breakdown Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          <div className="px-3 py-2 rounded-xl bg-black/35 border border-white/5 flex items-center justify-between">
            <span className="text-[11px] text-gray-400">Offline Videos Saved</span>
            <span className="text-xs font-bold font-mono text-white">
              {formatBytes(moviesBytes)} ({verifiedOfflineDownloads.length})
            </span>
          </div>

          <div className="px-3 py-2 rounded-xl bg-black/35 border border-white/5 flex items-center justify-between">
            <span className="text-[11px] text-gray-400">Free Phone Space</span>
            <span className="text-xs font-bold font-mono text-emerald-400">
              {deviceQuotaBytes > 0 ? formatBytes(availableBytes) : 'Measuring...'}
            </span>
          </div>

          <div className="px-3 py-2 rounded-xl bg-black/35 border border-white/5 flex items-center justify-between">
            <span className="text-[11px] text-gray-400">Phone Quota Used</span>
            <span className="text-xs font-bold font-mono text-amber-400">
              {deviceQuotaBytes > 0 ? `${percentUsed.toFixed(2)}%` : '0%'}
            </span>
          </div>
        </div>

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
