import React, { useState } from 'react';
import { useMovieContext } from '../context/MovieContext';
import { Heart, Play, Trash2, Film, Tv, Sparkles } from 'lucide-react';
import { MovieCard } from './MovieCard';
import { TVShowCard } from './TVShowCard';
import { Genre } from '../types';

export const WatchlistView: React.FC = () => {
  const { movies, tvShows, watchlist, playMovie, setActiveTab, showToast } = useMovieContext();
  const [selectedGenre, setSelectedGenre] = useState<Genre>('All');

  const watchlistMovies = movies.filter((m) => watchlist.includes(m.id));
  const watchlistShows = tvShows.filter((s) => watchlist.includes(s.id));

  const filteredMovies = watchlistMovies.filter(
    (m) => selectedGenre === 'All' || m.genre === selectedGenre
  );
  const filteredShows = watchlistShows.filter(
    (s) => selectedGenre === 'All' || s.genre === selectedGenre
  );

  const totalWatchlistCount = filteredMovies.length + filteredShows.length;

  const handlePlayFirst = () => {
    if (watchlistMovies.length > 0) {
      playMovie(watchlistMovies[0]);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Heart className="w-6 h-6 text-red-500 fill-red-500" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit'] tracking-tight">
              Personalized Watchlist
            </h1>
          </div>
          <p className="text-sm text-gray-400">
            Keep track of the movies and TV series you want to watch next on MovieKart UG.
          </p>
        </div>

        {watchlistMovies.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={handlePlayFirst}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-red-600/30 transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Play Next Saved Item</span>
            </button>
          </div>
        )}
      </div>

      {/* Genre Filter Sub-Tabs */}
      {(watchlistMovies.length > 0 || watchlistShows.length > 0) && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {(['All', 'Ugandan Hits', 'Action', 'Drama', 'Sci-Fi', 'Comedy', 'Thriller'] as Genre[]).map(
            (g) => {
              const count =
                g === 'All'
                  ? watchlistMovies.length + watchlistShows.length
                  : watchlistMovies.filter((m) => m.genre === g).length +
                    watchlistShows.filter((s) => s.genre === g).length;
              if (count === 0 && g !== 'All') return null;
              return (
                <button
                  key={g}
                  onClick={() => setSelectedGenre(g)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedGenre === g
                      ? 'bg-red-600 text-white'
                      : 'bg-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  {g} ({count})
                </button>
              );
            }
          )}
        </div>
      )}

      {/* Content */}
      {totalWatchlistCount > 0 ? (
        <div className="space-y-6">
          {filteredShows.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-base font-bold text-white font-['Outfit'] flex items-center gap-2">
                <Tv className="w-4 h-4 text-red-500" />
                <span>TV Series ({filteredShows.length})</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-5">
                {filteredShows.map((show) => (
                  <TVShowCard key={show.id} show={show} />
                ))}
              </div>
            </div>
          )}

          {filteredMovies.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-base font-bold text-white font-['Outfit'] flex items-center gap-2">
                <Film className="w-4 h-4 text-red-500" />
                <span>Movies ({filteredMovies.length})</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-5">
                {filteredMovies.map((movie) => (
                  <MovieCard key={movie.id} movie={movie} />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="py-20 text-center bg-[#101017] rounded-3xl border border-white/5 p-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-600/10 flex items-center justify-center text-red-500">
            <Heart className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Your Watchlist is Empty</h3>
          <p className="text-sm text-gray-400 max-w-sm mx-auto mb-6">
            Tap the "+ Watchlist" button on any movie or TV series to save it for later.
          </p>
          <button
            onClick={() => setActiveTab('home')}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-red-600/30 cursor-pointer"
          >
            Explore Movies & TV Shows
          </button>
        </div>
      )}
    </div>
  );
};
