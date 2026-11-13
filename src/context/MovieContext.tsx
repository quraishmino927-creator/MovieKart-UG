import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Movie,
  TVShow,
  Season,
  Episode,
  Genre,
  DownloadItem,
  UserAccount,
  ActiveTab,
  VJTrack,
  ContentMode,
  PlayableItem,
  ContinueWatchingItem
} from '../types';
import { INITIAL_MOVIES, INITIAL_USERS } from '../data/movies';
import { INITIAL_TV_SHOWS } from '../data/tvshows';

interface MovieContextType {
  contentMode: ContentMode;
  setContentMode: (mode: ContentMode) => void;
  movies: Movie[];
  tvShows: TVShow[];
  users: UserAccount[];
  currentUser: UserAccount | null;
  isAuthenticated: boolean;
  watchlist: string[];
  downloads: DownloadItem[];
  continueWatchingList: ContinueWatchingItem[];
  offlineMode: boolean;
  activeTab: ActiveTab;
  selectedGenre: Genre;
  searchQuery: string;
  selectedMovieForDetails: Movie | null;
  selectedShowForDetails: TVShow | null;
  currentlyPlayingItem: PlayableItem | null;
  selectedVJTrack: VJTrack | null;
  isAdminAuthenticated: boolean;
  toastMessage: string | null;

  // Actions
  setActiveTab: (tab: ActiveTab) => void;
  setSelectedGenre: (genre: Genre) => void;
  setSearchQuery: (query: string) => void;
  toggleWatchlist: (id: string) => void;
  isInWatchlist: (id: string) => boolean;
  startDownload: (item: Movie | { id: string; title: string; genre: string; posterUrl: string; videoUrl: string; fileSizeMb?: number; isEpisode?: boolean; episodeTitle?: string }, quality?: string) => void;
  pauseDownload: (id: string) => void;
  resumeDownload: (id: string) => void;
  deleteDownload: (id: string) => void;
  clearAllDownloads: () => void;
  getDownloadStatus: (id: string) => DownloadItem | undefined;
  
  // Continue Watching Actions
  updateWatchProgress: (params: {
    id: string;
    itemId: string;
    type: 'movie' | 'episode';
    title: string;
    showTitle?: string;
    seasonNumber?: number;
    episodeNumber?: number;
    thumbnailUrl: string;
    backdropUrl?: string;
    videoUrl: string;
    genre?: string;
    durationString?: string;
    currentTime: number;
    duration: number;
    vjTrackName?: string;
    vjTrackId?: string;
  }) => void;
  removeFromContinueWatching: (id: string) => void;
  clearContinueWatching: () => void;
  resumeContinueWatching: (item: ContinueWatchingItem) => void;

  // Playback
  playMovie: (movie: Movie, vjTrackId?: string) => void;
  playTrailer: (movie: Movie) => void;
  playEpisode: (show: TVShow, seasonNumber: number, episode: Episode, vjTrackId?: string) => void;
  closePlayer: () => void;

  // Details
  openMovieDetails: (movie: Movie) => void;
  closeMovieDetails: () => void;
  openShowDetails: (show: TVShow) => void;
  closeShowDetails: () => void;

  // Rating system
  rateMovie: (movieId: string, rating: number) => void;
  getUserRating: (movieId: string) => number | undefined;

  // Auth & User Session Actions (1: Google 1-click, 2: Phone Number, 3: Email & Password, Logout)
  signUpWithGoogle: (customData?: { name?: string; email?: string; avatar?: string }) => void;
  signUpWithPhone: (phoneNumber: string, name: string, momoProvider?: 'MTN Mobile Money' | 'Airtel Money') => void;
  signUpWithEmail: (email: string, password: string, name: string, momoProvider?: 'MTN Mobile Money' | 'Airtel Money') => { success: boolean; error?: string };
  signInWithEmail: (email: string, password: string) => { success: boolean; error?: string };
  continueAsGuest: () => void;
  logoutUser: () => void;
  switchUserAccount: (user: UserAccount) => void;

  // Preferences
  setOfflineMode: (offline: boolean) => void;
  setCurrentUser: (user: UserAccount | null) => void;
  
  // Admin actions
  authenticateAdmin: (pin: string) => boolean;
  logoutAdmin: () => void;
  addMovie: (movie: Omit<Movie, 'id'>) => void;
  updateMovie: (movie: Movie) => void;
  deleteMovie: (movieId: string) => void;
  addTVShow: (show: Omit<TVShow, 'id'>) => void;
  addEpisodeToShow: (params: {
    showTitle: string;
    posterUrl?: string;
    seasonNumber: number;
    episodeNumber: number;
    episodeTitle: string;
    videoUrl: string;
    duration?: string;
    synopsis?: string;
  }) => void;
  updateTVShow: (show: TVShow) => void;
  deleteTVShow: (showId: string) => void;
  addUser: (user: Omit<UserAccount, 'id'>) => void;
  updateUser: (user: UserAccount) => void;
  deleteUser: (userId: string) => void;
  showToast: (msg: string) => void;
}

const MovieContext = createContext<MovieContextType | undefined>(undefined);

const STORAGE_KEYS = {
  CONTENT_MODE: 'moviekart_ug_content_mode',
  MOVIES: 'moviekart_ug_movies',
  TV_SHOWS: 'moviekart_ug_tv_shows',
  USERS: 'moviekart_ug_users',
  WATCHLIST: 'moviekart_ug_watchlist',
  DOWNLOADS: 'moviekart_ug_downloads',
  OFFLINE: 'moviekart_ug_offline_mode',
  ADMIN_AUTH: 'moviekart_ug_admin_auth',
  USER_RATINGS: 'moviekart_ug_user_ratings',
  CONTINUE_WATCHING: 'moviekart_ug_continue_watching',
  CURRENT_USER_ID: 'moviekart_ug_current_user_id',
  USER_PASSWORDS: 'moviekart_ug_user_passwords',
};

