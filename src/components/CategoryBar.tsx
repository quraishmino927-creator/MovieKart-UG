import React from 'react';
import { useMovieContext } from '../context/MovieContext';
import { Genre, VJ_FILTER_OPTIONS } from '../types';
import { Flame, Volume2, Film, Mic } from 'lucide-react';

interface CategoryBarProps {
  showSubFilters?: boolean;
  filterVJOnly?: boolean;
  setFilterVJOnly?: (v: boolean) => void;
}

export const CategoryBar: React.FC<CategoryBarProps> = ({
  showSubFilters = true,
  filterVJOnly = false,
  setFilterVJOnly
}) => {
  const { selectedGenre, setSelectedGenre, selectedVJ, setSelectedVJ } = useMovieContext();

  const genres: { label: string; value: Genre; icon?: string }[] = [
    { label: 'All Films', value: 'All' },
    { label: 'Action', value: 'Action' },
    { label: 'Drama', value: 'Drama' },
    { label: 'Sci-Fi', value: 'Sci-Fi' },
    { label: 'Comedy', value: 'Comedy' },
    { label: 'Ugandan Hits 🇺🇬', value: 'Ugandan Hits' },
    { label: 'Thriller', value: 'Thriller' }
  ];

  return (
    <div className="w-full border-b border-white/5 bg-[#0b0b10] py-3 sticky top-16 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-2.5">
        {/* Row 1: Genre Filter Row */}
        <div className="flex items-center justify-between gap-4 overflow-x-auto no-scrollbar py-0.5">
          {/* Main Genre Tabs */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {genres.map((g) => {
              const isSelected = selectedGenre === g.value;
              return (
                <button
                  key={g.value}
                  onClick={() => setSelectedGenre(g.value)}
                  className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                      : 'bg-white/5 text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {g.value === 'All' && <Film className="w-3.5 h-3.5" />}
                  {g.value === 'Action' && <Flame className="w-3.5 h-3.5 text-amber-400" />}
                  {g.label}
                </button>
              );
            })}
          </div>

          {/* Special Ugandan VJ Quick Toggle Filter */}
          {showSubFilters && setFilterVJOnly && (
            <div className="flex items-center gap-2 pl-2 border-l border-white/10 shrink-0">
              <button
                onClick={() => setFilterVJOnly(!filterVJOnly)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                  filterVJOnly
                    ? 'bg-red-950/60 text-red-400 border-red-500/50 shadow-sm'
                    : 'bg-white/5 text-gray-400 border-white/5 hover:text-gray-200'
                }`}
              >
                <Volume2 className="w-3.5 h-3.5 text-red-500" />
                <span className="whitespace-nowrap">VJ Translated</span>
              </button>
            </div>
          )}
        </div>

        {/* Row 2: Browse by VJ Filter Row */}
        <div className="pt-2 border-t border-white/5 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5 text-[#E50914]" />
              <span>Browse by VJ</span>
            </h3>
            {selectedVJ !== 'All VJs' && (
              <button
                type="button"
                onClick={() => setSelectedVJ('All VJs')}
                className="text-[11px] font-semibold text-red-400 hover:text-red-300 cursor-pointer"
              >
                Reset to All VJs
              </button>
            )}
          </div>

          <div
            role="tablist"
            aria-label="Browse by VJ"
            className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5"
          >
            {VJ_FILTER_OPTIONS.map((vj) => {
              const isSelected = selectedVJ === vj;
              return (
                <button
                  key={vj}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setSelectedVJ(vj)}
                  className={`px-3 sm:px-3.5 py-1.5 min-h-[36px] rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#E50914] text-white shadow-md shadow-red-600/30'
                      : 'bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 border border-white/5'
                  }`}
                >
                  {vj}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
