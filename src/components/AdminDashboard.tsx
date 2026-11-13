import React, { useState } from 'react';
import { useMovieContext } from '../context/MovieContext';
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
  CheckCircle2,
  AlertCircle,
  X,
  Volume2,
  HardDrive,
  Eye,
  Sparkles,
  Smartphone,
  Layers,
  ArrowLeft
} from 'lucide-react';
import { Movie, TVShow, Genre, UserAccount } from '../types';

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
    isAdminAuthenticated,
    authenticateAdmin,
    logoutAdmin,
    setActiveTab,
    showToast
  } = useMovieContext();

  const [activeAdminTab, setActiveAdminTab] = useState<'movies' | 'tvshows' | 'users' | 'analytics'>('movies');
  const [pinInput, setPinInput] = useState('');
  
  // Modals state
  const [isAddMovieModalOpen, setIsAddMovieModalOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [isAddTVShowModalOpen, setIsAddTVShowModalOpen] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);

  // Form state for Movie Add/Edit
  const [movieForm, setMovieForm] = useState({
    title: '',
    genre: 'Action' as Genre,
    year: 2025,
    duration: '1h 45m',
    rating: 8.5,
    ageRating: '16+' as '13+' | '16+' | '18+' | 'PG',
    quality: '4K UHD' as '4K UHD' | '1080p FHD' | '720p HD',
    posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1600&q=80',
    synopsis: '',
    director: 'Kizito Samuel',
    cast: 'Okello Denis, Namugga Grace',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    fileSizeMb: 520,
    isTrending: false,
    isFeatured: false,
    isUgandanExclusive: true,
    vjName: 'VJ Junior',
    vjLanguage: 'Luganda'
  });

  // Form state for TV Show (Title, Poster, Season Number, Episode Number, Episode Title, Video URL)
  const [tvShowForm, setTvShowForm] = useState({
    title: '',
    poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80',
    seasonNumber: 1,
    episodeNumber: 1,
    episodeTitle: '',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    duration: '42m',
    synopsis: ''
  });

  // Form state for User Add
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    phone: '+256 7',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    subscription: 'MovieKart VIP' as 'MovieKart VIP' | 'Standard HD' | 'Free Pass',
    status: 'active' as 'active' | 'suspended',
    momoProvider: 'MTN Mobile Money' as 'MTN Mobile Money' | 'Airtel Money',
    storageUsedMb: 0,
    downloadsCount: 0
  });

  // PIN Entrance if not authenticated
  if (!isAdminAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="p-8 rounded-3xl bg-[#121218] border border-white/10 shadow-2xl space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-red-600/20 text-red-500 flex items-center justify-center">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <h1 className="text-2xl font-extrabold text-white font-['Outfit']">
              Secure Admin Dashboard
            </h1>
            <p className="text-xs text-gray-400 mt-2">
              Restricted area for MovieKart UG operations, movie catalogue updates, TV show additions, and subscriber management.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              authenticateAdmin(pinInput);
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs text-gray-400 mb-2 font-medium">
                Enter 4-Digit Security Passcode
              </label>
              <input
                type="password"
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="••••"
                autoFocus
                className="w-40 mx-auto text-center text-3xl tracking-[0.5em] font-mono py-2 rounded-xl bg-black border border-white/20 text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-red-600/30 cursor-pointer"
            >
              Unlock Dashboard
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('home')}
              className="inline-flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors cursor-pointer pt-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Home</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Handle open edit movie
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
      synopsis: movie.synopsis,
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

  // Submit Movie Form
  const handleSaveMovie = (e: React.FormEvent) => {
    e.preventDefault();
    const vjTrack = {
      id: `vj_${Date.now()}`,
      name: movieForm.vjName,
      language: movieForm.vjLanguage,
      isDefault: true,
      commentaryQuotes: ['Abasajja bano bazze!', 'Action packed!', 'Abaana ba Kampala!']
    };

    if (editingMovie) {
      updateMovie({
        ...editingMovie,
        title: movieForm.title,
        genre: movieForm.genre,
        year: Number(movieForm.year),
        duration: movieForm.duration,
        rating: Number(movieForm.rating),
        ageRating: movieForm.ageRating,
        quality: movieForm.quality,
        posterUrl: movieForm.posterUrl,
        backdropUrl: movieForm.backdropUrl,
        synopsis: movieForm.synopsis,
        director: movieForm.director,
        cast: movieForm.cast.split(',').map((c) => c.trim()),
        videoUrl: movieForm.videoUrl,
        fileSizeMb: Number(movieForm.fileSizeMb),
        isTrending: movieForm.isTrending,
        isFeatured: movieForm.isFeatured,
        isUgandanExclusive: movieForm.isUgandanExclusive,
        vjTracks: [vjTrack]
      });
    } else {
      addMovie({
        title: movieForm.title,
        genre: movieForm.genre,
        year: Number(movieForm.year),
        duration: movieForm.duration,
        rating: Number(movieForm.rating),
        ageRating: movieForm.ageRating,
        quality: movieForm.quality,
        posterUrl: movieForm.posterUrl,
        backdropUrl: movieForm.backdropUrl,
        synopsis: movieForm.synopsis,
        director: movieForm.director,
        cast: movieForm.cast.split(',').map((c) => c.trim()),
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
  };

  // Submit TV Show & Episode Form (Prompt: add admin form to add tv show with title,poster,season number,episode number,episode title, video URL)
  const handleSaveTVShow = (e: React.FormEvent) => {
    e.preventDefault();
    addEpisodeToShow({
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
      poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80',
      seasonNumber: 1,
      episodeNumber: 1,
      episodeTitle: '',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
      duration: '42m',
      synopsis: ''
    });
  };

  // Submit User Form
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
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      subscription: 'MovieKart VIP',
      status: 'active',
      momoProvider: 'MTN Mobile Money',
      storageUsedMb: 0,
      downloadsCount: 0
    });
  };

  const totalViews = movies.reduce((acc, m) => acc + (m.viewsCount || 35000), 0);
  const totalSubscribers = users.filter((u) => u.subscription === 'MovieKart VIP').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-red-600/20 text-red-500">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit']">
              Admin Operations Dashboard
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Real-time management for MovieKart UG movies, TV series & seasons, subscriber accounts, and video CDN.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setEditingMovie(null);
              setIsAddMovieModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-red-600/30 transition-all cursor-pointer"
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
            Lock Dashboard
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
            <span>Movies Catalog</span>
            <Film className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-extrabold text-white font-mono">{movies.length}</p>
          <p className="text-[11px] text-gray-400 mt-1">Active feature films</p>
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
            <span>VIP Subscribers</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-extrabold text-white font-mono">{totalSubscribers}</p>
          <p className="text-[11px] text-emerald-400 mt-1">MTN & Airtel MoMo</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#121217] border border-white/5">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>Total Streams</span>
            <Eye className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-extrabold text-white font-mono">
            {totalViews.toLocaleString()}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">Uganda viewers</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/5 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveAdminTab('movies')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer shrink-0 ${
            activeAdminTab === 'movies'
              ? 'bg-red-600 text-white shadow-md'
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
              ? 'bg-red-600 text-white shadow-md'
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
              ? 'bg-red-600 text-white shadow-md'
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
              ? 'bg-red-600 text-white shadow-md'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Ugandan Streaming Insights</span>
        </button>
      </div>

      {/* TAB 1: MOVIES MANAGEMENT */}
      {activeAdminTab === 'movies' && (
        <div className="space-y-4">
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
                        className="w-10 h-14 rounded-lg object-cover shrink-0"
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
                        <span>{(m.rating5 ?? (m.rating / 2)).toFixed(1)}/5</span>
                        <span className="text-[10px] text-gray-500 font-normal">({m.ratingsCount || 120})</span>
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
                            if (window.confirm(`Delete "${m.title}"?`)) {
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
        </div>
      )}

      {/* TAB 2: TV SHOWS MANAGEMENT */}
      {activeAdminTab === 'tvshows' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">TV Series Catalogue & Seasons</h3>
            <button
              onClick={() => setIsAddTVShowModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add TV Show / Episode</span>
            </button>
          </div>

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
                          className="w-10 h-14 rounded-lg object-cover shrink-0"
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
                              // Pre-populate add episode modal for this show
                              setTvShowForm({
                                title: s.title,
                                poster: s.posterUrl,
                                seasonNumber: s.seasons.length,
                                episodeNumber: (s.seasons[s.seasons.length - 1]?.episodes.length || 0) + 1,
                                episodeTitle: '',
                                videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
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
        </div>
      )}

      {/* TAB 3: USERS MANAGEMENT */}
      {activeAdminTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Registered MovieKart Subscribers</h3>
            <button
              onClick={() => setIsAddUserModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Subscriber</span>
            </button>
          </div>

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
                        <p className="text-[11px] text-gray-400">{u.email} · {u.phone}</p>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <select
                        value={u.subscription}
                        onChange={(e) => {
                          updateUser({ ...u, subscription: e.target.value as any });
                        }}
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
                        onClick={() => {
                          if (users.length <= 1) {
                            showToast('Cannot delete the last remaining user account.');
                            return;
                          }
                          deleteUser(u.id);
                        }}
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
        </div>
      )}

      {/* TAB 4: STREAMING & VJ INSIGHTS */}
      {activeAdminTab === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl bg-[#121217] border border-white/5 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-red-500" />
              Ugandan VJ Audio Preference Share
            </h3>

            <div className="space-y-3">
              {[
                { name: 'VJ Junior (Luganda)', share: 62, count: '142,300 streams' },
                { name: 'VJ Emmy (Luganda)', share: 26, count: '58,100 streams' },
                { name: 'VJ Jingo (Luganda)', share: 8, count: '18,400 streams' },
                { name: 'Original Studio Audio', share: 4, count: '9,200 streams' }
              ].map((item) => (
                <div key={item.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">{item.name}</span>
                    <span className="text-gray-400">{item.share}% ({item.count})</span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-600 rounded-full"
                      style={{ width: `${item.share}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#121217] border border-white/5 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-red-500" />
              Uganda Mobile Money Subscriber Billing
            </h3>

            <div className="space-y-3">
              {[
                { provider: 'MTN Mobile Money (Uganda)', share: 64, activeUsers: '12,400' },
                { provider: 'Airtel Money (Uganda)', share: 36, activeUsers: '6,900' }
              ].map((p) => (
                <div key={p.provider} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">{p.provider}</span>
                    <span className="text-gray-400">{p.share}%</span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${p.share}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-red-950/30 border border-red-500/20 rounded-xl text-xs text-gray-300">
              <p className="font-semibold text-white mb-1">💡 Data Bundle Optimization</p>
              Offline download mode currently saves Ugandan subscribers an estimated <strong>14.2 Terabytes</strong> of cellular mobile data every month.
            </div>
          </div>
        </div>
      )}

      {/* FORM MODAL 1: ADD / EDIT MOVIE */}
      {isAddMovieModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-[#121218] border border-white/10 rounded-3xl p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <h3 className="text-lg font-bold text-white font-['Outfit']">
                {editingMovie ? 'Edit Movie' : 'Add New Movie to MovieKart UG'}
              </h3>
              <button
                onClick={() => {
                  setIsAddMovieModalOpen(false);
                  setEditingMovie(null);
                }}
                className="p-1 rounded-lg text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMovie} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 font-medium mb-1">Movie Title</label>
                  <input
                    type="text"
                    required
                    value={movieForm.title}
                    onChange={(e) => setMovieForm({ ...movieForm, title: e.target.value })}
                    placeholder="e.g. Kampala Speed 2"
                    className="w-full bg-[#181822] text-white p-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-medium mb-1">Genre</label>
                  <select
                    value={movieForm.genre}
                    onChange={(e) => setMovieForm({ ...movieForm, genre: e.target.value as Genre })}
                    className="w-full bg-[#181822] text-white p-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-red-500"
                  >
                    <option value="Action">Action</option>
                    <option value="Drama">Drama</option>
                    <option value="Sci-Fi">Sci-Fi</option>
                    <option value="Comedy">Comedy</option>
                    <option value="Ugandan Hits">Ugandan Hits 🇺🇬</option>
                    <option value="Thriller">Thriller</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 font-medium mb-1">Release Year</label>
                  <input
                    type="number"
                    value={movieForm.year}
                    onChange={(e) => setMovieForm({ ...movieForm, year: Number(e.target.value) })}
                    className="w-full bg-[#181822] text-white p-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-medium mb-1">Duration</label>
                  <input
                    type="text"
                    value={movieForm.duration}
                    onChange={(e) => setMovieForm({ ...movieForm, duration: e.target.value })}
                    placeholder="1h 45m"
                    className="w-full bg-[#181822] text-white p-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-medium mb-1">Rating (1.0 - 10.0)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="10"
                    value={movieForm.rating}
                    onChange={(e) => setMovieForm({ ...movieForm, rating: Number(e.target.value) })}
                    className="w-full bg-[#181822] text-white p-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-medium mb-1">Quality Badge</label>
                  <select
                    value={movieForm.quality}
                    onChange={(e) => setMovieForm({ ...movieForm, quality: e.target.value as any })}
                    className="w-full bg-[#181822] text-white p-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-red-500"
                  >
                    <option value="4K UHD">4K UHD</option>
                    <option value="1080p FHD">1080p FHD</option>
                    <option value="720p HD">720p HD</option>
                  </select>
                </div>
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

              <div>
                <label className="block text-gray-400 font-medium mb-1">Poster Image URL</label>
                <input
                  type="url"
                  required
                  value={movieForm.posterUrl}
                  onChange={(e) => setMovieForm({ ...movieForm, posterUrl: e.target.value })}
                  className="w-full bg-[#181822] text-white p-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-gray-400 font-medium mb-1">Video Stream URL (.mp4)</label>
                <input
                  type="url"
                  required
                  value={movieForm.videoUrl}
                  onChange={(e) => setMovieForm({ ...movieForm, videoUrl: e.target.value })}
                  className="w-full bg-[#181822] text-white p-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-gray-400 font-medium mb-1">Synopsis / Storyline</label>
                <textarea
                  rows={3}
                  required
                  value={movieForm.synopsis}
                  onChange={(e) => setMovieForm({ ...movieForm, synopsis: e.target.value })}
                  placeholder="Enter high energy synopsis..."
                  className="w-full bg-[#181822] text-white p-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-red-500"
                />
              </div>

              {/* Checkboxes */}
              <div className="flex flex-wrap items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={movieForm.isTrending}
                    onChange={(e) => setMovieForm({ ...movieForm, isTrending: e.target.checked })}
                    className="rounded accent-red-600"
                  />
                  <span>Mark as Trending</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={movieForm.isFeatured}
                    onChange={(e) => setMovieForm({ ...movieForm, isFeatured: e.target.checked })}
                    className="rounded accent-red-600"
                  />
                  <span>Feature in Hero Carousel</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={movieForm.isUgandanExclusive}
                    onChange={(e) => setMovieForm({ ...movieForm, isUgandanExclusive: e.target.checked })}
                    className="rounded accent-red-600"
                  />
                  <span>Ugandan Exclusive 🇺🇬</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddMovieModalOpen(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md shadow-red-600/30"
                >
                  {editingMovie ? 'Save Changes' : 'Publish Movie'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FORM MODAL 2: ADD TV SHOW / EPISODE (Exact requested fields: title, poster, season number, episode number, episode title, video URL) */}
      {isAddTVShowModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-xl bg-[#121218] border border-white/10 rounded-3xl p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <Tv className="w-5 h-5 text-red-500" />
                <h3 className="text-lg font-bold text-white font-['Outfit']">
                  Add TV Show & Episode
                </h3>
              </div>
              <button
                onClick={() => setIsAddTVShowModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-400 mb-4">
              Specify the TV show title, poster, season, episode number, title, and video stream URL. If the show exists, the episode will be appended to the season.
            </p>

            <form onSubmit={handleSaveTVShow} className="space-y-3.5 text-xs">
              {/* Show Title */}
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
                  className="w-full bg-[#181822] text-white p-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-red-500"
                />
              </div>

              {/* Show Poster */}
              <div>
                <label className="block text-gray-300 font-semibold mb-1">
                  Poster Image URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={tvShowForm.poster}
                  onChange={(e) => setTvShowForm({ ...tvShowForm, poster: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-[#181822] text-white p-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-red-500"
                />
              </div>

              {/* Season Number & Episode Number */}
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
                    placeholder="1"
                    className="w-full bg-[#181822] text-white p-2.5 rounded-lg border border-white/10 focus:outline-none focus:border-red-500 font-mono text-sm"
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
                    placeholder="1"
                    className="w-full bg-[#181822] text-white p-2.5 rounded-lg border border-white/10 focus:outline-none focus:border-red-500 font-mono text-sm"
                  />
                </div>
              </div>

              {/* Episode Title */}
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
                  className="w-full bg-[#181822] text-white p-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-red-500"
                />
              </div>

              {/* Video URL */}
              <div>
                <label className="block text-gray-300 font-semibold mb-1">
                  Video Stream URL (.mp4) <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={tvShowForm.videoUrl}
                  onChange={(e) => setTvShowForm({ ...tvShowForm, videoUrl: e.target.value })}
                  placeholder="https://commondatastorage.googleapis.com/.../video.mp4"
                  className="w-full bg-[#181822] text-white p-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-red-500 font-mono text-xs"
                />
              </div>

              {/* Duration & Synopsis */}
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
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md shadow-red-600/30"
                >
                  Publish Episode to Show
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
                className="p-1 rounded-lg text-gray-400 hover:text-white"
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
                  className="w-full bg-[#181822] text-white p-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-red-500"
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
                  className="w-full bg-[#181822] text-white p-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-red-500"
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
                  className="w-full bg-[#181822] text-white p-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-red-500"
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
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md shadow-red-600/30"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