const DEFAULT_CONTINUE_WATCHING: ContinueWatchingItem[] = [
  {
    id: 'm3',
    itemId: 'm3',
    type: 'movie',
    title: 'Kampala Speed: Bodaboda Chase',
    thumbnailUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1600&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    genre: 'Action',
    durationString: '1h 38m',
    currentTime: 3740,
    duration: 5880,
    progressPercentage: 64,
    lastWatchedAt: Date.now() - 1000 * 60 * 35,
    vjTrackName: 'VJ Junior',
    vjTrackId: 'vj-jun'
  },
  {
    id: 'tv1_s1_e2',
    itemId: 'tv1_s1_e2',
    type: 'episode',
    title: 'Episode 2: Old Taxi Park Trap',
    showTitle: 'Kampala Hustle: The Series',
    seasonNumber: 1,
    episodeNumber: 2,
    thumbnailUrl: 'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1600&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    genre: 'Ugandan Hits',
    durationString: '42m',
    currentTime: 1080,
    duration: 2520,
    progressPercentage: 43,
    lastWatchedAt: Date.now() - 1000 * 60 * 120,
    vjTrackName: 'VJ Junior',
    vjTrackId: 'vj1'
  },
  {
    id: 'm1',
    itemId: 'm1',
    type: 'movie',
    title: 'Who Killed Captain Alex?',
    thumbnailUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1600&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    genre: 'Ugandan Hits',
    durationString: '1h 24m',
    currentTime: 1420,
    duration: 5040,
    progressPercentage: 28,
    lastWatchedAt: Date.now() - 1000 * 60 * 360,
    vjTrackName: 'VJ Emmie',
    vjTrackId: 'vj1'
  }
];

