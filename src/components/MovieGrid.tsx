import React from 'react';
import { Movie } from '../types';
import { MovieCard } from './MovieCard';
import { Flame, Sparkles, Film, ChevronRight } from 'lucide-react';

interface MovieGridProps {
  title?: string;
  subtitle?: string;
  movies: Movie[];
  emptyMessage?: string;
  onExploreAll?: () => void;
}

export const MovieGrid: React.FC<MovieGridProps> = ({
  title,
  subtitle,
  movies,
  emptyMessage = 'No movies found in this category.',
  onExploreAll
}) => {
  if (movies.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-white/5 flex items-center justify-center text-gray-500">
          <Film className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white mb-2">No Movies Found</h3>
          <p className="text-sm text-gray-400 max-w-md mx-auto">{emptyMessage}</p>
        </div>
        {onExploreAll && (
          <button
            type="button"
            onClick={onExploreAll}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#E50914] hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/25 transition-colors cursor-pointer"
          >
            <span>Show All Movies</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Section Header */}
      {title && (
        <div className="flex items-end justify-between mb-5">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-white font-['Outfit'] tracking-tight">
                {title}
              </h2>
              <span className="text-xs font-bold text-red-500 bg-red-950/40 border border-red-800/30 px-2 py-0.5 rounded-full">
                {movies.length}
              </span>
            </div>
            {subtitle && <p className="text-xs sm:text-sm text-gray-400 mt-1">{subtitle}</p>}
          </div>

          {onExploreAll && (
            <button
              onClick={onExploreAll}
              className="text-xs font-semibold text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors cursor-pointer"
            >
              See all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Grid container */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-5">
        {movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </section>
  );
};
