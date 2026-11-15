import React, { useState } from 'react';
import { useMovieContext } from '../context/MovieContext';
import { TVShowCard } from './TVShowCard';
import { ContinueWatchingRow } from './ContinueWatchingRow';
import { Genre } from '../types';
import { Tv, Volume2, Play, Loader2 } from 'lucide-react';

export const TVShowsSection: React.FC = () => {
  const { tvShows, tvShowsLoading, selectedGenre, setSelectedGenre, openShowDetails } = useMovieContext();
  const [filterVJOnly, setFilterVJOnly] = useState(false);

  if (tvShowsLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-600/15 border border-red-500/30 flex items-center justify-center mb-4">
          <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
        </div>
        <h2 className="text-lg sm:text-xl font-extrabold text-white font-['Outfit']">
          Loading TV Shows...
        </h2>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">
          Connecting live to Firestore catalog
        </p>
      </div>
    );
  }

  if (tvShows.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <div className="p-8 sm:p-12 rounded-3xl bg-[#0e0e14] border border-white/10 shadow-2xl space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-red-600/15 border border-red-500/30 flex items-center justify-center text-red-500">
            <Tv className="w-8 h-8" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit'] tracking-tight">
            No TV shows yet, Admin will add soon
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
            New series and episodes uploaded by the Admin will appear here live.
          </p>
        </div>
      </div>
    );
  }

  // Featured show for Hero Banner
  const featuredShow = tvShows.find((s) => s.isFeatured) || tvShows[0];

  const genres: { label: string; value: Genre }[] = [
    { label: 'All Series', value: 'All' },
    { label: 'Ugandan Hits 🇺🇬', value: 'Ugandan Hits' },
    { label: 'Action', value: 'Action' },
    { label: 'Drama', value: 'Drama' },
    { label: 'Sci-Fi', value: 'Sci-Fi' },
    { label: 'Comedy', value: 'Comedy' }
  ];

  const filteredShows = tvShows.filter((s) => {
    const matchesGenre = selectedGenre === 'All' || s.genre === selectedGenre;
    const matchesVJ = !filterVJOnly || (s.vjTracks && s.vjTracks.length > 0);
    return matchesGenre && matchesVJ;
  });

  const trendingShows = tvShows.filter((s) => s.isTrending);
  const ugandanShows = tvShows.filter((s) => s.genre === 'Ugandan Hits' || s.isUgandanExclusive);

  return (
    <div className="space-y-6">
      {/* Featured TV Show Hero Banner */}
      {featuredShow && (
        <div className="relative w-full h-[400px] sm:h-[480px] overflow-hidden bg-black select-none">
          <img
            src={featuredShow.backdropUrl || featuredShow.posterUrl}
            alt={featuredShow.title}
            className="w-full h-full object-cover object-top filter brightness-[0.7]"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070709] via-[#070709]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#070709] via-[#070709]/80 to-transparent max-w-2xl" />

          <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-10 sm:pb-14 z-10">
            <div className="max-w-xl space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-300 font-medium">
                <span className="bg-red-600 text-white font-bold px-2 py-0.5 rounded text-[11px] uppercase tracking-wider flex items-center gap-1">
                  <Tv className="w-3 h-3" /> Featured Series
                </span>
                <span className="text-amber-400 font-bold">★ {featuredShow.rating.toFixed(1)}</span>
                <span>·</span>
                <span>{featuredShow.year}</span>
                <span>·</span>
                <span className="text-gray-300">
                  {featuredShow.seasons.length} Seasons
                </span>
                <span>·</span>
                <span className="border border-white/20 px-1 rounded text-[10px] text-gray-400">
                  {featuredShow.quality}
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold text-white font-['Outfit'] tracking-tight leading-none drop-shadow">
                {featuredShow.title}
              </h1>

              <p className="text-sm text-gray-300 line-clamp-2 leading-relaxed">
                {featuredShow.synopsis}
              </p>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => openShowDetails(featuredShow)}
                  className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-red-600/30 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Explore Seasons & Episodes</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Continue Watching Shelf */}
      <ContinueWatchingRow />

      {/* Genre Filter Tabs Bar */}
      <div className="w-full border-b border-white/5 bg-[#0b0b10] py-3 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 sm:gap-2">
            {genres.map((g) => (
              <button
                key={g.value}
                onClick={() => setSelectedGenre(g.value)}
                className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedGenre === g.value
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                    : 'bg-white/5 text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setFilterVJOnly(!filterVJOnly)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors shrink-0 cursor-pointer ${
              filterVJOnly
                ? 'bg-red-950/60 text-red-400 border-red-500/50'
                : 'bg-white/5 text-gray-400 border-white/5 hover:text-gray-200'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5 text-red-500" />
            <span>VJ Audio Tracks</span>
          </button>
        </div>
      </div>

      {/* When a specific Genre is active */}
      {selectedGenre !== 'All' || filterVJOnly ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white font-['Outfit']">
                {selectedGenre === 'All' ? 'VJ Audio Series' : `${selectedGenre} Series`}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Browse multi-season TV shows with episode streams
              </p>
            </div>
            <span className="text-xs font-bold text-red-500 bg-red-950/40 border border-red-800/30 px-2 py-0.5 rounded-full">
              {filteredShows.length} Shows
            </span>
          </div>

          {filteredShows.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No TV shows match this filter.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-5">
              {filteredShows.map((show) => (
                <TVShowCard key={show.id} show={show} />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Categorized sections for TV Shows */
        <div className="space-y-8 py-2">
          {/* Trending TV Series */}
          {trendingShows.length > 0 && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white font-['Outfit']">
                    🔥 Trending TV Shows in Uganda
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Binge-worthy drama and action series with full seasons
                  </p>
                </div>
                <span className="text-xs font-bold text-red-500 bg-red-950/40 border border-red-800/30 px-2 py-0.5 rounded-full">
                  {trendingShows.length}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-5">
                {trendingShows.map((show) => (
                  <TVShowCard key={show.id} show={show} />
                ))}
              </div>
            </div>
          )}

          {/* Ugandan Hits & VJ Translated Series */}
          {ugandanShows.length > 0 && (
            <div className="bg-[#0c0c12] py-6 border-y border-white/5">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-white font-['Outfit']">
                      🇺🇬 Ugandan TV Series & VJ Specials
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Original Kampala productions with iconic VJ Junior and VJ Emmy narration
                    </p>
                  </div>
                  <span className="text-xs font-bold text-red-500 bg-red-950/40 border border-red-800/30 px-2 py-0.5 rounded-full">
                    {ugandanShows.length}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-5">
                  {ugandanShows.map((show) => (
                    <TVShowCard key={show.id} show={show} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* All TV Shows Catalogue */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white font-['Outfit']">
                  📺 Complete TV Shows Catalog
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Click any series to select seasons and watch episodes
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-5">
              {tvShows.map((show) => (
                <TVShowCard key={show.id} show={show} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
