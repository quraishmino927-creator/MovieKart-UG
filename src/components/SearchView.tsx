import React, { useState, useMemo } from 'react';
import { useMovieContext } from '../context/MovieContext';
import { Search, X, Flame, Film, Tv, Volume2, Sparkles, Filter } from 'lucide-react';
import { MovieCard } from './MovieCard';
import { TVShowCard } from './TVShowCard';
import { Genre } from '../types';

export const SearchView: React.FC = () => {
  const { movies, tvShows, searchQuery, setSearchQuery } = useMovieContext();
  const [selectedGenreFilter, setSelectedGenreFilter] = useState<Genre>('All');
  const [searchFilterType, setSearchFilterType] = useState<'all' | 'movies' | 'tvshows'>('all');
  const [vjOnly, setVjOnly] = useState<boolean>(false);

  const presetTags = [
    'Wakaliwood',
    'Kampala Hustle',
    'VJ Junior',
    'VJ Emmy',
    'Series',
    'Action 4K',
    'Sci-Fi',
    'Comedy'
  ];

  const q = searchQuery.toLowerCase().trim();

  const filteredMovies = useMemo(() => {
    if (searchFilterType === 'tvshows') return [];
    return movies.filter((movie) => {
      const matchesQuery =
        !q ||
        movie.title.toLowerCase().includes(q) ||
        movie.synopsis.toLowerCase().includes(q) ||
        movie.genre.toLowerCase().includes(q) ||
        (movie.director && movie.director.toLowerCase().includes(q)) ||
        (movie.cast && movie.cast.some((c) => c.toLowerCase().includes(q))) ||
        (movie.vjTracks &&
          movie.vjTracks.some(
            (vj) =>
              vj.name.toLowerCase().includes(q) ||
              vj.language.toLowerCase().includes(q)
          ));

      const matchesGenre =
        selectedGenreFilter === 'All' || movie.genre === selectedGenreFilter;
      const matchesVJ = !vjOnly || (movie.vjTracks && movie.vjTracks.length > 0);

      return matchesQuery && matchesGenre && matchesVJ;
    });
  }, [movies, q, selectedGenreFilter, vjOnly, searchFilterType]);

  const filteredTVShows = useMemo(() => {
    if (searchFilterType === 'movies') return [];
    return tvShows.filter((show) => {
      const matchesQuery =
        !q ||
        show.title.toLowerCase().includes(q) ||
        show.synopsis.toLowerCase().includes(q) ||
        show.genre.toLowerCase().includes(q) ||
        (show.creator && show.creator.toLowerCase().includes(q)) ||
        (show.cast && show.cast.some((c) => c.toLowerCase().includes(q))) ||
        (show.seasons &&
          show.seasons.some((sea) =>
            sea.episodes.some(
              (ep) =>
                ep.title.toLowerCase().includes(q) ||
                ep.synopsis.toLowerCase().includes(q)
            )
          )) ||
        (show.vjTracks &&
          show.vjTracks.some((vj) => vj.name.toLowerCase().includes(q)));

      const matchesGenre =
        selectedGenreFilter === 'All' || show.genre === selectedGenreFilter;
      const matchesVJ = !vjOnly || (show.vjTracks && show.vjTracks.length > 0);

      return matchesQuery && matchesGenre && matchesVJ;
    });
  }, [tvShows, q, selectedGenreFilter, vjOnly, searchFilterType]);

  const totalResults = filteredMovies.length + filteredTVShows.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Search Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit'] tracking-tight mb-2">
          Search & Discover
        </h1>
        <p className="text-sm text-gray-400">
          Find movies, TV series, episodes, and VJ commentary specials across MovieKart UG.
        </p>
      </div>

      {/* Main Search Input */}
      <div className="relative w-full">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search movies, TV shows, 'Kampala Hustle', 'Bruce U', 'VJ Junior'..."
          autoFocus
          className="w-full bg-[#14141c] text-white text-base sm:text-lg pl-12 pr-12 py-3.5 rounded-2xl border border-white/10 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all shadow-inner"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            aria-label="Clear search"
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Quick Tags */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-gray-400 font-semibold mr-1">Popular:</span>
        {presetTags.map((tag) => (
          <button
            key={tag}
            onClick={() => setSearchQuery(tag)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              searchQuery.toLowerCase() === tag.toLowerCase()
                ? 'bg-red-600 text-white border-red-500'
                : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Format Filter (All / Movies / TV Shows) + Genre Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/5">
        <div className="flex items-center gap-1.5 bg-[#14141c] p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setSearchFilterType('all')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              searchFilterType === 'all'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            All Formats
          </button>
          <button
            onClick={() => setSearchFilterType('movies')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              searchFilterType === 'movies'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Movies
          </button>
          <button
            onClick={() => setSearchFilterType('tvshows')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              searchFilterType === 'tvshows'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            TV Shows
          </button>
        </div>

        {/* VJ Toggle */}
        <button
          onClick={() => setVjOnly(!vjOnly)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
            vjOnly
              ? 'bg-red-950/60 text-red-400 border-red-500/50'
              : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'
          }`}
        >
          <Volume2 className="w-3.5 h-3.5 text-red-500" />
          <span>Luganda VJ Audio Only</span>
        </button>
      </div>

      {/* Results Section */}
      <div className="pt-2 space-y-6">
        <p className="text-xs sm:text-sm text-gray-400">
          Found <span className="text-white font-bold">{totalResults}</span> titles
          {searchQuery ? ` matching "${searchQuery}"` : ''}
        </p>

        {/* TV Shows Results */}
        {filteredTVShows.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-base font-bold text-white font-['Outfit'] flex items-center gap-2">
              <Tv className="w-4 h-4 text-red-500" />
              <span>TV Series ({filteredTVShows.length})</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-5">
              {filteredTVShows.map((show) => (
                <TVShowCard key={show.id} show={show} />
              ))}
            </div>
          </div>
        )}

        {/* Movies Results */}
        {filteredMovies.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-base font-bold text-white font-['Outfit'] flex items-center gap-2">
              <Film className="w-4 h-4 text-red-500" />
              <span>Feature Movies ({filteredMovies.length})</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-5">
              {filteredMovies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          </div>
        )}

        {totalResults === 0 && (
          <div className="py-20 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center text-gray-500">
              <Film className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">No Matches Found</h3>
            <p className="text-sm text-gray-400 max-w-sm mx-auto mb-4">
              Try searching for "Kampala", "Wakaliwood", "Junior", or clear your filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedGenreFilter('All');
                setSearchFilterType('all');
                setVjOnly(false);
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Reset Search
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
