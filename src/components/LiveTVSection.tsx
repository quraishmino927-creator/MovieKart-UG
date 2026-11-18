import React, { useState, useEffect } from 'react';
import { useMovieContext } from '../context/MovieContext';
import { LiveTVChannel } from '../types';
import {
  isYouTubeUrl,
  toYouTubeEmbedUrl,
  toYouTubeWatchLink,
  resolveYouTubeStream,
  getCachedResolvedYouTubeStream,
  ResolvedYouTubeStream,
} from '../lib/liveChannels';
import { Radio, Play, Eye, X, ExternalLink, Tv, Loader2, Film } from 'lucide-react';

const ChannelLogo: React.FC<{ channel: LiveTVChannel; className?: string }> = ({
  channel,
  className = 'w-full h-40 object-cover'
}) => {
  const [imgError, setImgError] = useState(false);

  if (!channel.logoUrl || imgError) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#1b1f27] to-[#0a0c10] text-white select-none ${className}`}
      >
        <Tv className="w-8 h-8 text-[#E50914] mb-1.5" />
        <span className="font-extrabold text-sm sm:text-base tracking-tight text-center px-2">
          {channel.name}
        </span>
      </div>
    );
  }

  return (
    <img
      src={channel.logoUrl}
      alt={`${channel.name} logo`}
      referrerPolicy="no-referrer"
      onError={() => setImgError(true)}
      className={className}
    />
  );
};

