import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useMovieContext } from '../context/MovieContext';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  ArrowLeft,
  Download,
  CheckCircle2,
  MessageSquareQuote,
  Film,
  Loader2,
  WifiOff,
  Volume2,
  VolumeX,
  Settings,
  Maximize,
  Minimize,
  Smartphone,
  AlertCircle,
  RefreshCw,
  Check
} from 'lucide-react';
import { VJTrack } from '../types';
import { isYouTubeUrl, toYouTubeEmbedUrl, resolveYouTubeStream } from '../lib/liveChannels';
import {
  getOfflineVideoRecord,
  extractGoogleDriveFileId,
  buildNetlifyDriveDownloadUrl
} from '../lib/offlineDownloads';

type QualityOption = 'Auto' | '1080p' | '720p' | '480p' | '360p';

const QUALITY_OPTIONS: { value: QualityOption; label: string; hint: string }[] = [
  { value: 'Auto', label: 'Auto (Recommended)', hint: 'Adapts to your connection' },
  { value: '1080p', label: '1080p Full HD', hint: 'Best picture quality' },
  { value: '720p', label: '720p HD', hint: 'Balanced data & clarity' },
  { value: '480p', label: '480p Data Saver', hint: 'Best for slower mobile networks' },
  { value: '360p', label: '360p Low Data', hint: 'Fastest loading on 3G/weak signal' },
];

