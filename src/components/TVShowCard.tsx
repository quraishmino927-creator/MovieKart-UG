import React, { useState } from 'react';
import { TVShow } from '../types';
import { useMovieContext } from '../context/MovieContext';
import { Play, Star, Plus, Check, Layers, Volume2, Eye } from 'lucide-react';

interface TVShowCardProps {
  show: TVShow;
}

export const TVShowCard: React.FC<TVShowCardProps> = ({ show }) => {
  const { openShowDetails, toggleWatchlist, isInWatchlist } = useMovieContext();
  const [imgError, setImgError] = useState(false);
  const inWatchlist = isInWatchlist(show.id);
  const totalEpisodes = show.seasons.reduce((acc, s) => acc + s.episodes.length, 0);
  const defaultVJ = show.vjTracks?.find((t) => t.isDefault) || show.vjTracks?.[0];
  const ratingsCount = show.ratingsCount || 0;
  const hasRatings = ratingsCount > 0 && (show.rating5 || 0) > 0;
  const viewsCount = Math.max(0, Math.floor(show.viewsCount || 0));

  return (
    <div className="group relative flex flex-col rounded-2xl bg-[#121217] border border-white/5 hover:border-white/20 transition-all duration-300 overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-black/60 hover:-translate-y-1">
      {/* Poster Image */}
      <div
        onClick={() => openShowDetails(show)}
        className="relative aspect-[2/3] w-full overflow-hidden bg-[#181822] cursor-pointer"
      >
        {!imgError ? (
          <img
            src={show.posterUrl}
            alt={show.title}
            onError={() => setImgError(true)}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-gray-900 to-black text-center">
            <span className="text-3xl mb-2">📺</span>
            <p className="text-xs font-bold text-gray-300">{show.title}</p>
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1 pointer-events-none">
          {hasRatings ? (
            <span className="bg-black/75 backdrop-blur-md text-amber-400 font-bold text-[11px] px-2 py-0.5 rounded-md flex items-center gap-1 border border-white/10 tabular-nums">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              {show.rating5!.toFixed(1)}
            </span>
          ) : (
            <span />
          )}

          <span className="bg-black/75 backdrop-blur-md text-gray-200 text-[10px] font-semibold px-1.5 py-0.5 rounded border border-white/10 uppercase">
            {show.quality}
          </span>
        </div>

        {/* Hover / Focus Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
          <div className="flex items-center justify-center mb-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                openShowDetails(show);
              }}
              className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-500 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-red-600/50 transition-transform transform scale-90 group-hover:scale-100 cursor-pointer"
            >
              <Play className="w-6 h-6 fill-white text-white translate-x-0.5" />
            </button>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/10">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleWatchlist(show.id);
              }}
              title={inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
              className={`p-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                inWatchlist ? 'bg-red-600 text-white' : 'bg-white/10 hover:bg-white/20 text-gray-200'
              }`}
            >
              {inWatchlist ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                openShowDetails(show);
              }}
              className="flex-1 py-1.5 px-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold text-center cursor-pointer"
            >
              View Episodes
            </button>
          </div>
        </div>

        {/* Seasons count pill */}
        <div className="absolute bottom-2 left-2 bg-black/80 backdrop-blur-sm text-gray-300 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 border border-white/10">
          <Layers className="w-3 h-3 text-red-500" />
          <span>{show.seasons.length} {show.seasons.length === 1 ? 'Season' : 'Seasons'} ({totalEpisodes} Eps)</span>
        </div>
      </div>

      {/* Card Info */}
      <div className="p-3 sm:p-3.5 flex flex-col justify-between flex-1">
        <div>
          <div className="flex items-center justify-between gap-1 text-[11px] text-gray-400 mb-1">
            <span className="text-red-400 font-semibold uppercase tracking-wider text-[10px]">
              {show.genre}
            </span>
            <span>{show.year} · Series</span>
          </div>

          <h3
            onClick={() => openShowDetails(show)}
            className="font-bold text-sm sm:text-base text-white group-hover:text-red-400 transition-colors line-clamp-1 cursor-pointer font-['Outfit']"
          >
            {show.title}
          </h3>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-gray-400 mt-1 tabular-nums">
            <span className="inline-flex items-center gap-1 text-gray-300">
              <Eye className="w-3 h-3 text-red-400 shrink-0" />
              <span>{viewsCount.toLocaleString()} {viewsCount === 1 ? 'view' : 'views'}</span>
            </span>
            <span className="text-gray-600">·</span>
            {hasRatings ? (
              <span className="inline-flex items-center gap-0.5 text-amber-400 font-bold">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{show.rating5!.toFixed(1)}</span>
              </span>
            ) : (
              <span className="text-[10px] text-gray-400">No ratings yet</span>
            )}
          </div>
        </div>

        {defaultVJ && (
          <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-400">
            <span className="flex items-center gap-1 text-gray-300">
              <Volume2 className="w-3 h-3 text-red-500 shrink-0" />
              <span className="truncate max-w-[130px]">{defaultVJ.name}</span>
            </span>
            <span className="text-[10px] text-gray-400">{show.ageRating}</span>
          </div>
        )}
      </div>
    </div>
  );
};
