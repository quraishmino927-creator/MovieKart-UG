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
import { OfflineIndicator } from './components/PWAInstallButton';
import { WhatsAppSupportButton } from './components/WhatsAppSupportButton';
import { WifiOff, Film, Loader2, AlertCircle } from 'lucide-react';

const MainContent: React.FC = () => {
  const {
    currentUser,
    contentMode,
    activeTab,
    selectedGenre,
    setSelectedGenre,
    movies,
    moviesLoading,
    firestoreError,
    offlineMode,
    toastMessage
  } = useMovieContext();

  const [filterVJOnly, setFilterVJOnly] = useState(false);

  // Admin route (/admin): only accessible by typing /admin at the end of the URL
  if (activeTab === 'admin') {
    return (
      <div className="min-h-screen bg-[#070709] text-gray-100 flex flex-col font-['Plus_Jakarta_Sans']">
        <Header />
        <main className="flex-1">
          <AdminDashboard />
        </main>
        {toastMessage && (
          <div className="fixed top-20 right-4 sm:right-8 z-50 animate-bounce duration-200">
            <div className="bg-[#181824] border border-red-500/50 text-white px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs sm:text-sm font-semibold backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span>{toastMessage}</span>
            </div>
          </div>
        )}
        <VideoPlayerModal />
      </div>
    );
  }

  // Filtered lists for Movies Home sections (all sourced LIVE from Firestore)
  const trendingMovies = movies.filter((m) => m.isTrending);
  const ugandanMovies = movies.filter((m) => m.genre === 'Ugandan Hits' || m.isUgandanExclusive);
  const actionMovies = movies.filter((m) => m.genre === 'Action');
  const sciFiMovies = movies.filter((m) => m.genre === 'Sci-Fi');
  const comedyMovies = movies.filter((m) => m.genre === 'Comedy');
  const dramaMovies = movies.filter((m) => m.genre === 'Drama');
  const thrillerMovies = movies.filter((m) => m.genre === 'Thriller');

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
                {moviesLoading ? (
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-2xl bg-red-600/15 border border-red-500/30 flex items-center justify-center mb-4">
                      <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-extrabold text-white font-['Outfit']">
                      Loading MovieKart UG...
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-400 mt-1">
                      Connecting live to Firestore catalog
                    </p>
                  </div>
                ) : movies.length === 0 ? (
                  <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
                    <div className="p-8 sm:p-12 rounded-3xl bg-[#0e0e14] border border-white/10 shadow-2xl space-y-4">
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-red-600/15 border border-red-500/30 flex items-center justify-center text-red-500">
                        <Film className="w-8 h-8" />
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit'] tracking-tight">
                        No movies yet, Admin will add soon
                      </h2>
                      <p className="text-xs sm:text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
                        New films added by the Admin will appear here instantaneously for all viewers across Uganda.
                      </p>
                      {firestoreError && (
                        <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{firestoreError}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Hero Carousel (Live Firestore Featured / Latest) */}
                    <HeroCarousel />

                    {/* Continue Watching Row */}
                    <ContinueWatchingRow />

                    {/* Category Navigation Bar */}
                    <CategoryBar
                      showSubFilters={true}
                      filterVJOnly={filterVJOnly}
                      setFilterVJOnly={setFilterVJOnly}
                    />

                    {/* When a specific Genre or VJ filter is selected */}
                    {selectedGenre !== 'All' || filterVJOnly ? (
                      <div className="py-2">
                        <MovieGrid
                          title={selectedGenre === 'All' ? 'VJ Translated Films' : `${selectedGenre} Films`}
                          subtitle={`Discover curated ${selectedGenre.toLowerCase()} cinema with high-definition audio & VJ translation`}
                          movies={activeGenreMovies}
                          onExploreAll={() => {
                            setSelectedGenre('All');
                            setFilterVJOnly(false);
                          }}
                        />
                      </div>
                    ) : (
                      /* When "All" is active, show Latest Movies first + non-empty category shelves */
                      <div className="space-y-8 py-2">
                        {/* 0. Latest Movies on MovieKart UG (ensures every published movie appears instantly) */}
                        <MovieGrid
                          title="🎬 Latest Movies on MovieKart UG"
                          subtitle="Live catalog updated directly by Admin"
                          movies={movies}
                        />

                        {trendingMovies.length > 0 && (
                          <div className="bg-[#0c0c12] py-4 border-y border-white/5">
                            <MovieGrid
                              title="🔥 Trending Movies in Uganda"
                              subtitle="Most watched titles across Kampala, Jinja, Entebbe, and Mbarara"
                              movies={trendingMovies}
                            />
                          </div>
                        )}

                        {ugandanMovies.length > 0 && (
                          <MovieGrid
                            title="🇺🇬 Ugandan Hits & VJ Translated Cinema"
                            subtitle="Iconic Luganda commentary and Ugandan blockbusters"
                            movies={ugandanMovies}
                          />
                        )}

                        {actionMovies.length > 0 && (
                          <MovieGrid
                            title="⚡ Action & Martial Arts"
                            subtitle="High adrenaline stunts, tactical squads, and non-stop combat"
                            movies={actionMovies}
                          />
                        )}

                        {sciFiMovies.length > 0 && (
                          <MovieGrid
                            title="🚀 Sci-Fi & Cyber Visions"
                            subtitle="Futuristic dimensions, AI insurgencies, and cosmic quests"
                            movies={sciFiMovies}
                          />
                        )}

                        {comedyMovies.length > 0 && (
                          <div className="bg-[#0c0c12] py-4 border-y border-white/5">
                            <MovieGrid
                              title="😂 Comedy & Stand-Up Specials"
                              subtitle="Laughs and feel-good adventures"
                              movies={comedyMovies}
                            />
                          </div>
                        )}

                        {dramaMovies.length > 0 && (
                          <MovieGrid
                            title="🎭 Drama & Compelling Stories"
                            subtitle="Inspirational human sagas and deep emotional storytelling"
                            movies={dramaMovies}
                          />
                        )}

                        {thrillerMovies.length > 0 && (
                          <MovieGrid
                            title="🕵️ Thriller & Suspense"
                            subtitle="Edge-of-your-seat mysteries and high-stakes plots"
                            movies={thrillerMovies}
                          />
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'search' && <SearchView />}
        {activeTab === 'watchlist' && <WatchlistView />}
        {activeTab === 'downloads' && <DownloadsView />}
        {activeTab === 'profile' && (currentUser ? <ProfileView /> : <AuthScreen />)}
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

      {/* Offline Connectivity Indicator */}
      <OfflineIndicator />

      {/* Floating WhatsApp Support Button */}
      <WhatsAppSupportButton />

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
