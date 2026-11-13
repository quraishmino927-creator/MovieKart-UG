import React, { useRef, useState, useEffect } from 'react';
import { useMovieContext } from '../context/MovieContext';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  X,
  Settings,
  Download,
  CheckCircle2,
  Volume1,
  PictureInPicture,
  MessageSquareQuote,
  ShieldCheck,
  Check,
  Film
} from 'lucide-react';
import { VJTrack } from '../types';

export const VideoPlayerModal: React.FC = () => {
  const {
    currentlyPlayingItem,
    selectedVJTrack,
    closePlayer,
    downloads,
    startDownload,
    getDownloadStatus,
    movies,
    playMovie,
    updateWatchProgress,
    showToast
  } = useMovieContext();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastSavedTimeRef = useRef<number>(0);

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showVJCommentary, setShowVJCommentary] = useState<boolean>(true);
  const [currentVJQuote, setCurrentVJQuote] = useState<string>('');
  const [showControls, setShowControls] = useState<boolean>(true);
  const [hasEnded, setHasEnded] = useState<boolean>(false);
  const controlsTimeoutRef = useRef<any>(null);

  const [activeVJTrack, setActiveVJTrack] = useState<VJTrack | null>(selectedVJTrack);

  useEffect(() => {
    setActiveVJTrack(selectedVJTrack);
  }, [selectedVJTrack]);

  useEffect(() => {
    setHasEnded(false);
  }, [currentlyPlayingItem?.id]);

  if (!currentlyPlayingItem) return null;

  const item = currentlyPlayingItem;
  const parentMovie = item.movieId
    ? movies.find((m) => m.id === item.movieId)
    : movies.find((m) => `${m.id}_trailer` === item.id);
  const downloadInfo = getDownloadStatus(item.id);
  const isDownloaded = downloadInfo?.status === 'completed';

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

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        } else {
          handleExitPlayer();
        }
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === 'm' || e.key === 'M') {
        toggleMute();
      } else if (e.key === 'ArrowRight') {
        skipTime(10);
      } else if (e.key === 'ArrowLeft') {
        skipTime(-10);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isMuted, isFullscreen]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Controls auto-hide timer
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
        setShowSettings(false);
      }
    }, 3500);
  };

  // Simulate VJ Commentary periodic speech balloons
  useEffect(() => {
    if (!activeVJTrack || !activeVJTrack.commentaryQuotes?.length || !showVJCommentary) {
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
  }, [activeVJTrack, showVJCommentary]);

  const saveProgress = (time: number, totalDuration?: number) => {
    if (!item || item.isTrailer || time < 5) return;
    const dur = totalDuration || duration || videoRef.current?.duration || 1;
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
    if (videoRef.current) {
      saveProgress(videoRef.current.currentTime, videoRef.current.duration);
    }
    closePlayer();
  };

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      saveProgress(videoRef.current.currentTime, videoRef.current.duration);
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const cur = videoRef.current.currentTime;
      setCurrentTime(cur);

      // Auto-save progress every 4 seconds of playback
      if (Math.abs(cur - lastSavedTimeRef.current) >= 4) {
        lastSavedTimeRef.current = cur;
        saveProgress(cur, videoRef.current.duration);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration;
      setDuration(dur);
      if (item.startTime && item.startTime > 0 && item.startTime < dur) {
        videoRef.current.currentTime = item.startTime;
        setCurrentTime(item.startTime);
        lastSavedTimeRef.current = item.startTime;
      }
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = parseFloat(e.target.value);
    setCurrentTime(targetTime);
    if (videoRef.current) {
      videoRef.current.currentTime = targetTime;
    }
  };

  const skipTime = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(
        0,
        Math.min(videoRef.current.duration, videoRef.current.currentTime + seconds)
      );
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    videoRef.current.muted = newMuted;
    if (!newMuted && volume === 0) {
      setVolume(0.5);
      videoRef.current.volume = 0.5;
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    setShowSettings(false);
    showToast(`Speed: ${speed}x`);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const togglePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    } catch {
      showToast('Picture-in-Picture not supported in this browser mode');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center select-none overflow-hidden">
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => {
          if (isPlaying) setShowControls(false);
        }}
        className="relative w-full h-full bg-black flex items-center justify-center"
      >
        {/* Main Video Element */}
        <video
          ref={videoRef}
          src={item.videoUrl}
          poster={item.backdropUrl || item.posterUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onClick={togglePlayPause}
          onEnded={() => {
            setIsPlaying(false);
            setHasEnded(true);
          }}
          playsInline
          className="w-full h-full object-contain cursor-pointer"
        />

        {/* Teaser Trailer Completion Screen */}
        {hasEnded && item.isTrailer && (
          <div className="absolute inset-0 z-35 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-6 text-center animate-fade-in">
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
                    videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
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

        {/* Offline Badge Notification */}
        {isDownloaded && !item.isTrailer && (
          <div className="absolute top-4 left-4 z-40 bg-emerald-600/90 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-lg backdrop-blur-sm pointer-events-none">
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            <span>Streaming from Offline Storage</span>
          </div>
        )}

        {/* Ugandan VJ Live Commentary Speech Bubble overlay */}
        {activeVJTrack && showVJCommentary && currentVJQuote && (
          <div className="absolute top-16 left-6 z-40 max-w-sm sm:max-w-md animate-fade-in pointer-events-none">
            <div className="bg-red-950/90 border border-red-500/60 text-white rounded-2xl p-3 shadow-2xl backdrop-blur-md">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="font-extrabold text-xs text-red-400 font-['Outfit']">
                  {activeVJTrack.name} Live Commentary ({activeVJTrack.language})
                </span>
              </div>
              <p className="text-sm font-bold text-white tracking-wide">
                "{currentVJQuote}"
              </p>
            </div>
          </div>
        )}

        {/* Play/Pause Large Center Click Indicator (if paused) */}
        {!isPlaying && !hasEnded && (
          <div
            onClick={togglePlayPause}
            className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer z-20"
          >
            <div className="w-20 h-20 rounded-full bg-red-600/90 hover:bg-red-600 text-white flex items-center justify-center shadow-2xl transition-transform hover:scale-110">
              <Play className="w-10 h-10 fill-white text-white translate-x-1" />
            </div>
          </div>
        )}

        {/* Top Controls Bar (Title & Close) */}
        <div
          className={`absolute top-0 inset-x-0 z-30 p-4 sm:p-6 bg-gradient-to-b from-black/90 via-black/50 to-transparent flex items-center justify-between transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={handleExitPlayer}
              aria-label="Exit player"
              className="p-2 rounded-full bg-white/10 hover:bg-red-600 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white font-['Outfit'] drop-shadow">
                  {item.title}
                </h2>
                {item.isTrailer && (
                  <span className="bg-red-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wider shadow">
                    Teaser
                  </span>
                )}
              </div>
              {item.subTitle && (
                <p className="text-xs text-red-400 font-semibold drop-shadow">{item.subTitle}</p>
              )}
              <p className="text-xs text-gray-300 flex items-center gap-2">
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

          <div className="flex items-center gap-2">
            {/* Quick Full Movie Switch if watching trailer */}
            {item.isTrailer && parentMovie && (
              <button
                onClick={() => {
                  setHasEnded(false);
                  playMovie(parentMovie);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-lg shadow-red-600/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                title="Switch to full movie"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span className="hidden sm:inline">Watch</span>
                <span>Full Movie</span>
              </button>
            )}

            {/* VJ Commentary Toggle */}
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

            {/* Offline download trigger directly inside player */}
            {!isDownloaded && (
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

        {/* Bottom Playback Controls Bar */}
        <div
          className={`absolute bottom-0 inset-x-0 z-30 p-4 sm:p-6 bg-gradient-to-t from-black/95 via-black/70 to-transparent flex flex-col gap-2 transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Seeker / Scrub Bar */}
          <div className="relative group/seeker w-full flex items-center">
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              aria-label="Seek timeline"
              className="w-full h-1.5 sm:h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-red-600 focus:outline-none hover:h-2.5 transition-all"
            />
          </div>

          {/* Controls Row */}
          <div className="flex items-center justify-between gap-2 sm:gap-4 pt-1">
            {/* Left Controls */}
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={togglePlayPause}
                aria-label={isPlaying ? 'Pause' : 'Play'}
                className="p-2 sm:p-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white transition-transform active:scale-90 cursor-pointer"
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white" />}
              </button>

              <button
                onClick={() => skipTime(-10)}
                aria-label="Skip backward 10s"
                className="p-2 rounded-full hover:bg-white/10 text-gray-200 transition-colors cursor-pointer"
                title="Skip back 10 seconds"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={() => skipTime(10)}
                aria-label="Skip forward 10s"
                className="p-2 rounded-full hover:bg-white/10 text-gray-200 transition-colors cursor-pointer"
                title="Skip forward 10 seconds"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              {/* Volume Slider */}
              <div className="hidden sm:flex items-center gap-2 group/volume">
                <button
                  onClick={toggleMute}
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                  className="p-1.5 text-gray-200 hover:text-white cursor-pointer"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-5 h-5 text-red-500" />
                  ) : volume < 0.5 ? (
                    <Volume1 className="w-5 h-5" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  aria-label="Volume slider"
                  className="w-16 lg:w-24 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-red-600 focus:outline-none"
                />
              </div>

              {/* Timestamp */}
              <div className="text-xs sm:text-sm font-mono text-gray-300">
                <span>{formatTime(currentTime)}</span>
                <span className="text-gray-500 mx-1">/</span>
                <span className="text-gray-400">{formatTime(duration)}</span>
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-1.5 sm:gap-3">
              {item.vjTracks && item.vjTracks.length > 1 && (
                <div className="relative">
                  <select
                    value={activeVJTrack?.id || ''}
                    onChange={(e) => {
                      const tr = item.vjTracks?.find((t) => t.id === e.target.value) || null;
                      setActiveVJTrack(tr);
                      showToast(`Switched audio to ${tr?.name || 'Default'}`);
                    }}
                    className="bg-[#181822] text-xs font-semibold text-red-400 border border-white/20 rounded-lg px-2 py-1.5 focus:outline-none cursor-pointer"
                  >
                    {item.vjTracks.map((tr) => (
                      <option key={tr.id} value={tr.id}>
                        {tr.name} ({tr.language})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Speed Settings Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  aria-label="Playback Settings"
                  className="p-2 rounded-lg hover:bg-white/10 text-gray-200 transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
                >
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">{playbackSpeed}x</span>
                </button>

                {showSettings && (
                  <div className="absolute bottom-12 right-0 bg-[#161622] border border-white/10 rounded-xl shadow-2xl p-2 w-44 z-50 text-xs">
                    <p className="text-[10px] text-gray-400 uppercase font-bold px-2 py-1">
                      Playback Speed
                    </p>
                    {[0.75, 1, 1.25, 1.5, 2].map((s) => (
                      <button
                        key={s}
                        onClick={() => handleSpeedChange(s)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-left transition-colors cursor-pointer ${
                          playbackSpeed === s
                            ? 'bg-red-600 text-white font-bold'
                            : 'text-gray-300 hover:bg-white/5'
                        }`}
                      >
                        <span>{s}x</span>
                        {playbackSpeed === s && <Check className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Picture in Picture */}
              <button
                onClick={togglePiP}
                aria-label="Picture in Picture"
                className="hidden sm:flex p-2 rounded-lg hover:bg-white/10 text-gray-200 transition-colors cursor-pointer"
                title="Picture in Picture"
              >
                <PictureInPicture className="w-4 h-4" />
              </button>

              {/* Fullscreen Button */}
              <button
                onClick={toggleFullscreen}
                aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                className="p-2 sm:p-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
