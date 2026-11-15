import React, { useState, useEffect } from 'react';
import { useMovieContext } from '../context/MovieContext';
import { Play, Plus, Check, Info, Star, ChevronLeft, ChevronRight, Volume2, ShieldAlert } from 'lucide-react';
import { Movie } from '../types';

export const HeroCarousel: React.FC = () => {
  const { movies, playMovie, toggleWatchlist, isInWatchlist, openMovieDetails, offlineMode, downloads } = useMovieContext();
  
  // Select featured/trending movies, or fallback to latest uploaded movies
  const flaggedMovies = movies.filter((m) => m.isFeatured || m.isTrending);
  const featuredMovies: Movie[] = (flaggedMovies.length > 0 ? flaggedMovies : movies).slice(0, 5);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (featuredMovies.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredMovies.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [featuredMovies.length]);

  if (!featuredMovies.length) return null;

  const currentMovie = featuredMovies[currentIndex] || featuredMovies[0];
  const inWatchlist = isInWatchlist(currentMovie.id);
  const isDownloaded = downloads.some((d) => d.movieId === currentMovie.id && d.status === 'completed');
  const defaultVJ = currentMovie.vjTracks?.find((t) => t.isDefault) || currentMovie.vjTracks?.[0];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % featuredMovies.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + featuredMovies.length) % featuredMovies.length);
  };

  return (
    <div className="relative w-full h-[460px] sm:h-[520px] lg:h-[600px] overflow-hidden bg-black select-none">
      {/* Background Image with Cinematic Gradient Overlay */}
      <div className="absolute inset-0 transition-opacity duration-700 ease-in-out">
        <img
          src={currentMovie.backdropUrl || currentMovie.posterUrl}
          alt={currentMovie.title}
          className="w-full h-full object-cover object-top filter brightness-[0.7] transform scale-105 transition-transform duration-1000 ease-out"
          referrerPolicy="no-referrer"
        />
        {/* Measured dark cinema scrims */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#070709] via-[#070709]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#070709] via-[#070709]/80 to-transparent max-w-3xl" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#070709] to-transparent" />
      </div>

      {/* Main Content Area */}
      <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-12 sm:pb-16 lg:pb-20 z-10">
        <div className="max-w-2xl space-y-3 sm:space-y-4">
          {/* Badges / Metadata row (No generic pill slop, clean unboxed text and subtle badges) */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-300 font-medium">
            <span className="bg-red-600 text-white font-bold px-2 py-0.5 rounded text-[11px] uppercase tracking-wider">
              {currentMovie.isUgandanExclusive ? 'Uganda Hit' : 'Trending Now'}
            </span>
            <span className="text-amber-400 flex items-center gap-1 font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              {(currentMovie.rating5 ?? (currentMovie.rating / 2)).toFixed(1)} / 5
            </span>
            <span>·</span>
            <span>{currentMovie.year}</span>
            <span>·</span>
            <span>{currentMovie.duration}</span>
            <span>·</span>
            <span className="border border-white/20 px-1 rounded text-[10px] text-gray-400">
              {currentMovie.quality}
            </span>
            {defaultVJ && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1 text-red-400 bg-red-950/40 border border-red-800/40 px-1.5 py-0.5 rounded text-[11px]">
                  <Volume2 className="w-3 h-3 text-red-400" />
                  {defaultVJ.name} ({defaultVJ.language})
                </span>
              </>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white font-['Outfit'] tracking-tight leading-none text-balance drop-shadow-md">
            {currentMovie.title}
          </h1>

          {/* Synopsis */}
          <p className="text-sm sm:text-base text-gray-300 line-clamp-2 sm:line-clamp-3 leading-relaxed max-w-xl">
            {currentMovie.synopsis}
          </p>

          {/* Offline Mode Alert banner if in offline mode and film is not downloaded */}
          {offlineMode && !isDownloaded && (
            <div className="flex items-center gap-2 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-lg max-w-md">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Offline Mode: Download this movie first to stream without internet.</span>
            </div>
          )}

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => playMovie(currentMovie)}
              className="flex items-center justify-center gap-2 px-6 sm:px-8 py-3 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-sm sm:text-base rounded-xl transition-all shadow-lg shadow-red-600/30 whitespace-nowrap cursor-pointer"
            >
              <Play className="w-5 h-5 fill-white text-white" />
              Watch Now
            </button>

            <button
              onClick={() => toggleWatchlist(currentMovie.id)}
              className={`flex items-center justify-center gap-2 px-4 sm:px-5 py-3 rounded-xl font-medium text-sm border transition-all whitespace-nowrap cursor-pointer ${
                inWatchlist
                  ? 'bg-white/20 text-white border-white/30'
                  : 'bg-black/60 hover:bg-black/80 text-gray-200 border-white/10 hover:border-white/30'
              }`}
            >
              {inWatchlist ? <Check className="w-4 h-4 text-red-400" /> : <Plus className="w-4 h-4" />}
              {inWatchlist ? 'In Watchlist' : 'Watchlist'}
            </button>

            <button
              onClick={() => openMovieDetails(currentMovie)}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-xl border border-white/10 transition-all cursor-pointer"
              title="Details & Cast"
            >
              <Info className="w-4 h-4" />
              <span className="hidden sm:inline">Details</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <div className="absolute right-4 sm:right-8 bottom-6 sm:bottom-12 z-20 flex items-center gap-2">
        <button
          onClick={handlePrev}
          aria-label="Previous slide"
          className="p-2 sm:p-2.5 rounded-full bg-black/60 hover:bg-red-600 text-white border border-white/10 transition-all hover:scale-105 cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={handleNext}
          aria-label="Next slide"
          className="p-2 sm:p-2.5 rounded-full bg-black/60 hover:bg-red-600 text-white border border-white/10 transition-all hover:scale-105 cursor-pointer"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Carousel Indicator Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {featuredMovies.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            className={`transition-all duration-300 rounded-full cursor-pointer ${
              idx === currentIndex
                ? 'w-7 h-2 bg-red-600'
                : 'w-2 h-2 bg-white/40 hover:bg-white/70'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
