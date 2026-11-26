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
import { LiveTVSection } from './components/LiveTVSection';
import { VideoPlayerModal } from './components/VideoPlayerModal';
import { SearchView } from './components/SearchView';
import { WatchlistView } from './components/WatchlistView';
import { DownloadsView } from './components/DownloadsView';
import { ProfileView } from './components/ProfileView';
import { AdminDashboard } from './components/AdminDashboard';
import { BottomNavBar } from './components/BottomNavBar';
import { OfflineIndicator } from './components/PWAInstallButton';
import { WhatsAppSupportButton } from './components/WhatsAppSupportButton';
import { TrialBanner } from './components/TrialBanner';
import { TrialExpiredPaywall } from './components/TrialExpiredPaywall';
import { SubscriptionLockedModal } from './components/SubscriptionLockedModal';
import { WifiOff, Film, Loader2, AlertCircle } from 'lucide-react';
import { Movie, NAMED_VJS, VJFilter } from './types';

const normalizeLabel = (val: string) => val.trim().toLowerCase().replace(/\s+/g, ' ');

function movieMatchesSelectedVJ(movie: Movie, selectedVJ: VJFilter): boolean {
  if (selectedVJ === 'All VJs') return true;

  const trackNames = (movie.vjTracks || []).map((t) => normalizeLabel(t.name)).filter(Boolean);
  const explicitVj = movie.vjName ? normalizeLabel(movie.vjName) : '';
  const searchableText = normalizeLabel(`${movie.title || ''} ${movie.description || ''}`);

  const matchesNamedVJ = (vjLabel: string): boolean => {
    const target = normalizeLabel(vjLabel);
    if (trackNames.some((n) => n === target || n.includes(target))) return true;
    if (explicitVj && (explicitVj === target || explicitVj.includes(target))) return true;
    if (searchableText.includes(target)) return true;
    return false;
  };

  if (selectedVJ === 'Other VJs') {
    return !NAMED_VJS.some((known) => matchesNamedVJ(known));
  }

  return matchesNamedVJ(selectedVJ);
}