const PLAYBACK_SPEEDS = [0.75, 1, 1.25, 1.5];

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

  const playerRootRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastSavedTimeRef = useRef<number>(0);
  const hideControlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const slowNetworkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTapRef = useRef<{ time: number; side: 'left' | 'right' | 'center' }>({
    time: 0,
    side: 'center',
  });
  const pendingResumeTimeRef = useRef<number | null>(null);

  const [viewport, setViewport] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1280,
    height: typeof window !== 'undefined' ? window.innerHeight : 720,
  }));
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [forcedLandscape, setForcedLandscape] = useState<boolean>(false);

  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [bufferedEnd, setBufferedEnd] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [selectedQuality, setSelectedQuality] = useState<QualityOption>('Auto');
  const [reloadNonce, setReloadNonce] = useState<number>(0);

  // Controls & overlays
  const [controlsVisible, setControlsVisible] = useState<boolean>(true);
  const [showSettingsMenu, setShowSettingsMenu] = useState<boolean>(false);
  const [isBuffering, setIsBuffering] = useState<boolean>(true);
  const [showSlowNetworkPrompt, setShowSlowNetworkPrompt] = useState<boolean>(false);
  const [playbackError, setPlaybackError] = useState<string>('');
  const [seekFeedback, setSeekFeedback] = useState<'back' | 'forward' | null>(null);

  // VJ commentary & end state
  const [showVJCommentary, setShowVJCommentary] = useState<boolean>(true);
  const [currentVJQuote, setCurrentVJQuote] = useState<string>('');
  const [hasEnded, setHasEnded] = useState<boolean>(false);
  const [activeVJTrack, setActiveVJTrack] = useState<VJTrack | null>(selectedVJTrack);

  // Offline blob lookup
  const [localOfflineUrl, setLocalOfflineUrl] = useState<string>('');
  const [checkingOfflineBlob, setCheckingOfflineBlob] = useState<boolean>(false);
  const [resolvedYoutubeUrl, setResolvedYoutubeUrl] = useState<string>('');

  const item = currentlyPlayingItem;
  const videoUrl = item?.videoUrl || '';

  useEffect(() => {
    setActiveVJTrack(selectedVJTrack);
  }, [selectedVJTrack]);

  // Reset per-item playback state when opening a new movie/episode
  useEffect(() => {
    if (!item) return;
    setHasEnded(false);
    setPlaybackError('');
    setIsBuffering(true);
    setShowSlowNetworkPrompt(false);
    setCurrentTime(0);
    setDuration(0);
    setBufferedEnd(0);
    setShowSettingsMenu(false);
    setControlsVisible(true);
    setForcedLandscape(false);
    lastSavedTimeRef.current = 0;
    pendingResumeTimeRef.current = item.startTime && item.startTime > 0 ? item.startTime : null;
  }, [item?.id]);

  // Track viewport size & orientation changes + lock body scroll while player is open
  useEffect(() => {
    if (!item) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setViewport({ width: w, height: h });
      // If user physically rotated phone into landscape, clear CSS forcedLandscape so native landscape takes over
      if (w > h) {
        setForcedLandscape(false);
      }
    };

    const handleFullscreenChange = () => {
      const doc = document as Document & { webkitFullscreenElement?: Element | null };
      const fsActive = Boolean(document.fullscreenElement || doc.webkitFullscreenElement);
      setIsFullscreen(fsActive);
      handleResize();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    handleResize();

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, [item?.id]);

  const isPortraitPhone = viewport.height > viewport.width && viewport.width < 768;
  const isMobileViewport = Math.min(viewport.width, viewport.height) < 768;
  const isLandscapeView = !isPortraitPhone || forcedLandscape;

  // Attempt native fullscreen + landscape lock
  const enterFullscreenLandscape = useCallback(async (allowCssFallback = false) => {
    const targetEl = (playerRootRef.current || document.documentElement) as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void> | void;
    };
    const orientationApi = window.screen?.orientation as
      | (ScreenOrientation & { lock?: (orientation: string) => Promise<void> })
      | undefined;

    let lockedNativeOrientation = false;

    try {
      if (!document.fullscreenElement) {
        if (typeof targetEl.requestFullscreen === 'function') {
          await targetEl.requestFullscreen();
        } else if (typeof targetEl.webkitRequestFullscreen === 'function') {
          await Promise.resolve(targetEl.webkitRequestFullscreen());
        }
      }
    } catch {
      // Some mobile browsers require an explicit gesture or disallow element fullscreen
    }

    try {
      if (orientationApi && typeof orientationApi.lock === 'function') {
        await orientationApi.lock('landscape');
        lockedNativeOrientation = true;
      }
    } catch {
      lockedNativeOrientation = false;
    }

    // If user explicitly tapped Rotate / Fullscreen in portrait and browser didn't rotate natively,
    // use CSS forced landscape so the movie still fills 100% of the screen horizontally.
    if (allowCssFallback && !lockedNativeOrientation && window.innerHeight > window.innerWidth) {
      setForcedLandscape(true);
    }
  }, []);

  const exitFullscreenLandscape = useCallback(async () => {
    setForcedLandscape(false);
    try {
      const orientationApi = window.screen?.orientation as
        | (ScreenOrientation & { unlock?: () => void })
        | undefined;
      if (orientationApi && typeof orientationApi.unlock === 'function') {
        orientationApi.unlock();
      }
    } catch {
      // Ignore
    }
    try {
      const doc = document as Document & { webkitExitFullscreen?: () => Promise<void> | void };
      if (document.fullscreenElement && typeof document.exitFullscreen === 'function') {
        await document.exitFullscreen();
      } else if (typeof doc.webkitExitFullscreen === 'function') {
        await Promise.resolve(doc.webkitExitFullscreen());
      }
    } catch {
      // Ignore
    }
  }, []);

  // Auto-request fullscreen + landscape when Watch Now opens on phones
  useEffect(() => {
    if (!item) return;
    if (isMobileViewport) {
      void enterFullscreenLandscape(false);
    }
  }, [item?.id]);

  // ALWAYS check IndexedDB FIRST before streaming from network
  useEffect(() => {
    if (!item || item.isTrailer) {
      setLocalOfflineUrl('');
      setCheckingOfflineBlob(false);
      return;
    }

    let cancelled = false;
    let createdObjectUrl = '';
    setCheckingOfflineBlob(true);
    setLocalOfflineUrl('');

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
      })
      .finally(() => {
        if (!cancelled) setCheckingOfflineBlob(false);
      });

    return () => {
      cancelled = true;
      if (createdObjectUrl) {
        URL.revokeObjectURL(createdObjectUrl);
      }
    };
  }, [item?.id, item?.isTrailer]);

  const isDeviceOffline = typeof navigator !== 'undefined' && !navigator.onLine;
  const isStrictOfflinePlayback = Boolean(item?.offlineOnly || isDeviceOffline);
  const isPlayingLocalOffline = Boolean(localOfflineUrl);
  const missingOfflineBlob = !checkingOfflineBlob && isStrictOfflinePlayback && !isPlayingLocalOffline;

  // Google Drive videos NEVER use an iframe — they stream directly into native <video> via our proxy
  const googleDriveFileId =
    !checkingOfflineBlob && !isPlayingLocalOffline && !isStrictOfflinePlayback
      ? extractGoogleDriveFileId(videoUrl)
      : null;

  // Keep YouTube embed ONLY for YouTube trailer links (never for Google Drive movies)
  const isYouTube =
    !checkingOfflineBlob &&
    !isPlayingLocalOffline &&
    !isStrictOfflinePlayback &&
    !googleDriveFileId &&
    isYouTubeUrl(videoUrl);

  useEffect(() => {
    if (!isYouTube || !videoUrl) {
      setResolvedYoutubeUrl('');
      return;
    }
    let cancelled = false;
    setResolvedYoutubeUrl(toYouTubeEmbedUrl(videoUrl));
    setIsBuffering(false);
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

  const effectiveVideoSrc = (() => {
    if (localOfflineUrl) return localOfflineUrl;
    if (isStrictOfflinePlayback) return '';
    if (googleDriveFileId) {
      const base = buildNetlifyDriveDownloadUrl(googleDriveFileId);
      const qParam = selectedQuality !== 'Auto' ? `&q=${encodeURIComponent(selectedQuality)}` : '';
      const rParam = reloadNonce > 0 ? `&r=${reloadNonce}` : '';
      return `${base}&mode=stream${qParam}${rParam}`;
    }
    if (!videoUrl) return '';
    if (reloadNonce > 0) {
      const sep = videoUrl.includes('?') ? '&' : '?';
      return `${videoUrl}${sep}mk_r=${reloadNonce}`;
    }
    return videoUrl;
  })();

  // Auto-hide controls after 3 seconds of inactivity while playing (YouTube / Netflix behavior)
  const scheduleHideControls = useCallback(() => {
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
      hideControlsTimerRef.current = null;
    }
    if (!isPlaying || showSettingsMenu || playbackError || hasEnded) return;
    hideControlsTimerRef.current = setTimeout(() => {
      setControlsVisible(false);
      setShowVolumeSlider(false);
    }, 3000);
  }, [isPlaying, showSettingsMenu, playbackError, hasEnded]);

  useEffect(() => {
    if (controlsVisible) {
      scheduleHideControls();
    }
    return () => {
      if (hideControlsTimerRef.current) {
        clearTimeout(hideControlsTimerRef.current);
      }
    };
  }, [controlsVisible, isPlaying, showSettingsMenu, playbackError, hasEnded, scheduleHideControls]);

  const revealControlsTemporarily = useCallback(() => {
    setControlsVisible(true);
    scheduleHideControls();
  }, [scheduleHideControls]);

  // 10-second slow network detector while buffering
  useEffect(() => {
    if (slowNetworkTimerRef.current) {
      clearTimeout(slowNetworkTimerRef.current);
      slowNetworkTimerRef.current = null;
    }

    if (
      !item ||
      isYouTube ||
      isPlayingLocalOffline ||
      checkingOfflineBlob ||
      missingOfflineBlob ||
      playbackError ||
      !isBuffering ||
      selectedQuality === '480p' ||
      selectedQuality === '360p'
    ) {
      setShowSlowNetworkPrompt(false);
      return;
    }

    slowNetworkTimerRef.current = setTimeout(() => {
      setShowSlowNetworkPrompt(true);
    }, 10000);

    return () => {
      if (slowNetworkTimerRef.current) {
        clearTimeout(slowNetworkTimerRef.current);
        slowNetworkTimerRef.current = null;
      }
    };
  }, [
    item?.id,
    isYouTube,
    isPlayingLocalOffline,
    checkingOfflineBlob,
    missingOfflineBlob,
    playbackError,
    isBuffering,
    selectedQuality
  ]);

  // Apply playbackRate & volume to <video>
  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = playbackRate;
  }, [playbackRate, effectiveVideoSrc]);

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.volume = isMuted ? 0 : volume;
    videoRef.current.muted = isMuted;
  }, [volume, isMuted, effectiveVideoSrc]);

  // Format time (seconds -> m:ss or h:mm:ss)
  const formatTime = (timeInSec: number) => {
    if (!Number.isFinite(timeInSec) || timeInSec < 0) return '0:00';
    const hrs = Math.floor(timeInSec / 3600);
    const mins = Math.floor((timeInSec % 3600) / 60);
    const secs = Math.floor(timeInSec % 60);
    if (hrs > 0) {
      return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const parentMovie = item
    ? item.movieId
      ? movies.find((m) => m.id === item.movieId)
      : movies.find((m) => `${m.id}_trailer` === item.id)
    : undefined;

  const saveProgress = (time: number, totalDuration?: number) => {
    if (!item || item.isTrailer || time < 5) return;
    const dur = totalDuration || videoRef.current?.duration || 1;
    if (!Number.isFinite(dur) || dur <= 0) return;

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
    if (videoRef.current && !isYouTube) {
      saveProgress(videoRef.current.currentTime, videoRef.current.duration);
    }
    void exitFullscreenLandscape();
    closePlayer();
  };

  // Playback control helpers
  const togglePlayPause = () => {
    const vid = videoRef.current;
    if (!vid) return;
    setHasEnded(false);
    if (vid.paused || vid.ended) {
      vid.play().catch(() => {});
    } else {
      vid.pause();
    }
    revealControlsTemporarily();
  };

  const skipBySeconds = (delta: number) => {
    const vid = videoRef.current;
    if (!vid) return;
    const total = Number.isFinite(vid.duration) && vid.duration > 0 ? vid.duration : duration;
    const nextTime = Math.max(0, Math.min(total || vid.currentTime + delta, vid.currentTime + delta));
    vid.currentTime = nextTime;
    setCurrentTime(nextTime);
    setSeekFeedback(delta < 0 ? 'back' : 'forward');
    setTimeout(() => setSeekFeedback(null), 550);
    revealControlsTemporarily();
  };

  const handleSeekChange = (nextSeconds: number) => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.currentTime = nextSeconds;
    setCurrentTime(nextSeconds);
    revealControlsTemporarily();
  };

  const handleToggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      if (volume === 0) setVolume(0.8);
    } else {
      setIsMuted(true);
    }
    revealControlsTemporarily();
  };

  const handleQualitySelect = (quality: QualityOption) => {
    const vid = videoRef.current;
    if (vid && vid.currentTime > 0) {
      pendingResumeTimeRef.current = vid.currentTime;
    }
    setSelectedQuality(quality);
    setShowSettingsMenu(false);
    setShowSlowNetworkPrompt(false);
    if (quality === '480p' || quality === '360p') {
      setIsBuffering(true);
      setReloadNonce((n) => n + 1);
      showToast(`MovieKart switched to ${quality} Data Saver for smoother playback`);
    } else {
      showToast(`MovieKart quality set to ${quality}`);
    }
    revealControlsTemporarily();
  };

  const handleRetryPlayback = () => {
    const vid = videoRef.current;
    if (vid && vid.currentTime > 0) {
      pendingResumeTimeRef.current = vid.currentTime;
    }
    setPlaybackError('');
    setIsBuffering(true);
    setShowSlowNetworkPrompt(false);
    setReloadNonce((n) => n + 1);
  };

  const handleRotateToggle = () => {
    if (forcedLandscape) {
      void exitFullscreenLandscape();
    } else if (isPortraitPhone) {
      void enterFullscreenLandscape(true);
    } else if (isFullscreen) {
      void exitFullscreenLandscape();
    } else {
      void enterFullscreenLandscape(true);
    }
    revealControlsTemporarily();
  };

  const handleFullscreenToggle = () => {
    if (isFullscreen || forcedLandscape) {
      void exitFullscreenLandscape();
    } else {
      void enterFullscreenLandscape(isPortraitPhone);
    }
    revealControlsTemporarily();
  };

  // Single tap toggles controls; double-tap left/right skips -10s/+10s
  const handleVideoSurfaceTap = (e: React.MouseEvent<HTMLDivElement>) => {
    if (showSettingsMenu) {
      setShowSettingsMenu(false);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = rect.width > 0 ? (e.clientX - rect.left) / rect.width : 0.5;
    const side: 'left' | 'right' | 'center' = relX < 0.33 ? 'left' : relX > 0.67 ? 'right' : 'center';
    const now = Date.now();

    if (now - lastTapRef.current.time < 280 && lastTapRef.current.side === side && side !== 'center') {
      lastTapRef.current = { time: 0, side: 'center' };
      skipBySeconds(side === 'left' ? -10 : 10);
      return;
    }

    lastTapRef.current = { time: now, side };
    setControlsVisible((prev) => !prev);
  };

  // Keyboard shortcuts (Space, ArrowLeft/Right, Escape, M, F)
  useEffect(() => {
    if (!currentlyPlayingItem) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (forcedLandscape || document.fullscreenElement) {
          void exitFullscreenLandscape();
        } else {
          handleExitPlayer();
        }
      } else if (e.key === ' ' && !isYouTube) {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === 'ArrowLeft' && !isYouTube) {
        e.preventDefault();
        skipBySeconds(-10);
      } else if (e.key === 'ArrowRight' && !isYouTube) {
        e.preventDefault();
        skipBySeconds(10);
      } else if (e.key.toLowerCase() === 'm' && !isYouTube) {
        handleToggleMute();
      } else if (e.key.toLowerCase() === 'f') {
        handleFullscreenToggle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentlyPlayingItem?.id, isYouTube, forcedLandscape, isMuted, volume, duration]);

  // Periodic Ugandan VJ live commentary overlay
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
    const vid = videoRef.current;
    if (!vid) return;
    const cur = vid.currentTime;
    setCurrentTime(cur);
    if (Number.isFinite(vid.duration) && vid.duration > 0) {
      setDuration(vid.duration);
    }
    if (vid.buffered && vid.buffered.length > 0) {
      try {
        setBufferedEnd(vid.buffered.end(vid.buffered.length - 1));
      } catch {
        // ignore buffered range error
      }
    }
    if (Math.abs(cur - lastSavedTimeRef.current) >= 4) {
      lastSavedTimeRef.current = cur;
      saveProgress(cur, vid.duration);
    }
  };

  const handleLoadedMetadata = () => {
    const vid = videoRef.current;
    if (!vid) return;
    const dur = vid.duration;
    if (Number.isFinite(dur) && dur > 0) {
      setDuration(dur);
    }
    const resumeTarget = pendingResumeTimeRef.current;
    if (resumeTarget && resumeTarget > 0 && (!Number.isFinite(dur) || resumeTarget < dur)) {
      vid.currentTime = resumeTarget;
      setCurrentTime(resumeTarget);
      lastSavedTimeRef.current = resumeTarget;
      pendingResumeTimeRef.current = null;
    }
    vid.playbackRate = playbackRate;
    vid.volume = isMuted ? 0 : volume;
    vid.muted = isMuted;
  };

  const playedPercent = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;
  const bufferedPercent = duration > 0 ? Math.min(100, Math.max(0, (bufferedEnd / duration) * 100)) : 0;

  // Root container:
  // - If CSS forcedLandscape is active on a portrait phone, rotate 90deg to fill 100dvh x 100vw edge-to-edge.
  // - Otherwise fill full 100vw x 100dvh with z-[100] above everything (no header/bottom nav visible).
  const rootClassName =
    forcedLandscape && isPortraitPhone
      ? 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90 w-[100dvh] h-[100vw] z-[100] bg-black flex flex-col overflow-hidden select-none'
      : 'fixed inset-0 w-screen h-[100dvh] z-[100] bg-black flex flex-col overflow-hidden select-none';

  // Video stage:
  // - In landscape / fullscreen: 100% width x 100% height (fills entire 100vw x 100vh viewport, NO huge bars).
  // - In portrait phone fallback: 100% width 16:9 pinned cleanly at the TOP, with movie title + rotate + controls below.
  const stageClassName = isLandscapeView
    ? 'relative w-full h-full flex-1 bg-black flex items-center justify-center overflow-hidden'
    : 'relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden shrink-0';

  const renderSettingsPopover = () => (
    <div
      onClick={(e) => e.stopPropagation()}
      className="absolute bottom-16 right-3 sm:right-5 z-50 w-64 max-h-[75%] overflow-y-auto rounded-2xl bg-[#111118]/95 border border-white/15 shadow-2xl backdrop-blur-xl p-3 text-left"
    >
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
        <span className="text-xs font-extrabold text-white tracking-wide uppercase">
          MovieKart Settings
        </span>
        <span className="text-[10px] font-bold text-[#E50914]">{selectedQuality}</span>
      </div>

      <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1.5 px-1">
        Video Quality
      </p>
      <div className="space-y-1 mb-3">
        {QUALITY_OPTIONS.map((opt) => {
          const active = selectedQuality === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleQualitySelect(opt.value)}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                active
                  ? 'bg-[#E50914]/20 text-white border border-[#E50914]/50 font-bold'
                  : 'text-gray-300 hover:bg-white/10 border border-transparent'
              }`}
            >
              <div className="min-w-0">
                <div className="truncate">{opt.label}</div>
                <div className="text-[10px] text-gray-400 truncate">{opt.hint}</div>
              </div>
              {active && <Check className="w-3.5 h-3.5 text-[#E50914] shrink-0 ml-2" />}
            </button>
          );
        })}
      </div>

      <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1.5 px-1">
        Playback Speed
      </p>
      <div className="grid grid-cols-4 gap-1 mb-2">
        {PLAYBACK_SPEEDS.map((spd) => (
          <button
            key={spd}
            type="button"
            onClick={() => {
              setPlaybackRate(spd);
              revealControlsTemporarily();
            }}
            className={`py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
              playbackRate === spd
                ? 'bg-[#E50914] text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            {spd}x
          </button>
        ))}
      </div>

      {activeVJTrack && (
        <button
          type="button"
          onClick={() => {
            setShowVJCommentary((prev) => !prev);
            revealControlsTemporarily();
          }}
          className="w-full mt-1 flex items-center justify-between px-2.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-200 cursor-pointer"
        >
          <span className="flex items-center gap-1.5 font-semibold">
            <MessageSquareQuote className="w-3.5 h-3.5 text-[#E50914]" />
            VJ Commentary
          </span>
          <span className={`text-[10px] font-bold ${showVJCommentary ? 'text-emerald-400' : 'text-gray-500'}`}>
            {showVJCommentary ? 'ON' : 'OFF'}
          </span>
        </button>
      )}
    </div>
  );

  return (
    <div ref={playerRootRef} className={rootClassName}>
      {/* Main Video Stage */}
      <div className={stageClassName} onClick={!isYouTube ? handleVideoSurfaceTap : undefined}>
        {checkingOfflineBlob ? (
          <div className="flex flex-col items-center justify-center gap-3 text-white p-6">
            <Loader2 className="w-10 h-10 text-[#E50914] animate-spin" />
            <p className="text-sm font-bold">Loading...</p>
            <p className="text-xs text-gray-400">Opening movie from MovieKart storage</p>
          </div>
        ) : missingOfflineBlob ? (
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-sm mx-auto text-center p-5 space-y-3"
          >
            <div className="w-12 h-12 mx-auto rounded-2xl bg-[#E50914]/20 border border-[#E50914]/40 flex items-center justify-center text-[#E50914]">
              <WifiOff className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Offline Video Not Found</h3>
            <p className="text-xs text-gray-400">
              Reconnect to the internet and download this movie to watch offline inside MovieKart.
            </p>
            <button
              type="button"
              onClick={handleExitPlayer}
              className="px-5 py-2 rounded-xl bg-[#E50914] hover:bg-red-700 text-white font-bold text-xs cursor-pointer"
            >
              Back to Downloads
            </button>
          </div>
        ) : isYouTube ? (
          <>
            <iframe
              src={youtubeSrc}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
              allowFullScreen
              title={item.title}
              className="w-full h-full border-0 bg-black"
            />
            {/* Minimal Back Button for YouTube Trailers */}
            <div className="absolute top-3 left-3 z-30 flex items-center gap-2">
              <button
                type="button"
                onClick={handleExitPlayer}
                aria-label="Back"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/75 hover:bg-[#E50914] text-white text-xs font-bold backdrop-blur-md border border-white/15 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <span className="px-2.5 py-1 rounded-full bg-black/70 text-[11px] font-black text-white border border-white/10">
                Movie<span className="text-[#E50914]">Kart</span>
              </span>
            </div>
          </>
        ) : (
          <>
            {/* Native HTML5 <video> — NO Google Drive iframe, NO native overlapping controls */}
            <video
              key={effectiveVideoSrc}
              ref={videoRef}
              src={effectiveVideoSrc}
              poster={item.backdropUrl || item.posterUrl}
              autoPlay
              playsInline
              preload={selectedQuality === '480p' || selectedQuality === '360p' ? 'metadata' : 'auto'}
              controls={false}
              controlsList="nodownload"
              onLoadStart={() => {
                setIsBuffering(true);
                setPlaybackError('');
              }}
              onWaiting={() => setIsBuffering(true)}
              onStalled={() => setIsBuffering(true)}
              onCanPlay={() => {
                setIsBuffering(false);
                setShowSlowNetworkPrompt(false);
              }}
              onPlaying={() => {
                setIsPlaying(true);
                setIsBuffering(false);
                setShowSlowNetworkPrompt(false);
                setPlaybackError('');
              }}
              onPause={() => {
                setIsPlaying(false);
                setControlsVisible(true);
              }}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={() => {
                setIsPlaying(false);
                setHasEnded(true);
                setControlsVisible(true);
              }}
              onError={() => {
                setIsBuffering(false);
                setIsPlaying(false);
                setControlsVisible(true);
                setPlaybackError(
                  'Unable to load video right now. Please check your connection or switch to 480p.'
                );
              }}
              className="w-full h-full object-contain bg-black"
            />

            {/* Double-tap -10s / +10s Visual Feedback */}
            {seekFeedback && (
              <div
                className={`absolute top-1/2 -translate-y-1/2 z-20 pointer-events-none px-4 py-2 rounded-full bg-black/70 border border-white/20 text-white text-sm font-extrabold flex items-center gap-1.5 backdrop-blur-md ${
                  seekFeedback === 'back' ? 'left-8' : 'right-8'
                }`}
              >
                {seekFeedback === 'back' ? (
                  <>
                    <RotateCcw className="w-4 h-4 text-[#E50914]" />
                    <span>-10s</span>
                  </>
                ) : (
                  <>
                    <span>+10s</span>
                    <RotateCw className="w-4 h-4 text-[#E50914]" />
                  </>
                )}
              </div>
            )}

            {/* Real Center Buffering Spinner + "Loading..." + >10s Slow Network 480p Switch */}
            {isBuffering && !playbackError && !hasEnded && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/45 pointer-events-auto px-4 text-center"
              >
                <div className="flex flex-col items-center gap-2.5">
                  <div className="w-12 h-12 rounded-full bg-black/65 border border-white/15 flex items-center justify-center backdrop-blur-md">
                    <Loader2 className="w-7 h-7 text-[#E50914] animate-spin" />
                  </div>
                  <span className="text-sm font-bold text-white tracking-wide drop-shadow">
                    Loading...
                  </span>
                  {showSlowNetworkPrompt && (
                    <button
                      type="button"
                      onClick={() => handleQualitySelect('480p')}
                      className="mt-1 px-4 py-2 rounded-full bg-[#E50914] hover:bg-red-700 text-white text-xs font-extrabold shadow-xl shadow-red-900/50 active:scale-95 transition-transform cursor-pointer"
                    >
                      Slow network - Switch to 480p?
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Branded MovieKart Error Fallback (never mentions drive.google.com) */}
            {playbackError && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md p-5 text-center"
              >
                <AlertCircle className="w-10 h-10 text-[#E50914] mb-2" />
                <h3 className="text-sm sm:text-base font-extrabold text-white mb-1">
                  MovieKart Stream Interrupted
                </h3>
                <p className="text-xs text-gray-300 max-w-xs mb-4">{playbackError}</p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={handleRetryPlayback}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#E50914] hover:bg-red-700 text-white text-xs font-bold cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry</span>
                  </button>
                  {selectedQuality !== '480p' && (
                    <button
                      type="button"
                      onClick={() => handleQualitySelect('480p')}
                      className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold cursor-pointer"
                    >
                      Switch to 480p
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleExitPlayer}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-200 text-xs font-semibold cursor-pointer"
                  >
                    Back
                  </button>
                </div>
              </div>
            )}

            {/* Ugandan VJ Live Commentary Overlay */}
            {activeVJTrack && showVJCommentary && currentVJQuote && !playbackError && (
              <div
                className={`absolute right-3 z-20 max-w-[260px] sm:max-w-sm pointer-events-none transition-all duration-300 ${
                  controlsVisible ? 'top-14' : 'top-3'
                }`}
              >
                <div className="bg-black/80 border border-[#E50914]/50 text-white rounded-xl px-3 py-2 shadow-xl backdrop-blur-md">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E50914] animate-pulse" />
                    <span className="font-extrabold text-[10px] text-red-400">
                      {activeVJTrack.name} ({activeVJTrack.language})
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-white leading-snug">
                    &ldquo;{currentVJQuote}&rdquo;
                  </p>
                </div>
              </div>
            )}

            {/* Auto-Hiding YouTube / Netflix Style Controls Overlay (hides after 3s) */}
            <div
              className={`absolute inset-0 z-30 flex flex-col justify-between transition-opacity duration-300 ${
                controlsVisible && !playbackError
                  ? 'opacity-100'
                  : 'opacity-0 pointer-events-none'
              }`}
            >
              {/* Top Gradient Bar: Back Button Top-Left + Movie Title + MovieKart Branding + Rotate/Settings */}
              <div
                onClick={(e) => e.stopPropagation()}
                className="w-full px-3 sm:px-5 pt-3 pb-6 bg-gradient-to-b from-black/85 via-black/45 to-transparent flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    type="button"
                    onClick={handleExitPlayer}
                    aria-label="Back"
                    className="w-9 h-9 rounded-full bg-black/50 hover:bg-[#E50914] text-white flex items-center justify-center border border-white/15 backdrop-blur-sm transition-colors cursor-pointer shrink-0"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xs sm:text-base font-extrabold text-white font-['Outfit'] truncate drop-shadow">
                        {item.title}
                      </h2>
                      <span className="shrink-0 px-1.5 py-0.5 rounded bg-[#E50914] text-white text-[9px] font-black tracking-wider uppercase">
                        MovieKart
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-gray-300 truncate">
                      {isPlayingLocalOffline && (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          Offline
                        </span>
                      )}
                      {item.subTitle && <span className="truncate">{item.subTitle}</span>}
                      {activeVJTrack && (
                        <span className="text-red-400 font-semibold truncate">
                          {activeVJTrack.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {item.isTrailer && parentMovie && (
                    <button
                      type="button"
                      onClick={() => {
                        setHasEnded(false);
                        playMovie(parentMovie);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-[#E50914] hover:bg-red-700 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-white" />
                      <span>Full Movie</span>
                    </button>
                  )}

                  {isMobileViewport && (
                    <button
                      type="button"
                      onClick={handleRotateToggle}
                      aria-label={forcedLandscape ? 'Exit Landscape' : 'Rotate to Landscape'}
                      title={forcedLandscape ? 'Exit Landscape' : 'Rotate to Landscape'}
                      className="h-9 px-2.5 rounded-full bg-black/55 hover:bg-white/20 text-white border border-white/15 flex items-center gap-1 text-[11px] font-bold backdrop-blur-sm cursor-pointer"
                    >
                      <Smartphone className="w-3.5 h-3.5 text-[#E50914]" />
                      <span className="hidden xs:inline">
                        {forcedLandscape ? 'Portrait' : 'Rotate'}
                      </span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setShowSettingsMenu((prev) => !prev);
                      revealControlsTemporarily();
                    }}
                    aria-label="Settings and Quality"
                    title="Settings (Quality)"
                    className="w-9 h-9 rounded-full bg-black/55 hover:bg-white/20 text-white border border-white/15 flex items-center justify-center backdrop-blur-sm cursor-pointer"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Center Big Play / Pause + -10s / +10s Controls */}
              {!isBuffering && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center justify-center gap-6 sm:gap-10 pointer-events-auto"
                >
                  <button
                    type="button"
                    onClick={() => skipBySeconds(-10)}
                    aria-label="Rewind 10 seconds"
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-black/55 hover:bg-black/75 border border-white/20 text-white flex flex-col items-center justify-center backdrop-blur-md active:scale-90 transition-transform cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-[9px] font-extrabold leading-none mt-0.5">-10s</span>
                  </button>

                  <button
                    type="button"
                    onClick={togglePlayPause}
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#E50914]/90 hover:bg-[#E50914] border-2 border-white/30 text-white flex items-center justify-center shadow-2xl shadow-black/70 active:scale-90 transition-transform cursor-pointer"
                  >
                    {isPlaying ? (
                      <Pause className="w-7 h-7 sm:w-9 sm:h-9 fill-white" />
                    ) : (
                      <Play className="w-7 h-7 sm:w-9 sm:h-9 fill-white ml-1" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => skipBySeconds(10)}
                    aria-label="Forward 10 seconds"
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-black/55 hover:bg-black/75 border border-white/20 text-white flex flex-col items-center justify-center backdrop-blur-md active:scale-90 transition-transform cursor-pointer"
                  >
                    <RotateCw className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-[9px] font-extrabold leading-none mt-0.5">+10s</span>
                  </button>
                </div>
              )}

              {/* Bottom Gradient Bar: Full-Width Seek Bar + Time + Volume + Quality + Fullscreen */}
              <div
                onClick={(e) => e.stopPropagation()}
                className="w-full px-3 sm:px-5 pt-6 pb-3 bg-gradient-to-t from-black/90 via-black/55 to-transparent space-y-2"
              >
                {/* Full-Width Seek Bar */}
                <div className="w-full flex flex-col gap-1">
                  <div className="relative w-full h-5 flex items-center">
                    <progress
                      value={bufferedPercent}
                      max={100}
                      aria-hidden="true"
                      className="absolute inset-x-0 w-full h-1.5 rounded-full overflow-hidden pointer-events-none appearance-none [&::-webkit-progress-bar]:bg-white/25 [&::-webkit-progress-value]:bg-white/45 [&::-moz-progress-bar]:bg-white/45"
                    />
                    <progress
                      value={playedPercent}
                      max={100}
                      aria-hidden="true"
                      className="absolute inset-x-0 w-full h-1.5 rounded-full overflow-hidden pointer-events-none appearance-none [&::-webkit-progress-bar]:bg-transparent [&::-webkit-progress-value]:bg-[#E50914] [&::-moz-progress-bar]:bg-[#E50914]"
                    />
                    <input
                      type="range"
                      aria-label="Seek video timeline"
                      min={0}
                      max={duration > 0 ? duration : 100}
                      step={0.25}
                      value={duration > 0 ? currentTime : 0}
                      onChange={(e) => handleSeekChange(Number(e.target.value))}
                      className="relative z-10 w-full h-5 appearance-none bg-transparent cursor-pointer accent-[#E50914]"
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-semibold text-gray-200 tabular-nums">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Bottom Action Row */}
                <div className="flex items-center justify-between gap-2">
                  {/* Left: Play/Pause mini + Volume + -10/+10 compact */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={togglePlayPause}
                      aria-label={isPlaying ? 'Pause' : 'Play'}
                      className="p-1.5 rounded-lg text-white hover:bg-white/15 cursor-pointer"
                    >
                      {isPlaying ? (
                        <Pause className="w-4 h-4 fill-white" />
                      ) : (
                        <Play className="w-4 h-4 fill-white" />
                      )}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          if (isMobileViewport) {
                            handleToggleMute();
                          } else {
                            setShowVolumeSlider((prev) => !prev);
                          }
                        }}
                        aria-label={isMuted ? 'Unmute' : 'Mute'}
                        className="p-1.5 rounded-lg text-white hover:bg-white/15 cursor-pointer"
                      >
                        {isMuted || volume === 0 ? (
                          <VolumeX className="w-4 h-4 text-red-400" />
                        ) : (
                          <Volume2 className="w-4 h-4" />
                        )}
                      </button>

                      {(showVolumeSlider || !isMobileViewport) && (
                        <input
                          type="range"
                          aria-label="Volume"
                          min={0}
                          max={1}
                          step={0.05}
                          value={isMuted ? 0 : volume}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setVolume(val);
                            setIsMuted(val === 0);
                            revealControlsTemporarily();
                          }}
                          className="w-16 sm:w-20 h-1 accent-[#E50914] cursor-pointer"
                        />
                      )}
                    </div>
                  </div>

                  {/* Right: Quality badge + Settings + Rotate + Fullscreen */}
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowSettingsMenu((prev) => !prev);
                        revealControlsTemporarily();
                      }}
                      className="px-2 py-1 rounded-md bg-white/15 hover:bg-white/25 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>{selectedQuality}</span>
                    </button>

                    {!isDownloaded && !item.isTrailer && (
                      <button
                        type="button"
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
                        aria-label="Download movie"
                        title="Download for offline viewing"
                        className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleFullscreenToggle}
                      aria-label={isFullscreen || forcedLandscape ? 'Exit Fullscreen' : 'Fullscreen'}
                      title={isFullscreen || forcedLandscape ? 'Exit Fullscreen' : 'Fullscreen Landscape'}
                      className="p-1.5 rounded-lg bg-white/15 hover:bg-[#E50914] text-white transition-colors cursor-pointer"
                    >
                      {isFullscreen || forcedLandscape ? (
                        <Minimize className="w-4 h-4" />
                      ) : (
                        <Maximize className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Teaser Trailer End Screen */}
            {hasEnded && item.isTrailer && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-6 text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#E50914] to-red-900 border border-red-500/50 text-white flex items-center justify-center mb-3">
                  <Film className="w-7 h-7" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black font-['Outfit'] text-white mb-2">
                  Ready for the Full Movie?
                </h3>
                <div className="flex flex-wrap items-center justify-center gap-2.5 mt-2">
                  {parentMovie && (
                    <button
                      type="button"
                      onClick={() => {
                        setHasEnded(false);
                        playMovie(parentMovie);
                      }}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E50914] hover:bg-red-700 text-white font-bold text-xs sm:text-sm cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>Watch Full Movie</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setHasEnded(false);
                      if (videoRef.current) {
                        videoRef.current.currentTime = 0;
                        videoRef.current.play().catch(() => {});
                      }
                    }}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Replay</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExitPlayer}
                    className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/15 text-gray-300 text-xs sm:text-sm cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* PORTRAIT FALLBACK PANEL: Video stays 100% width at top, title + 1-tap Rotate + controls below */}
      {isPortraitPhone && !forcedLandscape && (
        <div className="flex-1 w-full bg-[#070709] border-t border-white/10 overflow-y-auto px-4 py-4 space-y-4">
          {/* 1-Tap Rotate Phone for Best View Banner */}
          <div className="rounded-2xl bg-[#14141d] border border-[#E50914]/40 p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[#E50914]/15 border border-[#E50914]/40 flex items-center justify-center text-[#E50914] shrink-0">
                <Smartphone className="w-5 h-5 rotate-90" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-white truncate">
                  Rotate phone for best view
                </p>
                <p className="text-[11px] text-gray-400 truncate">
                  Tap Rotate for fullscreen landscape cinema
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRotateToggle}
              className="shrink-0 px-3.5 py-2 rounded-xl bg-[#E50914] hover:bg-red-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-lg shadow-red-950/50 active:scale-95 transition-transform cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Rotate</span>
            </button>
          </div>

          {/* Movie Title & MovieKart Meta */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <h1 className="text-lg font-black text-white font-['Outfit'] leading-tight">
                {item.title}
              </h1>
              <span className="shrink-0 px-2 py-0.5 rounded bg-[#E50914] text-white text-[10px] font-black uppercase tracking-wider">
                MovieKart
              </span>
            </div>
            {item.subTitle && (
              <p className="text-xs font-semibold text-red-400">{item.subTitle}</p>
            )}
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
              {item.year && <span>{item.year}</span>}
              <span>·</span>
              <span className="text-white font-semibold">{selectedQuality}</span>
              {activeVJTrack && (
                <>
                  <span>·</span>
                  <span className="text-red-400 font-semibold">{activeVJTrack.name}</span>
                </>
              )}
              {isPlayingLocalOffline && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-600/20 text-emerald-300 text-[11px] font-bold">
                  <CheckCircle2 className="w-3 h-3" />
                  Offline Playback
                </span>
              )}
            </div>
          </div>

          {/* Portrait Quick Controls Bar */}
          {!isYouTube && (
            <div className="grid grid-cols-5 gap-2">
              <button
                type="button"
                onClick={() => skipBySeconds(-10)}
                className="py-2.5 rounded-xl bg-[#14141d] border border-white/10 text-white flex flex-col items-center justify-center gap-1 text-[10px] font-bold active:scale-95 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>-10s</span>
              </button>
              <button
                type="button"
                onClick={togglePlayPause}
                className="py-2.5 rounded-xl bg-[#E50914] text-white flex flex-col items-center justify-center gap-1 text-[10px] font-bold active:scale-95 cursor-pointer"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4 fill-white" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>Play</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => skipBySeconds(10)}
                className="py-2.5 rounded-xl bg-[#14141d] border border-white/10 text-white flex flex-col items-center justify-center gap-1 text-[10px] font-bold active:scale-95 cursor-pointer"
              >
                <RotateCw className="w-4 h-4" />
                <span>+10s</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setControlsVisible(true);
                  setShowSettingsMenu((prev) => !prev);
                }}
                className="py-2.5 rounded-xl bg-[#14141d] border border-white/10 text-white flex flex-col items-center justify-center gap-1 text-[10px] font-bold active:scale-95 cursor-pointer"
              >
                <Settings className="w-4 h-4" />
                <span>{selectedQuality}</span>
              </button>
              <button
                type="button"
                onClick={handleFullscreenToggle}
                className="py-2.5 rounded-xl bg-[#14141d] border border-white/10 text-white flex flex-col items-center justify-center gap-1 text-[10px] font-bold active:scale-95 cursor-pointer"
              >
                <Maximize className="w-4 h-4" />
                <span>Full</span>
              </button>
            </div>
          )}

          {/* Audio Track & Download Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {item.vjTracks && item.vjTracks.length > 1 && (
              <select
                value={activeVJTrack?.id || ''}
                onChange={(e) => {
                  const tr = item.vjTracks?.find((t) => t.id === e.target.value) || null;
                  setActiveVJTrack(tr);
                  showToast(`Switched audio to ${tr?.name || 'Default'}`);
                }}
                className="bg-[#14141d] text-xs font-semibold text-red-400 border border-white/15 rounded-xl px-3 py-2 focus:outline-none"
              >
                {item.vjTracks.map((tr) => (
                  <option key={tr.id} value={tr.id}>
                    {tr.name} ({tr.language})
                  </option>
                ))}
              </select>
            )}

            {!isDownloaded && !isYouTube && !item.isTrailer && (
              <button
                type="button"
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
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Offline</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleExitPlayer}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/15 text-gray-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Movies</span>
            </button>
          </div>

          {parentMovie?.synopsis && (
            <p className="text-xs text-gray-400 leading-relaxed">{parentMovie.synopsis}</p>
          )}
        </div>
      )}

      {/* Settings (Quality & Speed) Popover mounted at player root so it never clips in portrait or landscape */}
      {showSettingsMenu && renderSettingsPopover()}
    </div>
  );
};
