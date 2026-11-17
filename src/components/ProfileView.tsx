import React, { useState } from 'react';
import { useMovieContext } from '../context/MovieContext';
import {
  Smartphone,
  Users,
  Sparkles,
  SlidersHorizontal,
  LogOut,
  MessageCircle,
  ExternalLink
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

export const ProfileView: React.FC = () => {
  const {
    currentUser,
    users,
    logoutUser,
    switchUserAccount,
    showToast
  } = useMovieContext();

  const [wifiOnly, setWifiOnly] = useState(true);
  const [dataSaver, setDataSaver] = useState(false);
  const [defaultQuality, setDefaultQuality] = useState('1080p FHD');

  if (!currentUser) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit'] tracking-tight mb-1">
          Profile & Settings
        </h1>
        <p className="text-sm text-gray-400">
          Manage your MovieKart UG subscription, offline storage, and video playback settings.
        </p>
      </div>

      {/* User Info Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#121217] border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-4 ring-red-600/40 shrink-0"
          />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg sm:text-xl font-bold text-white font-['Outfit']">
                {currentUser.name}
              </h2>
              <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                <Sparkles className="w-2.5 h-2.5" /> VIP
              </span>
            </div>
            <p className="text-xs text-gray-400">{currentUser.email}</p>
            {currentUser.phone && <p className="text-xs text-gray-400">{currentUser.phone}</p>}
          </div>
        </div>

        {/* Subscription Badge */}
        <div className="w-full sm:w-auto bg-[#181824] border border-white/5 p-3 rounded-2xl text-left sm:text-right">
          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">
            Plan & Billing
          </span>
          <p className="text-sm font-bold text-emerald-400">{currentUser.subscription}</p>
          <p className="text-[11px] text-gray-400 flex items-center sm:justify-end gap-1 mt-0.5">
            <Smartphone className="w-3 h-3 text-red-500" />
            {currentUser.momoProvider}
          </p>
        </div>
      </div>

      {/* Switch Profile Strip (shown only when saved accounts exist) */}
      {users.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-red-500" />
              Switch Active User Profile
            </h3>
            <span className="text-xs text-gray-400">Multi-Account Support</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {users.map((u) => {
              const isSelected = u.id === currentUser.id;
              return (
                <button
                  key={u.id}
                  onClick={() => {
                    switchUserAccount(u);
                  }}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-red-950/40 border-red-500 text-white shadow-md shadow-red-600/10'
                      : 'bg-[#121217] border-white/5 hover:border-white/10 text-gray-300'
                  }`}
                >
                  <img
                    src={u.avatar}
                    alt={u.name}
                    className="w-10 h-10 rounded-xl object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{u.name}</p>
                    <p className="text-[10px] text-gray-400 truncate">{u.subscription}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Playback & Download Preferences */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#121217] border border-white/5 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-red-500" />
          Streaming & Data Preferences (Uganda)
        </h3>

        <div className="space-y-3 divide-y divide-white/5">
          {/* Download Quality */}
          <div className="pt-2 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">Default Download Resolution</p>
              <p className="text-xs text-gray-400">High definition vs data saving</p>
            </div>
            <select
              value={defaultQuality}
              onChange={(e) => {
                setDefaultQuality(e.target.value);
                showToast(`Default download quality set to ${e.target.value}`);
              }}
              className="bg-[#1a1a26] text-xs font-bold text-red-400 border border-white/10 rounded-xl px-3 py-1.5 focus:outline-none cursor-pointer"
            >
              <option value="4K UHD">4K UHD (Highest)</option>
              <option value="1080p FHD">1080p Full HD (Recommended)</option>
              <option value="720p HD">720p Data Saver</option>
            </select>
          </div>

          {/* Wi-Fi Only */}
          <div className="pt-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">Download on Wi-Fi Only</p>
              <p className="text-xs text-gray-400">Prevent using cellular data for offline downloads</p>
            </div>
            <button
              onClick={() => {
                const next = !wifiOnly;
                setWifiOnly(next);
                showToast(next ? 'Downloads restricted to Wi-Fi' : 'Cellular downloads allowed');
              }}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                wifiOnly ? 'bg-red-600 justify-end' : 'bg-gray-700 justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-md" />
            </button>
          </div>

          {/* Data Saver Mode */}
          <div className="pt-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">Data Saver Streaming Mode</p>
              <p className="text-xs text-gray-400">Optimizes streaming for Airtel & MTN UG data bundles</p>
            </div>
            <button
              onClick={() => {
                const next = !dataSaver;
                setDataSaver(next);
                showToast(next ? 'Data Saver mode active (Low Bitrate)' : 'High Bitrate streaming active');
              }}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                dataSaver ? 'bg-red-600 justify-end' : 'bg-gray-700 justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-md" />
            </button>
          </div>
        </div>
      </div>

      {/* WhatsApp Support / Contact Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#121217] border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-[#25D366]" />
            MovieKart UG WhatsApp Support & Help
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Need help with a movie request, playback issue, or Mobile Money? Chat with us on{' '}
            <span className="text-[#25D366] font-bold">+256 741 094 332</span>.
          </p>
        </div>

        <a
          href="https://wa.me/256741094332"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto px-5 py-2.5 bg-[#25D366] hover:bg-[#1ebe5d] text-black rounded-xl text-xs sm:text-sm font-extrabold transition-all shadow-md flex items-center justify-center gap-2 shrink-0 active:scale-95"
        >
          <span>Chat +256 741 094 332</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* In-App PWA Install Card */}
      <PWAInstallButton variant="card" />

      {/* Prominent Account Sign Out / Logout Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#121217] border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <LogOut className="w-4 h-4 text-red-500" />
            Account & Session
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Currently logged in as <span className="text-white font-semibold">{currentUser.name}</span> ({currentUser.email || currentUser.phone}).
            Your watchlist, downloads, and continue watching records are preserved.
          </p>
        </div>

        <button
          onClick={logoutUser}
          className="w-full sm:w-auto px-5 py-2.5 bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 hover:border-red-500 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out / Log Out</span>
        </button>
      </div>
    </div>
  );
};
