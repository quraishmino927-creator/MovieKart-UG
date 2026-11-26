import React, { useRef, useState, useEffect } from 'react';
import { useMovieContext } from '../context/MovieContext';
import {
  Play,
  RotateCcw,
  X,
  Download,
  CheckCircle2,
  MessageSquareQuote,
  Film
} from 'lucide-react';
import { VJTrack } from '../types';
import { isYouTubeUrl, toYouTubeEmbedUrl, resolveYouTubeStream } from '../lib/liveChannels';
import { getOfflineVideoRecord } from '../lib/offlineDownloads';

function toDriveEmbedUrl(rawUrl: string): string {
  let trimmed = (rawUrl || '').trim();
  if (trimmed && !/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }
  const fileMatch = trimmed.match(/drive\.google\.com\/file\/(?:u\/\d+\/)?d\/([^/?#]+)/i);
  if (fileMatch && fileMatch[1]) {
    return `https://drive.google.com/file/d/${fileMatch[1]}/preview`;
  }
  const idMatch = trimmed.match(/[?&]id=([^&#]+)/i);
  if (idMatch && idMatch[1]) {
    return `https://drive.google.com/file/d/${idMatch[1]}/preview`;
  }
  return trimmed;
}

export const VideoPlayerModal: React.FC = () => {
  const {
    currentlyPlayingItem,
    selectedVJTrack,
    closePlayer,
    startDownload,
    getDownloadStatus,
    movies,
    playMovie,
    updateWatchProgress,
    showToast
  } = useMovieContext();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastSavedTimeRef = useRef<number>(0);

  const [showVJCommentary, setShowVJCommentary] = useState<boolean>(true);
  const [currentVJQuote, setCurrentVJQuote] = useState<string>('');
  const [hasEnded, setHasEnded] = useState<boolean>(false);
  const [activeVJTrack, setActiveVJTrack] = useState<VJTrack | null>(selectedVJTrack);

  useEffect(() => {
    setActiveVJTrack(selectedVJTrack);
  }, [selectedVJTrack]);

  useEffect(() => {
    setHasEnded(false);
    lastSavedTimeRef.current = 0;
  }, [currentlyPlayingItem?.id]);

  // Format time (seconds -> mm:ss or hh:mm:ss)
  const formatTime = (timeInSec: number) => {
    if (isNaN(timeInSec)) return '00:00';
    const hrs = Math.floor(timeInSec / 3600);
    const mins = Math.floor((timeInSec % 3600) / 60);
    const secs = Math.floor(timeInSec % 60);

    if (hrs > 0) {
      return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const item = currentlyPlayingItem;
  const videoUrl = item?.videoUrl || '';
  const [localOfflineUrl, setLocalOfflineUrl] = useState<string>('');

  // Load real offline Blob from IndexedDB if this movie/episode has been downloaded to the phone
  useEffect(() => {
    if (!item || item.isTrailer) {
      setLocalOfflineUrl('');
      return;
    }

    let cancelled = false;
    let createdObjectUrl = '';

    getOfflineVideoRecord(item.id)
      .then((record) => {
        if (cancelled) return;
        if (record?.blob) {
          createdObjectUrl = URL.createObjectURL(record.blob);
          setLocalOfflineUrl(createdObjectUrl);
        } else {
          setLocalOfflineUrl('');
        }
      })
      .catch(() => {
        if (!cancelled) setLocalOfflineUrl('');
      });

    return () => {
      cancelled = true;
      if (createdObjectUrl) {
        URL.revokeObjectURL(createdObjectUrl);
      }
    };
  }, [item?.id, item?.isTrailer]);

  const isPlayingLocalOffline = Boolean(localOfflineUrl);
  const isGoogleDrive = !isPlayingLocalOffline && videoUrl.toLowerCase().includes('drive.google.com');
  const isYouTube = !isPlayingLocalOffline && !isGoogleDrive && isYouTubeUrl(videoUrl);
  const isIframeEmbed = isGoogleDrive || isYouTube;
  const driveSrc = isGoogleDrive ? toDriveEmbedUrl(videoUrl) : '';
  const [resolvedYoutubeUrl, setResolvedYoutubeUrl] = useState<string>('');

  useEffect(() => {
    if (!isYouTube || !videoUrl) {
      setResolvedYoutubeUrl('');
      return;
    }
    let cancelled = false;
    setResolvedYoutubeUrl(toYouTubeEmbedUrl(videoUrl));
    resolveYouTubeStream(videoUrl)
      .then((res) => {
        if (!cancelled && res.embedUrl) {
          setResolvedYoutubeUrl(res.embedUrl);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isYouTube, videoUrl]);

  const youtubeSrc = isYouTube ? resolvedYoutubeUrl || toYouTubeEmbedUrl(videoUrl) : '';
  const effectiveVideoSrc = localOfflineUrl || videoUrl;

  const parentMovie = item
    ? item.movieId
      ? movies.find((m) => m.id === item.movieId)
      : movies.find((m) => `${m.id}_trailer` === item.id)
    : undefined;

  const saveProgress = (time: number, totalDuration?: number) => {
    if (!item || item.isTrailer || time < 5) return;
    const dur = totalDuration || videoRef.current?.duration || 1;
    if (dur <= 0) return;

    if (item.episodeNumber) {
      updateWatchProgress({
        id: item.id,
        itemId: item.id,
        type: 'episode',
        title: item.subTitle?.split(': ')[1] || item.title,
        showTitle: item.showTitle || item.title,
        seasonNumber: item.seasonNumber,
        episodeNumber: item.episodeNumber,
        thumbnailUrl: item.posterUrl,
        backdropUrl: item.backdropUrl,
        videoUrl: item.videoUrl,
        genre: 'Ugandan Hits',
        durationString: formatTime(dur),
        currentTime: time,
        duration: dur,
        vjTrackName: activeVJTrack?.name,
        vjTrackId: activeVJTrack?.id
      });
    } else {
      const matchedMovie = parentMovie || movies.find((m) => m.id === item.id || m.id === item.movieId);
      updateWatchProgress({
        id: matchedMovie?.id || item.id,
        itemId: matchedMovie?.id || item.id,
        type: 'movie',
        title: matchedMovie?.title || item.title,
        thumbnailUrl: matchedMovie?.backdropUrl || matchedMovie?.posterUrl || item.posterUrl,
        backdropUrl: matchedMovie?.backdropUrl || item.backdropUrl,
        videoUrl: item.videoUrl,
        genre: matchedMovie?.genre || 'Action',
        durationString: matchedMovie?.duration || formatTime(dur),
        currentTime: time,
        duration: dur,
        vjTrackName: activeVJTrack?.name,
        vjTrackId: activeVJTrack?.id
      });
    }
  };

  const handleExitPlayer = () => {
    if (videoRef.current && !isGoogleDrive) {
      saveProgress(videoRef.current.currentTime, videoRef.current.duration);
    }
    closePlayer();
  };

  // Keyboard shortcut: Escape to close player
  useEffect(() => {
    if (!currentlyPlayingItem) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        } else {
          handleExitPlayer();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentlyPlayingItem?.id, isGoogleDrive]);

  // Simulate VJ Commentary periodic speech balloons
  useEffect(() => {
    if (!currentlyPlayingItem || !activeVJTrack || !activeVJTrack.commentaryQuotes?.length || !showVJCommentary) {
      setCurrentVJQuote('');
      return;
    }

    const quotes = activeVJTrack.commentaryQuotes;
    let quoteIndex = 0;

    setCurrentVJQuote(quotes[0]);
    const hideInitial = setTimeout(() => setCurrentVJQuote(''), 5000);

    const interval = setInterval(() => {
      quoteIndex = (quoteIndex + 1) % quotes.length;
      setCurrentVJQuote(quotes[quoteIndex]);
      setTimeout(() => setCurrentVJQuote(''), 4500);
    }, 14000);

    return () => {
      clearTimeout(hideInitial);
      clearInterval(interval);
    };
  }, [currentlyPlayingItem?.id, activeVJTrack, showVJCommentary]);

  if (!item) return null;

  const downloadInfo = getDownloadStatus(item.id);
  const isDownloaded = Boolean(downloadInfo?.status === 'completed' && downloadInfo?.hasLocalBlob);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const cur = videoRef.current.currentTime;
      if (Math.abs(cur - lastSavedTimeRef.current) >= 4) {
        lastSavedTimeRef.current = cur;
        saveProgress(cur, videoRef.current.duration);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration;
      if (item.startTime && item.startTime > 0 && item.startTime < dur) {
        videoRef.current.currentTime = item.startTime;
        lastSavedTimeRef.current = item.startTime;
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col overflow-hidden">
      {/* Top Bar (Title, Audio Track Switcher & Close) */}
      <div className="w-full px-4 sm:px-6 py-3 bg-black/95 border-b border-white/10 flex items-center justify-between gap-3 shrink-0 z-30">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={handleExitPlayer}
            aria-label="Exit player"
            className="p-2 rounded-full bg-white/10 hover:bg-red-600 text-white transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-white font-['Outfit'] truncate">
                {item.title}
              </h2>
              {item.isTrailer && (
                <span className="bg-red-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wider shrink-0">
                  Teaser
                </span>
              )}
            </div>
            {item.subTitle && (
              <p className="text-xs text-red-400 font-semibold truncate">{item.subTitle}</p>
            )}
            <p className="text-xs text-gray-400 flex items-center gap-2 truncate">
              {item.year && <span>{item.year}</span>}
              {item.quality && (
                <>
                  <span>·</span>
                  <span>{item.quality}</span>
                </>
              )}
              {activeVJTrack && (
                <>
                  <span>·</span>
                  <span className="text-red-400 font-semibold">{activeVJTrack.name}</span>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {item.isTrailer && parentMovie && (
            <button
              onClick={() => {
                setHasEnded(false);
                playMovie(parentMovie);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-lg shadow-red-600/30 transition-all cursor-pointer"
              title="Switch to full movie"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span className="hidden sm:inline">Watch</span>
              <span>Full Movie</span>
            </button>
          )}

          {item.vjTracks && item.vjTracks.length > 1 && (
            <select
              value={activeVJTrack?.id || ''}
              onChange={(e) => {
                const tr = item.vjTracks?.find((t) => t.id === e.target.value) || null;
                setActiveVJTrack(tr);
                showToast(`Switched audio to ${tr?.name || 'Default'}`);
              }}
              className="bg-[#181822] text-xs font-semibold text-red-400 border border-white/20 rounded-lg px-2 py-1.5 focus:outline-none cursor-pointer hidden sm:block"
            >
              {item.vjTracks.map((tr) => (
                <option key={tr.id} value={tr.id}>
                  {tr.name} ({tr.language})
                </option>
              ))}
            </select>
          )}

          {activeVJTrack && (
            <button
              onClick={() => {
                setShowVJCommentary(!showVJCommentary);
                showToast(showVJCommentary ? 'VJ Subtitles Hidden' : 'VJ Commentary Enabled');
              }}
              className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-colors cursor-pointer ${
                showVJCommentary
                  ? 'bg-red-600/30 text-red-400 border-red-500/50'
                  : 'bg-white/10 text-gray-400 border-white/10'
              }`}
              title="Toggle VJ Audio/Commentary subtitles"
            >
              <MessageSquareQuote className="w-4 h-4 text-red-400" />
              <span className="hidden sm:inline">VJ Commentary</span>
            </button>
          )}

          {!isDownloaded && !isYouTube && !item.isTrailer && (
            <button
              onClick={() =>
                startDownload({
                  id: item.id,
                  title: item.title,
                  genre: 'Stream',
                  posterUrl: item.posterUrl,
                  videoUrl: item.videoUrl,
                  fileSizeMb: item.fileSizeMb
                })
              }
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Download for offline viewing"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Watch Player Area (Black Background) */}
      <div className="relative flex-1 w-full bg-black flex items-center justify-center overflow-hidden p-0 sm:p-4">
        {isGoogleDrive ? (
          <iframe
            src={driveSrc}
            width="100%"
            height="500px"
            style={{ border: '0', backgroundColor: '#000000' }}
            allow="autoplay; fullscreen; encrypted-media"
            allowFullScreen
            title={item.title}
            className="w-full max-w-6xl bg-black"
          />
        ) : isYouTube ? (
          <iframe
            src={youtubeSrc}
            width="100%"
            height="500px"
            style={{ border: '0', backgroundColor: '#000000' }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            allowFullScreen
            title={item.title}
            className="w-full max-w-6xl aspect-video bg-black"
          />
        ) : (
          <video
            ref={videoRef}
            controls
            autoPlay
            playsInline
            src={effectiveVideoSrc}
            poster={item.backdropUrl || item.posterUrl}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setHasEnded(true)}
            className="w-full h-full max-h-full bg-black object-contain"
          />
        )}

        {/* Offline Badge Notification (only shown when genuinely playing from local phone storage) */}
        {isPlayingLocalOffline && !item.isTrailer && (
          <div className="absolute top-4 left-4 z-20 bg-emerald-600/90 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-lg backdrop-blur-sm pointer-events-none">
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            <span>Playing from Phone Offline Storage</span>
          </div>
        )}

        {/* Ugandan VJ Live Commentary Speech Bubble overlay (non-iframe direct video streams) */}
        {!isIframeEmbed && activeVJTrack && showVJCommentary && currentVJQuote && (
          <div className="absolute top-4 right-4 sm:left-6 sm:right-auto z-20 max-w-xs sm:max-w-md pointer-events-none">
            <div className="bg-red-950/90 border border-red-500/60 text-white rounded-2xl p-3 shadow-2xl backdrop-blur-md">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="font-extrabold text-xs text-red-400 font-['Outfit']">
                  {activeVJTrack.name} Live Commentary ({activeVJTrack.language})
                </span>
              </div>
              <p className="text-xs sm:text-sm font-bold text-white tracking-wide">
                "{currentVJQuote}"
              </p>
            </div>
          </div>
        )}

        {/* Teaser Trailer Completion Screen (for standard video files) */}
        {hasEnded && item.isTrailer && !isIframeEmbed && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-red-900 border border-red-500/50 text-white flex items-center justify-center mb-4 shadow-xl shadow-red-950/60">
              <Film className="w-8 h-8" />
            </div>
            <span className="text-[11px] uppercase font-extrabold tracking-widest text-red-500 mb-1">
              Official Teaser Finished
            </span>
            <h3 className="text-2xl sm:text-3xl font-black font-['Outfit'] text-white mb-2">
              Ready for the Full Experience?
            </h3>
            <p className="text-xs sm:text-sm text-gray-300 max-w-md mb-6 leading-relaxed">
              Stream {parentMovie?.title || item.title.replace(' (Official Teaser)', '')} with full Luganda VJ commentary tracks, offline download options, and 4K cinema audio.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {parentMovie && (
                <button
                  onClick={() => {
                    setHasEnded(false);
                    playMovie(parentMovie);
                  }}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-xl shadow-red-600/40 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Watch Full Movie Now</span>
                </button>
              )}
              <button
                onClick={() => {
                  setHasEnded(false);
                  if (videoRef.current) {
                    videoRef.current.currentTime = 0;
                    videoRef.current.play().catch(() => {});
                  }
                }}
                className="flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/20 transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Replay Teaser</span>
              </button>
              <button
                onClick={handleExitPlayer}
                className="px-4 py-3.5 rounded-xl bg-transparent hover:bg-white/5 text-gray-400 hover:text-white text-sm transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