export const LiveTVSection: React.FC = () => {
  const {
    liveChannels,
    activeLiveChannel,
    openLiveChannel,
    closeLiveChannel
  } = useMovieContext();

  const [resolvedStreams, setResolvedStreams] = useState<Record<string, ResolvedYouTubeStream>>({});
  const [resolvingChannelId, setResolvingChannelId] = useState<string | null>(null);

  // Prefetch YouTube Live / latest-video fallback status for channel cards so clicks open instantaneously
  useEffect(() => {
    let cancelled = false;
    const ytChannels = liveChannels.filter((ch) => isYouTubeUrl(ch.youtubeLiveUrl));
    if (ytChannels.length === 0) return;

    ytChannels.forEach((ch) => {
      const cached = getCachedResolvedYouTubeStream(ch.youtubeLiveUrl);
      if (cached) {
        setResolvedStreams((prev) => ({ ...prev, [ch.youtubeLiveUrl]: cached }));
        return;
      }
      resolveYouTubeStream(ch.youtubeLiveUrl)
        .then((res) => {
          if (!cancelled && res.embedUrl) {
            setResolvedStreams((prev) => ({ ...prev, [ch.youtubeLiveUrl]: res }));
          }
        })
        .catch(() => {});
    });

    return () => {
      cancelled = true;
    };
  }, [liveChannels]);

  // Resolve the active channel immediately when opened (if not already cached)
  useEffect(() => {
    if (!activeLiveChannel) {
      setResolvingChannelId(null);
      return;
    }

    const url = activeLiveChannel.youtubeLiveUrl;
    if (!isYouTubeUrl(url)) {
      setResolvingChannelId(null);
      return;
    }

    const cached = getCachedResolvedYouTubeStream(url) || resolvedStreams[url];
    if (cached?.embedUrl) {
      setResolvedStreams((prev) => ({ ...prev, [url]: cached }));
      setResolvingChannelId(null);
      return;
    }

    let cancelled = false;
    setResolvingChannelId(activeLiveChannel.id);

    resolveYouTubeStream(url)
      .then((res) => {
        if (!cancelled) {
          setResolvedStreams((prev) => ({ ...prev, [url]: res }));
          setResolvingChannelId(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setResolvingChannelId(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeLiveChannel?.id, activeLiveChannel?.youtubeLiveUrl]);

  // Keyboard Escape support for closing Live TV Player
  useEffect(() => {
    if (!activeLiveChannel) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeLiveChannel();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeLiveChannel?.id]);

  const totalWatchingNow = liveChannels.reduce(
    (sum, ch) => sum + (Number(ch.watchingNow) || 0),
    0
  );

  const activeIsYouTube = activeLiveChannel ? isYouTubeUrl(activeLiveChannel.youtubeLiveUrl) : false;
  const activeResolved = activeLiveChannel
    ? resolvedStreams[activeLiveChannel.youtubeLiveUrl] ||
      getCachedResolvedYouTubeStream(activeLiveChannel.youtubeLiveUrl)
    : null;

  const isLoadingActiveStream =
    Boolean(activeLiveChannel) &&
    activeIsYouTube &&
    resolvingChannelId === activeLiveChannel?.id &&
    !activeResolved?.embedUrl;

  const embedUrl = activeLiveChannel
    ? activeIsYouTube
      ? activeResolved?.embedUrl || toYouTubeEmbedUrl(activeLiveChannel.youtubeLiveUrl)
      : activeLiveChannel.youtubeLiveUrl
    : '';

  const directYouTubeLink = activeLiveChannel
    ? activeResolved?.watchUrl || toYouTubeWatchLink(activeLiveChannel.youtubeLiveUrl)
    : '';

  const isPlayingFallbackLatest =
    Boolean(activeResolved) &&
    (activeResolved?.mode === 'latest_video' || activeResolved?.mode === 'playlist_fallback');

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#E50914] text-white text-[11px] font-black uppercase tracking-wider shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              LIVE
            </span>
            <span className="text-xs font-semibold text-gray-400">
              Uganda Free-to-Air Channels
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit'] tracking-tight mt-2">
            Ugandan Live TV
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Stream live news, Luganda programming, talk shows, and sports directly on MovieKart UG.
          </p>
        </div>

        {/* Unboxed tabular Watching Now summary */}
        <div className="flex items-center gap-3 text-xs sm:text-sm text-gray-300 font-medium tabular-nums">
          <span className="flex items-center gap-1.5 text-white font-bold">
            <Eye className="w-4 h-4 text-[#E50914]" />
            <span>{totalWatchingNow.toLocaleString()} Watching Now</span>
          </span>
          <span className="text-gray-600" aria-hidden="true">·</span>
          <span className="text-gray-400">{liveChannels.length} Channels</span>
        </div>
      </div>

      {/* Empty State if Admin removes all channels */}
      {liveChannels.length === 0 ? (
        <div className="p-10 rounded-3xl bg-[#101217] border border-white/10 text-center space-y-3">
          <Radio className="w-9 h-9 mx-auto text-[#E50914]" />
          <h2 className="text-lg font-bold text-white">No Live TV channels listed yet</h2>
          <p className="text-xs sm:text-sm text-gray-400">
            Admin can add Live TV stations from the Admin Operations Dashboard.
          </p>
        </div>
      ) : (
        /* Channels Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {liveChannels.map((channel) => {
            const isCurrentlyPlaying = activeLiveChannel?.id === channel.id;
            return (
              <div
                key={channel.id}
                onClick={() => openLiveChannel(channel)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openLiveChannel(channel);
                  }
                }}
                className={`group rounded-2xl bg-[#111319] border transition-all overflow-hidden flex flex-col cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E50914] ${
                  isCurrentlyPlaying
                    ? 'border-[#E50914] shadow-xl shadow-red-600/20'
                    : 'border-white/10 hover:border-[#E50914]/60 hover:-translate-y-0.5'
                }`}
              >
                {/* Logo / Preview Area */}
                <div className="relative aspect-[16/9] w-full bg-black overflow-hidden">
                  <ChannelLogo
                    channel={channel}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />

                  {/* RED LIVE Badge */}
                  {channel.isLive !== false && (
                    <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#E50914] text-white text-[10px] font-black uppercase tracking-wider shadow-lg">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      LIVE
                    </span>
                  )}

                  {/* Watching Now indicator overlay bottom-left */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/95 tabular-nums drop-shadow">
                      <Eye className="w-3.5 h-3.5 text-[#E50914]" />
                      <span>{(channel.watchingNow || 0).toLocaleString()} watching now</span>
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                  <div>
                    <h2 className="text-base sm:text-lg font-extrabold text-white font-['Outfit'] truncate">
                      {channel.name}
                    </h2>
                    {channel.description && (
                      <p className="text-xs text-gray-400 line-clamp-2 mt-1 leading-relaxed">
                        {channel.description}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openLiveChannel(channel);
                    }}
                    className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[#E50914] hover:bg-red-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors shadow-md shadow-red-600/25 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>{isCurrentlyPlaying ? 'Watching Live' : 'Watch Live'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* LIVE TV YOUTUBE IFRAME PLAYER MODAL */}
      {activeLiveChannel && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-label={`${activeLiveChannel.name} Live Player`}
        >
          {/* Player Top Bar */}
          <div className="w-full px-3 sm:px-6 py-3 bg-black border-b border-white/10 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={closeLiveChannel}
                aria-label="Close Live TV Player"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-white/10 hover:bg-[#E50914] text-white transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-11 h-8 rounded-lg overflow-hidden bg-[#14141c] border border-white/10 shrink-0 hidden sm:block">
                <ChannelLogo channel={activeLiveChannel} className="w-full h-full object-cover" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm sm:text-base font-extrabold text-white font-['Outfit'] truncate">
                    {activeLiveChannel.name}
                  </h2>
                  {isPlayingFallbackLatest ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-extrabold uppercase tracking-wider shrink-0">
                      <Film className="w-3 h-3" />
                      Latest Video · Channel Offline
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#E50914] text-white text-[10px] font-black uppercase tracking-wider shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      LIVE
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 flex items-center gap-1.5 tabular-nums truncate">
                  <Eye className="w-3.5 h-3.5 text-[#E50914] shrink-0" />
                  <span>{(activeLiveChannel.watchingNow || 0).toLocaleString()} watching now</span>
                  {activeResolved?.title && (
                    <>
                      <span className="text-gray-600" aria-hidden="true">·</span>
                      <span className="text-gray-300 truncate">{activeResolved.title}</span>
                    </>
                  )}
                </p>
              </div>
            </div>

            {directYouTubeLink && (
              <a
                href={directYouTubeLink}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[40px] px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors"
              >
                <span className="hidden sm:inline">Open on YouTube</span>
                <span className="sm:hidden">YouTube</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {/* Main Black Video Area */}
          <div className="flex-1 bg-black flex items-center justify-center p-0 sm:p-4 overflow-hidden">
            <div className="w-full max-w-6xl aspect-video max-h-full bg-black rounded-none sm:rounded-2xl overflow-hidden border-0 sm:border sm:border-white/10 flex items-center justify-center">
              {isLoadingActiveStream ? (
                <div className="flex flex-col items-center justify-center gap-3 text-center p-6">
                  <Loader2 className="w-9 h-9 text-[#E50914] animate-spin" />
                  <p className="text-sm font-bold text-white">
                    Connecting to {activeLiveChannel.name}...
                  </p>
                  <p className="text-xs text-gray-400">
                    Checking live stream or loading latest broadcast
                  </p>
                </div>
              ) : activeIsYouTube || embedUrl.includes('youtube.com') ? (
                <iframe
                  key={activeLiveChannel.id + embedUrl}
                  src={embedUrl}
                  title={`${activeLiveChannel.name} YouTube Live`}
                  width="100%"
                  height="100%"
                  style={{ border: 0, backgroundColor: '#000000' }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                  allowFullScreen
                  className="w-full h-full bg-black"
                />
              ) : (
                <video
                  key={activeLiveChannel.id}
                  controls
                  autoPlay
                  playsInline
                  src={activeLiveChannel.youtubeLiveUrl}
                  className="w-full h-full bg-black object-contain"
                />
              )}
            </div>
          </div>

          {/* Quick Channel Switcher Rail */}
          <div className="w-full px-3 sm:px-6 py-3 bg-[#0a0a0e] border-t border-white/10 shrink-0">
            <div className="max-w-6xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider shrink-0 pr-1">
                Channels:
              </span>
              {liveChannels.map((ch) => {
                const isSelected = ch.id === activeLiveChannel.id;
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => openLiveChannel(ch)}
                    className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#E50914] text-white shadow-md shadow-red-600/30'
                        : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                    <span>{ch.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
