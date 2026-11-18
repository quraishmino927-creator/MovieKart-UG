import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  setDoc,
  doc,
  serverTimestamp,
  Timestamp,
  increment
} from 'firebase/firestore';
import { DEFAULT_LIVE_CHANNELS } from '../lib/liveChannels';
import {
  User,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import {
  db,
  auth,
  adminDb,
  adminAuth,
  OperationType,
  buildFirestoreErrorInfo,
  testFirestoreConnection
} from '../lib/firebase';
import {
  Movie,
  TVShow,
  Episode,
  Genre,
  DownloadItem,
  UserAccount,
  ActiveTab,
  VJTrack,
  ContentMode,
  PlayableItem,
  ContinueWatchingItem,
  WatchHistoryItem,
  LiveTVChannel
} from '../types';

interface MovieContextType {
  contentMode: ContentMode;
  setContentMode: (mode: ContentMode) => void;
  movies: Movie[];
  moviesLoading: boolean;
  firestoreError: string | null;
  tvShows: TVShow[];
  tvShowsLoading: boolean;
  liveChannels: LiveTVChannel[];
  activeLiveChannel: LiveTVChannel | null;
  users: UserAccount[];
  currentUser: UserAccount | null;
  isAuthenticated: boolean;
  watchlist: string[];
  downloads: DownloadItem[];
  continueWatchingList: ContinueWatchingItem[];
  watchHistory: WatchHistoryItem[];
  offlineMode: boolean;
  activeTab: ActiveTab;
  selectedGenre: Genre;
  searchQuery: string;
  selectedMovieForDetails: Movie | null;
  selectedShowForDetails: TVShow | null;
  currentlyPlayingItem: PlayableItem | null;
  selectedVJTrack: VJTrack | null;
  adminUser: User | null;
  adminAuthLoading: boolean;
  isAdminAuthenticated: boolean;
  toastMessage: string | null;

  // Actions
  setActiveTab: (tab: ActiveTab) => void;
  setSelectedGenre: (genre: Genre) => void;
  setSearchQuery: (query: string) => void;
  toggleWatchlist: (id: string) => void;
  isInWatchlist: (id: string) => boolean;
  startDownload: (
    item:
      | Movie
      | {
          id: string;
          title: string;
          genre: string;
          posterUrl: string;
          videoUrl: string;
          fileSizeMb?: number;
          isEpisode?: boolean;
          episodeTitle?: string;
        },
    quality?: string
  ) => void;
  pauseDownload: (id: string) => void;
  resumeDownload: (id: string) => void;
  deleteDownload: (id: string) => void;
  clearAllDownloads: () => void;
  getDownloadStatus: (id: string) => DownloadItem | undefined;

  // Continue Watching & Watch History Actions
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
  removeFromWatchHistory: (itemId: string) => void;
  clearWatchHistory: () => void;

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
  rateMovie: (movieId: string, rating: number) => Promise<void>;
  getUserRating: (movieId: string) => number | undefined;

  // Viewer Session & Profile Actions
  signUpWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signUpWithPhone: (
    phoneNumber: string,
    name: string,
    momoProvider?: 'MTN Mobile Money' | 'Airtel Money'
  ) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (
    email: string,
    password: string,
    name: string,
    momoProvider?: 'MTN Mobile Money' | 'Airtel Money'
  ) => Promise<{ success: boolean; error?: string }>;
  signInWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  updateUserProfile: (updates: {
    name: string;
    username: string;
    avatar: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logoutUser: () => Promise<void>;
  switchUserAccount: (user: UserAccount) => void;

  // Preferences
  setOfflineMode: (offline: boolean) => void;
  setCurrentUser: (user: UserAccount | null) => void;

  // Firebase Admin Auth & Firestore CRUD Actions
  loginAdminWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logoutAdmin: () => Promise<void>;
  addMovie: (movie: Omit<Movie, 'id'>) => Promise<void>;
  updateMovie: (movie: Movie) => Promise<void>;
  deleteMovie: (movieId: string) => Promise<void>;
  addEpisodeToShow: (params: {
    showTitle: string;
    posterUrl?: string;
    seasonNumber: number;
    episodeNumber: number;
    episodeTitle: string;
    videoUrl: string;
    duration?: string;
    synopsis?: string;
  }) => Promise<void>;
  deleteTVShow: (showId: string) => Promise<void>;
  openLiveChannel: (channel: LiveTVChannel) => void;
  closeLiveChannel: () => void;
  addLiveChannel: (channel: {
    name: string;
    logoUrl: string;
    youtubeLiveUrl: string;
    description?: string;
    watchingNow?: number;
    isLive?: boolean;
  }) => Promise<void>;
  updateLiveChannel: (channel: LiveTVChannel) => Promise<void>;
  deleteLiveChannel: (channelId: string) => Promise<void>;
  addUser: (user: Omit<UserAccount, 'id'>) => void;
  updateUser: (user: UserAccount) => void;
  deleteUser: (userId: string) => void;
  showToast: (msg: string) => void;
}

const MovieContext = createContext<MovieContextType | undefined>(undefined);

const STORAGE_KEYS = {
  CONTENT_MODE: 'moviekart_ug_content_mode',
  USERS: 'moviekart_ug_users',
  WATCHLIST: 'moviekart_ug_watchlist',
  DOWNLOADS: 'moviekart_ug_downloads',
  OFFLINE: 'moviekart_ug_offline_mode',
  USER_RATINGS: 'moviekart_ug_user_ratings',
  CONTINUE_WATCHING: 'moviekart_ug_continue_watching',
  WATCH_HISTORY: 'moviekart_ug_watch_history',
  CURRENT_USER_ID: 'moviekart_ug_current_user_id',
  USER_PASSWORDS: 'moviekart_ug_user_passwords',
  LIVE_CHANNELS: 'moviekart_ug_live_channels',
};

function parseTimestampMs(val: unknown): number {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  if (val instanceof Timestamp) return val.toMillis();
  if (typeof val === 'object' && val !== null && 'seconds' in val) {
    return Number((val as { seconds: number }).seconds) * 1000;
  }
  if (typeof val === 'string') {
    const parsed = Date.parse(val);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

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
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Live Firestore State (NO fake/demo initial data)
  const [movies, setMovies] = useState<Movie[]>([]);
  const [moviesLoading, setMoviesLoading] = useState<boolean>(true);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  const [tvShows, setTvShows] = useState<TVShow[]>([]);
  const [tvShowsLoading, setTvShowsLoading] = useState<boolean>(true);

  const [liveChannels, setLiveChannels] = useState<LiveTVChannel[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LIVE_CHANNELS);
      if (saved) {
        const parsed = JSON.parse(saved) as LiveTVChannel[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((ch) => {
            const def = DEFAULT_LIVE_CHANNELS.find((d) => d.id === ch.id);
            if (def && ch.youtubeLiveUrl?.includes('embed/live_stream?channel=')) {
              return { ...ch, youtubeLiveUrl: def.youtubeLiveUrl };
            }
            return ch;
          });
        }
      }
    } catch {}
    return DEFAULT_LIVE_CHANNELS;
  });
  const [activeLiveChannelId, setActiveLiveChannelId] = useState<string | null>(null);
  const activeLiveChannel = liveChannels.find((c) => c.id === activeLiveChannelId) || null;

  const [users, setUsers] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USERS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const savedUserId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
      if (!savedUserId) return null;
      const savedProfile = localStorage.getItem(`moviekart_ug_user_${savedUserId}_profile`);
      if (savedProfile) return JSON.parse(savedProfile);
      const savedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
      const userList: UserAccount[] = savedUsers ? JSON.parse(savedUsers) : [];
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
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
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
      return saved ? JSON.parse(saved) : [];
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
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>(() => {
    try {
      const savedUserId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
      if (savedUserId) {
        const userSaved = localStorage.getItem(`moviekart_ug_user_${savedUserId}_watch_history`);
        if (userSaved) return JSON.parse(userSaved);
      }
      const saved = localStorage.getItem(STORAGE_KEYS.WATCH_HISTORY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [offlineMode, setOfflineMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.OFFLINE) === 'true';
    } catch {
      return false;
    }
  });

  const isAdminPath = () => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname.replace(/\/+$/, '').toLowerCase();
    const hash = window.location.hash.replace(/\/+$/, '').toLowerCase();
    return path.endsWith('/admin') || hash === '#/admin';
  };

  const [activeTab, setActiveTabState] = useState<ActiveTab>(() =>
    isAdminPath() ? 'admin' : 'home'
  );

  const setActiveTab = (tab: ActiveTab) => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      if (tab === 'admin' && !isAdminPath()) {
        window.history.pushState({}, '', '/admin');
      } else if (tab !== 'admin' && isAdminPath()) {
        window.history.pushState({}, '', '/');
      }
    }
  };

  useEffect(() => {
    const syncRoute = () => {
      setActiveTabState(isAdminPath() ? 'admin' : 'home');
    };
    window.addEventListener('popstate', syncRoute);
    window.addEventListener('hashchange', syncRoute);
    return () => {
      window.removeEventListener('popstate', syncRoute);
      window.removeEventListener('hashchange', syncRoute);
    };
  }, []);

  const [selectedGenre, setSelectedGenre] = useState<Genre>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [selectedMovieForDetails, setSelectedMovieForDetails] = useState<Movie | null>(null);
  const [selectedShowForDetails, setSelectedShowForDetails] = useState<TVShow | null>(null);
  const [currentlyPlayingItem, setCurrentlyPlayingItem] = useState<PlayableItem | null>(null);
  const [selectedVJTrack, setSelectedVJTrack] = useState<VJTrack | null>(null);

  // Firebase Admin Auth state
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [adminAuthLoading, setAdminAuthLoading] = useState<boolean>(true);
  const isAdminAuthenticated = !!adminUser;

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  // 1. Validate Firestore connection & listen to isolated Firebase Admin Auth + Viewer Auth state
  useEffect(() => {
    testFirestoreConnection();

    const unsubscribeAdminAuth = onAuthStateChanged(adminAuth, (user) => {
      setAdminUser(user);
      setAdminAuthLoading(false);
    });

    const unsubscribeViewerAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) return;
      await hydrateViewerFromFirebase(fbUser);
    });

    return () => {
      unsubscribeAdminAuth();
      unsubscribeViewerAuth();
    };
  }, []);

  // Also refresh local session (e.g. phone sign-in) from Firestore on initial load
  useEffect(() => {
    const savedId = currentUser?.id;
    if (!savedId) return;
    getDoc(doc(db, 'users', savedId))
      .then((snap) => {
        if (!snap.exists()) return;
        const data = snap.data() as Record<string, unknown>;
        setCurrentUser((prev) => {
          if (!prev || prev.id !== savedId) return prev;
          const merged: UserAccount = {
            ...prev,
            name: typeof data.name === 'string' && data.name ? data.name : prev.name,
            username: typeof data.username === 'string' ? data.username : prev.username,
            avatar: typeof data.avatar === 'string' && data.avatar ? data.avatar : prev.avatar,
            joinedDate:
              typeof data.joinedDate === 'string' && data.joinedDate ? data.joinedDate : prev.joinedDate,
            moviesWatchedCount:
              typeof data.moviesWatchedCount === 'number'
                ? data.moviesWatchedCount
                : prev.moviesWatchedCount,
          };
          try {
            localStorage.setItem(`moviekart_ug_user_${savedId}_profile`, JSON.stringify(merged));
          } catch {}
          return merged;
        });
        if (Array.isArray(data.watchlist)) {
          setWatchlist(data.watchlist as string[]);
        }
        if (Array.isArray(data.watchHistory)) {
          setWatchHistory(data.watchHistory as WatchHistoryItem[]);
        }
      })
      .catch(() => {});
  }, []);

  // 2. Real-time Firestore listener for "movies" collection
  useEffect(() => {
    const moviesRef = collection(db, 'movies');
    const unsubscribe = onSnapshot(
      moviesRef,
      (snapshot) => {
        const loadedMovies: Movie[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as Record<string, unknown>;
          const rawRating = Number(data.rating) || 8.0;
          const rating5 =
            typeof data.rating5 === 'number'
              ? data.rating5
              : +Math.min(5, Math.max(1, rawRating / 2)).toFixed(1);
          const descriptionText =
            (typeof data.description === 'string' && data.description) ||
            (typeof data.synopsis === 'string' && data.synopsis) ||
            '';
          const posterUrl =
            (typeof data.posterUrl === 'string' && data.posterUrl) ||
            (typeof data.poster === 'string' && data.poster) ||
            '';
          const videoUrl =
            (typeof data.videoUrl === 'string' && data.videoUrl) ||
            (typeof data.videoURL === 'string' && data.videoURL) ||
            (typeof data.video_url === 'string' && data.video_url) ||
            (typeof data.url === 'string' && data.url) ||
            '';

          return {
            id: docSnap.id,
            title: typeof data.title === 'string' ? data.title : 'Untitled Movie',
            genre: (typeof data.genre === 'string' ? data.genre : 'Action') as Genre,
            year: Number(data.year) || new Date().getFullYear(),
            duration: typeof data.duration === 'string' ? data.duration : '1h 45m',
            rating: rawRating,
            rating5,
            ratingsCount: typeof data.ratingsCount === 'number' ? data.ratingsCount : 0,
            userRating: userRatings[docSnap.id],
            ageRating: (typeof data.ageRating === 'string' ? data.ageRating : '16+') as Movie['ageRating'],
            quality: (typeof data.quality === 'string' ? data.quality : '1080p FHD') as Movie['quality'],
            posterUrl,
            backdropUrl:
              (typeof data.backdropUrl === 'string' && data.backdropUrl) || posterUrl,
            description: descriptionText,
            synopsis: descriptionText,
            director: typeof data.director === 'string' ? data.director : '',
            cast: Array.isArray(data.cast) ? (data.cast as string[]) : [],
            videoUrl: videoUrl.trim(),
            trailerUrl: typeof data.trailerUrl === 'string' ? data.trailerUrl : undefined,
            fileSizeMb: typeof data.fileSizeMb === 'number' ? data.fileSizeMb : 450,
            isTrending: Boolean(data.isTrending),
            isFeatured: Boolean(data.isFeatured),
            isUgandanExclusive: Boolean(data.isUgandanExclusive),
            vjTracks: Array.isArray(data.vjTracks) ? (data.vjTracks as VJTrack[]) : [],
            viewsCount: typeof data.viewsCount === 'number' ? data.viewsCount : 0,
            createdAt: parseTimestampMs(data.createdAt),
          };
        });

        loadedMovies.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setMovies(loadedMovies);
        setMoviesLoading(false);
        setFirestoreError(null);
      },
      (error) => {
        const info = buildFirestoreErrorInfo(error, OperationType.LIST, 'movies');
        console.error('Firestore Movies Error:', JSON.stringify(info));
        setFirestoreError(
          error instanceof Error
            ? error.message
            : 'Unable to load movies from Firestore. Check Firestore rules.'
        );
        setMovies([]);
        setMoviesLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userRatings]);

  // 3. Real-time Firestore listener for "tvshows" collection
  useEffect(() => {
    const showsRef = collection(db, 'tvshows');
    const unsubscribe = onSnapshot(
      showsRef,
      (snapshot) => {
        const loadedShows: TVShow[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as Record<string, unknown>;
          return {
            id: docSnap.id,
            title: typeof data.title === 'string' ? data.title : 'Untitled Series',
            genre: (typeof data.genre === 'string' ? data.genre : 'Drama') as Genre,
            year: Number(data.year) || new Date().getFullYear(),
            rating: Number(data.rating) || 8.5,
            ageRating: (typeof data.ageRating === 'string' ? data.ageRating : '16+') as TVShow['ageRating'],
            quality: (typeof data.quality === 'string' ? data.quality : '1080p FHD') as TVShow['quality'],
            posterUrl: typeof data.posterUrl === 'string' ? data.posterUrl : '',
            backdropUrl:
              (typeof data.backdropUrl === 'string' && data.backdropUrl) ||
              (typeof data.posterUrl === 'string' ? data.posterUrl : ''),
            synopsis: typeof data.synopsis === 'string' ? data.synopsis : '',
            creator: typeof data.creator === 'string' ? data.creator : 'MovieKart UG',
            cast: Array.isArray(data.cast) ? (data.cast as string[]) : [],
            isTrending: Boolean(data.isTrending),
            isFeatured: Boolean(data.isFeatured),
            isUgandanExclusive: Boolean(data.isUgandanExclusive),
            vjTracks: Array.isArray(data.vjTracks) ? (data.vjTracks as VJTrack[]) : [],
            seasons: Array.isArray(data.seasons) ? (data.seasons as TVShow['seasons']) : [],
            viewsCount: typeof data.viewsCount === 'number' ? data.viewsCount : 0,
          };
        });
        setTvShows(loadedShows);
        setTvShowsLoading(false);
      },
      (error) => {
        const info = buildFirestoreErrorInfo(error, OperationType.LIST, 'tvshows');
        console.warn('Firestore TV Shows listener:', JSON.stringify(info));
        setTvShows([]);
        setTvShowsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // 4. Real-time Firestore listener for "livetv" collection merged with Ugandan defaults
  useEffect(() => {
    const liveRef = collection(db, 'livetv');
    const unsubscribe = onSnapshot(
      liveRef,
      (snapshot) => {
        const defaultMap = new Map<string, LiveTVChannel>();
        DEFAULT_LIVE_CHANNELS.forEach((ch) => defaultMap.set(ch.id, ch));

        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data() as Record<string, unknown>;
          const fallback = defaultMap.get(docSnap.id);
          const merged: LiveTVChannel = {
            id: docSnap.id,
            name: typeof data.name === 'string' && data.name ? data.name : fallback?.name || 'Live Channel',
            logoUrl: typeof data.logoUrl === 'string' && data.logoUrl ? data.logoUrl : fallback?.logoUrl || '',
            youtubeLiveUrl:
              typeof data.youtubeLiveUrl === 'string' &&
              data.youtubeLiveUrl &&
              !(fallback && data.youtubeLiveUrl.includes('embed/live_stream?channel='))
                ? data.youtubeLiveUrl
                : fallback?.youtubeLiveUrl || '',
            description:
              typeof data.description === 'string'
                ? data.description
                : fallback?.description || '',
            watchingNow:
              typeof data.watchingNow === 'number' && !Number.isNaN(data.watchingNow)
                ? data.watchingNow
                : fallback?.watchingNow || 100,
            isLive: typeof data.isLive === 'boolean' ? data.isLive : true,
            isDeleted: Boolean(data.isDeleted),
            order: typeof data.order === 'number' ? data.order : fallback?.order || 99,
            createdAt: parseTimestampMs(data.createdAt) || fallback?.createdAt || 0,
            updatedAt: parseTimestampMs(data.updatedAt) || 0,
          };
          defaultMap.set(docSnap.id, merged);
        });

        const mergedList = Array.from(defaultMap.values())
          .filter((ch) => !ch.isDeleted)
          .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));

        setLiveChannels(mergedList);
        try {
          localStorage.setItem(STORAGE_KEYS.LIVE_CHANNELS, JSON.stringify(mergedList));
        } catch {}
      },
      () => {
        // Fallback smoothly to cached/default Ugandan channels
      }
    );

    return () => unsubscribe();
  }, []);

  // Keep selectedMovieForDetails synced if live Firestore data updates
  useEffect(() => {
    if (selectedMovieForDetails) {
      const latest = movies.find((m) => m.id === selectedMovieForDetails.id);
      if (latest) {
        setSelectedMovieForDetails(latest);
      }
    }
  }, [movies, selectedMovieForDetails?.id]);

  // Sync local preferences
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CONTENT_MODE, contentMode);
    } catch {}
  }, [contentMode]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    } catch {}
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.WATCHLIST, JSON.stringify(watchlist));
    } catch {}
  }, [watchlist]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.DOWNLOADS, JSON.stringify(downloads));
    } catch {}
  }, [downloads]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.OFFLINE, String(offlineMode));
    } catch {}
  }, [offlineMode]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CONTINUE_WATCHING, JSON.stringify(continueWatchingList));
    } catch {}
  }, [continueWatchingList]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.WATCH_HISTORY, JSON.stringify(watchHistory));
    } catch {}
  }, [watchHistory]);

  // Per-user isolated storage + Firestore synchronization
  useEffect(() => {
    if (currentUser) {
      try {
        localStorage.setItem(`moviekart_ug_user_${currentUser.id}_watchlist`, JSON.stringify(watchlist));
      } catch {}
      setDoc(
        doc(db, 'users', currentUser.id),
        { watchlist, updatedAt: serverTimestamp() },
        { merge: true }
      ).catch(() => {});
    }
  }, [watchlist, currentUser?.id]);

  useEffect(() => {
    if (currentUser) {
      try {
        localStorage.setItem(`moviekart_ug_user_${currentUser.id}_downloads`, JSON.stringify(downloads));
      } catch {}
    }
  }, [downloads, currentUser?.id]);

  useEffect(() => {
    if (currentUser) {
      try {
        localStorage.setItem(
          `moviekart_ug_user_${currentUser.id}_continue_watching`,
          JSON.stringify(continueWatchingList)
        );
      } catch {}
    }
  }, [continueWatchingList, currentUser?.id]);

  useEffect(() => {
    if (currentUser) {
      try {
        localStorage.setItem(
          `moviekart_ug_user_${currentUser.id}_watch_history`,
          JSON.stringify(watchHistory)
        );
      } catch {}
      setDoc(
        doc(db, 'users', currentUser.id),
        {
          watchHistory: watchHistory.slice(0, 50),
          moviesWatchedCount: watchHistory.length,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      ).catch(() => {});
    }
  }, [watchHistory, currentUser?.id]);

  useEffect(() => {
    if (currentUser) {
      try {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, currentUser.id);
        localStorage.setItem(`moviekart_ug_user_${currentUser.id}_profile`, JSON.stringify(currentUser));
      } catch {}
    } else {
      try {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
      } catch {}
    }
  }, [currentUser]);

  // Handle active offline downloads progression
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
    item:
      | Movie
      | {
          id: string;
          title: string;
          genre: string;
          posterUrl: string;
          videoUrl: string;
          fileSizeMb?: number;
          isEpisode?: boolean;
          episodeTitle?: string;
        },
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

  const recordWatchHistory = (entry: Omit<WatchHistoryItem, 'watchedAt'>) => {
    const newEntry: WatchHistoryItem = {
      ...entry,
      watchedAt: Date.now(),
    };
    setWatchHistory((prev) => {
      const filtered = prev.filter((h) => h.itemId !== entry.itemId);
      const next = [newEntry, ...filtered].slice(0, 50);
      if (currentUser) {
        setCurrentUser((u) =>
          u ? { ...u, moviesWatchedCount: next.length } : u
        );
      }
      return next;
    });
  };

  const removeFromWatchHistory = (itemId: string) => {
    setWatchHistory((prev) => {
      const next = prev.filter((h) => h.itemId !== itemId);
      if (currentUser) {
        setCurrentUser((u) =>
          u ? { ...u, moviesWatchedCount: next.length } : u
        );
      }
      return next;
    });
    showToast('Removed from Watch History');
  };

  const clearWatchHistory = () => {
    setWatchHistory([]);
    if (currentUser) {
      setCurrentUser((u) => (u ? { ...u, moviesWatchedCount: 0 } : u));
    }
    showToast('Watch History cleared');
  };

  const playMovie = (movie: Movie, vjTrackId?: string) => {
    if (offlineMode) {
      const isDownloaded = downloads.some((d) => d.movieId === movie.id && d.status === 'completed');
      if (!isDownloaded) {
        showToast(`Offline Mode active: "${movie.title}" is not downloaded yet!`);
        return;
      }
    }

    recordWatchHistory({
      id: movie.id,
      itemId: movie.id,
      type: 'movie',
      title: movie.title,
      posterUrl: movie.posterUrl,
      videoUrl: movie.videoUrl,
      genre: movie.genre,
      duration: movie.duration,
      year: movie.year,
    });

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

  const playTrailer = (movie: Movie) => {
    const trailerUrl = movie.trailerUrl || movie.videoUrl;
    const defaultTrack = movie.vjTracks?.find((t) => t.isDefault) || movie.vjTracks?.[0] || null;
    setSelectedVJTrack(defaultTrack);
    setCurrentlyPlayingItem({
      id: `${movie.id}_trailer`,
      movieId: movie.id,
      title: `${movie.title} (Official Teaser)`,
      subTitle: 'Official Teaser Preview',
      videoUrl: trailerUrl,
      posterUrl: movie.posterUrl,
      backdropUrl: movie.backdropUrl,
      year: movie.year,
      quality: movie.quality || 'HD Teaser',
      isTrailer: true,
      vjTracks: movie.vjTracks,
      fileSizeMb: 45
    });
    showToast(`Playing "${movie.title}" Trailer`);
  };

  const playEpisode = (show: TVShow, seasonNumber: number, episode: Episode, vjTrackId?: string) => {
    if (offlineMode) {
      const isDownloaded = downloads.some((d) => d.movieId === episode.id && d.status === 'completed');
      if (!isDownloaded) {
        showToast(`Offline Mode active: "${episode.title}" is not downloaded yet!`);
        return;
      }
    }

    recordWatchHistory({
      id: episode.id,
      itemId: episode.id,
      type: 'episode',
      title: episode.title,
      showTitle: show.title,
      seasonNumber,
      episodeNumber: episode.episodeNumber,
      posterUrl: episode.thumbnailUrl || show.posterUrl,
      videoUrl: episode.videoUrl,
      genre: show.genre,
      duration: episode.duration,
      year: show.year,
    });

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

  const resumeContinueWatching = (item: ContinueWatchingItem) => {
    if (offlineMode) {
      const isDownloaded = downloads.some((d) => d.movieId === item.itemId && d.status === 'completed');
      if (!isDownloaded) {
        showToast(`Offline Mode active: "${item.title}" is not downloaded yet!`);
        return;
      }
    }

    recordWatchHistory({
      id: item.itemId,
      itemId: item.itemId,
      type: item.type,
      title: item.title,
      showTitle: item.showTitle,
      seasonNumber: item.seasonNumber,
      episodeNumber: item.episodeNumber,
      posterUrl: item.thumbnailUrl,
      videoUrl: item.videoUrl,
      genre: item.genre,
      duration: item.durationString,
    });

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
        videoUrl: targetMovie?.videoUrl || item.videoUrl,
        posterUrl: targetMovie?.posterUrl || item.thumbnailUrl,
        backdropUrl: targetMovie?.backdropUrl || item.backdropUrl,
        year: targetMovie?.year,
        quality: targetMovie?.quality || '1080p FHD',
        startTime: item.currentTime,
        vjTracks: targetMovie?.vjTracks
      });
    } else {
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

  // 5-Star Rating System (synced with Firestore when permitted)
  const rateMovie = async (movieId: string, rating: number) => {
    const clampedRating = Math.max(1, Math.min(5, Math.round(rating)));

    setUserRatings((prev) => {
      const updated = { ...prev, [movieId]: clampedRating };
      try {
        localStorage.setItem(STORAGE_KEYS.USER_RATINGS, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    const targetMovie = movies.find((m) => m.id === movieId);
    if (!targetMovie) return;

    const previousRating = targetMovie.userRating ?? userRatings[movieId];
    const currentCount = targetMovie.ratingsCount ?? 0;
    const currentAvg = targetMovie.rating5 ?? +(targetMovie.rating / 2).toFixed(1);

    let newAvg: number;
    let newCount: number;

    if (previousRating !== undefined && currentCount > 0) {
      const totalPoints = currentAvg * currentCount - previousRating + clampedRating;
      newCount = currentCount;
      newAvg = +(totalPoints / newCount).toFixed(1);
    } else {
      const totalPoints = currentAvg * currentCount + clampedRating;
      newCount = currentCount + 1;
      newAvg = +(totalPoints / newCount).toFixed(1);
    }

    newAvg = Math.max(1.0, Math.min(5.0, newAvg));
    const newRating10 = +(newAvg * 2).toFixed(1);

    const updatedMovie: Movie = {
      ...targetMovie,
      rating5: newAvg,
      rating: newRating10,
      ratingsCount: newCount,
      userRating: clampedRating
    };

    setMovies((prev) => prev.map((m) => (m.id === movieId ? updatedMovie : m)));
    if (selectedMovieForDetails?.id === movieId) {
      setSelectedMovieForDetails(updatedMovie);
    }
    showToast(`You rated "${targetMovie.title}" ${clampedRating} stars! (Average: ★ ${newAvg.toFixed(1)}/5)`);

    try {
      await updateDoc(doc(db, 'movies', movieId), {
        rating: newRating10,
        rating5: newAvg,
        ratingsCount: newCount,
      });
    } catch (error) {
      const info = buildFirestoreErrorInfo(error, OperationType.UPDATE, `movies/${movieId}`);
      console.warn('Rating Firestore sync skipped or denied:', JSON.stringify(info));
    }
  };

  const getUserRating = (movieId: string) => {
    return userRatings[movieId];
  };

  // Firebase Admin Authentication (Isolated adminAuth instance)
  const loginAdminWithEmail = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await signInWithEmailAndPassword(adminAuth, email.trim(), password);
      showToast('Admin signed in with Firebase Auth');
      return { success: true };
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code || '';
      let message = 'Failed to sign in. Check your admin email and password.';
      if (
        code === 'auth/invalid-credential' ||
        code === 'auth/wrong-password' ||
        code === 'auth/user-not-found'
      ) {
        message = 'Invalid admin email or password.';
      } else if (code === 'auth/too-many-requests') {
        message = 'Too many failed attempts. Please wait a moment and try again.';
      } else if (code === 'auth/invalid-email') {
        message = 'Please enter a valid email address.';
      } else if (error instanceof Error && error.message) {
        message = error.message;
      }
      return { success: false, error: message };
    }
  };

  const logoutAdmin = async () => {
    try {
      await signOut(adminAuth);
      showToast('Signed out of Admin');
    } catch (error) {
      console.error('Admin sign out error:', error);
    }
  };

  // Firestore Movie CRUD (Admin only, via adminDb/adminAuth)
  const addMovie = async (movieData: Omit<Movie, 'id'>) => {
    if (!adminAuth.currentUser) {
      showToast('Admin sign-in required to add movies.');
      throw new Error('Admin authentication required');
    }

    const descriptionText = (movieData.description || movieData.synopsis || '').trim();
    const numericRating = Number(movieData.rating) || 8.0;
    const rating5 = +(Math.min(5, Math.max(1, numericRating / 2))).toFixed(1);
    const vjTracks =
      movieData.vjTracks && movieData.vjTracks.length > 0
        ? movieData.vjTracks
        : [
            {
              id: `vj_${Date.now()}`,
              name: 'VJ Junior',
              language: 'Luganda',
              isDefault: true,
              commentaryQuotes: ['MovieKart UG Premiere!']
            }
          ];

    const payload = {
      title: movieData.title.trim(),
      description: descriptionText,
      synopsis: descriptionText,
      genre: movieData.genre || 'Action',
      posterUrl: movieData.posterUrl.trim(),
      backdropUrl: (movieData.backdropUrl || movieData.posterUrl).trim(),
      videoUrl: movieData.videoUrl.trim(),
      year: Number(movieData.year) || new Date().getFullYear(),
      rating: numericRating,
      rating5,
      ratingsCount: 0,
      duration: movieData.duration || '1h 45m',
      ageRating: movieData.ageRating || '16+',
      quality: movieData.quality || '1080p FHD',
      director: movieData.director || '',
      cast: movieData.cast || [],
      fileSizeMb: Number(movieData.fileSizeMb) || 450,
      isTrending: Boolean(movieData.isTrending),
      isFeatured: Boolean(movieData.isFeatured),
      isUgandanExclusive: Boolean(movieData.isUgandanExclusive),
      vjTracks,
      viewsCount: 0,
      createdAt: serverTimestamp(),
      createdBy: adminAuth.currentUser.uid,
    };

    try {
      await addDoc(collection(adminDb, 'movies'), payload);
      showToast(`Published "${payload.title}" live to MovieKart UG!`);
    } catch (error) {
      const info = buildFirestoreErrorInfo(error, OperationType.CREATE, 'movies');
      console.error('Firestore Add Movie Error:', JSON.stringify(info));
      showToast('Failed to save movie to Firestore. Check permissions.');
      throw error;
    }
  };

  const updateMovie = async (updatedMovie: Movie) => {
    if (!adminAuth.currentUser) {
      showToast('Admin sign-in required to update movies.');
      throw new Error('Admin authentication required');
    }

    const descriptionText = (updatedMovie.description || updatedMovie.synopsis || '').trim();
    const numericRating = Number(updatedMovie.rating) || 8.0;

    try {
      await updateDoc(doc(adminDb, 'movies', updatedMovie.id), {
        title: updatedMovie.title.trim(),
        description: descriptionText,
        synopsis: descriptionText,
        genre: updatedMovie.genre,
        posterUrl: updatedMovie.posterUrl.trim(),
        backdropUrl: (updatedMovie.backdropUrl || updatedMovie.posterUrl).trim(),
        videoUrl: updatedMovie.videoUrl.trim(),
        year: Number(updatedMovie.year),
        rating: numericRating,
        rating5: +(Math.min(5, Math.max(1, numericRating / 2))).toFixed(1),
        duration: updatedMovie.duration,
        ageRating: updatedMovie.ageRating,
        quality: updatedMovie.quality,
        director: updatedMovie.director,
        cast: updatedMovie.cast,
        fileSizeMb: Number(updatedMovie.fileSizeMb) || 450,
        isTrending: Boolean(updatedMovie.isTrending),
        isFeatured: Boolean(updatedMovie.isFeatured),
        isUgandanExclusive: Boolean(updatedMovie.isUgandanExclusive),
        vjTracks: updatedMovie.vjTracks || [],
      });
      showToast(`Updated "${updatedMovie.title}"`);
    } catch (error) {
      const info = buildFirestoreErrorInfo(error, OperationType.UPDATE, `movies/${updatedMovie.id}`);
      console.error('Firestore Update Movie Error:', JSON.stringify(info));
      showToast('Failed to update movie in Firestore.');
      throw error;
    }
  };

  const deleteMovie = async (movieId: string) => {
    if (!adminAuth.currentUser) {
      showToast('Admin sign-in required to delete movies.');
      return;
    }

    try {
      await deleteDoc(doc(adminDb, 'movies', movieId));
      showToast('Movie deleted from Firestore');
    } catch (error) {
      const info = buildFirestoreErrorInfo(error, OperationType.DELETE, `movies/${movieId}`);
      console.error('Firestore Delete Movie Error:', JSON.stringify(info));
      showToast('Failed to delete movie from Firestore.');
    }
  };

  // Firestore TV Show CRUD (Admin only)
  const addEpisodeToShow = async (params: {
    showTitle: string;
    posterUrl?: string;
    seasonNumber: number;
    episodeNumber: number;
    episodeTitle: string;
    videoUrl: string;
    duration?: string;
    synopsis?: string;
  }) => {
    if (!adminAuth.currentUser) {
      showToast('Admin sign-in required to add TV episodes.');
      throw new Error('Admin authentication required');
    }

    const normalizedTitle = params.showTitle.trim();
    const existingShow = tvShows.find(
      (s) => s.title.toLowerCase() === normalizedTitle.toLowerCase()
    );

    const newEp: Episode = {
      id: `ep_${Date.now()}_${params.episodeNumber}`,
      episodeNumber: Number(params.episodeNumber),
      title: params.episodeTitle.trim(),
      duration: params.duration || '42m',
      thumbnailUrl: params.posterUrl || '',
      videoUrl: params.videoUrl.trim(),
      synopsis: params.synopsis || `Episode ${params.episodeNumber} of ${normalizedTitle}`,
      fileSizeMb: 240
    };

    try {
      if (existingShow) {
        const seasonNum = Number(params.seasonNumber);
        const updatedSeasons = existingShow.seasons.map((s) => ({
          ...s,
          episodes: [...s.episodes]
        }));
        const seasonIndex = updatedSeasons.findIndex((s) => s.seasonNumber === seasonNum);

        if (seasonIndex >= 0) {
          const season = updatedSeasons[seasonIndex];
          const epIndex = season.episodes.findIndex((e) => e.episodeNumber === newEp.episodeNumber);
          if (epIndex >= 0) {
            season.episodes[epIndex] = newEp;
          } else {
            season.episodes.push(newEp);
            season.episodes.sort((a, b) => a.episodeNumber - b.episodeNumber);
          }
        } else {
          updatedSeasons.push({
            seasonNumber: seasonNum,
            title: `Season ${seasonNum}`,
            episodes: [newEp]
          });
          updatedSeasons.sort((a, b) => a.seasonNumber - b.seasonNumber);
        }

        await updateDoc(doc(adminDb, 'tvshows', existingShow.id), {
          seasons: updatedSeasons
        });
        showToast(`Added Season ${params.seasonNumber} Ep ${params.episodeNumber} to "${existingShow.title}"`);
      } else {
        const newShowPayload = {
          title: normalizedTitle,
          genre: 'Drama',
          year: new Date().getFullYear(),
          rating: 8.8,
          ageRating: '16+',
          quality: '1080p FHD',
          posterUrl: params.posterUrl || '',
          backdropUrl: params.posterUrl || '',
          synopsis: params.synopsis || `Series: ${normalizedTitle}`,
          creator: 'MovieKart UG',
          cast: [],
          isTrending: true,
          isFeatured: true,
          vjTracks: [
            {
              id: 'vj_jun',
              name: 'VJ Junior',
              language: 'Luganda',
              isDefault: true,
              commentaryQuotes: ['MovieKart UG Series!']
            }
          ],
          seasons: [
            {
              seasonNumber: Number(params.seasonNumber),
              title: `Season ${params.seasonNumber}`,
              episodes: [newEp]
            }
          ],
          createdAt: serverTimestamp(),
          createdBy: adminAuth.currentUser.uid,
        };
        await addDoc(collection(adminDb, 'tvshows'), newShowPayload);
        showToast(`Created TV Show "${normalizedTitle}" in Firestore`);
      }
    } catch (error) {
      const info = buildFirestoreErrorInfo(error, OperationType.WRITE, 'tvshows');
      console.error('Firestore TV Show Error:', JSON.stringify(info));
      showToast('Failed to save TV show to Firestore.');
      throw error;
    }
  };

  const deleteTVShow = async (showId: string) => {
    if (!adminAuth.currentUser) {
      showToast('Admin sign-in required.');
      return;
    }
    try {
      await deleteDoc(doc(adminDb, 'tvshows', showId));
      showToast('TV Show deleted from Firestore');
    } catch (error) {
      const info = buildFirestoreErrorInfo(error, OperationType.DELETE, `tvshows/${showId}`);
      console.error('Firestore Delete TV Show Error:', JSON.stringify(info));
      showToast('Failed to delete TV show.');
    }
  };

  // Live TV Playback & Watching Now Counter
  const openLiveChannel = (channel: LiveTVChannel) => {
    setActiveLiveChannelId(channel.id);
    setLiveChannels((prev) => {
      const next = prev.map((c) =>
        c.id === channel.id ? { ...c, watchingNow: (c.watchingNow || 0) + 1 } : c
      );
      try {
        localStorage.setItem(STORAGE_KEYS.LIVE_CHANNELS, JSON.stringify(next));
      } catch {}
      return next;
    });

    // Sync watchingNow increment to Firestore if allowed
    setDoc(
      doc(db, 'livetv', channel.id),
      {
        name: channel.name,
        logoUrl: channel.logoUrl,
        youtubeLiveUrl: channel.youtubeLiveUrl,
        description: channel.description || '',
        isLive: channel.isLive !== false,
        order: channel.order ?? 99,
        watchingNow: increment(1),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    ).catch(() => {});
  };

  const closeLiveChannel = () => {
    const closingId = activeLiveChannelId;
    setActiveLiveChannelId(null);
    if (closingId) {
      setLiveChannels((prev) =>
        prev.map((c) =>
          c.id === closingId ? { ...c, watchingNow: Math.max(1, (c.watchingNow || 1) - 1) } : c
        )
      );
    }
  };

  // Admin CRUD: Add, Update, Delete Live TV Channels
  const addLiveChannel = async (channelData: {
    name: string;
    logoUrl: string;
    youtubeLiveUrl: string;
    description?: string;
    watchingNow?: number;
    isLive?: boolean;
  }) => {
    if (!adminAuth.currentUser) {
      showToast('Admin sign-in required to add Live TV channels.');
      throw new Error('Admin authentication required');
    }

    const id = `live_${Date.now()}`;
    const newChannel: LiveTVChannel = {
      id,
      name: channelData.name.trim(),
      logoUrl: channelData.logoUrl.trim(),
      youtubeLiveUrl: channelData.youtubeLiveUrl.trim(),
      description: (channelData.description || '').trim() || `Watch ${channelData.name.trim()} live on MovieKart UG.`,
      watchingNow: Math.max(0, Number(channelData.watchingNow) || 120),
      isLive: channelData.isLive !== false,
      order: liveChannels.length + 1,
      createdAt: Date.now(),
    };

    try {
      await setDoc(doc(adminDb, 'livetv', id), {
        ...newChannel,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: adminAuth.currentUser.uid,
      });
      setLiveChannels((prev) => {
        const next = [...prev.filter((c) => c.id !== id), newChannel];
        try {
          localStorage.setItem(STORAGE_KEYS.LIVE_CHANNELS, JSON.stringify(next));
        } catch {}
        return next;
      });
      showToast(`Added "${newChannel.name}" to Live TV!`);
    } catch (error) {
      const info = buildFirestoreErrorInfo(error, OperationType.CREATE, `livetv/${id}`);
      console.error('Firestore Add Live TV Error:', JSON.stringify(info));
      // Still update local cache & inform admin
      setLiveChannels((prev) => {
        const next = [...prev, newChannel];
        try {
          localStorage.setItem(STORAGE_KEYS.LIVE_CHANNELS, JSON.stringify(next));
        } catch {}
        return next;
      });
      showToast(`Saved "${newChannel.name}" locally (check Firestore livetv rules for cloud sync).`);
    }
  };

  const updateLiveChannel = async (channel: LiveTVChannel) => {
    if (!adminAuth.currentUser) {
      showToast('Admin sign-in required to update Live TV channels.');
      throw new Error('Admin authentication required');
    }

    const updated: LiveTVChannel = {
      ...channel,
      name: channel.name.trim(),
      logoUrl: channel.logoUrl.trim(),
      youtubeLiveUrl: channel.youtubeLiveUrl.trim(),
      description: (channel.description || '').trim(),
      watchingNow: Math.max(0, Number(channel.watchingNow) || 0),
      isLive: channel.isLive !== false,
      updatedAt: Date.now(),
    };

    try {
      await setDoc(
        doc(adminDb, 'livetv', channel.id),
        {
          name: updated.name,
          logoUrl: updated.logoUrl,
          youtubeLiveUrl: updated.youtubeLiveUrl,
          description: updated.description,
          watchingNow: updated.watchingNow,
          isLive: updated.isLive,
          order: updated.order ?? 99,
          isDeleted: false,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      setLiveChannels((prev) => {
        const next = prev.map((c) => (c.id === updated.id ? updated : c));
        try {
          localStorage.setItem(STORAGE_KEYS.LIVE_CHANNELS, JSON.stringify(next));
        } catch {}
        return next;
      });
      showToast(`Updated Live TV channel "${updated.name}"`);
    } catch (error) {
      const info = buildFirestoreErrorInfo(error, OperationType.UPDATE, `livetv/${channel.id}`);
      console.error('Firestore Update Live TV Error:', JSON.stringify(info));
      setLiveChannels((prev) => {
        const next = prev.map((c) => (c.id === updated.id ? updated : c));
        try {
          localStorage.setItem(STORAGE_KEYS.LIVE_CHANNELS, JSON.stringify(next));
        } catch {}
        return next;
      });
      showToast(`Updated "${updated.name}" locally.`);
    }
  };

  const deleteLiveChannel = async (channelId: string) => {
    if (!adminAuth.currentUser) {
      showToast('Admin sign-in required to delete Live TV channels.');
      return;
    }

    const isDefault = DEFAULT_LIVE_CHANNELS.some((d) => d.id === channelId);
    try {
      if (isDefault) {
        await setDoc(
          doc(adminDb, 'livetv', channelId),
          { isDeleted: true, updatedAt: serverTimestamp() },
          { merge: true }
        );
      } else {
        await deleteDoc(doc(adminDb, 'livetv', channelId));
      }
    } catch (error) {
      console.warn('Firestore Delete Live TV error:', error);
    }

    setLiveChannels((prev) => {
      const next = prev.filter((c) => c.id !== channelId);
      try {
        localStorage.setItem(STORAGE_KEYS.LIVE_CHANNELS, JSON.stringify(next));
      } catch {}
      return next;
    });
    if (activeLiveChannelId === channelId) {
      setActiveLiveChannelId(null);
    }
    showToast('Live TV channel removed');
  };

  // User account local management
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

  // Helper: format join date nicely
  const formatJoinDate = (rawDate?: string) => {
    if (rawDate && rawDate !== 'Just now') return rawDate;
    return new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Helper: derive default handle from name/email
  const deriveUsername = (name: string, email: string) => {
    const base = (name || email.split('@')[0] || 'viewer')
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
    return base || 'moviefan';
  };

  // Hydrate Viewer Session from Firebase Auth user + Firestore users/{uid} + localStorage
  async function hydrateViewerFromFirebase(fbUser: User, explicitName?: string) {
    let localProfile: Partial<UserAccount> = {};
    try {
      const savedLocal = localStorage.getItem(`moviekart_ug_user_${fbUser.uid}_profile`);
      if (savedLocal) localProfile = JSON.parse(savedLocal);
    } catch {}

    let remoteData: Record<string, unknown> | null = null;
    try {
      const snap = await getDoc(doc(db, 'users', fbUser.uid));
      if (snap.exists()) {
        remoteData = snap.data() as Record<string, unknown>;
      }
    } catch {}

    const baseName =
      (typeof remoteData?.name === 'string' && remoteData.name) ||
      localProfile.name ||
      explicitName ||
      fbUser.displayName ||
      fbUser.email?.split('@')[0] ||
      'MovieKart Viewer';

    const baseEmail = fbUser.email || localProfile.email || '';
    const baseUsername =
      (typeof remoteData?.username === 'string' && remoteData.username) ||
      localProfile.username ||
      deriveUsername(baseName, baseEmail);

    const baseAvatar =
      (typeof remoteData?.avatar === 'string' && remoteData.avatar) ||
      localProfile.avatar ||
      fbUser.photoURL ||
      '/pwa-192x192.png';

    const joinedDate =
      (typeof remoteData?.joinedDate === 'string' && remoteData.joinedDate !== 'Just now' && remoteData.joinedDate) ||
      (localProfile.joinedDate && localProfile.joinedDate !== 'Just now' ? localProfile.joinedDate : '') ||
      (fbUser.metadata?.creationTime
        ? new Date(fbUser.metadata.creationTime).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })
        : formatJoinDate());

    const remoteWatchlist = Array.isArray(remoteData?.watchlist)
      ? (remoteData!.watchlist as string[])
      : undefined;
    const remoteHistory = Array.isArray(remoteData?.watchHistory)
      ? (remoteData!.watchHistory as WatchHistoryItem[])
      : undefined;

    const hydratedUser: UserAccount = {
      id: fbUser.uid,
      name: baseName,
      username: baseUsername,
      email: baseEmail,
      phone:
        (typeof remoteData?.phone === 'string' && remoteData.phone) ||
        localProfile.phone ||
        fbUser.phoneNumber ||
        '',
      avatar: baseAvatar,
      authProvider:
        fbUser.providerData?.some((p) => p.providerId === 'google.com')
          ? 'google'
          : 'email',
      subscription: localProfile.subscription || 'MovieKart VIP',
      status: 'active',
      joinedDate,
      momoProvider: localProfile.momoProvider || 'MTN Mobile Money',
      storageUsedMb: localProfile.storageUsedMb || 0,
      downloadsCount: localProfile.downloadsCount || 0,
      moviesWatchedCount:
        remoteHistory?.length ??
        (typeof remoteData?.moviesWatchedCount === 'number'
          ? remoteData.moviesWatchedCount
          : localProfile.moviesWatchedCount || 0),
    };

    setUsers((prev) => {
      const others = prev.filter((u) => u.id !== hydratedUser.id);
      return [hydratedUser, ...others];
    });
    setCurrentUser(hydratedUser);

    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, hydratedUser.id);
      localStorage.setItem(`moviekart_ug_user_${hydratedUser.id}_profile`, JSON.stringify(hydratedUser));

      if (remoteWatchlist) {
        setWatchlist(remoteWatchlist);
      } else {
        const localWL = localStorage.getItem(`moviekart_ug_user_${hydratedUser.id}_watchlist`);
        if (localWL) setWatchlist(JSON.parse(localWL));
      }

      if (remoteHistory) {
        setWatchHistory(remoteHistory);
      } else {
        const localWH = localStorage.getItem(`moviekart_ug_user_${hydratedUser.id}_watch_history`);
        if (localWH) setWatchHistory(JSON.parse(localWH));
      }

      const localDL = localStorage.getItem(`moviekart_ug_user_${hydratedUser.id}_downloads`);
      if (localDL) setDownloads(JSON.parse(localDL));

      const localCW = localStorage.getItem(`moviekart_ug_user_${hydratedUser.id}_continue_watching`);
      if (localCW) setContinueWatchingList(JSON.parse(localCW));
    } catch {}

    // Ensure initial user profile record exists in Firestore
    if (!remoteData) {
      setDoc(
        doc(db, 'users', hydratedUser.id),
        {
          id: hydratedUser.id,
          name: hydratedUser.name,
          username: hydratedUser.username,
          email: hydratedUser.email,
          phone: hydratedUser.phone,
          avatar: hydratedUser.avatar,
          authProvider: hydratedUser.authProvider,
          joinedDate: hydratedUser.joinedDate,
          moviesWatchedCount: hydratedUser.moviesWatchedCount || 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      ).catch(() => {});
    }

    return hydratedUser;
  }

  // Viewer Session & Authentication Helpers (NO fake defaults)
  const activateUserSession = (user: UserAccount) => {
    setCurrentUser(user);
    setUsers((prev) => [user, ...prev.filter((u) => u.id !== user.id)]);
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, user.id);
      localStorage.setItem(`moviekart_ug_user_${user.id}_profile`, JSON.stringify(user));

      const userWatchlist = localStorage.getItem(`moviekart_ug_user_${user.id}_watchlist`);
      setWatchlist(userWatchlist ? JSON.parse(userWatchlist) : []);

      const userDownloads = localStorage.getItem(`moviekart_ug_user_${user.id}_downloads`);
      setDownloads(userDownloads ? JSON.parse(userDownloads) : []);

      const userCW = localStorage.getItem(`moviekart_ug_user_${user.id}_continue_watching`);
      setContinueWatchingList(userCW ? JSON.parse(userCW) : []);

      const userWH = localStorage.getItem(`moviekart_ug_user_${user.id}_watch_history`);
      setWatchHistory(userWH ? JSON.parse(userWH) : []);
    } catch (e) {
      console.warn('Error activating user session', e);
    }
  };

  const switchUserAccount = (user: UserAccount) => {
    activateUserSession(user);
    setActiveTab('profile');
    showToast(`Switched account to ${user.name}`);
  };

  const logoutUser = async () => {
    if (currentUser) {
      try {
        localStorage.setItem(`moviekart_ug_user_${currentUser.id}_watchlist`, JSON.stringify(watchlist));
        localStorage.setItem(`moviekart_ug_user_${currentUser.id}_downloads`, JSON.stringify(downloads));
        localStorage.setItem(
          `moviekart_ug_user_${currentUser.id}_continue_watching`,
          JSON.stringify(continueWatchingList)
        );
        localStorage.setItem(
          `moviekart_ug_user_${currentUser.id}_watch_history`,
          JSON.stringify(watchHistory)
        );
        localStorage.setItem(`moviekart_ug_user_${currentUser.id}_profile`, JSON.stringify(currentUser));
      } catch {}
    }

    try {
      if (auth.currentUser) {
        await signOut(auth);
      }
    } catch (err) {
      console.warn('Viewer signOut warning:', err);
    }

    setCurrentUser(null);
    setWatchlist([]);
    setWatchHistory([]);
    setDownloads([]);
    setContinueWatchingList([]);
    try {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
    } catch {}
    setActiveTab('profile');
    showToast('Logged out of MovieKart UG');
  };

  // Real Profile Editor: Saves Name, Username, and Profile Photo to localStorage + Firebase
  const updateUserProfile = async (updates: {
    name: string;
    username: string;
    avatar: string;
  }): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) {
      return { success: false, error: 'Please log in first to edit your profile.' };
    }

    const cleanName = updates.name.trim();
    if (!cleanName) {
      return { success: false, error: 'Name cannot be empty.' };
    }

    const cleanUsername = updates.username
      .trim()
      .replace(/^@+/, '')
      .replace(/\s+/g, '_')
      .toLowerCase();

    const finalAvatar = updates.avatar.trim() || currentUser.avatar || '/pwa-192x192.png';

    const updatedUser: UserAccount = {
      ...currentUser,
      name: cleanName,
      username: cleanUsername || deriveUsername(cleanName, currentUser.email),
      avatar: finalAvatar,
    };

    // 1. Update local state & localStorage immediately
    setCurrentUser(updatedUser);
    setUsers((prev) => [updatedUser, ...prev.filter((u) => u.id !== updatedUser.id)]);
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, updatedUser.id);
      localStorage.setItem(`moviekart_ug_user_${updatedUser.id}_profile`, JSON.stringify(updatedUser));
    } catch (err) {
      console.warn('Failed to write profile to localStorage:', err);
    }

    // 2. Sync Firebase Auth profile if authenticated via Firebase Auth
    try {
      if (auth.currentUser && auth.currentUser.uid === updatedUser.id) {
        const photoUpdate = finalAvatar.startsWith('http') ? finalAvatar : undefined;
        await updateProfile(auth.currentUser, {
          displayName: updatedUser.name,
          ...(photoUpdate ? { photoURL: photoUpdate } : {}),
        });
      }
    } catch (err) {
      console.warn('Firebase Auth updateProfile skipped:', err);
    }

    // 3. Persist to Firestore users/{userId}
    try {
      await setDoc(
        doc(db, 'users', updatedUser.id),
        {
          id: updatedUser.id,
          name: updatedUser.name,
          username: updatedUser.username,
          email: updatedUser.email,
          phone: updatedUser.phone,
          avatar: updatedUser.avatar,
          joinedDate: updatedUser.joinedDate,
          moviesWatchedCount: watchHistory.length,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      showToast('Profile saved to MovieKart UG & Firebase!');
      return { success: true };
    } catch (error) {
      console.warn('Firestore profile sync warning (saved locally):', error);
      showToast('Profile saved locally! (Enable Firestore users rules to sync cloud)');
      return { success: true };
    }
  };

  // Real Google Sign-In via Firebase GoogleAuthProvider
  const signUpWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const user = await hydrateViewerFromFirebase(result.user);
      setActiveTab('profile');
      showToast(`Welcome, ${user.name}!`);
      return { success: true };
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code || '';
      let message = 'Google Sign-In failed. Please try Email & Password.';
      if (code === 'auth/popup-closed-by-user') {
        message = 'Google sign-in popup was closed before completing.';
      } else if (code === 'auth/popup-blocked') {
        message = 'Popup blocked by browser. Allow popups or use Email & Password.';
      } else if (code === 'auth/operation-not-allowed') {
        message = 'Google Sign-In is not enabled in Firebase Auth Console yet. Please use Email & Password.';
      } else if (code === 'auth/unauthorized-domain') {
        message = 'This domain is not authorized in Firebase Auth settings yet. Use Email & Password or authorize the domain.';
      } else if (error instanceof Error && error.message) {
        message = error.message;
      }
      return { success: false, error: message };
    }
  };

  // Phone Sign-Up / Sign-In backed by Firestore + localStorage
  const signUpWithPhone = async (
    phoneNumber: string,
    name: string,
    momoProvider: 'MTN Mobile Money' | 'Airtel Money' = 'MTN Mobile Money'
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanDigits = phoneNumber.replace(/\D/g, '');
    if (cleanDigits.length < 8) {
      return { success: false, error: 'Please enter a valid Ugandan phone number.' };
    }
    const formattedPhone = cleanDigits.startsWith('256') ? `+${cleanDigits}` : `+256 ${cleanDigits}`;
    const displayName = name.trim() || 'MovieKart Streamer';
    const docId = `phone_${cleanDigits}`;

    let existingUser = users.find((u) => u.id === docId || u.phone.replace(/\D/g, '') === cleanDigits);

    if (!existingUser) {
      try {
        const snap = await getDoc(doc(db, 'users', docId));
        if (snap.exists()) {
          const data = snap.data() as Record<string, unknown>;
          existingUser = {
            id: docId,
            name: typeof data.name === 'string' ? data.name : displayName,
            username:
              typeof data.username === 'string'
                ? data.username
                : deriveUsername(displayName, ''),
            email: typeof data.email === 'string' ? data.email : `${cleanDigits.slice(-6)}@moviekart.ug`,
            phone: formattedPhone,
            avatar: typeof data.avatar === 'string' ? data.avatar : '/pwa-192x192.png',
            authProvider: 'phone',
            subscription: 'MovieKart VIP',
            status: 'active',
            joinedDate:
              typeof data.joinedDate === 'string' ? data.joinedDate : formatJoinDate(),
            momoProvider,
            storageUsedMb: 0,
            downloadsCount: 0,
            moviesWatchedCount:
              typeof data.moviesWatchedCount === 'number' ? data.moviesWatchedCount : 0,
          };
          if (Array.isArray(data.watchlist)) {
            localStorage.setItem(`moviekart_ug_user_${docId}_watchlist`, JSON.stringify(data.watchlist));
          }
          if (Array.isArray(data.watchHistory)) {
            localStorage.setItem(`moviekart_ug_user_${docId}_watch_history`, JSON.stringify(data.watchHistory));
          }
        }
      } catch {}
    }

    if (!existingUser) {
      existingUser = {
        id: docId,
        name: displayName,
        username: deriveUsername(displayName, ''),
        email: `${cleanDigits.slice(-6)}@moviekart.ug`,
        phone: formattedPhone,
        avatar: '/pwa-192x192.png',
        authProvider: 'phone',
        subscription: 'MovieKart VIP',
        status: 'active',
        joinedDate: formatJoinDate(),
        momoProvider,
        storageUsedMb: 0,
        downloadsCount: 0,
        moviesWatchedCount: 0,
      };
      setDoc(
        doc(db, 'users', docId),
        {
          ...existingUser,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      ).catch(() => {});
    }

    activateUserSession(existingUser);
    setActiveTab('profile');
    showToast(`Signed in with ${momoProvider}! Welcome, ${existingUser.name}`);
    return { success: true };
  };

  // Real Email & Password Sign-Up with Firebase Auth + Firestore
  const signUpWithEmail = async (
    email: string,
    password: string,
    name: string,
    momoProvider: 'MTN Mobile Money' | 'Airtel Money' = 'MTN Mobile Money'
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (!password || password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    const displayName = name.trim() || cleanEmail.split('@')[0];

    try {
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      await updateProfile(cred.user, { displayName });
      const user = await hydrateViewerFromFirebase(cred.user, displayName);
      const updatedWithMomo = { ...user, momoProvider };
      setCurrentUser(updatedWithMomo);
      localStorage.setItem(`moviekart_ug_user_${user.id}_profile`, JSON.stringify(updatedWithMomo));
      setDoc(doc(db, 'users', user.id), { momoProvider }, { merge: true }).catch(() => {});
      setActiveTab('profile');
      showToast(`Account created for ${user.name}!`);
      return { success: true };
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code || '';
      if (code === 'auth/email-already-in-use') {
        return { success: false, error: 'An account with this email already exists. Please switch to Sign In.' };
      }
      if (code === 'auth/weak-password') {
        return { success: false, error: 'Password must be at least 6 characters.' };
      }
      if (code === 'auth/invalid-email') {
        return { success: false, error: 'Please enter a valid email address.' };
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unable to create account.',
      };
    }
  };

  // Real Email & Password Sign-In with Firebase Auth + Firestore restore
  const signInWithEmail = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, error: 'Please enter your email address.' };
    }
    if (!password) {
      return { success: false, error: 'Please enter your password.' };
    }

    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const user = await hydrateViewerFromFirebase(cred.user);
      setActiveTab('profile');
      showToast(`Welcome back, ${user.name}!`);
      return { success: true };
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code || '';
      if (
        code === 'auth/invalid-credential' ||
        code === 'auth/wrong-password' ||
        code === 'auth/user-not-found'
      ) {
        return { success: false, error: 'Invalid email or password.' };
      }
      if (code === 'auth/too-many-requests') {
        return { success: false, error: 'Too many failed login attempts. Try again shortly.' };
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sign in.',
      };
    }
  };

  return (
    <MovieContext.Provider
      value={{
        contentMode,
        setContentMode,
        movies,
        moviesLoading,
        firestoreError,
        tvShows,
        tvShowsLoading,
        liveChannels,
        activeLiveChannel,
        users,
        currentUser,
        isAuthenticated,
        watchlist,
        downloads,
        continueWatchingList,
        watchHistory,
        offlineMode,
        activeTab,
        selectedGenre,
        searchQuery,
        selectedMovieForDetails,
        selectedShowForDetails,
        currentlyPlayingItem,
        selectedVJTrack,
        adminUser,
        adminAuthLoading,
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
        removeFromWatchHistory,
        clearWatchHistory,
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
        updateUserProfile,
        logoutUser,
        switchUserAccount,
        loginAdminWithEmail,
        logoutAdmin,
        addMovie,
        updateMovie,
        deleteMovie,
        addEpisodeToShow,
        deleteTVShow,
        openLiveChannel,
        closeLiveChannel,
        addLiveChannel,
        updateLiveChannel,
        deleteLiveChannel,
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
