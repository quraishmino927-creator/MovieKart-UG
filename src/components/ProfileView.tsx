import React, { useState, useRef } from 'react';
import { useMovieContext } from '../context/MovieContext';
import { AuthScreen } from './AuthScreen';
import { PWAInstallButton } from './PWAInstallButton';
import { auth, uploadFileToStorage } from '../lib/firebase';
import {
  Edit3,
  LogOut,
  Bookmark,
  History,
  Play,
  Trash2,
  Calendar,
  Mail,
  Film,
  Tv,
  Camera,
  Check,
  X,
  Loader2,
  SlidersHorizontal,
  MessageCircle,
  ExternalLink,
  AtSign,
  ArrowRight
} from 'lucide-react';

// Built-in SVG data-URI preset avatars (zero external URL failures)
const PRESET_AVATARS: { id: string; label: string; url: string }[] = [
  {
    id: 'moviekart',
    label: 'MovieKart',
    url: '/pwa-192x192.png',
  },
  {
    id: 'emerald',
    label: 'Emerald',
    url: `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><defs><linearGradient id="g1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#25D366"/><stop offset="100%" stop-color="#065f46"/></linearGradient></defs><rect width="120" height="120" rx="60" fill="url(#g1)"/><circle cx="60" cy="46" r="20" fill="#ffffff"/><path d="M24 102c4-20 20-30 36-30s32 10 36 30" fill="#ffffff"/></svg>`
    )}`,
  },
  {
    id: 'kampala_gold',
    label: 'Gold',
    url: `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><defs><linearGradient id="g2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f59e0b"/><stop offset="100%" stop-color="#78350f"/></linearGradient></defs><rect width="120" height="120" rx="60" fill="url(#g2)"/><circle cx="60" cy="46" r="20" fill="#fef3c7"/><path d="M24 102c4-20 20-30 36-30s32 10 36 30" fill="#fef3c7"/></svg>`
    )}`,
  },
  {
    id: 'cinema_dark',
    label: 'Cinema',
    url: `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><defs><linearGradient id="g3" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#10b981"/><stop offset="100%" stop-color="#0f172a"/></linearGradient></defs><rect width="120" height="120" rx="60" fill="url(#g3)"/><polygon points="48,38 86,60 48,82" fill="#ffffff"/></svg>`
    )}`,
  },
  {
    id: 'vj_star',
    label: 'VJ Star',
    url: `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><defs><linearGradient id="g4" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#14b8a6"/><stop offset="100%" stop-color="#1e293b"/></linearGradient></defs><rect width="120" height="120" rx="60" fill="url(#g4)"/><polygon points="60,24 70,48 96,50 76,67 82,92 60,78 38,92 44,67 24,50 50,48" fill="#ffffff"/></svg>`
    )}`,
  },
  {
    id: 'crimson',
    label: 'Night',
    url: `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><defs><linearGradient id="g5" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#059669"/><stop offset="100%" stop-color="#020617"/></linearGradient></defs><rect width="120" height="120" rx="60" fill="url(#g5)"/><rect x="30" y="34" width="60" height="52" rx="10" fill="none" stroke="#ffffff" stroke-width="6"/><circle cx="60" cy="60" r="12" fill="#25D366"/></svg>`
    )}`,
  },
];

// Resize & center-crop uploaded image on canvas to a crisp 256x256 JPEG (~20-35KB)
async function resizeAvatarImage(file: File): Promise<{ dataUrl: string; blobFile: File }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the selected image.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image format.'));
      img.onload = () => {
        const size = 256;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable.'));
          return;
        }
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        canvas.toBlob(
          (blob) => {
            const blobFile = blob
              ? new File([blob], `avatar_${Date.now()}.jpg`, { type: 'image/jpeg' })
              : file;
            resolve({ dataUrl, blobFile });
          },
          'image/jpeg',
          0.82
        );
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function formatHistoryDate(timestamp: number): string {
  if (!timestamp) return 'Recently';
  const diffMs = Date.now() - timestamp;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export const ProfileView: React.FC = () => {
  const {
    currentUser,
    movies,
    tvShows,
    watchlist,
    watchHistory,
    toggleWatchlist,
    playMovie,
    openMovieDetails,
    openShowDetails,
    removeFromWatchHistory,
    clearWatchHistory,
    updateUserProfile,
    logoutUser,
    setActiveTab,
    showToast
  } = useMovieContext();

  // Preferences state
  const [wifiOnly, setWifiOnly] = useState(true);
  const [dataSaver, setDataSaver] = useState(false);
  const [defaultQuality, setDefaultQuality] = useState('1080p FHD');

  // Edit Profile Modal state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [editError, setEditError] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // If user is NOT logged in, show real Login / Sign Up experience (never fake profile)
  if (!currentUser) {
    return <AuthScreen />;
  }

  const savedMovies = movies.filter((m) => watchlist.includes(m.id));
  const savedShows = tvShows.filter((s) => watchlist.includes(s.id));
  const totalSavedCount = savedMovies.length + savedShows.length;
  const moviesWatchedCount = watchHistory.length;

  const openEditModal = () => {
    setEditName(currentUser.name || '');
    setEditUsername(currentUser.username || '');
    setEditAvatar(currentUser.avatar || '/pwa-192x192.png');
    setEditError('');
    setIsEditing(true);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditError('');
    setUploadingPhoto(true);

    try {
      const { dataUrl, blobFile } = await resizeAvatarImage(file);
      let finalUrl = dataUrl;

      // Attempt Firebase Storage upload if authenticated via Firebase Auth; fall back gracefully to compressed JPEG Data URL
      if (auth.currentUser) {
        try {
          finalUrl = await uploadFileToStorage(blobFile, 'avatars', undefined, false);
        } catch {
          finalUrl = dataUrl;
        }
      }

      setEditAvatar(finalUrl);
      showToast('Profile photo ready — tap Save Changes to confirm');
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to process photo.');
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError('');
    setSavingProfile(true);
    try {
      const result = await updateUserProfile({
        name: editName,
        username: editUsername,
        avatar: editAvatar,
      });
      if (result.success) {
        setIsEditing(false);
      } else if (result.error) {
        setEditError(result.error);
      }
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logoutUser();
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit'] tracking-tight">
            My Profile
          </h1>
          <p className="text-xs sm:text-sm text-gray-400">
            Synced with your account and saved across sessions.
          </p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 hover:border-red-500 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-60"
        >
          {loggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
          <span>Log Out</span>
        </button>
      </div>

      {/* Main Profile Hero Card (Green MovieKart Theme) */}
      <section className="relative overflow-hidden p-5 sm:p-7 rounded-3xl bg-gradient-to-br from-[#0e1512] via-[#101318] to-[#0c0e12] border border-[#25D366]/25 shadow-2xl">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#25D366]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Left: Circle Avatar & Identity */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 sm:gap-5">
            <div className="relative shrink-0">
              <img
                src={currentUser.avatar || '/pwa-192x192.png'}
                alt={currentUser.name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover ring-4 ring-[#25D366]/70 bg-black shadow-xl shadow-[#25D366]/15"
              />
              <button
                type="button"
                onClick={openEditModal}
                aria-label="Change Profile Photo"
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#25D366] hover:bg-[#1ebe5d] text-black flex items-center justify-center shadow-lg border-2 border-[#0e1512] cursor-pointer transition-transform hover:scale-105"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-xl sm:text-2xl font-extrabold text-white font-['Outfit'] truncate max-w-xs">
                  {currentUser.name}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-[#25D366]/15 text-[#25D366] border border-[#25D366]/30 text-[11px] font-bold">
                  @{currentUser.username || 'moviefan'}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:flex-wrap items-center sm:items-start gap-1.5 sm:gap-4 text-xs text-gray-300">
                {currentUser.email && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#25D366]" />
                    <span className="truncate max-w-[240px]">{currentUser.email}</span>
                  </span>
                )}
                {currentUser.phone && (
                  <span className="text-gray-400">{currentUser.phone}</span>
                )}
                <span className="flex items-center gap-1.5 text-gray-400">
                  <Calendar className="w-3.5 h-3.5 text-[#25D366]" />
                  <span>Joined {currentUser.joinedDate}</span>
                </span>
              </div>

              {/* Edit Profile Button */}
              <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <button
                  type="button"
                  onClick={openEditModal}
                  className="px-5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] text-black font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-[#25D366]/20 transition-all cursor-pointer active:scale-95"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>EDIT PROFILE</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right: Live Stats */}
          <div className="grid grid-cols-2 gap-3 w-full md:w-auto shrink-0">
            <div className="p-4 rounded-2xl bg-black/40 border border-[#25D366]/20 text-center">
              <p className="text-2xl sm:text-3xl font-extrabold text-[#25D366] font-['Outfit']">
                {moviesWatchedCount}
              </p>
              <p className="text-[11px] font-semibold text-gray-300 mt-0.5">
                Movies Watched
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 text-center">
              <p className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit']">
                {totalSavedCount}
              </p>
              <p className="text-[11px] font-semibold text-gray-300 mt-0.5">
                My List Saved
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* MY LIST / WATCHLIST SECTION */}
      <section className="p-5 sm:p-6 rounded-3xl bg-[#111419] border border-white/10 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#25D366]/15 border border-[#25D366]/30 flex items-center justify-center text-[#25D366]">
              <Bookmark className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-white font-['Outfit']">
                My List / Watchlist
              </h3>
              <p className="text-xs text-gray-400">
                {totalSavedCount === 0
                  ? 'Movies and shows you bookmark will appear here'
                  : `${totalSavedCount} saved title${totalSavedCount === 1 ? '' : 's'}`}
              </p>
            </div>
          </div>

          {totalSavedCount > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('watchlist')}
              className="text-xs font-bold text-[#25D366] hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {totalSavedCount === 0 ? (
          <div className="p-6 rounded-2xl bg-black/30 border border-white/5 text-center space-y-3">
            <p className="text-xs sm:text-sm text-gray-400">
              Your My List is empty. Tap the heart or bookmark icon on any movie to save it here.
            </p>
            <button
              type="button"
              onClick={() => setActiveTab('home')}
              className="px-4 py-2 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366] text-[#25D366] hover:text-black border border-[#25D366]/30 text-xs font-bold transition-all cursor-pointer"
            >
              Browse Movies
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
            {savedMovies.map((movie) => (
              <div
                key={movie.id}
                className="group rounded-2xl bg-[#171b22] border border-white/5 hover:border-[#25D366]/50 overflow-hidden flex flex-col transition-all"
              >
                <div
                  onClick={() => openMovieDetails(movie)}
                  className="relative aspect-[2/3] bg-black cursor-pointer overflow-hidden"
                >
                  <img
                    src={movie.posterUrl}
                    alt={movie.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 text-[10px] font-bold text-[#25D366] flex items-center gap-1">
                    <Film className="w-2.5 h-2.5" /> Movie
                  </span>
                </div>
                <div className="p-3 flex-1 flex flex-col justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-white truncate">{movie.title}</h4>
                    <p className="text-[10px] text-gray-400">
                      {movie.genre} · {movie.year}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => playMovie(movie)}
                      className="flex-1 py-1.5 px-2 rounded-lg bg-[#25D366] hover:bg-[#1ebe5d] text-black text-[11px] font-extrabold flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-black" /> Watch
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleWatchlist(movie.id)}
                      title="Remove from My List"
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {savedShows.map((show) => (
              <div
                key={show.id}
                className="group rounded-2xl bg-[#171b22] border border-white/5 hover:border-[#25D366]/50 overflow-hidden flex flex-col transition-all"
              >
                <div
                  onClick={() => openShowDetails(show)}
                  className="relative aspect-[2/3] bg-black cursor-pointer overflow-hidden"
                >
                  <img
                    src={show.posterUrl}
                    alt={show.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 text-[10px] font-bold text-[#25D366] flex items-center gap-1">
                    <Tv className="w-2.5 h-2.5" /> Series
                  </span>
                </div>
                <div className="p-3 flex-1 flex flex-col justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-white truncate">{show.title}</h4>
                    <p className="text-[10px] text-gray-400">
                      {show.seasons.length} Season{show.seasons.length === 1 ? '' : 's'} · {show.year}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openShowDetails(show)}
                      className="flex-1 py-1.5 px-2 rounded-lg bg-[#25D366] hover:bg-[#1ebe5d] text-black text-[11px] font-extrabold flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-black" /> Open
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleWatchlist(show.id)}
                      title="Remove from My List"
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* WATCH HISTORY SECTION */}
      <section className="p-5 sm:p-6 rounded-3xl bg-[#111419] border border-white/10 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#25D366]/15 border border-[#25D366]/30 flex items-center justify-center text-[#25D366]">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-white font-['Outfit']">
                Watch History
              </h3>
              <p className="text-xs text-gray-400">
                {watchHistory.length === 0
                  ? 'Movies and episodes you watch will show here'
                  : `${watchHistory.length} watched title${watchHistory.length === 1 ? '' : 's'}`}
              </p>
            </div>
          </div>

          {watchHistory.length > 0 && (
            <button
              type="button"
              onClick={clearWatchHistory}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-red-500/15 text-gray-400 hover:text-red-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Clear All
            </button>
          )}
        </div>

        {watchHistory.length === 0 ? (
          <div className="p-6 rounded-2xl bg-black/30 border border-white/5 text-center space-y-2">
            <p className="text-xs sm:text-sm text-gray-400">
              You haven't watched any movies yet. Start watching to track your history!
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {watchHistory.map((item) => {
              const matchedMovie =
                item.type === 'movie'
                  ? movies.find((m) => m.id === item.itemId || m.id === item.id)
                  : undefined;
              const matchedShow =
                item.type === 'episode' && item.showTitle
                  ? tvShows.find((s) => s.title === item.showTitle)
                  : undefined;

              return (
                <div
                  key={`${item.itemId}_${item.watchedAt}`}
                  className="p-3 rounded-2xl bg-[#171b22] border border-white/5 hover:border-[#25D366]/40 flex items-center justify-between gap-3 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={item.posterUrl || '/pwa-192x192.png'}
                      alt={item.title}
                      className="w-14 h-20 rounded-xl object-cover bg-black shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-[#25D366]/15 text-[#25D366]">
                          {item.type === 'episode' ? 'Episode' : 'Movie'}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          {formatHistoryDate(item.watchedAt)}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white truncate mt-1">
                        {item.showTitle ? `${item.showTitle} · ${item.title}` : item.title}
                      </h4>
                      <p className="text-xs text-gray-400 truncate">
                        {[
                          item.seasonNumber && item.episodeNumber
                            ? `S${item.seasonNumber} E${item.episodeNumber}`
                            : null,
                          item.genre,
                          item.duration,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {matchedMovie && (
                      <button
                        type="button"
                        onClick={() => playMovie(matchedMovie)}
                        className="px-3 py-2 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] text-black text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-black" />
                        <span className="hidden sm:inline">Watch Again</span>
                      </button>
                    )}
                    {!matchedMovie && matchedShow && (
                      <button
                        type="button"
                        onClick={() => openShowDetails(matchedShow)}
                        className="px-3 py-2 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] text-black text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-black" />
                        <span className="hidden sm:inline">Open Show</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeFromWatchHistory(item.itemId)}
                      title="Remove from history"
                      className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Playback & Data Preferences */}
      <section className="p-5 sm:p-6 rounded-3xl bg-[#111419] border border-white/10 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-[#25D366]" />
          Streaming & Data Preferences (Uganda)
        </h3>

        <div className="space-y-3 divide-y divide-white/5">
          <div className="pt-2 flex items-center justify-between gap-3">
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
              className="bg-[#181d25] text-xs font-bold text-[#25D366] border border-white/10 rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
            >
              <option value="4K UHD">4K UHD (Highest)</option>
              <option value="1080p FHD">1080p Full HD (Recommended)</option>
              <option value="720p HD">720p Data Saver</option>
            </select>
          </div>

          <div className="pt-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white">Download on Wi-Fi Only</p>
              <p className="text-xs text-gray-400">Prevent using cellular data for offline downloads</p>
            </div>
            <button
              type="button"
              onClick={() => {
                const next = !wifiOnly;
                setWifiOnly(next);
                showToast(next ? 'Downloads restricted to Wi-Fi' : 'Cellular downloads allowed');
              }}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                wifiOnly ? 'bg-[#25D366] justify-end' : 'bg-gray-700 justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-md" />
            </button>
          </div>

          <div className="pt-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white">Data Saver Streaming Mode</p>
              <p className="text-xs text-gray-400">Optimizes streaming for Airtel & MTN UG bundles</p>
            </div>
            <button
              type="button"
              onClick={() => {
                const next = !dataSaver;
                setDataSaver(next);
                showToast(next ? 'Data Saver mode active' : 'High Bitrate streaming active');
              }}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                dataSaver ? 'bg-[#25D366] justify-end' : 'bg-gray-700 justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-md" />
            </button>
          </div>
        </div>
      </section>

      {/* WhatsApp Support Card */}
      <section className="p-5 sm:p-6 rounded-3xl bg-[#111419] border border-[#25D366]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-[#25D366]" />
            MovieKart UG WhatsApp Support & Help
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Need help with a movie request or playback issue? Chat with us on{' '}
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
      </section>

      {/* PWA Install Card */}
      <PWAInstallButton variant="card" />

      {/* Bottom Log Out Section */}
      <section className="p-5 sm:p-6 rounded-3xl bg-[#111419] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <LogOut className="w-4 h-4 text-red-400" />
            Account Session
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Signed in as <span className="text-white font-semibold">{currentUser.name}</span> (@{currentUser.username || 'moviefan'}).
            Your profile, My List, and Watch History remain safely saved.
          </p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full sm:w-auto px-5 py-2.5 bg-red-600/15 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 hover:border-red-500 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0 disabled:opacity-60"
        >
          {loggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
          <span>Log Out</span>
        </button>
      </section>

      {/* EDIT PROFILE MODAL */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-3xl bg-[#11151b] border border-[#25D366]/30 shadow-2xl p-5 sm:p-6 space-y-5 my-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg sm:text-xl font-extrabold text-white font-['Outfit']">
                Edit Profile
              </h3>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer"
                aria-label="Close Edit Profile"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Live Circle Avatar Preview + Upload from Phone */}
              <div className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-black/30 border border-white/5">
                <img
                  src={editAvatar || '/pwa-192x192.png'}
                  alt="Preview Avatar"
                  className="w-24 h-24 rounded-full object-cover ring-4 ring-[#25D366] bg-black shadow-lg"
                />

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="px-4 py-2 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366] text-[#25D366] hover:text-black border border-[#25D366]/40 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-60"
                >
                  {uploadingPhoto ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing Photo...</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4" />
                      <span>Upload Photo from Phone</span>
                    </>
                  )}
                </button>

                {/* Preset Avatars */}
                <div className="w-full pt-1">
                  <p className="text-[11px] font-semibold text-gray-400 text-center mb-2">
                    Or choose an avatar
                  </p>
                  <div className="grid grid-cols-6 gap-2">
                    {PRESET_AVATARS.map((preset) => {
                      const isSelected = editAvatar === preset.url;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setEditAvatar(preset.url)}
                          title={preset.label}
                          className={`relative rounded-full p-0.5 transition-all cursor-pointer ${
                            isSelected
                              ? 'ring-2 ring-[#25D366] scale-110'
                              : 'opacity-75 hover:opacity-100'
                          }`}
                        >
                          <img
                            src={preset.url}
                            alt={preset.label}
                            className="w-10 h-10 rounded-full object-cover mx-auto bg-black"
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Name Input */}
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Enter your name"
                  required
                  className="w-full bg-[#171c24] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#25D366]"
                />
              </div>

              {/* Username Input */}
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#25D366]" />
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value.replace(/\s+/g, '_').toLowerCase())}
                    placeholder="username"
                    required
                    className="w-full bg-[#171c24] border border-white/10 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#25D366]"
                  />
                </div>
              </div>

              {editError && (
                <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 p-2.5 rounded-xl">
                  {editError}
                </p>
              )}

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs sm:text-sm font-bold text-gray-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile || uploadingPhoto}
                  className="flex-1 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] disabled:opacity-60 text-black text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/20 cursor-pointer"
                >
                  {savingProfile ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