export const MovieProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [contentMode, setContentMode] = useState<ContentMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CONTENT_MODE);
      return (saved as ContentMode) || 'movies';
    } catch {
      return 'movies';
    }
  });

  const [userRatings, setUserRatings] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER_RATINGS);
      return saved ? JSON.parse(saved) : { m1: 5, m3: 4 };
    } catch {
      return { m1: 5, m3: 4 };
    }
  });

  const [movies, setMovies] = useState<Movie[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MOVIES);
      const list: Movie[] = saved ? JSON.parse(saved) : INITIAL_MOVIES;
      const ratingsSaved = localStorage.getItem(STORAGE_KEYS.USER_RATINGS);
      const ratingsObj: Record<string, number> = ratingsSaved ? JSON.parse(ratingsSaved) : { m1: 5, m3: 4 };
      return list.map((m) => {
        const rating5 = m.rating5 ?? +(m.rating / 2).toFixed(1);
        const ratingsCount = m.ratingsCount ?? (Math.floor(m.rating * 35) + 60);
        return {
          ...m,
          rating5,
          ratingsCount,
          userRating: ratingsObj[m.id]
        };
      });
    } catch {
      return INITIAL_MOVIES.map((m) => ({
        ...m,
        rating5: +(m.rating / 2).toFixed(1),
        ratingsCount: Math.floor(m.rating * 35) + 60,
        userRating: m.id === 'm1' ? 5 : undefined
      }));
    }
  });

  const [tvShows, setTvShows] = useState<TVShow[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TV_SHOWS);
      return saved ? JSON.parse(saved) : INITIAL_TV_SHOWS;
    } catch {
      return INITIAL_TV_SHOWS;
    }
  });

  const [users, setUsers] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USERS);
      return saved ? JSON.parse(saved) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const savedUserId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
      if (!savedUserId) return null;
      const savedProfile = localStorage.getItem(`moviekart_ug_user_${savedUserId}_profile`);
      if (savedProfile) return JSON.parse(savedProfile);
      const savedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
      const userList: UserAccount[] = savedUsers ? JSON.parse(savedUsers) : INITIAL_USERS;
      return userList.find((u) => u.id === savedUserId) || null;
    } catch {
      return null;
    }
  });

  const isAuthenticated = !!currentUser;

  const [watchlist, setWatchlist] = useState<string[]>(() => {
    try {
      const savedUserId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
      if (savedUserId) {
        const userSaved = localStorage.getItem(`moviekart_ug_user_${savedUserId}_watchlist`);
        if (userSaved) return JSON.parse(userSaved);
      }
      const saved = localStorage.getItem(STORAGE_KEYS.WATCHLIST);
      return saved ? JSON.parse(saved) : ['m1', 'tv1', 'm3'];
    } catch {
      return ['m1', 'tv1', 'm3'];
    }
  });

  const [downloads, setDownloads] = useState<DownloadItem[]>(() => {
    try {
      const savedUserId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
      if (savedUserId) {
        const userSaved = localStorage.getItem(`moviekart_ug_user_${savedUserId}_downloads`);
        if (userSaved) return JSON.parse(userSaved);
      }
      const saved = localStorage.getItem(STORAGE_KEYS.DOWNLOADS);
      if (saved) return JSON.parse(saved);
      return [];
    } catch {
      return [];
    }
  });

  const [continueWatchingList, setContinueWatchingList] = useState<ContinueWatchingItem[]>(() => {
    try {
      const savedUserId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
      if (savedUserId) {
        const userSaved = localStorage.getItem(`moviekart_ug_user_${savedUserId}_continue_watching`);
        if (userSaved) return JSON.parse(userSaved);
      }
      const saved = localStorage.getItem(STORAGE_KEYS.CONTINUE_WATCHING);
      return saved ? JSON.parse(saved) : DEFAULT_CONTINUE_WATCHING;
    } catch {
      return DEFAULT_CONTINUE_WATCHING;
    }
  });

  const [offlineMode, setOfflineMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.OFFLINE) === 'true';
    } catch {
      return false;
    }
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [selectedGenre, setSelectedGenre] = useState<Genre>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [selectedMovieForDetails, setSelectedMovieForDetails] = useState<Movie | null>(null);
  const [selectedShowForDetails, setSelectedShowForDetails] = useState<TVShow | null>(null);
  const [currentlyPlayingItem, setCurrentlyPlayingItem] = useState<PlayableItem | null>(null);
  const [selectedVJTrack, setSelectedVJTrack] = useState<VJTrack | null>(null);

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH) === 'true';
    } catch {
      return false;
    }
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  // Sync state to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CONTENT_MODE, contentMode);
    } catch (e) {
      console.warn('Storage error', e);
    }
  }, [contentMode]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MOVIES, JSON.stringify(movies));
    } catch (e) {
      console.warn('Storage error', e);
    }
  }, [movies]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TV_SHOWS, JSON.stringify(tvShows));
    } catch (e) {
      console.warn('Storage error', e);
    }
  }, [tvShows]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    } catch (e) {
      console.warn('Storage error', e);
    }
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.WATCHLIST, JSON.stringify(watchlist));
    } catch (e) {
      console.warn('Storage error', e);
    }
  }, [watchlist]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.DOWNLOADS, JSON.stringify(downloads));
    } catch (e) {
      console.warn('Storage error', e);
    }
  }, [downloads]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.OFFLINE, String(offlineMode));
    } catch (e) {
      console.warn('Storage error', e);
    }
  }, [offlineMode]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, String(isAdminAuthenticated));
    } catch (e) {
      console.warn('Storage error', e);
    }
  }, [isAdminAuthenticated]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CONTINUE_WATCHING, JSON.stringify(continueWatchingList));
    } catch (e) {
      console.warn('Storage error', e);
    }
  }, [continueWatchingList]);

  // Per-user isolated storage synchronization (Prompt Requirement: save user profile, watchlist, downloads, and continue watching for that user)
  useEffect(() => {
    if (currentUser) {
      try {
        localStorage.setItem(`moviekart_ug_user_${currentUser.id}_watchlist`, JSON.stringify(watchlist));
      } catch (e) {
        console.warn('User watchlist storage error', e);
      }
    }
  }, [watchlist, currentUser?.id]);

  useEffect(() => {
    if (currentUser) {
      try {
        localStorage.setItem(`moviekart_ug_user_${currentUser.id}_downloads`, JSON.stringify(downloads));
      } catch (e) {
        console.warn('User downloads storage error', e);
      }
    }
  }, [downloads, currentUser?.id]);

  useEffect(() => {
    if (currentUser) {
      try {
        localStorage.setItem(`moviekart_ug_user_${currentUser.id}_continue_watching`, JSON.stringify(continueWatchingList));
      } catch (e) {
        console.warn('User continue watching storage error', e);
      }
    }
  }, [continueWatchingList, currentUser?.id]);

  useEffect(() => {
    if (currentUser) {
      try {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, currentUser.id);
        localStorage.setItem(`moviekart_ug_user_${currentUser.id}_profile`, JSON.stringify(currentUser));
      } catch (e) {
        console.warn('User session storage error', e);
      }
    } else {
      try {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
      } catch (e) {
        console.warn('User session clear error', e);
      }
    }
  }, [currentUser]);

  // Handle active downloads ticking simulation
  useEffect(() => {
    const hasActiveDownloads = downloads.some((d) => d.status === 'downloading');
    if (!hasActiveDownloads) return;

    const interval = setInterval(() => {
      setDownloads((prev) =>
        prev.map((item) => {
          if (item.status !== 'downloading') return item;
          const increment = Math.floor(Math.random() * 8) + 6;
          const nextProgress = Math.min(100, item.progress + increment);
          const nextSpeed = +(Math.random() * 4 + 3.2).toFixed(1);

          if (nextProgress >= 100) {
            showToast(`"${item.movieTitle}" downloaded for offline viewing!`);
            return {
              ...item,
              progress: 100,
              status: 'completed',
              speedMbps: 0,
              downloadedAt: 'Just now'
            };
          }

          return {
            ...item,
            progress: nextProgress,
            speedMbps: nextSpeed
          };
        })
      );
    }, 600);

    return () => clearInterval(interval);
  }, [downloads]);

  const toggleWatchlist = (id: string) => {
    setWatchlist((prev) => {
      const exists = prev.includes(id);
      if (exists) {
        showToast('Removed from Watchlist');
        return prev.filter((item) => item !== id);
      } else {
        showToast('Added to your Watchlist');
        return [...prev, id];
      }
    });
  };

  const isInWatchlist = (id: string) => watchlist.includes(id);

  const startDownload = (
    item: Movie | { id: string; title: string; genre: string; posterUrl: string; videoUrl: string; fileSizeMb?: number; isEpisode?: boolean; episodeTitle?: string },
    quality: string = '1080p FHD'
  ) => {
    const existing = downloads.find((d) => d.movieId === item.id);
    if (existing && existing.status === 'completed') {
      showToast(`"${item.title}" is already in your offline library.`);
      return;
    }

    if (existing && existing.status === 'downloading') {
      showToast(`"${item.title}" is already downloading.`);
      return;
    }

    const isEp = 'isEpisode' in item && !!item.isEpisode;
    const epTitle = 'episodeTitle' in item ? item.episodeTitle : undefined;

    const newItem: DownloadItem = {
      movieId: item.id,
      movieTitle: item.title,
      genre: item.genre,
      posterUrl: item.posterUrl,
      videoUrl: item.videoUrl,
      quality,
      fileSizeMb: item.fileSizeMb || 260,
      progress: 5,
      status: 'downloading',
      speedMbps: 4.8,
      isEpisode: isEp,
      episodeTitle: epTitle
    };

    setDownloads((prev) => [newItem, ...prev.filter((d) => d.movieId !== item.id)]);
    showToast(`Downloading "${item.title}" (${quality})...`);
  };

  const pauseDownload = (id: string) => {
    setDownloads((prev) =>
      prev.map((d) => (d.movieId === id ? { ...d, status: 'paused', speedMbps: 0 } : d))
    );
  };

  const resumeDownload = (id: string) => {
    setDownloads((prev) =>
      prev.map((d) => (d.movieId === id ? { ...d, status: 'downloading', speedMbps: 4.2 } : d))
    );
  };

  const deleteDownload = (id: string) => {
    setDownloads((prev) => prev.filter((d) => d.movieId !== id));
    showToast('Download removed from device');
  };

  const clearAllDownloads = () => {
    setDownloads([]);
    showToast('All offline downloads cleared');
  };

  const getDownloadStatus = (id: string) => {
    return downloads.find((d) => d.movieId === id);
  };

  // Play a movie
  const playMovie = (movie: Movie, vjTrackId?: string) => {
    if (offlineMode) {
      const isDownloaded = downloads.some((d) => d.movieId === movie.id && d.status === 'completed');
      if (!isDownloaded) {
        showToast(`Offline Mode active: "${movie.title}" is not downloaded yet!`);
        return;
      }
    }

    const track = vjTrackId
      ? movie.vjTracks?.find((t) => t.id === vjTrackId) || movie.vjTracks?.[0]
      : movie.vjTracks?.find((t) => t.isDefault) || movie.vjTracks?.[0] || null;

    setSelectedVJTrack(track || null);
    setCurrentlyPlayingItem({
      id: movie.id,
      movieId: movie.id,
      title: movie.title,
      videoUrl: movie.videoUrl,
      posterUrl: movie.posterUrl,
      backdropUrl: movie.backdropUrl,
      year: movie.year,
      quality: movie.quality,
      vjTracks: movie.vjTracks,
      fileSizeMb: movie.fileSizeMb
    });
  };

  // Play high-energy teaser trailer
  const playTrailer = (movie: Movie) => {
    // Select high-energy teaser trailer URL
    let trailerUrl = movie.trailerUrl;
    if (!trailerUrl) {
      if (movie.genre === 'Comedy') {
        trailerUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4';
      } else if (movie.genre === 'Action' || movie.genre === 'Sci-Fi' || movie.genre === 'Thriller') {
        trailerUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
      } else if (movie.genre === 'Ugandan Hits') {
        trailerUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4';
      } else {
        trailerUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4';
      }
    }

    const defaultTrack = movie.vjTracks?.find((t) => t.isDefault) || movie.vjTracks?.[0] || null;
    setSelectedVJTrack(defaultTrack);
    setCurrentlyPlayingItem({
      id: `${movie.id}_trailer`,
      movieId: movie.id,
      title: `${movie.title} (Official Teaser)`,
      subTitle: 'Official 4K Teaser Trailer',
      videoUrl: trailerUrl,
      posterUrl: movie.posterUrl,
      backdropUrl: movie.backdropUrl,
      year: movie.year,
      quality: '4K Teaser',
      isTrailer: true,
      vjTracks: movie.vjTracks,
      fileSizeMb: 45
    });
    showToast(`Playing "${movie.title}" Official Trailer`);
  };

  // Play an episode of a TV show
  const playEpisode = (show: TVShow, seasonNumber: number, episode: Episode, vjTrackId?: string) => {
    if (offlineMode) {
      const isDownloaded = downloads.some((d) => d.movieId === episode.id && d.status === 'completed');
      if (!isDownloaded) {
        showToast(`Offline Mode active: "${episode.title}" is not downloaded yet!`);
        return;
      }
    }

    const track = vjTrackId
      ? show.vjTracks?.find((t) => t.id === vjTrackId) || show.vjTracks?.[0]
      : show.vjTracks?.find((t) => t.isDefault) || show.vjTracks?.[0] || null;

    setSelectedVJTrack(track || null);
    setCurrentlyPlayingItem({
      id: episode.id,
      showId: show.id,
      title: show.title,
      subTitle: `Season ${seasonNumber}, Ep ${episode.episodeNumber}: ${episode.title}`,
      showTitle: show.title,
      seasonNumber,
      episodeNumber: episode.episodeNumber,
      videoUrl: episode.videoUrl,
      posterUrl: episode.thumbnailUrl || show.posterUrl,
      backdropUrl: show.backdropUrl,
      year: show.year,
      quality: show.quality,
      vjTracks: show.vjTracks,
      fileSizeMb: episode.fileSizeMb
    });
  };

  // Resume an item from Continue Watching row
  const resumeContinueWatching = (item: ContinueWatchingItem) => {
    if (offlineMode) {
      const isDownloaded = downloads.some((d) => d.movieId === item.itemId && d.status === 'completed');
      if (!isDownloaded) {
        showToast(`Offline Mode active: "${item.title}" is not downloaded yet!`);
        return;
      }
    }

    if (item.type === 'movie') {
      const targetMovie = movies.find((m) => m.id === item.itemId);
      const track = item.vjTrackId
        ? targetMovie?.vjTracks?.find((t) => t.id === item.vjTrackId)
        : targetMovie?.vjTracks?.find((t) => t.isDefault) || targetMovie?.vjTracks?.[0];

      setSelectedVJTrack(track || null);
      setCurrentlyPlayingItem({
        id: item.itemId,
        movieId: item.itemId,
        title: item.title,
        videoUrl: item.videoUrl,
        posterUrl: item.thumbnailUrl,
        backdropUrl: item.backdropUrl,
        year: targetMovie?.year,
        quality: targetMovie?.quality || '1080p FHD',
        startTime: item.currentTime,
        vjTracks: targetMovie?.vjTracks
      });
    } else {
      // TV Episode
      const targetShow = tvShows.find(
        (s) =>
          s.title === item.showTitle ||
          s.id === item.itemId ||
          s.seasons?.some((sn) => sn.episodes?.some((ep) => ep.id === item.itemId))
      );
      const track = item.vjTrackId
        ? targetShow?.vjTracks?.find((t) => t.id === item.vjTrackId)
        : targetShow?.vjTracks?.find((t) => t.isDefault) || targetShow?.vjTracks?.[0];

      setSelectedVJTrack(track || null);
      setCurrentlyPlayingItem({
        id: item.itemId,
        showId: targetShow?.id,
        title: item.showTitle || item.title,
        subTitle: item.seasonNumber
          ? `Season ${item.seasonNumber}, Ep ${item.episodeNumber}: ${item.title}`
          : item.title,
        showTitle: item.showTitle,
        seasonNumber: item.seasonNumber,
        episodeNumber: item.episodeNumber,
        videoUrl: item.videoUrl,
        posterUrl: item.thumbnailUrl,
        backdropUrl: item.backdropUrl,
        year: targetShow?.year,
        quality: targetShow?.quality || '1080p FHD',
        startTime: item.currentTime,
        vjTracks: targetShow?.vjTracks
      });
    }

    const mins = Math.floor(item.currentTime / 60);
    const secs = Math.floor(item.currentTime % 60);
    showToast(`Resuming "${item.title}" at ${mins}:${secs < 10 ? '0' : ''}${secs}`);
  };

  // Update watch progress in Continue Watching row
  const updateWatchProgress = (params: {
    id: string;
    itemId: string;
    type: 'movie' | 'episode';
    title: string;
    showTitle?: string;
    seasonNumber?: number;
    episodeNumber?: number;
    thumbnailUrl: string;
    backdropUrl?: string;
    videoUrl: string;
    genre?: string;
    durationString?: string;
    currentTime: number;
    duration: number;
    vjTrackName?: string;
    vjTrackId?: string;
  }) => {
    if (params.currentTime < 5) return;

    const duration = params.duration > 0 ? params.duration : 1;
    const progressPercentage = Math.min(100, Math.round((params.currentTime / duration) * 100));

    // If watched >= 95%, remove from continue watching
    if (progressPercentage >= 95) {
      setContinueWatchingList((prev) => prev.filter((item) => item.id !== params.id));
      return;
    }

    setContinueWatchingList((prev) => {
      const existing = prev.find((item) => item.id === params.id);
      const newItem: ContinueWatchingItem = {
        id: params.id,
        itemId: params.itemId,
        type: params.type,
        title: params.title,
        showTitle: params.showTitle || existing?.showTitle,
        seasonNumber: params.seasonNumber ?? existing?.seasonNumber,
        episodeNumber: params.episodeNumber ?? existing?.episodeNumber,
        thumbnailUrl: params.thumbnailUrl || existing?.thumbnailUrl || '',
        backdropUrl: params.backdropUrl || existing?.backdropUrl,
        videoUrl: params.videoUrl || existing?.videoUrl || '',
        genre: params.genre || existing?.genre || 'Action',
        durationString: params.durationString || existing?.durationString || '45m',
        currentTime: Math.floor(params.currentTime),
        duration: Math.floor(duration),
        progressPercentage,
        lastWatchedAt: Date.now(),
        vjTrackName: params.vjTrackName || existing?.vjTrackName,
        vjTrackId: params.vjTrackId || existing?.vjTrackId
      };

      const remaining = prev.filter((item) => item.id !== params.id);
      return [newItem, ...remaining].slice(0, 15);
    });
  };

  const removeFromContinueWatching = (id: string) => {
    setContinueWatchingList((prev) => prev.filter((item) => item.id !== id));
    showToast('Removed from Continue Watching');
  };

  const clearContinueWatching = () => {
    setContinueWatchingList([]);
    showToast('Continue Watching list cleared');
  };

  const closePlayer = () => {
    setCurrentlyPlayingItem(null);
    setSelectedVJTrack(null);
  };

  const openMovieDetails = (movie: Movie) => {
    setSelectedMovieForDetails(movie);
  };

  const closeMovieDetails = () => {
    setSelectedMovieForDetails(null);
  };

  const openShowDetails = (show: TVShow) => {
    setSelectedShowForDetails(show);
  };

  const closeShowDetails = () => {
    setSelectedShowForDetails(null);
  };

  // 5-Star Rating System
  const rateMovie = (movieId: string, rating: number) => {
    const clampedRating = Math.max(1, Math.min(5, Math.round(rating)));

    setUserRatings((prev) => {
      const updated = { ...prev, [movieId]: clampedRating };
      try {
        localStorage.setItem(STORAGE_KEYS.USER_RATINGS, JSON.stringify(updated));
      } catch (e) {
        console.warn('Rating storage error', e);
      }
      return updated;
    });

    setMovies((prevMovies) =>
      prevMovies.map((m) => {
        if (m.id !== movieId) return m;

        const previousRating = m.userRating ?? userRatings[movieId];
        const currentCount = m.ratingsCount ?? (Math.floor(m.rating * 35) + 60);
        const currentAvg = m.rating5 ?? +(m.rating / 2).toFixed(1);

        let newAvg: number;
        let newCount: number;

        if (previousRating !== undefined) {
          const totalPoints = currentAvg * currentCount - previousRating + clampedRating;
          newCount = currentCount;
          newAvg = +(totalPoints / newCount).toFixed(1);
        } else {
          const totalPoints = currentAvg * currentCount + clampedRating;
          newCount = currentCount + 1;
          newAvg = +(totalPoints / newCount).toFixed(1);
        }

        newAvg = Math.max(1.0, Math.min(5.0, newAvg));

        const updatedMovie: Movie = {
          ...m,
          rating5: newAvg,
          rating: +(newAvg * 2).toFixed(1),
          ratingsCount: newCount,
          userRating: clampedRating
        };

        if (selectedMovieForDetails?.id === movieId) {
          setSelectedMovieForDetails(updatedMovie);
        }

        showToast(`You rated "${m.title}" ${clampedRating} stars! (Average: ★ ${newAvg.toFixed(1)}/5)`);
        return updatedMovie;
      })
    );
  };

  const getUserRating = (movieId: string) => {
    return userRatings[movieId];
  };

  // Admin authentication
  const authenticateAdmin = (pin: string): boolean => {
    if (pin === '1234' || pin === '9988') {
      setIsAdminAuthenticated(true);
      showToast('Admin Access Granted');
      return true;
    }
    showToast('Incorrect Admin PIN! (Default: 1234)');
    return false;
  };

  const logoutAdmin = () => {
    setIsAdminAuthenticated(false);
    showToast('Logged out of Admin');
  };

  // Movie CRUD
  const addMovie = (movieData: Omit<Movie, 'id'>) => {
    const newMovie: Movie = {
      ...movieData,
      id: `m_${Date.now()}`,
      viewsCount: 0,
      vjTracks: movieData.vjTracks && movieData.vjTracks.length > 0 ? movieData.vjTracks : [
        {
          id: 'vj_auto',
          name: 'VJ Junior',
          language: 'Luganda',
          isDefault: true,
          commentaryQuotes: ['Abasajja bano bazze!', 'Action packed!']
        }
      ]
    };
    setMovies((prev) => [newMovie, ...prev]);
    showToast(`Added movie: "${newMovie.title}"`);
  };

  const updateMovie = (updatedMovie: Movie) => {
    setMovies((prev) => prev.map((m) => (m.id === updatedMovie.id ? updatedMovie : m)));
    showToast(`Updated movie: "${updatedMovie.title}"`);
  };

  const deleteMovie = (movieId: string) => {
    setMovies((prev) => prev.filter((m) => m.id !== movieId));
    showToast('Movie deleted from catalog');
  };

  // TV Show CRUD
  const addTVShow = (showData: Omit<TVShow, 'id'>) => {
    const newShow: TVShow = {
      ...showData,
      id: `tv_${Date.now()}`,
      viewsCount: 0,
    };
    setTvShows((prev) => [newShow, ...prev]);
    showToast(`Added TV Show: "${newShow.title}"`);
  };

  // Admin: Add or update TV show episode
  const addEpisodeToShow = (params: {
    showTitle: string;
    posterUrl?: string;
    seasonNumber: number;
    episodeNumber: number;
    episodeTitle: string;
    videoUrl: string;
    duration?: string;
    synopsis?: string;
  }) => {
    const normalizedTitle = params.showTitle.trim();
    const existingShow = tvShows.find(
      (s) => s.title.toLowerCase() === normalizedTitle.toLowerCase()
    );

    const newEp: Episode = {
      id: `ep_${Date.now()}_${params.episodeNumber}`,
      episodeNumber: Number(params.episodeNumber),
      title: params.episodeTitle.trim(),
      duration: params.duration || '42m',
      thumbnailUrl: params.posterUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80',
      videoUrl: params.videoUrl.trim(),
      synopsis: params.synopsis || `Episode ${params.episodeNumber} of ${normalizedTitle}`,
      fileSizeMb: 240
    };

    if (existingShow) {
      // Find or create season
      const seasonNum = Number(params.seasonNumber);
      const updatedSeasons = [...existingShow.seasons];
      const seasonIndex = updatedSeasons.findIndex((s) => s.seasonNumber === seasonNum);

      if (seasonIndex >= 0) {
        // Append or replace episode
        const season = updatedSeasons[seasonIndex];
        const epIndex = season.episodes.findIndex((e) => e.episodeNumber === newEp.episodeNumber);
        if (epIndex >= 0) {
          season.episodes[epIndex] = newEp;
        } else {
          season.episodes.push(newEp);
          season.episodes.sort((a, b) => a.episodeNumber - b.episodeNumber);
        }
      } else {
        // Add new season
        updatedSeasons.push({
          seasonNumber: seasonNum,
          title: `Season ${seasonNum}`,
          episodes: [newEp]
        });
        updatedSeasons.sort((a, b) => a.seasonNumber - b.seasonNumber);
      }

      setTvShows((prev) =>
        prev.map((s) => (s.id === existingShow.id ? { ...s, seasons: updatedSeasons } : s))
      );
      showToast(`Added Season ${params.seasonNumber} Ep ${params.episodeNumber} to "${existingShow.title}"`);
    } else {
      // Create new TV show
      const newShow: TVShow = {
        id: `tv_${Date.now()}`,
        title: normalizedTitle,
        genre: 'Drama',
        year: 2025,
        rating: 8.8,
        ageRating: '16+',
        quality: '1080p FHD',
        posterUrl: params.posterUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80',
        backdropUrl: params.posterUrl || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1600&q=80',
        synopsis: params.synopsis || `The compelling saga of ${normalizedTitle}.`,
        creator: 'MovieKart UG Productions',
        cast: ['Ugandan Ensemble'],
        isTrending: true,
        vjTracks: [
          {
            id: 'vj_jun',
            name: 'VJ Junior',
            language: 'Luganda',
            isDefault: true,
            commentaryQuotes: ['Abaana bano bazze!', 'Series eno ya kabi!']
          }
        ],
        seasons: [
          {
            seasonNumber: Number(params.seasonNumber),
            title: `Season ${params.seasonNumber}`,
            episodes: [newEp]
          }
        ]
      };
      setTvShows((prev) => [newShow, ...prev]);
      showToast(`Created new TV Show: "${newShow.title}" with Episode 1`);
    }
  };

  const updateTVShow = (updatedShow: TVShow) => {
    setTvShows((prev) => prev.map((s) => (s.id === updatedShow.id ? updatedShow : s)));
    showToast(`Updated TV Show: "${updatedShow.title}"`);
  };

  const deleteTVShow = (showId: string) => {
    setTvShows((prev) => prev.filter((s) => s.id !== showId));
    showToast('TV Show deleted from catalog');
  };

  // User CRUD
  const addUser = (userData: Omit<UserAccount, 'id'>) => {
    const newUser: UserAccount = {
      ...userData,
      id: `u_${Date.now()}`
    };
    setUsers((prev) => [newUser, ...prev]);
    showToast(`Created user account for ${newUser.name}`);
  };

  const updateUser = (updatedUser: UserAccount) => {
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    if (currentUser && currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
    showToast(`Updated user: ${updatedUser.name}`);
  };

  const deleteUser = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    showToast('User account deleted');
  };

  // User Session & Authentication Helpers
  const activateUserSession = (user: UserAccount) => {
    setCurrentUser(user);
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, user.id);
      localStorage.setItem(`moviekart_ug_user_${user.id}_profile`, JSON.stringify(user));

      // 1. User's Watchlist
      const userWatchlist = localStorage.getItem(`moviekart_ug_user_${user.id}_watchlist`);
      if (userWatchlist) {
        setWatchlist(JSON.parse(userWatchlist));
      } else {
        const defaultWL = ['m1', 'tv1', 'm3'];
        setWatchlist(defaultWL);
        localStorage.setItem(`moviekart_ug_user_${user.id}_watchlist`, JSON.stringify(defaultWL));
      }

      // 2. User's Downloads
      const userDownloads = localStorage.getItem(`moviekart_ug_user_${user.id}_downloads`);
      if (userDownloads) {
        setDownloads(JSON.parse(userDownloads));
      } else {
        setDownloads([]);
        localStorage.setItem(`moviekart_ug_user_${user.id}_downloads`, JSON.stringify([]));
      }

      // 3. User's Continue Watching
      const userCW = localStorage.getItem(`moviekart_ug_user_${user.id}_continue_watching`);
      if (userCW) {
        setContinueWatchingList(JSON.parse(userCW));
      } else {
        setContinueWatchingList(DEFAULT_CONTINUE_WATCHING);
        localStorage.setItem(`moviekart_ug_user_${user.id}_continue_watching`, JSON.stringify(DEFAULT_CONTINUE_WATCHING));
      }
    } catch (e) {
      console.warn('Error activating user session', e);
    }
  };

  const switchUserAccount = (user: UserAccount) => {
    activateUserSession(user);
    showToast(`Switched account to ${user.name}`);
  };

  const logoutUser = () => {
    if (currentUser) {
      try {
        localStorage.setItem(`moviekart_ug_user_${currentUser.id}_watchlist`, JSON.stringify(watchlist));
        localStorage.setItem(`moviekart_ug_user_${currentUser.id}_downloads`, JSON.stringify(downloads));
        localStorage.setItem(`moviekart_ug_user_${currentUser.id}_continue_watching`, JSON.stringify(continueWatchingList));
        localStorage.setItem(`moviekart_ug_user_${currentUser.id}_profile`, JSON.stringify(currentUser));
      } catch {}
    }

    setCurrentUser(null);
    try {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
    } catch {}
    setActiveTab('home');
    showToast('Signed out of MovieKart UG');
  };

  // Option 1: Sign up with Google (1 click)
  const signUpWithGoogle = (customData?: { name?: string; email?: string; avatar?: string }) => {
    const email = customData?.email || 'quraishmino927@gmail.com';
    const name = customData?.name || 'Quraish Mino';
    const avatar =
      customData?.avatar ||
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80';

    let existingUser = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!existingUser) {
      const newUser: UserAccount = {
        id: `u_google_${Date.now()}`,
        name,
        email,
        phone: '+256 700 892011',
        avatar,
        authProvider: 'google',
        subscription: 'MovieKart VIP',
        status: 'active',
        joinedDate: 'Just now',
        momoProvider: 'MTN Mobile Money',
        storageUsedMb: 0,
        downloadsCount: 0
      };
      setUsers((prev) => [newUser, ...prev]);
      existingUser = newUser;
    }

    activateUserSession(existingUser);
    showToast(`Signed in with Google as ${existingUser.name}`);
  };

  // Option 2: Sign up with Phone Number
  const signUpWithPhone = (
    phoneNumber: string,
    name: string,
    momoProvider: 'MTN Mobile Money' | 'Airtel Money' = 'MTN Mobile Money'
  ) => {
    const cleanDigits = phoneNumber.replace(/\D/g, '');
    const formattedPhone = cleanDigits.startsWith('256') ? `+${cleanDigits}` : `+256 ${cleanDigits}`;
    const displayName = name.trim() || 'Kampala Streamer';

    let existingUser = users.find((u) => u.phone.replace(/\D/g, '') === cleanDigits);
    if (!existingUser) {
      const newUser: UserAccount = {
        id: `u_phone_${Date.now()}`,
        name: displayName,
        email: `${cleanDigits.slice(-6)}@moviekart.ug`,
        phone: formattedPhone,
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
        authProvider: 'phone',
        subscription: 'MovieKart VIP',
        status: 'active',
        joinedDate: 'Just now',
        momoProvider,
        storageUsedMb: 0,
        downloadsCount: 0
      };
      setUsers((prev) => [newUser, ...prev]);
      existingUser = newUser;
    }

    activateUserSession(existingUser);
    showToast(`Signed up with ${momoProvider}! Welcome, ${existingUser.name}`);
  };

  // Option 3: Sign up with Email and Password
  const signUpWithEmail = (
    email: string,
    password: string,
    name: string,
    momoProvider: 'MTN Mobile Money' | 'Airtel Money' = 'MTN Mobile Money'
  ): { success: boolean; error?: string } => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (!password || password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    const existingUser = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existingUser) {
      return { success: false, error: 'An account with this email already exists. Please choose Sign In.' };
    }

    try {
      const savedPw = localStorage.getItem(STORAGE_KEYS.USER_PASSWORDS);
      const pwMap = savedPw ? JSON.parse(savedPw) : {};
      pwMap[cleanEmail] = password;
      localStorage.setItem(STORAGE_KEYS.USER_PASSWORDS, JSON.stringify(pwMap));
    } catch {}

    const displayName = name.trim() || cleanEmail.split('@')[0];
    const newUser: UserAccount = {
      id: `u_email_${Date.now()}`,
      name: displayName,
      email: cleanEmail,
      phone: '+256 772 100200',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      authProvider: 'email',
      subscription: 'MovieKart VIP',
      status: 'active',
      joinedDate: 'Just now',
      momoProvider,
      storageUsedMb: 0,
      downloadsCount: 0
    };

    setUsers((prev) => [newUser, ...prev]);
    activateUserSession(newUser);
    showToast(`Account created for ${newUser.name}!`);
    return { success: true };
  };

  const signInWithEmail = (email: string, password: string): { success: boolean; error?: string } => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, error: 'Please enter your email address.' };
    }
    if (!password) {
      return { success: false, error: 'Please enter your password.' };
    }

    const foundUser = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!foundUser) {
      return { success: false, error: 'No account found with this email. Please create an account first.' };
    }

    activateUserSession(foundUser);
    showToast(`Welcome back, ${foundUser.name}!`);
    return { success: true };
  };

  const continueAsGuest = () => {
    const guestUser = users[0] || INITIAL_USERS[0];
    activateUserSession(guestUser);
    showToast('Browsing MovieKart UG catalog as Guest');
  };

  return (
    <MovieContext.Provider
      value={{
        contentMode,
        setContentMode,
        movies,
        tvShows,
        users,
        currentUser,
        isAuthenticated,
        watchlist,
        downloads,
        continueWatchingList,
        offlineMode,
        activeTab,
        selectedGenre,
        searchQuery,
        selectedMovieForDetails,
        selectedShowForDetails,
        currentlyPlayingItem,
        selectedVJTrack,
        isAdminAuthenticated,
        toastMessage,
        setActiveTab,
        setSelectedGenre,
        setSearchQuery,
        toggleWatchlist,
        isInWatchlist,
        startDownload,
        pauseDownload,
        resumeDownload,
        deleteDownload,
        clearAllDownloads,
        getDownloadStatus,
        updateWatchProgress,
        removeFromContinueWatching,
        clearContinueWatching,
        resumeContinueWatching,
        playMovie,
        playTrailer,
        playEpisode,
        closePlayer,
        openMovieDetails,
        closeMovieDetails,
        openShowDetails,
        closeShowDetails,
        rateMovie,
        getUserRating,
        setOfflineMode,
        setCurrentUser,
        signUpWithGoogle,
        signUpWithPhone,
        signUpWithEmail,
        signInWithEmail,
        continueAsGuest,
        logoutUser,
        switchUserAccount,
        authenticateAdmin,
        logoutAdmin,
        addMovie,
        updateMovie,
        deleteMovie,
        addTVShow,
        addEpisodeToShow,
        updateTVShow,
        deleteTVShow,
        addUser,
        updateUser,
        deleteUser,
        showToast,
      }}
    >
      {children}
    </MovieContext.Provider>
  );
};

export const useMovieContext = () => {
  const context = useContext(MovieContext);
  if (!context) {
    throw new Error('useMovieContext must be used within a MovieProvider');
  }
  return context;
};
