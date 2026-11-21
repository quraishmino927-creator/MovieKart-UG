import React from 'react';
import { useMovieContext } from '../context/MovieContext';
import { Search, Wifi, WifiOff, Film, Tv, Heart, DownloadCloud, Radio, Lock } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  onLockedSubscribeClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onLockedSubscribeClick }) => {
  const {
    contentMode,
    setContentMode,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    offlineMode,
    setOfflineMode,
    watchlist,
    downloads,
    currentUser,
    showToast
  } = useMovieContext();

  const completedDownloadsCount = downloads.filter((d) => d.status === 'completed').length;
  const activeDownloadsCount = downloads.filter((d) => d.status === 'downloading').length;
  const isLiveTVActive = activeTab === 'livetv';
  const showLockedSubscribe =
    activeTab !== 'admin' && activeTab !== 'poster' && Boolean(onLockedSubscribeClick);

  const renderPrimaryTabs = () => (
    <nav
      aria-label="Primary Content Menu"
      className="flex items-center gap-1 bg-[#13131c] p-1 rounded-xl border border-white/10 overflow-x-auto no-scrollbar max-w-full"
    >
      <button
        type="button"
        onClick={() => {
          setContentMode('movies');
          if (activeTab !== 'home') setActiveTab('home');
        }}
        className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
          !isLiveTVActive && contentMode === 'movies' && activeTab === 'home'
            ? 'bg-[#E50914] text-white shadow-md shadow-red-600/30'
            : 'text-gray-300 hover:text-white'
        }`}
      >
        <Film className="w-3.5 h-3.5 shrink-0" />
        <span>Movies</span>
      </button>

      <button
        type="button"
        onClick={() => {
          setContentMode('tvshows');
          if (activeTab !== 'home') setActiveTab('home');
        }}
        className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
          !isLiveTVActive && contentMode === 'tvshows' && activeTab === 'home'
            ? 'bg-[#E50914] text-white shadow-md shadow-red-600/30'
            : 'text-gray-300 hover:text-white'
        }`}
      >
        <Tv className="w-3.5 h-3.5 shrink-0" />
        <span>TV Shows</span>
      </button>

      <button
        type="button"
        onClick={() => {
          setContentMode('livetv');
          setActiveTab('livetv');
        }}
        className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
          isLiveTVActive
            ? 'bg-[#E50914] text-white shadow-md shadow-red-600/30'
            : 'text-gray-300 hover:text-white'
        }`}
      >
        <Radio className={`w-3.5 h-3.5 shrink-0 ${isLiveTVActive ? 'text-white' : 'text-[#E50914]'}`} />
        <span>Live TV</span>
      </button>

      {showLockedSubscribe && (
        <button
          type="button"
          onClick={onLockedSubscribeClick}
          title="Subscriptions are Locked for Now - Coming Soon"
          className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold whitespace-nowrap shrink-0 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition-all cursor-pointer active:scale-95"
        >
          <span>Subscribe</span>
          <Lock className="w-3 h-3 text-amber-400 shrink-0" aria-hidden="true" />
        </button>
      )}
    </nav>
  );

  return (
    <header className="sticky top-0 z-40 w-full bg-[#070709]/95 backdrop-blur-md border-b border-white/5 transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Brand Lockup & Desktop/Tablet Scrollable Tabs */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1 md:flex-initial">
          <button
            type="button"
            onClick={() => {
              if (contentMode === 'livetv') setContentMode('movies');
              setActiveTab('home');
            }}
            className="flex items-center gap-2 text-left focus:outline-none group shrink-0 cursor-pointer"
            aria-label="MovieKart UG Home"
          >
            <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-xl overflow-hidden bg-black border border-red-500/40 shadow-md shadow-red-600/30 group-hover:border-red-500 transition-all duration-200">
              <img
                src="/assets/aistudio/mino2_5d86aea4.jpg"
                alt="MovieKart UG Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base sm:text-xl tracking-tight text-white font-['Outfit'] group-hover:text-red-400 transition-colors whitespace-nowrap">
                Movie<span className="text-red-600">Kart</span>
              </span>
              <span className="hidden sm:inline bg-red-600/20 text-red-400 border border-red-500/30 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded tracking-wider">
                UG
              </span>
            </div>
          </button>

          {/* Desktop / Tablet inline horizontally-scrollable nav tabs */}
          <div className="hidden md:flex min-w-0">{renderPrimaryTabs()}</div>
        </div>

        {/* Center: Search Bar (Desktop) */}
        <div className="hidden lg:flex flex-1 max-w-sm mx-2">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (activeTab !== 'search') setActiveTab('search');
              }}
              onFocus={() => {
                if (activeTab !== 'search') setActiveTab('search');
              }}
              placeholder={`Search ${contentMode === 'tvshows' ? 'TV shows, series, episodes...' : 'movies, actors, VJ specials...'}`}
              className="w-full bg-[#14141c] text-xs sm:text-sm text-gray-200 placeholder-gray-500 pl-10 pr-4 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
            />
          </div>
        </div>

        {/* Right Action Zone */}
        <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
          {/* Offline Mode Switch */}
          <button
            type="button"
            onClick={() => {
              const next = !offlineMode;
              setOfflineMode(next);
              showToast(next ? 'Offline Mode enabled (Showing downloaded content)' : 'Online Mode restored');
            }}
            title={offlineMode ? 'Currently Offline: Tap to switch to Online' : 'Tap to simulate Offline Mode'}
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              offlineMode
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
            }`}
          >
            {offlineMode ? <WifiOff className="w-3.5 h-3.5 text-amber-400" /> : <Wifi className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{offlineMode ? 'Offline' : 'Online'}</span>
          </button>

          {/* Quick Watchlist shortcut */}
          <button
            type="button"
            onClick={() => setActiveTab('watchlist')}
            className={`relative p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer ${
              activeTab === 'watchlist' ? 'text-red-500 bg-red-600/10' : ''
            }`}
            title="My Watchlist"
          >
            <Heart className="w-5 h-5" />
            {watchlist.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-600 text-[10px] font-bold text-white rounded-full flex items-center justify-center tabular-nums">
                {watchlist.length}
              </span>
            )}
          </button>

          {/* Quick Downloads shortcut */}
          <button
            type="button"
            onClick={() => setActiveTab('downloads')}
            className={`relative p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer ${
              activeTab === 'downloads' ? 'text-red-500 bg-red-600/10' : ''
            }`}
            title="Offline Downloads"
          >
            <DownloadCloud className={`w-5 h-5 ${activeDownloadsCount > 0 ? 'text-red-500 animate-pulse' : ''}`} />
            {completedDownloadsCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-600 text-[10px] font-bold text-white rounded-full flex items-center justify-center tabular-nums">
                {completedDownloadsCount}
              </span>
            )}
          </button>

          {/* In-App PWA Install Button */}
          <PWAInstallButton variant="header" />

          {/* Current User Avatar or Login / Sign Up */}
          {currentUser ? (
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className="flex items-center gap-2 p-1 rounded-full hover:bg-white/5 transition-colors focus:outline-none cursor-pointer shrink-0"
              title={`${currentUser.name} (@${currentUser.username || 'moviefan'})`}
            >
              <img
                src={currentUser.avatar || '/pwa-192x192.png'}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-[#25D366]/70 bg-black"
              />
              <div className="hidden xl:block text-left text-xs leading-tight pr-1">
                <p className="font-semibold text-white truncate max-w-[90px]">{currentUser.name}</p>
                <p className="text-[10px] text-[#25D366] font-medium truncate max-w-[90px]">
                  @{currentUser.username || 'moviefan'}
                </p>
              </div>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] text-black text-[11px] sm:text-xs font-extrabold transition-all shadow-md shadow-[#25D366]/20 cursor-pointer whitespace-nowrap shrink-0"
            >
              Login
            </button>
          )}
        </div>
      </div>

      {/* Mobile Horizontally Scrollable Primary Nav Strip (Zero Overlap on Small Phones) */}
      <div className="md:hidden px-3 pb-2.5 pt-0.5">
        {renderPrimaryTabs()}
      </div>
    </header>
  );
};
