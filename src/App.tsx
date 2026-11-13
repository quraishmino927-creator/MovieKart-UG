import React, { useState } from 'react';
import { MovieProvider, useMovieContext } from './context/MovieContext';
import { AuthScreen } from './components/AuthScreen';
import { Header } from './components/Header';
import { HeroCarousel } from './components/HeroCarousel';
import { ContinueWatchingRow } from './components/ContinueWatchingRow';
import { CategoryBar } from './components/CategoryBar';
import { MovieGrid } from './components/MovieGrid';
import { MovieDetailsModal } from './components/MovieDetailsModal';
import { TVShowDetailsModal } from './components/TVShowDetailsModal';
import { TVShowsSection } from './components/TVShowsSection';
import { VideoPlayerModal } from './components/VideoPlayerModal';
import { SearchView } from './components/SearchView';
import { WatchlistView } from './components/WatchlistView';
import { DownloadsView } from './components/DownloadsView';
import { ProfileView } from './components/ProfileView';
import { AdminDashboard } from './components/AdminDashboard';
import { BottomNavBar } from './components/BottomNavBar';
import { WifiOff, Film, Tv, Sparkles, Heart, ChevronRight, CheckCircle2 } from 'lucide-react';

const MainContent: React.FC = () => {
  const {
    currentUser,
    contentMode,
    activeTab,
    selectedGenre,
    setSelectedGenre,
    movies,
    offlineMode,
    watchlist,
    downloads,
    toastMessage
  } = useMovieContext();

  const [filterVJOnly, setFilterVJOnly] = useState(false);

  // If no user is authenticated, render the Sign Up / Login screen as the first screen before Home
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#070709] text-gray-100 font-['Plus_Jakarta_Sans']">
        <AuthScreen />
        {toastMessage && (
          <div className="fixed top-20 right-4 sm:right-8 z-50 animate-bounce duration-200">
            <div className="bg-[#181824] border border-red-500/50 text-white px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs sm:text-sm font-semibold backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span>{toastMessage}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Filtered lists for Movies Home sections
  const trendingMovies = movies.filter((m) => m.isTrending);
  const ugandanMovies = movies.filter((m) => m.genre === 'Ugandan Hits' || m.isUgandanExclusive);
  const actionMovies = movies.filter((m) => m.genre === 'Action');
  const sciFiMovies = movies.filter((m) => m.genre === 'Sci-Fi');
  const comedyMovies = movies.filter((m) => m.genre === 'Comedy');
  const dramaMovies = movies.filter((m) => m.genre === 'Drama');

  // Currently filtered view when a specific genre is chosen in CategoryBar
  const activeGenreMovies = movies.filter((m) => {
    const matchesGenre = selectedGenre === 'All' || m.genre === selectedGenre;
    const matchesVJ = !filterVJOnly || (m.vjTracks && m.vjTracks.length > 0);
    return matchesGenre && matchesVJ;
  });

  return (
    <div className="min-h-screen bg-[#070709] text-gray-100 flex flex-col font-['Plus_Jakarta_Sans'] pb-24">
      {/* Top Header with Movies / TV Shows Toggle */}
      <Header />

      {/* Offline Mode Banner */}
      {offlineMode && (
        <div className="bg-amber-500/20 border-b border-amber-500/40 px-4 py-2 text-center text-xs text-amber-200 font-semibold flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4 text-amber-400" />
          <span>Offline Mode is ON — Showing downloaded content ready to stream without internet data.</span>
        </div>
      )}

      {/* Main Tab Routing */}
      <main className="flex-1">
        {activeTab === 'home' && (
          <div>
            {/* If TV Shows mode is active */}
            {contentMode === 'tvshows' ? (
              <TVShowsSection />
            ) : (
              /* If Movies mode is active */
              <div className="space-y-6">
                {/* Hero Carousel (Now Playing) */}
                <HeroCarousel />

                {/* Continue Watching Row (Prompt Requirement: Add a 'Continue Watching' row at the top of the Home screen that automatically populates with partially watched movies or episodes, including a progress bar overlay on their thumbnails) */}
                <ContinueWatchingRow />

                {/* Category Navigation Bar for Action, Drama, Sci-Fi, Comedy, Ugandan Hits */}
                <CategoryBar
                  showSubFilters={true}
                  filterVJOnly={filterVJOnly}
                  setFilterVJOnly={setFilterVJOnly}
                />

                {/* When a specific Genre is selected */}
                {selectedGenre !== 'All' ? (
                  <div className="py-2">
                    <MovieGrid
                      title={`${selectedGenre} Films`}
                      subtitle={`Discover curated ${selectedGenre.toLowerCase()} cinema with high-definition audio & VJ translation`}
                      movies={activeGenreMovies}
                      onExploreAll={() => setSelectedGenre('All')}
                    />
                  </div>
                ) : (
                  /* When "All" is active, show categorized rows */
                  <div className="space-y-8 py-2">
                    {/* 1. Trending Movies Section */}
                    <MovieGrid
                      title="🔥 Trending Movies in Uganda"
                      subtitle="Most watched titles across Kampala, Jinja, Entebbe, and Mbarara this week"
                      movies={trendingMovies}
                    />

                    {/* 2. Ugandan Hits & VJ Translated Section */}
                    <div className="bg-[#0c0c12] py-4 border-y border-white/5">
                      <MovieGrid
                        title="🇺🇬 Ugandan Hits & VJ Translated Cinema"
                        subtitle="Iconic Luganda commentary by VJ Junior, VJ Emmy, and Wakaliwood blockbusters"
                        movies={ugandanMovies}
                      />
                    </div>

                    {/* 3. Action Blockbusters */}
                    <MovieGrid
                      title="⚡ Action & Martial Arts"
                      subtitle="High adrenaline stunts, tactical squads, and non-stop combat"
                      movies={actionMovies}
                    />

                    {/* 4. Sci-Fi & Cyber Futures */}
                    <MovieGrid
                      title="🚀 Sci-Fi & Cyber Visions"
                      subtitle="Futuristic dimensions, AI insurgencies, and cosmic quests"
                      movies={sciFiMovies}
                    />

                    {/* 5. Comedy Nights */}
                    <div className="bg-[#0c0c12] py-4 border-y border-white/5">
                      <MovieGrid
                        title="😂 Comedy & Stand-Up Specials"
                        subtitle="Laughs from Kampala's finest comedians and animated adventures"
                        movies={comedyMovies}
                      />
                    </div>

                    {/* 6. Drama & Emotional Journeys */}
                    <MovieGrid
                      title="🎭 Drama & Compelling Stories"
                      subtitle="Inspirational human sagas and deep emotional storytelling"
                      movies={dramaMovies}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'search' && <SearchView />}
        {activeTab === 'watchlist' && <WatchlistView />}
        {activeTab === 'downloads' && <DownloadsView />}
        {activeTab === 'profile' && <ProfileView />}
        {activeTab === 'admin' && <AdminDashboard />}
      </main>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 animate-bounce duration-200">
          <div className="bg-[#181824] border border-red-500/50 text-white px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs sm:text-sm font-semibold backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Modals */}
      <MovieDetailsModal />
      <TVShowDetailsModal />
      <VideoPlayerModal />

      {/* Bottom Navigation Bar */}
      <BottomNavBar />
    </div>
  );
};

export default function App() {
  return (
    <MovieProvider>
      <MainContent />
    </MovieProvider>
  );
}
