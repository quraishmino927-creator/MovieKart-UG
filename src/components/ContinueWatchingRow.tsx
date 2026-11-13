import React, { useRef } from 'react';
import { useMovieContext } from '../context/MovieContext';
import { ContinueWatchingItem } from '../types';
import {
  Play,
  RotateCcw,
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
  Sparkles,
  Info,
  Tv,
  Film,
  Volume2
} from 'lucide-react';

export const ContinueWatchingRow: React.FC = () => {
  const {
    continueWatchingList,
    resumeContinueWatching,
    removeFromContinueWatching,
    movies,
    tvShows,
    openMovieDetails,
    openShowDetails
  } = useMovieContext();

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  if (!continueWatchingList || continueWatchingList.length === 0) {
    return null;
  }

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -420 : 420;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleOpenInfo = (e: React.MouseEvent, item: ContinueWatchingItem) => {
    e.stopPropagation();
    if (item.type === 'movie') {
      const movie = movies.find((m) => m.id === item.itemId);
      if (movie) openMovieDetails(movie);
    } else {
      const show = tvShows.find(
        (s) =>
          s.title === item.showTitle ||
          s.id === item.itemId ||
          s.seasons?.some((sn) => sn.episodes?.some((ep) => ep.id === item.itemId))
      );
      if (show) openShowDetails(show);
    }
  };

  const formatRemainingTime = (item: ContinueWatchingItem) => {
    const remainingSecs = Math.max(0, item.duration - item.currentTime);
    const mins = Math.ceil(remainingSecs / 60);
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const remMins = mins % 60;
      return `${hrs}h ${remMins > 0 ? `${remMins}m` : ''} left`;
    }
    return `${mins}m left`;
  };

  return (
    <section className="relative px-4 sm:px-6 lg:px-8 py-2 select-none">
      {/* Row Header */}
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-red-600/20 text-red-500 border border-red-500/30">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold font-['Outfit'] text-white tracking-tight">
                Continue Watching
              </h2>
              <span className="text-[11px] font-semibold bg-white/10 text-gray-300 px-2 py-0.5 rounded-full">
                {continueWatchingList.length} in progress
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Pick up right where you left off across movies and episodes
            </p>
          </div>
        </div>

        {/* Desktop Carousel Navigation Arrows */}
        <div className="hidden sm:flex items-center gap-1.5">
          <button
            onClick={() => scroll('left')}
            aria-label="Scroll left"
            className="p-2 rounded-full bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white border border-white/10 transition-all cursor-pointer hover:scale-105 active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            aria-label="Scroll right"
            className="p-2 rounded-full bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white border border-white/10 transition-all cursor-pointer hover:scale-105 active:scale-95"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Scrolling Shelf */}
      <div
        ref={scrollContainerRef}
        className="flex items-stretch gap-4 overflow-x-auto pb-3 pt-1 scrollbar-none snap-x snap-mandatory focus:outline-none"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {continueWatchingList.map((item) => {
          const remainingText = formatRemainingTime(item);

          return (
            <div
              key={item.id}
              onClick={() => resumeContinueWatching(item)}
              className="group relative flex-none w-64 sm:w-72 md:w-80 rounded-2xl bg-[#0f0f16] border border-white/10 hover:border-red-500/60 overflow-hidden shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-red-950/40 cursor-pointer snap-start"
            >
              {/* Thumbnail Container (16:9 ratio) */}
              <div className="relative aspect-video w-full overflow-hidden bg-black">
                <img
                  src={item.backdropUrl || item.thumbnailUrl}
                  alt={item.title}
                  className="w-full h-full object-cover filter brightness-[0.75] group-hover:brightness-[0.9] group-hover:scale-105 transition-all duration-500"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />

                {/* Dark Vignette Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f16] via-transparent to-black/60" />

                {/* Top Badges Bar */}
                <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between z-10">
                  {/* Type Badge */}
                  <span className="flex items-center gap-1 bg-black/70 backdrop-blur-md text-[10px] font-bold text-gray-200 px-2 py-0.5 rounded-md border border-white/10">
                    {item.type === 'episode' ? (
                      <>
                        <Tv className="w-3 h-3 text-red-400" />
                        <span>S{item.seasonNumber}:E{item.episodeNumber}</span>
                      </>
                    ) : (
                      <>
                        <Film className="w-3 h-3 text-red-400" />
                        <span>{item.genre}</span>
                      </>
                    )}
                  </span>

                  {/* Top Right Action: Remove from continue watching */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromContinueWatching(item.id);
                    }}
                    title="Remove from Continue Watching"
                    aria-label="Remove item"
                    className="p-1 rounded-full bg-black/70 hover:bg-red-600 text-gray-300 hover:text-white backdrop-blur-md border border-white/20 transition-all opacity-80 sm:opacity-0 group-hover:opacity-100 hover:scale-110 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Center Hover Play Button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-xl shadow-red-950/80 transition-all duration-300 group-hover:scale-110 group-hover:bg-red-600">
                    <Play className="w-5 h-5 fill-white translate-x-0.5" />
                  </div>
                </div>

                {/* Time Remaining overlay pill */}
                <div className="absolute bottom-3 right-2.5 z-10">
                  <span className="bg-black/80 backdrop-blur-md text-[10px] font-mono font-semibold text-gray-200 px-2 py-0.5 rounded border border-white/10 shadow">
                    {remainingText}
                  </span>
                </div>

                {/* PROGRESS BAR OVERLAY AT THE BOTTOM EDGE OF THUMBNAIL */}
                <div className="absolute bottom-0 inset-x-0 h-1.5 bg-black/60 z-20 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-600 to-red-500 rounded-r-full shadow-sm shadow-red-500 transition-all duration-300 group-hover:h-2"
                    style={{ width: `${Math.max(4, Math.min(100, item.progressPercentage))}%` }}
                  />
                </div>
              </div>

              {/* Card Meta Content */}
              <div className="p-3 sm:p-3.5 flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  {/* Episode show title or genre */}
                  {item.type === 'episode' && item.showTitle && (
                    <p className="text-[11px] font-semibold text-red-400 truncate mb-0.5">
                      {item.showTitle}
                    </p>
                  )}

                  {/* Main Title */}
                  <h3 className="text-sm font-bold text-white truncate font-['Outfit'] group-hover:text-red-400 transition-colors">
                    {item.title}
                  </h3>

                  {/* Progress & VJ Info */}
                  <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-1">
                    <span className="font-medium text-gray-300">
                      {item.progressPercentage}% watched
                    </span>
                    <span>·</span>
                    <span className="truncate">{item.durationString}</span>
                    {item.vjTrackName && (
                      <>
                        <span>·</span>
                        <span className="text-red-400/90 font-medium truncate flex items-center gap-1">
                          <Volume2 className="w-2.5 h-2.5 shrink-0" />
                          {item.vjTrackName}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Info Button to open details */}
                <button
                  onClick={(e) => handleOpenInfo(e, item)}
                  title="View details"
                  aria-label="View film details"
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white transition-colors shrink-0 mt-0.5 cursor-pointer"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
