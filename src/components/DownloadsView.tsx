import React from 'react';
import { useMovieContext } from '../context/MovieContext';
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
  Film,
  Sparkles,
  AlertTriangle
} from 'lucide-react';

export const DownloadsView: React.FC = () => {
  const {
    downloads,
    movies,
    offlineMode,
    setOfflineMode,
    playMovie,
    pauseDownload,
    resumeDownload,
    deleteDownload,
    clearAllDownloads,
    setActiveTab,
    showToast
  } = useMovieContext();

  const completedDownloads = downloads.filter((d) => d.status === 'completed');
  const activeDownloads = downloads.filter((d) => d.status === 'downloading' || d.status === 'paused');

  // Calculate used storage
  const totalUsedMb = completedDownloads.reduce((sum, d) => sum + (d.fileSizeMb || 450), 0);
  const totalStorageGb = 32;
  const usedStorageGb = +(totalUsedMb / 1024).toFixed(2);
  const percentUsed = Math.min(100, Math.round((usedStorageGb / totalStorageGb) * 100));

  const handlePlayDownloaded = (movieId: string) => {
    const movie = movies.find((m) => m.id === movieId);
    if (movie) {
      playMovie(movie);
    } else {
      showToast('Movie file not found in local library.');
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
            Stream high-definition movies without burning your MTN or Airtel Uganda data bundle.
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
            {offlineMode ? <WifiOff className="w-4 h-4 text-amber-400" /> : <Wifi className="w-4 h-4 text-emerald-400" />}
            <span>{offlineMode ? 'Offline Mode: ON' : 'Offline Mode: OFF'}</span>
          </button>

          {completedDownloads.length > 0 && (
            <button
              onClick={clearAllDownloads}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-red-600/20 text-gray-400 hover:text-red-400 border border-white/10 transition-colors cursor-pointer"
              title="Clear all downloaded files"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Storage Gauge Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#121217] border border-white/5 space-y-2">
        <div className="flex items-center justify-between text-xs sm:text-sm font-medium">
          <span className="flex items-center gap-2 text-gray-300">
            <HardDrive className="w-4 h-4 text-red-500" />
            Device Storage for Offline Movies
          </span>
          <span className="text-white font-bold font-mono">
            {totalUsedMb > 1024 ? `${usedStorageGb} GB` : `${totalUsedMb} MB`} / {totalStorageGb} GB
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-red-600 to-amber-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.max(4, percentUsed)}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-gray-400 pt-0.5">
          <span>{completedDownloads.length} movies ready to play offline</span>
          <span>{totalStorageGb - usedStorageGb} GB free space</span>
        </div>
      </div>

      {/* Active Downloading Section (if any) */}
      {activeDownloads.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <RotateCw className="w-4 h-4 animate-spin text-amber-400" />
            In Progress ({activeDownloads.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeDownloads.map((item) => (
              <div
                key={item.movieId}
                className="flex items-center gap-3 p-3 rounded-2xl bg-[#161622] border border-amber-500/20 shadow-md"
              >
                <img
                  src={item.posterUrl}
                  alt={item.movieTitle}
                  className="w-16 h-22 object-cover rounded-xl shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-sm text-white truncate">{item.movieTitle}</h3>
                    <span className="text-xs font-mono font-bold text-amber-400">
                      {item.progress}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden mb-1.5">
                    <div
                      className="h-full bg-amber-500 transition-all duration-300 rounded-full"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-gray-400">
                    <span>
                      {item.status === 'downloading'
                        ? `${item.speedMbps} MB/s • ${item.quality}`
                        : 'Paused'}
                    </span>
                    <div className="flex items-center gap-2">
                      {item.status === 'downloading' ? (
                        <button
                          onClick={() => pauseDownload(item.movieId)}
                          className="p-1 rounded bg-white/10 hover:bg-white/20 text-gray-200 cursor-pointer"
                          title="Pause"
                        >
                          <Pause className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => resumeDownload(item.movieId)}
                          className="p-1 rounded bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 cursor-pointer"
                          title="Resume"
                        >
                          <Play className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteDownload(item.movieId)}
                        className="p-1 rounded bg-white/10 hover:bg-red-600/30 text-gray-400 hover:text-red-400 cursor-pointer"
                        title="Cancel"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Downloads List */}
      <div className="space-y-4">
        <h2 className="text-base sm:text-lg font-bold text-white font-['Outfit']">
          Downloaded Movies ({completedDownloads.length})
        </h2>

        {completedDownloads.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedDownloads.map((item) => (
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
                  <div className="absolute top-1 left-1 bg-emerald-600 text-white rounded p-0.5">
                    <CheckCircle2 className="w-3 h-3" />
                  </div>
                </div>

                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-red-500">
                      {item.genre}
                    </span>
                    <h3 className="font-bold text-sm text-white truncate group-hover:text-red-400 transition-colors">
                      {item.movieTitle}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {item.quality} · {item.fileSizeMb} MB
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      Downloaded {item.downloadedAt || 'Recently'}
                    </p>
                  </div>

                  {/* Play & Delete buttons */}
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => handlePlayDownloaded(item.movieId)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm shadow-red-600/30 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Play Offline</span>
                    </button>

                    <button
                      onClick={() => deleteDownload(item.movieId)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-red-600/20 text-gray-400 hover:text-red-400 border border-white/5 transition-colors cursor-pointer"
                      title="Delete from device"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center bg-[#101017] rounded-3xl border border-white/5 p-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center text-gray-500">
              <DownloadCloud className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">No Offline Movies Saved</h3>
            <p className="text-sm text-gray-400 max-w-sm mx-auto mb-6">
              Download your favorite Ugandan action, comedy, or VJ translated movies to enjoy them anywhere, even without an internet connection.
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
