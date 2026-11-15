import React, { useState } from 'react';
import { useMovieContext } from '../context/MovieContext';
import { uploadFileToStorage } from '../lib/firebase';
import {
  ShieldCheck,
  Film,
  Tv,
  Users,
  BarChart3,
  Plus,
  Trash2,
  Edit3,
  Play,
  Lock,
  Star,
  X,
  Volume2,
  HardDrive,
  Eye,
  Smartphone,
  Layers,
  ArrowLeft,
  Mail,
  UploadCloud,
  CheckCircle2,
  Loader2,
  EyeOff,
  AlertCircle
} from 'lucide-react';
import { Movie, Genre } from '../types';

export const AdminDashboard: React.FC = () => {
  const {
    movies,
    tvShows,
    users,
    addMovie,
    updateMovie,
    deleteMovie,
    addEpisodeToShow,
    deleteTVShow,
    openShowDetails,
    addUser,
    updateUser,
    deleteUser,
    playMovie,
    adminUser,
    adminAuthLoading,
    isAdminAuthenticated,
    loginAdminWithEmail,
    logoutAdmin,
    setActiveTab,
    showToast
  } = useMovieContext();

  const [activeAdminTab, setActiveAdminTab] = useState<'movies' | 'tvshows' | 'users' | 'analytics'>('movies');

  // Firebase Email/Password Admin Login state
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Modals state
  const [isAddMovieModalOpen, setIsAddMovieModalOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [isAddTVShowModalOpen, setIsAddTVShowModalOpen] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);

  // Firebase Storage Upload states
  const [posterUploading, setPosterUploading] = useState(false);
  const [posterUploadProgress, setPosterUploadProgress] = useState(0);
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [videoUploadStatusText, setVideoUploadStatusText] = useState('');
  const [savingMovie, setSavingMovie] = useState(false);

  // TV Show Storage Upload states
  const [tvPosterUploading, setTvPosterUploading] = useState(false);
  const [tvPosterProgress, setTvPosterProgress] = useState(0);
  const [tvVideoUploading, setTvVideoUploading] = useState(false);
  const [tvVideoProgress, setTvVideoProgress] = useState(0);
  const [savingTVShow, setSavingTVShow] = useState(false);

  const emptyMovieForm = {
    title: '',
    genre: 'Action' as Genre,
    year: new Date().getFullYear(),
    duration: '1h 45m',
    rating: 8.5,
    ageRating: '16+' as '13+' | '16+' | '18+' | 'PG',
    quality: '1080p FHD' as '4K UHD' | '1080p FHD' | '720p HD',
    posterUrl: '',
    backdropUrl: '',
    description: '',
    director: '',
    cast: '',
    videoUrl: '',
    fileSizeMb: 450,
    isTrending: false,
    isFeatured: true,
    isUgandanExclusive: false,
    vjName: 'VJ Junior',
    vjLanguage: 'Luganda'
  };

  const [movieForm, setMovieForm] = useState(emptyMovieForm);

  const [tvShowForm, setTvShowForm] = useState({
    title: '',
    poster: '',
    seasonNumber: 1,
    episodeNumber: 1,
    episodeTitle: '',
    videoUrl: '',
    duration: '42m',
    synopsis: ''
  });

  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    phone: '+256 7',
    avatar: '/pwa-192x192.png',
    subscription: 'MovieKart VIP' as 'MovieKart VIP' | 'Standard HD' | 'Free Pass',
    status: 'active' as 'active' | 'suspended',
    momoProvider: 'MTN Mobile Money' as 'MTN Mobile Money' | 'Airtel Money',
    storageUsedMb: 0,
    downloadsCount: 0
  });

  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSubmitting(true);
    const res = await loginAdminWithEmail(adminEmail, adminPassword);
    setAuthSubmitting(false);
    if (!res.success && res.error) {
      setAuthError(res.error);
    } else {
      setAdminPassword('');
    }
  };

  // Show loading while checking Firebase Auth state
  if (adminAuthLoading) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <div className="p-8 rounded-3xl bg-[#121218] border border-white/10 shadow-2xl space-y-4">
          <Loader2 className="w-8 h-8 mx-auto text-[#E50914] animate-spin" />
          <p className="text-xs text-gray-400">Verifying Firebase Admin session...</p>
        </div>
      </div>
    );
  }

  // Firebase Email/Password Admin Login Gate
  if (!isAdminAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-14">
        <div className="p-7 sm:p-8 rounded-3xl bg-[#111116] border border-white/10 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[#E50914]/15 border border-[#E50914]/30 text-[#E50914] flex items-center justify-center">
              <Lock className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-extrabold text-white font-['Outfit']">
              Admin Portal Sign In
            </h1>
            <p className="text-xs text-gray-400">
              Sign in with your Firebase Admin email & password to upload movies, posters, and videos to MovieKart UG.
            </p>
          </div>

          <form onSubmit={handleAdminLoginSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-gray-300 font-semibold mb-1.5">Admin Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@moviekart.ug"
                  autoFocus
                  className="w-full bg-black/70 border border-white/15 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#E50914]"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-300 font-semibold mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showAdminPassword ? 'text' : 'password'}
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full bg-black/70 border border-white/15 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#E50914]"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPassword(!showAdminPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer"
                >
                  {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {authError && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-left">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={authSubmitting}
              className="w-full py-3 bg-[#E50914] hover:bg-red-700 disabled:opacity-60 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              {authSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In to Admin Dashboard</span>
              )}
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setActiveTab('home')}
                className="inline-flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Home</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Firebase Storage Handlers for Movie Modal
  const handlePosterFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPosterUploading(true);
    setPosterUploadProgress(0);
    try {
      const downloadUrl = await uploadFileToStorage(file, 'posters', (percent) => {
        setPosterUploadProgress(percent);
      });
      setMovieForm((prev) => ({
        ...prev,
        posterUrl: downloadUrl,
        backdropUrl: prev.backdropUrl || downloadUrl
      }));
      showToast('Poster uploaded to Firebase Storage!');
    } catch (err) {
      console.error('Poster upload failed:', err);
      showToast('Poster upload failed. Check Firebase Storage rules.');
    } finally {
      setPosterUploading(false);
    }
  };

  const handleVideoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoUploading(true);
    setVideoUploadProgress(0);
    setVideoUploadStatusText('Starting upload...');
    try {
      const fileSizeMb = Math.max(1, Math.round(file.size / (1024 * 1024)));
      const downloadUrl = await uploadFileToStorage(file, 'videos', (percent, transferredMb, totalMb) => {
        setVideoUploadProgress(percent);
        setVideoUploadStatusText(`${transferredMb} MB / ${totalMb} MB (${percent}%)`);
      });
      setMovieForm((prev) => ({
        ...prev,
        videoUrl: downloadUrl,
        fileSizeMb
      }));
      showToast('Video uploaded to Firebase Storage!');
    } catch (err) {
      console.error('Video upload failed:', err);
      showToast('Video upload failed. Check Firebase Storage rules.');
    } finally {
      setVideoUploading(false);
    }
  };

  // Firebase Storage Handlers for TV Show Modal
  const handleTVPosterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setTvPosterUploading(true);
    setTvPosterProgress(0);
    try {
      const url = await uploadFileToStorage(file, 'posters', (p) => setTvPosterProgress(p));
      setTvShowForm((prev) => ({ ...prev, poster: url }));
      showToast('TV poster uploaded to Firebase Storage!');
    } catch (err) {
      console.error('TV poster upload failed:', err);
      showToast('TV poster upload failed.');
    } finally {
      setTvPosterUploading(false);
    }
  };

  const handleTVVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setTvVideoUploading(true);
    setTvVideoProgress(0);
    try {
      const url = await uploadFileToStorage(file, 'videos', (p) => setTvVideoProgress(p));
      setTvShowForm((prev) => ({ ...prev, videoUrl: url }));
      showToast('Episode video uploaded to Firebase Storage!');
    } catch (err) {
      console.error('Episode video upload failed:', err);
      showToast('Episode video upload failed.');
    } finally {
      setTvVideoUploading(false);
    }
  };

  const handleOpenEditMovie = (movie: Movie) => {
    setEditingMovie(movie);
    setMovieForm({
      title: movie.title,
      genre: movie.genre,
      year: movie.year,
      duration: movie.duration,
      rating: movie.rating,
      ageRating: movie.ageRating,
      quality: movie.quality,
      posterUrl: movie.posterUrl,
      backdropUrl: movie.backdropUrl,
      description: movie.description || movie.synopsis || '',
      director: movie.director,
      cast: movie.cast.join(', '),
      videoUrl: movie.videoUrl,
      fileSizeMb: movie.fileSizeMb,
      isTrending: !!movie.isTrending,
      isFeatured: !!movie.isFeatured,
      isUgandanExclusive: !!movie.isUgandanExclusive,
      vjName: movie.vjTracks?.[0]?.name || 'VJ Junior',
      vjLanguage: movie.vjTracks?.[0]?.language || 'Luganda'
    });
    setIsAddMovieModalOpen(true);
  };

  const handleSaveMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movieForm.posterUrl.trim() || !movieForm.videoUrl.trim()) {
      showToast('Please upload or provide both Poster and Video URLs.');
      return;
    }

    setSavingMovie(true);
    const vjTrack = {
      id: `vj_${Date.now()}`,
      name: movieForm.vjName,
      language: movieForm.vjLanguage,
      isDefault: true,
      commentaryQuotes: ['MovieKart UG Exclusive Stream']
    };

    try {
      if (editingMovie) {
        await updateMovie({
          ...editingMovie,
          title: movieForm.title,
          genre: movieForm.genre,
          year: Number(movieForm.year),
          duration: movieForm.duration,
          rating: Number(movieForm.rating),
          ageRating: movieForm.ageRating,
          quality: movieForm.quality,
          posterUrl: movieForm.posterUrl,
          backdropUrl: movieForm.backdropUrl || movieForm.posterUrl,
          description: movieForm.description,
          synopsis: movieForm.description,
          director: movieForm.director,
          cast: movieForm.cast
            .split(',')
            .map((c) => c.trim())
            .filter(Boolean),
          videoUrl: movieForm.videoUrl,
          fileSizeMb: Number(movieForm.fileSizeMb),
          isTrending: movieForm.isTrending,
          isFeatured: movieForm.isFeatured,
          isUgandanExclusive: movieForm.isUgandanExclusive,
          vjTracks: [vjTrack]
        });
      } else {
        await addMovie({
          title: movieForm.title,
          genre: movieForm.genre,
          year: Number(movieForm.year),
          duration: movieForm.duration,
          rating: Number(movieForm.rating),
          ageRating: movieForm.ageRating,
          quality: movieForm.quality,
          posterUrl: movieForm.posterUrl,
          backdropUrl: movieForm.backdropUrl || movieForm.posterUrl,
          description: movieForm.description,
          synopsis: movieForm.description,
          director: movieForm.director,
          cast: movieForm.cast
            .split(',')
            .map((c) => c.trim())
            .filter(Boolean),
          videoUrl: movieForm.videoUrl,
          fileSizeMb: Number(movieForm.fileSizeMb),
          isTrending: movieForm.isTrending,
          isFeatured: movieForm.isFeatured,
          isUgandanExclusive: movieForm.isUgandanExclusive,
          vjTracks: [vjTrack]
        });
      }

      setIsAddMovieModalOpen(false);
      setEditingMovie(null);
      setMovieForm(emptyMovieForm);
    } catch {
      // Toast already surfaced in context
    } finally {
      setSavingMovie(false);
    }
  };

  const handleSaveTVShow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tvShowForm.poster.trim() || !tvShowForm.videoUrl.trim()) {
      showToast('Please upload or enter both Poster and Video URLs.');
      return;
    }

    setSavingTVShow(true);
    try {
      await addEpisodeToShow({
        showTitle: tvShowForm.title,
        posterUrl: tvShowForm.poster,
        seasonNumber: Number(tvShowForm.seasonNumber),
        episodeNumber: Number(tvShowForm.episodeNumber),
        episodeTitle: tvShowForm.episodeTitle,
        videoUrl: tvShowForm.videoUrl,
        duration: tvShowForm.duration,
        synopsis: tvShowForm.synopsis
      });
      setIsAddTVShowModalOpen(false);
      setTvShowForm({
        title: '',
        poster: '',
        seasonNumber: 1,
        episodeNumber: 1,
        episodeTitle: '',
        videoUrl: '',
        duration: '42m',
        synopsis: ''
      });
    } catch {
      // Handled via toast
    } finally {
      setSavingTVShow(false);
    }
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    addUser({
      name: userForm.name,
      email: userForm.email,
      phone: userForm.phone,
      avatar: userForm.avatar,
      subscription: userForm.subscription,
      status: userForm.status,
      joinedDate: 'Today',
      momoProvider: userForm.momoProvider,
      storageUsedMb: 0,
      downloadsCount: 0
    });
    setIsAddUserModalOpen(false);
    setUserForm({
      name: '',
      email: '',
      phone: '+256 7',
      avatar: '/pwa-192x192.png',
      subscription: 'MovieKart VIP',
      status: 'active',
      momoProvider: 'MTN Mobile Money',
      storageUsedMb: 0,
      downloadsCount: 0
    });
  };

  const totalViews = movies.reduce((acc, m) => acc + (m.viewsCount || 0), 0);
  const totalSubscribers = users.filter((u) => u.subscription === 'MovieKart VIP').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-red-600/20 text-[#E50914]">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit']">
              Admin Operations Dashboard
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Signed in as <span className="text-white font-semibold">{adminUser?.email}</span> · Live Firestore & Firebase Storage
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setEditingMovie(null);
              setMovieForm(emptyMovieForm);
              setIsAddMovieModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#E50914] hover:bg-red-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-red-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Movie</span>
          </button>

          <button
            onClick={() => setIsAddTVShowModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-red-950/60 hover:bg-red-900/60 text-red-400 border border-red-500/50 font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add TV Show / Episode</span>
          </button>

          <button
            onClick={logoutAdmin}
            className="px-3.5 py-2 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Sign Out
          </button>

          <button
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#121217] border border-white/5">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>Firestore Movies</span>
            <Film className="w-4 h-4 text-[#E50914]" />
          </div>
          <p className="text-2xl font-extrabold text-white font-mono">{movies.length}</p>
          <p className="text-[11px] text-gray-400 mt-1">Live in "movies" collection</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#121217] border border-white/5">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>TV Series</span>
            <Tv className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-extrabold text-white font-mono">{tvShows.length}</p>
          <p className="text-[11px] text-gray-400 mt-1">
            {tvShows.reduce((acc, s) => acc + s.seasons.reduce((ea, sea) => ea + sea.episodes.length, 0), 0)} Total Episodes
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#121217] border border-white/5">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>Total Views</span>
            <Eye className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-extrabold text-white font-mono">{totalViews.toLocaleString()}</p>
          <p className="text-[11px] text-gray-400 mt-1">Live stream tracking</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#121217] border border-white/5">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>Storage Bucket</span>
            <HardDrive className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-sm font-extrabold text-white font-mono truncate">moviekart-ug.firebasestorage.app</p>
          <p className="text-[11px] text-emerald-400 mt-1">Connected & Ready</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/5 pb-3 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveAdminTab('movies')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer shrink-0 ${
            activeAdminTab === 'movies'
              ? 'bg-[#E50914] text-white shadow-md'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Film className="w-4 h-4" />
          <span>Movies ({movies.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('tvshows')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer shrink-0 ${
            activeAdminTab === 'tvshows'
              ? 'bg-[#E50914] text-white shadow-md'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Tv className="w-4 h-4" />
          <span>TV Shows ({tvShows.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer shrink-0 ${
            activeAdminTab === 'users'
              ? 'bg-[#E50914] text-white shadow-md'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Subscribers ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer shrink-0 ${
            activeAdminTab === 'analytics'
              ? 'bg-[#E50914] text-white shadow-md'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Insights ({totalSubscribers} VIP)</span>
        </button>
      </div>

      {/* TAB 1: MOVIES MANAGEMENT */}
      {activeAdminTab === 'movies' && (
        <div className="space-y-4">
          {movies.length === 0 ? (
            <div className="p-12 rounded-3xl bg-[#121217] border border-white/5 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-[#E50914]/15 text-[#E50914] flex items-center justify-center">
                <Film className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">No movies in Firestore yet</h3>
                <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
                  Upload a poster and movie video file to Firebase Storage, and it will appear live on the homepage immediately.
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingMovie(null);
                  setMovieForm(emptyMovieForm);
                  setIsAddMovieModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#E50914] hover:bg-red-700 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Movie</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl bg-[#121217] border border-white/5">
              <table className="w-full text-left text-xs sm:text-sm text-gray-300">
                <thead className="bg-[#181822] text-[11px] uppercase font-bold text-gray-400 border-b border-white/5">
                  <tr>
                    <th className="py-3 px-4">Movie</th>
                    <th className="py-3 px-4">Genre</th>
                    <th className="py-3 px-4">Rating</th>
                    <th className="py-3 px-4">Audio / VJ</th>
                    <th className="py-3 px-4">Flags</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {movies.map((m) => (
                    <tr key={m.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 flex items-center gap-3">
                        <img
                          src={m.posterUrl}
                          alt={m.title}
                          className="w-10 h-14 rounded-lg object-cover shrink-0 bg-black"
                        />
                        <div>
                          <p className="font-bold text-white line-clamp-1">{m.title}</p>
                          <p className="text-[11px] text-gray-400">
                            {m.year} · {m.duration} · {m.quality}
                          </p>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-semibold text-gray-200">{m.genre}</span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-amber-400 font-bold flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span>{(m.rating5 ?? m.rating / 2).toFixed(1)}/5</span>
                          <span className="text-[10px] text-gray-500 font-normal">({m.ratingsCount || 0})</span>
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-[11px] text-red-400 flex items-center gap-1 font-medium">
                          <Volume2 className="w-3 h-3 text-red-500" />
                          {m.vjTracks?.[0]?.name || 'Original'}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {m.isTrending && (
                            <span className="text-[10px] bg-red-950/60 text-red-400 border border-red-500/40 px-1.5 py-0.5 rounded font-bold">
                              Trending
                            </span>
                          )}
                          {m.isFeatured && (
                            <span className="text-[10px] bg-amber-950/60 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded font-bold">
                              Featured
                            </span>
                          )}
                          {m.isUgandanExclusive && (
                            <span className="text-[10px] bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.5 rounded font-bold">
                              UG Hit
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => playMovie(m)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white cursor-pointer"
                            title="Preview Video"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEditMovie(m)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white cursor-pointer"
                            title="Edit Movie"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete "${m.title}" from Firestore?`)) {
                                deleteMovie(m.id);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-red-600/20 text-gray-400 hover:text-red-400 cursor-pointer"
                            title="Delete Movie"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TV SHOWS MANAGEMENT */}
      {activeAdminTab === 'tvshows' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">TV Series Catalogue & Seasons</h3>
            <button
              onClick={() => setIsAddTVShowModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E50914] hover:bg-red-700 text-white text-xs font-bold rounded-lg cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add TV Show / Episode</span>
            </button>
          </div>

          {tvShows.length === 0 ? (
            <div className="p-10 rounded-3xl bg-[#121217] border border-white/5 text-center space-y-2">
              <Tv className="w-8 h-8 mx-auto text-gray-500" />
              <p className="text-sm font-bold text-white">No TV shows in Firestore yet</p>
              <p className="text-xs text-gray-400">Click "Add TV Show / Episode" to publish a series.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl bg-[#121217] border border-white/5">
              <table className="w-full text-left text-xs sm:text-sm text-gray-300">
                <thead className="bg-[#181822] text-[11px] uppercase font-bold text-gray-400 border-b border-white/5">
                  <tr>
                    <th className="py-3 px-4">TV Show</th>
                    <th className="py-3 px-4">Genre</th>
                    <th className="py-3 px-4">Rating</th>
                    <th className="py-3 px-4">Seasons</th>
                    <th className="py-3 px-4">Total Episodes</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {tvShows.map((s) => {
                    const totalEps = s.seasons.reduce((acc, sea) => acc + sea.episodes.length, 0);
                    return (
                      <tr key={s.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4 flex items-center gap-3">
                          <img
                            src={s.posterUrl}
                            alt={s.title}
                            className="w-10 h-14 rounded-lg object-cover shrink-0 bg-black"
                          />
                          <div>
                            <p className="font-bold text-white line-clamp-1">{s.title}</p>
                            <p className="text-[11px] text-gray-400">{s.year} · {s.quality}</p>
                          </div>
                        </td>

                        <td className="py-3 px-4 font-semibold text-gray-200">{s.genre}</td>

                        <td className="py-3 px-4">
                          <span className="text-amber-400 font-bold flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-amber-400" />
                            {s.rating.toFixed(1)}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-xs">
                            {s.seasons.length} {s.seasons.length === 1 ? 'Season' : 'Seasons'}
                          </span>
                        </td>

                        <td className="py-3 px-4 font-mono">{totalEps} Episodes</td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openShowDetails(s)}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white cursor-pointer"
                              title="Manage Episodes & Seasons"
                            >
                              <Layers className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => {
                                setTvShowForm({
                                  title: s.title,
                                  poster: s.posterUrl,
                                  seasonNumber: s.seasons.length || 1,
                                  episodeNumber: (s.seasons[s.seasons.length - 1]?.episodes.length || 0) + 1,
                                  episodeTitle: '',
                                  videoUrl: '',
                                  duration: '45m',
                                  synopsis: ''
                                });
                                setIsAddTVShowModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg bg-red-950/40 text-red-400 border border-red-500/30 hover:bg-red-900/60 cursor-pointer"
                              title="Add Next Episode"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => {
                                if (window.confirm(`Delete TV Show "${s.title}"?`)) {
                                  deleteTVShow(s.id);
                                }
                              }}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-red-600/20 text-gray-400 hover:text-red-400 cursor-pointer"
                              title="Delete Show"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: USERS MANAGEMENT */}
      {activeAdminTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Registered MovieKart Subscribers</h3>
            <button
              onClick={() => setIsAddUserModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E50914] hover:bg-red-700 text-white text-xs font-bold rounded-lg cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Subscriber</span>
            </button>
          </div>

          {users.length === 0 ? (
            <div className="p-10 rounded-3xl bg-[#121217] border border-white/5 text-center space-y-2">
              <Users className="w-8 h-8 mx-auto text-gray-500" />
              <p className="text-sm font-bold text-white">No local subscriber accounts yet</p>
              <p className="text-xs text-gray-400">Accounts created via Sign Up will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl bg-[#121217] border border-white/5">
              <table className="w-full text-left text-xs sm:text-sm text-gray-300">
                <thead className="bg-[#181822] text-[11px] uppercase font-bold text-gray-400 border-b border-white/5">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Subscription Plan</th>
                    <th className="py-3 px-4">Mobile Money Provider</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Storage Used</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 flex items-center gap-3">
                        <img
                          src={u.avatar}
                          alt={u.name}
                          className="w-10 h-10 rounded-xl object-cover shrink-0"
                        />
                        <div>
                          <p className="font-bold text-white">{u.name}</p>
                          <p className="text-[11px] text-gray-400">{u.email} {u.phone ? `· ${u.phone}` : ''}</p>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <select
                          value={u.subscription}
                          onChange={(e) => updateUser({ ...u, subscription: e.target.value as any })}
                          className="bg-black/50 text-xs font-bold text-white border border-white/10 rounded-lg px-2 py-1 focus:outline-none"
                        >
                          <option value="MovieKart VIP">MovieKart VIP</option>
                          <option value="Standard HD">Standard HD</option>
                          <option value="Free Pass">Free Pass</option>
                        </select>
                      </td>

                      <td className="py-3 px-4">
                        <span className="flex items-center gap-1.5 text-xs text-gray-300">
                          <Smartphone className="w-3.5 h-3.5 text-red-500" />
                          {u.momoProvider}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <button
                          onClick={() => {
                            const nextStatus = u.status === 'active' ? 'suspended' : 'active';
                            updateUser({ ...u, status: nextStatus });
                          }}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                            u.status === 'active'
                              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/40'
                              : 'bg-red-950/60 text-red-400 border border-red-500/40'
                          }`}
                        >
                          {u.status}
                        </button>
                      </td>

                      <td className="py-3 px-4 font-mono text-xs">
                        {u.storageUsedMb} MB ({u.downloadsCount} files)
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => deleteUser(u.id)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-red-600/20 text-gray-400 hover:text-red-400 cursor-pointer"
                          title="Delete User"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: STREAMING SUMMARY */}
      {activeAdminTab === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl bg-[#121217] border border-white/5 space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Film className="w-4 h-4 text-[#E50914]" />
              Live Firestore Catalog Summary
            </h3>
            <p className="text-xs text-gray-400">
              All movies are synced in real time via Firestore collection <code className="text-red-400">movies</code>.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                <p className="text-[11px] text-gray-400">Published Movies</p>
                <p className="text-xl font-bold text-white font-mono">{movies.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                <p className="text-[11px] text-gray-400">Published TV Shows</p>
                <p className="text-xl font-bold text-white font-mono">{tvShows.length}</p>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#121217] border border-white/5 space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-[#E50914]" />
              Firebase Storage Media Pipeline
            </h3>
            <p className="text-xs text-gray-400">
              Posters are stored in <code className="text-red-400">posters/</code> and video streams in{' '}
              <code className="text-red-400">videos/</code> inside <code className="text-white">moviekart-ug.firebasestorage.app</code>.
            </p>
          </div>
        </div>
      )}

      {/* FORM MODAL 1: ADD / EDIT MOVIE WITH FIREBASE STORAGE UPLOAD */}
      {isAddMovieModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-[#121218] border border-white/10 rounded-3xl p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <h3 className="text-lg font-bold text-white font-['Outfit']">
                {editingMovie ? 'Edit Movie in Firestore' : 'Upload & Publish New Movie'}
              </h3>
              <button
                onClick={() => {
                  setIsAddMovieModalOpen(false);
                  setEditingMovie(null);
                }}
                className="p-1 rounded-lg text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMovie} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">
                    Movie Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={movieForm.title}
                    onChange={(e) => setMovieForm({ ...movieForm, title: e.target.value })}
                    placeholder="e.g. Kampala Speed 2"
                    className="w-full bg-[#181822] text-white p-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#E50914]"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">
                    Genre <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={movieForm.genre}
                    onChange={(e) => setMovieForm({ ...movieForm, genre: e.target.value as Genre })}
                    className="w-full bg-[#181822] text-white p-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#E50914]"
                  >
                    <option value="Action">Action</option>
                    <option value="Drama">Drama</option>
                    <option value="Sci-Fi">Sci-Fi</option>
                    <option value="Comedy">Comedy</option>
                    <option value="Ugandan Hits">Ugandan Hits 🇺🇬</option>
                    <option value="Thriller">Thriller</option>
                    <option value="Animation">Animation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">
                    Release Year <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={movieForm.year}
                    onChange={(e) => setMovieForm({ ...movieForm, year: Number(e.target.value) })}
                    className="w-full bg-[#181822] text-white p-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#E50914]"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">
                    Rating (1.0 - 10.0) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="10"
                    required
                    value={movieForm.rating}
                    onChange={(e) => setMovieForm({ ...movieForm, rating: Number(e.target.value) })}
                    className="w-full bg-[#181822] text-white p-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#E50914]"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-medium mb-1">Duration</label>
                  <input
                    type="text"
                    value={movieForm.duration}
                    onChange={(e) => setMovieForm({ ...movieForm, duration: e.target.value })}
                    placeholder="1h 45m"
                    className="w-full bg-[#181822] text-white p-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#E50914]"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-medium mb-1">Quality Badge</label>
                  <select
                    value={movieForm.quality}
                    onChange={(e) => setMovieForm({ ...movieForm, quality: e.target.value as any })}
                    className="w-full bg-[#181822] text-white p-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#E50914]"
                  >
                    <option value="4K UHD">4K UHD</option>
                    <option value="1080p FHD">1080p FHD</option>
                    <option value="720p HD">720p HD</option>
                  </select>
                </div>
              </div>

              {/* Poster Image Upload to Firebase Storage */}
              <div className="p-3.5 rounded-2xl bg-[#181822] border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-gray-200 font-bold flex items-center gap-1.5">
                    <UploadCloud className="w-4 h-4 text-[#E50914]" />
                    <span>Poster Image (Firebase Storage or URL) *</span>
                  </label>
                  {movieForm.posterUrl && !posterUploading && (
                    <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                  {movieForm.posterUrl && (
                    <img
                      src={movieForm.posterUrl}
                      alt="Poster preview"
                      className="w-12 h-16 rounded-lg object-cover border border-white/10 shrink-0"
                    />
                  )}
                  <div className="flex-1 w-full space-y-2">
                    <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold cursor-pointer transition-colors">
                      <UploadCloud className="w-4 h-4 text-[#E50914]" />
                      <span>{posterUploading ? `Uploading ${posterUploadProgress}%...` : 'Choose Poster Image File'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePosterFileChange}
                        disabled={posterUploading}
                        className="hidden"
                      />
                    </label>
                    {posterUploading && (
                      <div className="w-full h-1.5 bg-black rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#E50914] transition-all"
                          style={{ width: `${posterUploadProgress}%` }}
                        />
                      </div>
                    )}
                    <input
                      type="url"
                      required
                      value={movieForm.posterUrl}
                      onChange={(e) => setMovieForm({ ...movieForm, posterUrl: e.target.value })}
                      placeholder="https://firebasestorage.googleapis.com/..."
                      className="w-full bg-black/50 text-white p-2 rounded-xl border border-white/10 focus:outline-none focus:border-[#E50914] font-mono text-[11px]"
                    />
                  </div>
                </div>
              </div>

              {/* Video File Upload to Firebase Storage */}
              <div className="p-3.5 rounded-2xl bg-[#181822] border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-gray-200 font-bold flex items-center gap-1.5">
                    <UploadCloud className="w-4 h-4 text-[#E50914]" />
                    <span>Movie Video File (Firebase Storage or MP4 URL) *</span>
                  </label>
                  {movieForm.videoUrl && !videoUploading && (
                    <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[#E50914]/20 hover:bg-[#E50914]/30 border border-[#E50914]/40 text-white font-semibold cursor-pointer transition-colors">
                      <UploadCloud className="w-4 h-4 text-[#E50914]" />
                      <span>{videoUploading ? 'Uploading Video...' : 'Upload Video File (.mp4 / video)'}</span>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleVideoFileChange}
                        disabled={videoUploading}
                        className="hidden"
                      />
                    </label>
                    {videoUploading && (
                      <span className="text-[11px] text-amber-300 font-mono">{videoUploadStatusText}</span>
                    )}
                  </div>
                  {videoUploading && (
                    <div className="w-full h-1.5 bg-black rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#E50914] transition-all"
                        style={{ width: `${videoUploadProgress}%` }}
                      />
                    </div>
                  )}
                  <input
                    type="url"
                    required
                    value={movieForm.videoUrl}
                    onChange={(e) => setMovieForm({ ...movieForm, videoUrl: e.target.value })}
                    placeholder="https://firebasestorage.googleapis.com/..."
                    className="w-full bg-black/50 text-white p-2 rounded-xl border border-white/10 focus:outline-none focus:border-[#E50914] font-mono text-[11px]"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-gray-300 font-semibold mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={movieForm.description}
                  onChange={(e) => setMovieForm({ ...movieForm, description: e.target.value })}
                  placeholder="Enter movie description..."
                  className="w-full bg-[#181822] text-white p-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#E50914]"
                />
              </div>

              {/* VJ Audio Track */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-red-950/20 border border-red-500/20 rounded-xl">
                <div>
                  <label className="block text-red-400 font-bold mb-1">VJ Commentator (Uganda)</label>
                  <select
                    value={movieForm.vjName}
                    onChange={(e) => setMovieForm({ ...movieForm, vjName: e.target.value })}
                    className="w-full bg-[#181822] text-white p-2 rounded-lg border border-white/10 focus:outline-none"
                  >
                    <option value="VJ Junior">VJ Junior</option>
                    <option value="VJ Emmy">VJ Emmy</option>
                    <option value="VJ Jingo">VJ Jingo</option>
                    <option value="Original English">Original Studio Track</option>
                  </select>
                </div>

                <div>
                  <label className="block text-red-400 font-bold mb-1">Commentary Language</label>
                  <input
                    type="text"
                    value={movieForm.vjLanguage}
                    onChange={(e) => setMovieForm({ ...movieForm, vjLanguage: e.target.value })}
                    placeholder="Luganda"
                    className="w-full bg-[#181822] text-white p-2 rounded-lg border border-white/10 focus:outline-none"
                  />
                </div>
              </div>

              {/* Flags */}
              <div className="flex flex-wrap items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={movieForm.isTrending}
                    onChange={(e) => setMovieForm({ ...movieForm, isTrending: e.target.checked })}
                    className="rounded accent-[#E50914]"
                  />
                  <span>Mark as Trending</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={movieForm.isFeatured}
                    onChange={(e) => setMovieForm({ ...movieForm, isFeatured: e.target.checked })}
                    className="rounded accent-[#E50914]"
                  />
                  <span>Feature in Hero Carousel</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={movieForm.isUgandanExclusive}
                    onChange={(e) => setMovieForm({ ...movieForm, isUgandanExclusive: e.target.checked })}
                    className="rounded accent-[#E50914]"
                  />
                  <span>Ugandan Exclusive 🇺🇬</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddMovieModalOpen(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={posterUploading || videoUploading || savingMovie}
                  className="px-6 py-2.5 bg-[#E50914] hover:bg-red-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md shadow-red-600/30 flex items-center gap-2 cursor-pointer"
                >
                  {savingMovie && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingMovie ? 'Save Changes' : 'Publish to Firestore'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FORM MODAL 2: ADD TV SHOW / EPISODE */}
      {isAddTVShowModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-xl bg-[#121218] border border-white/10 rounded-3xl p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <Tv className="w-5 h-5 text-[#E50914]" />
                <h3 className="text-lg font-bold text-white font-['Outfit']">
                  Add TV Show & Episode
                </h3>
              </div>
              <button
                onClick={() => setIsAddTVShowModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTVShow} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-gray-300 font-semibold mb-1">
                  TV Show Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={tvShowForm.title}
                  onChange={(e) => setTvShowForm({ ...tvShowForm, title: e.target.value })}
                  placeholder="e.g. Kampala Hustle: The Series"
                  className="w-full bg-[#181822] text-white p-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#E50914]"
                />
              </div>

              <div className="p-3 rounded-xl bg-[#181822] border border-white/10 space-y-2">
                <label className="block text-gray-300 font-semibold">
                  Show Poster (Firebase Storage or URL) <span className="text-red-500">*</span>
                </label>
                <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white cursor-pointer">
                  <UploadCloud className="w-3.5 h-3.5 text-[#E50914]" />
                  <span>{tvPosterUploading ? `Uploading ${tvPosterProgress}%...` : 'Upload Poster Image'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleTVPosterUpload}
                    disabled={tvPosterUploading}
                    className="hidden"
                  />
                </label>
                <input
                  type="url"
                  required
                  value={tvShowForm.poster}
                  onChange={(e) => setTvShowForm({ ...tvShowForm, poster: e.target.value })}
                  placeholder="https://firebasestorage.googleapis.com/..."
                  className="w-full bg-black/50 text-white p-2 rounded-lg border border-white/10 focus:outline-none focus:border-[#E50914] font-mono text-[11px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-red-950/20 border border-red-500/20 rounded-xl">
                <div>
                  <label className="block text-red-400 font-bold mb-1">
                    Season Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={tvShowForm.seasonNumber}
                    onChange={(e) => setTvShowForm({ ...tvShowForm, seasonNumber: Number(e.target.value) })}
                    className="w-full bg-[#181822] text-white p-2.5 rounded-lg border border-white/10 focus:outline-none focus:border-[#E50914] font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block text-red-400 font-bold mb-1">
                    Episode Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={tvShowForm.episodeNumber}
                    onChange={(e) => setTvShowForm({ ...tvShowForm, episodeNumber: Number(e.target.value) })}
                    className="w-full bg-[#181822] text-white p-2.5 rounded-lg border border-white/10 focus:outline-none focus:border-[#E50914] font-mono text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">
                  Episode Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={tvShowForm.episodeTitle}
                  onChange={(e) => setTvShowForm({ ...tvShowForm, episodeTitle: e.target.value })}
                  placeholder="e.g. Pilot: The Nakasero Drop"
                  className="w-full bg-[#181822] text-white p-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#E50914]"
                />
              </div>

              <div className="p-3 rounded-xl bg-[#181822] border border-white/10 space-y-2">
                <label className="block text-gray-300 font-semibold">
                  Episode Video (Firebase Storage or URL) <span className="text-red-500">*</span>
                </label>
                <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#E50914]/20 hover:bg-[#E50914]/30 text-white cursor-pointer">
                  <UploadCloud className="w-3.5 h-3.5 text-[#E50914]" />
                  <span>{tvVideoUploading ? `Uploading ${tvVideoProgress}%...` : 'Upload Episode Video'}</span>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleTVVideoUpload}
                    disabled={tvVideoUploading}
                    className="hidden"
                  />
                </label>
                <input
                  type="url"
                  required
                  value={tvShowForm.videoUrl}
                  onChange={(e) => setTvShowForm({ ...tvShowForm, videoUrl: e.target.value })}
                  placeholder="https://firebasestorage.googleapis.com/..."
                  className="w-full bg-black/50 text-white p-2 rounded-lg border border-white/10 focus:outline-none focus:border-[#E50914] font-mono text-[11px]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 font-medium mb-1">Duration</label>
                  <input
                    type="text"
                    value={tvShowForm.duration}
                    onChange={(e) => setTvShowForm({ ...tvShowForm, duration: e.target.value })}
                    placeholder="45m"
                    className="w-full bg-[#181822] text-white p-2 rounded-xl border border-white/10 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-medium mb-1">Episode Synopsis</label>
                  <input
                    type="text"
                    value={tvShowForm.synopsis}
                    onChange={(e) => setTvShowForm({ ...tvShowForm, synopsis: e.target.value })}
                    placeholder="Brief storyline..."
                    className="w-full bg-[#181822] text-white p-2 rounded-xl border border-white/10 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddTVShowModalOpen(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={tvPosterUploading || tvVideoUploading || savingTVShow}
                  className="px-6 py-2 bg-[#E50914] hover:bg-red-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md shadow-red-600/30 cursor-pointer"
                >
                  {savingTVShow ? 'Publishing...' : 'Publish Episode'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FORM MODAL 3: ADD USER */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-[#121218] border border-white/10 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <h3 className="text-base font-bold text-white font-['Outfit']">
                Add New Subscriber Account
              </h3>
              <button
                onClick={() => setIsAddUserModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-400 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  placeholder="e.g. Ssekandi Emmanuel"
                  className="w-full bg-[#181822] text-white p-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#E50914]"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  placeholder="emmanuel@ugmail.com"
                  className="w-full bg-[#181822] text-white p-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#E50914]"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Uganda Phone (MoMo)</label>
                <input
                  type="tel"
                  required
                  value={userForm.phone}
                  onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                  placeholder="+256 7..."
                  className="w-full bg-[#181822] text-white p-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#E50914]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-400 mb-1">Subscription Plan</label>
                  <select
                    value={userForm.subscription}
                    onChange={(e) => setUserForm({ ...userForm, subscription: e.target.value as any })}
                    className="w-full bg-[#181822] text-white p-2 rounded-xl border border-white/10 focus:outline-none"
                  >
                    <option value="MovieKart VIP">MovieKart VIP</option>
                    <option value="Standard HD">Standard HD</option>
                    <option value="Free Pass">Free Pass</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 mb-1">Billing Provider</label>
                  <select
                    value={userForm.momoProvider}
                    onChange={(e) => setUserForm({ ...userForm, momoProvider: e.target.value as any })}
                    className="w-full bg-[#181822] text-white p-2 rounded-xl border border-white/10 focus:outline-none"
                  >
                    <option value="MTN Mobile Money">MTN MoMo</option>
                    <option value="Airtel Money">Airtel Money</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#E50914] hover:bg-red-700 text-white font-bold rounded-xl shadow-md shadow-red-600/30 cursor-pointer"
                >
                  Save User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
