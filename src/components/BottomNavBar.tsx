import React from 'react';
import { useMovieContext } from '../context/MovieContext';
import { Home, Radio, Search, Heart, DownloadCloud, User } from 'lucide-react';
import { ActiveTab } from '../types';

export const BottomNavBar: React.FC = () => {
  const { activeTab, setActiveTab, setContentMode, watchlist, downloads } = useMovieContext();

  const completedDownloadsCount = downloads.filter((d) => d.status === 'completed').length;
  const activeDownloadsCount = downloads.filter((d) => d.status === 'downloading').length;

  const navItems: { id: ActiveTab; label: string; icon: React.FC<{ className?: string }>; badge?: number }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'livetv', label: 'Live TV', icon: Radio },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'watchlist', label: 'Watchlist', icon: Heart, badge: watchlist.length },
    { id: 'downloads', label: 'Downloads', icon: DownloadCloud, badge: completedDownloadsCount },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav
      aria-label="Bottom Navigation"
      className="fixed bottom-0 inset-x-0 z-[45] bg-[#070709]/95 backdrop-blur-lg border-t border-white/10 pb-safe transition-all"
    >
      <div className="max-w-lg mx-auto px-1 flex items-center justify-around min-h-16">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'livetv') {
                  setContentMode('livetv');
                }
                setActiveTab(item.id);
              }}
              className={`relative flex flex-col items-center justify-center flex-1 min-h-[44px] py-1 text-center transition-colors cursor-pointer ${
                isActive ? 'text-red-500' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110 stroke-[2.5px]' : 'stroke-2'
                  } ${item.id === 'downloads' && activeDownloadsCount > 0 ? 'animate-bounce text-amber-400' : ''}`}
                />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-2 bg-red-600 text-white text-[9px] font-bold px-1 rounded-full min-w-[14px] h-[14px] flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] tracking-tight mt-1 font-medium ${isActive ? 'font-bold text-white' : ''}`}>
                {item.label}
              </span>
              {isActive && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-red-500" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
