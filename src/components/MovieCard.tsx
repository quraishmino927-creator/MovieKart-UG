import React, { useState } from 'react';
import { Movie } from '../types';
import { useMovieContext } from '../context/MovieContext';
import { Play, Star, Plus, Check, Download, CheckCircle2, Loader2, Volume2, Info, Eye } from 'lucide-react';

interface MovieCardProps {
  movie: Movie;
}

export const MovieCard: React.FC<MovieCardProps> = ({ movie }) => {
  const {
    playMovie,
    openMovieDetails,
    toggleWatchlist,
    isInWatchlist,
    startDownload,
    getDownloadStatus,
    offlineMode
  } = useMovieContext();

  const [imgError, setImgError] = useState(false);
  const inWatchlist = isInWatchlist(movie.id);
  const downloadInfo = getDownloadStatus(movie.id);
  const isDownloaded = downloadInfo?.status === 'completed';
  const isDownloading = downloadInfo?.status === 'downloading';
  const defaultVJ = movie.vjTracks?.find((t) => t.isDefault) || movie.vjTracks?.[0];

  // Real 5-Star rating & views (strictly start at 0 — no fake fallbacks)
  const ratingsCount = movie.ratingsCount || 0;
  const hasRatings = ratingsCount > 0 && (movie.rating5 || 0) > 0;
  const displayRating5 = hasRatings ? (movie.rating5 as number) : 0;
  const viewsCount = Math.max(0, Math.floor(movie.viewsCount || 0));

  return (
    <div className="group relative flex flex-col rounded-2xl bg-[#121217] border border-white/5 hover:border-white/20 transition-all duration-300 overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-black/60 hover:-translate-y-1">
      {/* Poster Image Container */}
      <div
        onClick={() => openMovieDetails(movie)}
        className="relative aspect-[2/3] w-full overflow-hidden bg-[#181822] cursor-pointer"
      >
        {!imgError ? (
          <img
            src={movie.posterUrl}
            alt={movie.title}
            onError={() => setImgError(true)}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-gray-900 to-black text-center">
            <span className="text-3xl mb-2">🎬</span>
            <p className="text-xs font-bold text-gray-300">{movie.title}</p>
          </div>
        )}

        {/* Top Badges: Real 5-Star Rating (only if rated) & Quality */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1 pointer-events-none">
          {hasRatings ? (
            <span className="bg-black/85 backdrop-blur-md text-amber-400 font-bold text-[11px] px-2 py-0.5 rounded-md flex items-center gap-1 border border-white/10 shadow-sm tabular-nums">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{displayRating5.toFixed(1)}</span>
            </span>
          ) : (
            <span />
          )}

          <span className="bg-black/75 backdrop-blur-md text-gray-200 text-[10px] font-semibold px-1.5 py-0.5 rounded border border-white/10 uppercase">
            {movie.quality}
          </span>
        </div>

        {/* Hover / Focus Overlay with Action Buttons */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
          <div className="flex items-center justify-center mb-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                playMovie(movie);
              }}
              title="Play Now"
              className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-500 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-red-600/50 transition-transform transform scale-90 group-hover:scale-100 cursor-pointer"
            >
              <Play className="w-6 h-6 fill-white text-white translate-x-0.5" />
            </button>
          </div>

          {/* Quick Action Ribbon */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/10">
            {/* Watchlist button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleWatchlist(movie.id);
              }}
              title={inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
              className={`p-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                inWatchlist
                  ? 'bg-red-600 text-white'
                  : 'bg-white/10 hover:bg-white/20 text-gray-200'
              }`}
            >
              {inWatchlist ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </button>

            {/* Offline Download button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!isDownloaded && !isDownloading) {
                  startDownload(movie);
                }
              }}
              disabled={isDownloaded || isDownloading}
              title={
                isDownloaded
                  ? 'Downloaded for Offline'
                  : isDownloading
                  ? `Downloading: ${downloadInfo?.progress}%`
                  : 'Download for Offline Viewing'
              }
              className={`p-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                isDownloaded
                  ? 'bg-emerald-600 text-white'
                  : isDownloading
                  ? 'bg-amber-600/50 text-amber-200'
                  : 'bg-white/10 hover:bg-white/20 text-gray-200'
              }`}
            >
              {isDownloaded ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              ) : isDownloading ? (
                <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
              ) : (
                <Download className="w-4 h-4" />
              )}
            </button>

            {/* View Details modal */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                openMovieDetails(movie);
              }}
              title="Movie Details & Ratings"
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-gray-200 text-xs font-medium transition-colors cursor-pointer"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Offline indicator badge if downloaded */}
        {isDownloaded && (
          <div className="absolute bottom-2 left-2 bg-emerald-600/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 shadow-sm">
            <CheckCircle2 className="w-2.5 h-2.5" /> Offline Ready
          </div>
        )}

        {/* Downloading progress indicator */}
        {isDownloading && (
          <div className="absolute inset-x-0 bottom-0 bg-black/80 p-1.5 flex items-center justify-between gap-1 text-[10px] text-amber-300">
            <span className="flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" /> {downloadInfo.progress}%
            </span>
            <span>{downloadInfo.speedMbps} MB/s</span>
          </div>
        )}
      </div>

      {/* Card Body Info */}
      <div className="p-3 sm:p-3.5 flex flex-col justify-between flex-1">
        <div>
          <div className="flex items-center justify-between gap-1 text-[11px] text-gray-400 mb-1">
            <span className="text-red-400 font-semibold uppercase tracking-wider text-[10px]">
              {movie.genre}
            </span>
            <span>{movie.year} · {movie.duration}</span>
          </div>

          <h3
            onClick={() => openMovieDetails(movie)}
            className="font-bold text-sm sm:text-base text-white group-hover:text-red-400 transition-colors line-clamp-1 cursor-pointer font-['Outfit']"
          >
            {movie.title}
          </h3>

          {/* Real Views & Real Rating in Card Body */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-gray-400 mt-1 tabular-nums">
            <span className="inline-flex items-center gap-1 text-gray-300">
              <Eye className="w-3 h-3 text-red-400 shrink-0" />
              <span>{viewsCount.toLocaleString()} {viewsCount === 1 ? 'view' : 'views'}</span>
            </span>
            <span className="text-gray-600">·</span>
            {hasRatings ? (
              <span className="inline-flex items-center gap-0.5 text-amber-400 font-bold">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{displayRating5.toFixed(1)}</span>
                <span className="text-gray-400 font-normal text-[10px]">({ratingsCount})</span>
              </span>
            ) : (
              <span className="text-[10px] text-gray-400">No ratings yet</span>
            )}
          </div>
        </div>

        {/* VJ Audio Badge */}
        {defaultVJ && (
          <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-400">
            <span className="flex items-center gap-1 text-gray-300">
              <Volume2 className="w-3 h-3 text-red-500 shrink-0" />
              <span className="truncate max-w-[130px]">{defaultVJ.name} ({defaultVJ.language})</span>
            </span>
            <span className="text-[10px] text-gray-400">{movie.ageRating}</span>
          </div>
        )}
      </div>
    </div>
  );
};