const MainContent: React.FC = () => {
  const {
    currentUser,
    currentUserTrialInfo,
    contentMode,
    activeTab,
    selectedGenre,
    setSelectedGenre,
    selectedVJ,
    setSelectedVJ,
    movies,
    moviesLoading,
    firestoreError,
    offlineMode,
    toastMessage
  } = useMovieContext();

  const [filterVJOnly, setFilterVJOnly] = useState(false);
  const [showSubscriptionLockedModal, setShowSubscriptionLockedModal] = useState(false);

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

  // Dedicated Poster Portal route (/poster): ONLY Poster Login / Poster Dashboard — NO viewer movies or nav
  if (activeTab === 'poster') {
    return (
      <div className="min-h-screen bg-[#070709] text-gray-100 flex flex-col font-['Plus_Jakarta_Sans']">
        <main className="flex-1">
          <AdminDashboard portalMode="poster" />
        </main>
        {toastMessage && (
          <div className="fixed top-6 right-4 sm:right-8 z-50">
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

  // 1. FORCE SIGN UP / LOGIN GATE: Block ALL online browsing until signed in,
  //    EXCEPT when opening the app offline so users can always play their saved offline downloads.
  const isDeviceOffline = typeof navigator !== 'undefined' && !navigator.onLine;
  if (!currentUser && !isDeviceOffline) {
    return (
      <>
        <AuthScreen isForcedGate={true} />
        {toastMessage && (
          <div className="fixed top-6 right-4 sm:right-8 z-50">
            <div className="bg-[#181824] border border-red-500/50 text-white px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs sm:text-sm font-semibold backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span>{toastMessage}</span>
            </div>
          </div>
        )}
      </>
    );
  }

  if (!currentUser && isDeviceOffline) {
    return (
      <div className="min-h-screen bg-[#070709] text-gray-100 flex flex-col font-['Plus_Jakarta_Sans'] pb-24">
        <Header onLockedSubscribeClick={() => setShowSubscriptionLockedModal(true)} />
        <div className="bg-amber-500/20 border-b border-amber-500/40 px-4 py-2 text-center text-xs text-amber-200 font-semibold flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4 text-amber-400" />
          <span>You are offline — Play your downloaded movies below without internet.</span>
        </div>
        <main className="flex-1">
          <DownloadsView />
        </main>
        <BottomNavBar />
        <VideoPlayerModal />
      </div>
    );
  }

  // 2. 30-DAY FREE TRIAL EXPIRY PAYWALL (viewer Subscriptions are locked — tapping Subscribe opens locked popup instead of payment)
  if (currentUserTrialInfo?.isExpired) {
    return (
      <>
        <TrialExpiredPaywall allowClose={false} />
        {toastMessage && (
          <div className="fixed top-6 right-4 sm:right-8 z-50">
            <div className="bg-[#181824] border border-red-500/50 text-white px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs sm:text-sm font-semibold backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span>{toastMessage}</span>
            </div>
          </div>
        )}
      </>
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

  // Currently filtered view when a specific genre, VJ toggle, or Browse-by-VJ chip is active
  const isFilteredView = selectedGenre !== 'All' || filterVJOnly || selectedVJ !== 'All VJs';
  const activeGenreMovies = movies.filter((m) => {
    const matchesGenre = selectedGenre === 'All' || m.genre === selectedGenre;
    const matchesVJToggle = !filterVJOnly || (m.vjTracks && m.vjTracks.length > 0);
    const matchesSelectedVJ = movieMatchesSelectedVJ(m, selectedVJ);
    return matchesGenre && matchesVJToggle && matchesSelectedVJ;
  });

  const filteredTitle =
    selectedVJ !== 'All VJs' && selectedGenre !== 'All'
      ? `${selectedVJ} · ${selectedGenre} Films`
      : selectedVJ !== 'All VJs'
        ? `${selectedVJ} Movies`
        : selectedGenre === 'All'
          ? 'VJ Translated Films'
          : `${selectedGenre} Films`;

  const filteredEmptyMessage =
    selectedVJ !== 'All VJs'
      ? `No movies found for ${selectedVJ} yet. Try selecting All VJs or another VJ.`
      : 'No movies found in this category.';

  return (
    <div className="min-h-screen bg-[#070709] text-gray-100 flex flex-col font-['Plus_Jakarta_Sans'] pb-24">
      {/* Top Header with Movies / TV Shows Toggle & Locked Subscribe Button */}
      <Header onLockedSubscribeClick={() => setShowSubscriptionLockedModal(true)} />

      {/* 30 Days Free Trial Countdown Box */}
      <TrialBanner onSubscribeClick={() => setShowSubscriptionLockedModal(true)} />

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

                    {/* When a specific Genre, VJ Translated toggle, or Browse-by-VJ filter is selected */}
                    {isFilteredView ? (
                      <div className="py-2">
                        <MovieGrid
                          title={filteredTitle}
                          subtitle={
                            selectedVJ !== 'All VJs'
                              ? `Showing ${activeGenreMovies.length} ${activeGenreMovies.length === 1 ? 'movie' : 'movies'} translated by ${selectedVJ}`
                              : `Discover curated ${selectedGenre.toLowerCase()} cinema with high-definition audio & VJ translation`
                          }
                          movies={activeGenreMovies}
                          emptyMessage={filteredEmptyMessage}
                          onExploreAll={() => {
                            setSelectedGenre('All');
                            setSelectedVJ('All VJs');
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

        {activeTab === 'livetv' && <LiveTVSection />}
        {activeTab === 'search' && <SearchView />}
        {activeTab === 'watchlist' && <WatchlistView />}
        {activeTab === 'downloads' && <DownloadsView />}
        {activeTab === 'profile' && (currentUser ? <ProfileView /> : <AuthScreen />)}
      </main>

      {/* Site Footer with WhatsApp Contact & Support */}
      <footer className="border-t border-white/5 bg-[#0a0a0f] mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <div className="text-center sm:text-left">
            <p className="font-bold text-white font-['Outfit']">
              Movie<span className="text-[#E50914]">Kart</span> UG
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Watch movies & TV shows in Uganda and around the world · Help & Support:{' '}
              <span className="text-[#25D366] font-semibold">+256 741 094 332</span>
            </p>
          </div>

          <a
            href="https://wa.me/256741094332"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] text-black font-extrabold text-xs shadow-md transition-all active:scale-95"
          >
            <span>WhatsApp Support: +256 741 094 332</span>
          </a>
        </div>
      </footer>

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
      <SubscriptionLockedModal
        isOpen={showSubscriptionLockedModal}
        onClose={() => setShowSubscriptionLockedModal(false)}
      />

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
