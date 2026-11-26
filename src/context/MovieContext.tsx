import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  setDoc,
  doc,
  serverTimestamp,
  Timestamp,
  increment
} from 'firebase/firestore';
import { DEFAULT_LIVE_CHANNELS } from '../lib/liveChannels';
import {
  RealDeviceStorageInfo,
  getRealDeviceStorageInfo,
  getAllOfflineVideoMeta,
  saveOfflineVideoBlob,
  deleteOfflineVideoBlob,
  clearAllOfflineVideoBlobs,
  downloadVideoWithProgress,
  requestPersistentStorage,
  formatMegabytes
} from '../lib/offlineDownloads';
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
  inviteAuth,
  OperationType,
  buildFirestoreErrorInfo,
  testFirestoreConnection
} from '../lib/firebase';
import {
  createInitialTrialDates,
  getUserTrialInfo,
  TrialInfo,
  MS_PER_DAY,
  TRIAL_DURATION_DAYS
} from '../lib/trial';
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
  LiveTVChannel,
  VJFilter,
  TeamMember,
  TeamRole,
  TrialStatus
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
  currentUserTrialInfo: TrialInfo | null;
  hasSignedUpBefore: boolean;
  isAuthenticated: boolean;
  watchlist: string[];
  downloads: DownloadItem[];
  deviceStorage: RealDeviceStorageInfo | null;
  continueWatchingList: ContinueWatchingItem[];
  watchHistory: WatchHistoryItem[];
  offlineMode: boolean;
  activeTab: ActiveTab;
  selectedGenre: Genre;
  selectedVJ: VJFilter;
  searchQuery: string;
  selectedMovieForDetails: Movie | null;
  selectedShowForDetails: TVShow | null;
  currentlyPlayingItem: PlayableItem | null;
  selectedVJTrack: VJTrack | null;
  adminUser: User | null;
  adminRole: TeamRole | null;
  staffEmail: string | null;
  adminAuthLoading: boolean;
  isAdminAuthenticated: boolean;
  teamMembers: TeamMember[];
  toastMessage: string | null;

  // Actions
  setActiveTab: (tab: ActiveTab) => void;
  setSelectedGenre: (genre: Genre) => void;
  setSelectedVJ: (vj: VJFilter) => void;
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
  refreshDeviceStorage: () => Promise<void>;
  playOfflineDownload: (item: DownloadItem) => void;

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
  playTrailer: (item: Movie | TVShow) => void;
  playEpisode: (show: TVShow, seasonNumber: number, episode: Episode, vjTrackId?: string) => void;
  closePlayer: () => void;

  // Details
  openMovieDetails: (movie: Movie) => void;
  closeMovieDetails: () => void;
  openShowDetails: (show: TVShow) => void;
  closeShowDetails: () => void;

  // Rating system
  rateMovie: (movieId: string, rating: number) => Promise<void>;
  rateTVShow: (showId: string, rating: number) => Promise<void>;
  getUserRating: (mediaId: string) => number | undefined;

  // Viewer Session & Profile Actions
  signUpWithEmailOrPhone: (
    fullName: string,
    emailOrPhone: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  loginWithEmailOrPhone: (
    emailOrPhone: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
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
  subscribeCurrentUser: (
    plan: 'MovieKart VIP' | 'Standard HD',
    momoProvider: 'MTN Mobile Money' | 'Airtel Money',
    momoPhone?: string
  ) => Promise<{ success: boolean; error?: string }>;
  setUserBillingStatus: (userId: string, status: TrialStatus) => Promise<void>;
  logoutUser: () => Promise<void>;
  switchUserAccount: (user: UserAccount) => void;

  // Preferences
  setOfflineMode: (offline: boolean) => void;
  setCurrentUser: (user: UserAccount | null) => void;

  // Firebase Admin & Poster Auth & Firestore CRUD Actions
  loginAdminWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logoutAdmin: () => Promise<void>;
  loginPosterWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logoutPoster: () => Promise<void>;
  inviteTeamMember: (
    email: string,
    password: string,
    role?: TeamRole
  ) => Promise<{ success: boolean; error?: string }>;
  removeTeamMember: (memberId: string) => Promise<void>;
  isOwnedByCurrentStaff: (item: { createdBy?: string; createdByEmail?: string }) => boolean;
  addMovie: (movie: Omit<Movie, 'id'>) => Promise<void>;
  updateMovie: (movie: Movie) => Promise<void>;
  deleteMovie: (movieId: string) => Promise<void>;
  addEpisodeToShow: (params: {
    showTitle: string;
    posterUrl?: string;
    trailerUrl?: string;
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
  HAS_SIGNED_UP: 'moviekart_ug_has_signed_up',
  TEAM_MEMBERS: 'moviekart_ug_team_members',
  POSTER_SESSION: 'moviekart_ug_poster_session',
  ADMIN_EMAIL: 'moviekart_ug_admin_email',
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

  const [deviceStorage, setDeviceStorage] = useState<RealDeviceStorageInfo | null>(null);
  const activeDownloadControllersRef = useRef<Map<string, AbortController>>(new Map());

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
      if (typeof navigator !== 'undefined' && !navigator.onLine) return true;
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

  const isPosterPath = () => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname.replace(/\/+$/, '').toLowerCase();
    const hash = window.location.hash.replace(/\/+$/, '').toLowerCase();
    return path.endsWith('/poster') || hash === '#/poster';
  };

  const [activeTab, setActiveTabState] = useState<ActiveTab>(() => {
    if (isAdminPath()) return 'admin';
    if (isPosterPath()) return 'poster';
    // Auto-open Downloads tab immediately when MovieKart opens offline
    if (typeof navigator !== 'undefined' && !navigator.onLine) return 'downloads';
    return 'home';
  });

  const setActiveTab = (tab: ActiveTab) => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      if (tab === 'admin' && !isAdminPath()) {
        window.history.pushState({}, '', '/admin');
      } else if (tab === 'poster' && !isPosterPath()) {
        window.history.pushState({}, '', '/poster');
      } else if (tab !== 'admin' && tab !== 'poster' && (isAdminPath() || isPosterPath())) {
        window.history.pushState({}, '', '/');
      }
    }
  };

  useEffect(() => {
    const syncRoute = () => {
      setActiveTabState(isAdminPath() ? 'admin' : isPosterPath() ? 'poster' : 'home');
    };
    window.addEventListener('popstate', syncRoute);
    window.addEventListener('hashchange', syncRoute);
    return () => {
      window.removeEventListener('popstate', syncRoute);
      window.removeEventListener('hashchange', syncRoute);
    };
  }, []);

  const [selectedGenre, setSelectedGenre] = useState<Genre>('All');
  const [selectedVJ, setSelectedVJ] = useState<VJFilter>('All VJs');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [selectedMovieForDetails, setSelectedMovieForDetails] = useState<Movie | null>(null);
  const [selectedShowForDetails, setSelectedShowForDetails] = useState<TVShow | null>(null);
  const [currentlyPlayingItem, setCurrentlyPlayingItem] = useState<PlayableItem | null>(null);
  const [selectedVJTrack, setSelectedVJTrack] = useState<VJTrack | null>(null);

  // Firebase Admin & Poster RBAC Auth state
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [adminAuthLoading, setAdminAuthLoading] = useState<boolean>(true);
  const [posterSessionEmail, setPosterSessionEmail] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.POSTER_SESSION) || null;
    } catch {
      return null;
    }
  });
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TEAM_MEMBERS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [hasSignedUpBefore, setHasSignedUpBefore] = useState<boolean>(() => {
    try {
      if (localStorage.getItem(STORAGE_KEYS.HAS_SIGNED_UP) === 'true') return true;
      const savedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
      if (savedUsers) {
        const parsed = JSON.parse(savedUsers);
        if (Array.isArray(parsed) && parsed.length > 0) return true;
      }
      return false;
    } catch {
      return false;
    }
  });

  // Live minute ticker so 30-day free trial countdown updates automatically
  const [trialNowMs, setTrialNowMs] = useState<number>(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => setTrialNowMs(Date.now()), 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const currentUserTrialInfo: TrialInfo | null = currentUser
    ? getUserTrialInfo(currentUser, trialNowMs)
    : null;

  const staffEmail = (adminUser?.email || posterSessionEmail || '').trim().toLowerCase() || null;
  const matchedTeamMember = staffEmail
    ? teamMembers.find(
        (m) => m.status !== 'removed' && m.email.trim().toLowerCase() === staffEmail
      )
    : undefined;

  const adminRole: TeamRole | null = !staffEmail
    ? null
    : posterSessionEmail && !adminUser
      ? 'Poster'
      : matchedTeamMember?.role === 'Poster'
        ? 'Poster'
        : 'Admin';

  const isAdminAuthenticated = Boolean(adminUser || posterSessionEmail);

  const isOwnedByCurrentStaff = (item: { createdBy?: string; createdByEmail?: string }): boolean => {
    if (adminRole === 'Admin') return true;
    if (adminRole !== 'Poster' || !staffEmail) return false;
    const itemEmail = (item.createdByEmail || '').trim().toLowerCase();
    if (itemEmail && itemEmail === staffEmail) return true;
    if (adminUser?.uid && item.createdBy === adminUser.uid) return true;
    if (item.createdBy && item.createdBy.trim().toLowerCase() === staffEmail) return true;
    return false;
  };

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  const markHasSignedUp = () => {
    setHasSignedUpBefore(true);
    try {
      localStorage.setItem(STORAGE_KEYS.HAS_SIGNED_UP, 'true');
    } catch {}
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

  // Also refresh local session (e.g. phone/email sign-in) from Firestore on initial load
  useEffect(() => {
    const savedId = currentUser?.id;
    if (!savedId) return;
    getDoc(doc(db, 'users', savedId))
      .then((snap) => {
        if (!snap.exists()) return;
        const data = snap.data() as Record<string, unknown>;
        setCurrentUser((prev) => {
          if (!prev || prev.id !== savedId) return prev;
          const trialStart =
            parseTimestampMs(data.trialStartDate) ||
            prev.trialStartDate ||
            parseTimestampMs(data.createdAt) ||
            Date.now();
          const trialEnd =
            parseTimestampMs(data.trialEndDate) ||
            prev.trialEndDate ||
            trialStart + TRIAL_DURATION_DAYS * MS_PER_DAY;
          const merged: UserAccount = {
            ...prev,
            name: typeof data.name === 'string' && data.name ? data.name : prev.name,
            username: typeof data.username === 'string' ? data.username : prev.username,
            avatar: typeof data.avatar === 'string' && data.avatar ? data.avatar : prev.avatar,
            joinedDate:
              typeof data.joinedDate === 'string' && data.joinedDate ? data.joinedDate : prev.joinedDate,
            trialStartDate: trialStart,
            trialEndDate: trialEnd,
            trialStatus:
              data.trialStatus === 'Paid' || data.trialStatus === 'Expired' || data.trialStatus === 'Free Trial'
                ? data.trialStatus
                : prev.trialStatus,
            isPaid: typeof data.isPaid === 'boolean' ? data.isPaid : prev.isPaid,
            paidAt: parseTimestampMs(data.paidAt) || prev.paidAt,
            status: data.status === 'suspended' ? 'suspended' : prev.status || 'active',
            subscription:
              data.subscription === 'MovieKart VIP' ||
              data.subscription === 'Standard HD' ||
              data.subscription === 'Free Pass'
                ? data.subscription
                : prev.subscription,
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
  const parseRealRatingsMap = (raw: unknown): Record<string, number> => {
    const clean: Record<string, number> = {};
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
        const num = Number(v);
        if (Number.isFinite(num) && num >= 1 && num <= 5) {
          clean[k] = Math.round(num);
        }
      }
    }
    return clean;
  };

  const getActiveRaterKey = (): string | null => {
    const rawKey = auth.currentUser?.uid || currentUser?.id || currentUser?.email || '';
    const trimmed = rawKey.trim();
    if (!trimmed) return null;
    return trimmed.replace(/[^a-zA-Z0-9_-]/g, '_');
  };

  const computeRealRatingStats = (ratingsMap: Record<string, number>) => {
    const values = Object.values(ratingsMap);
    const count = values.length;
    if (count === 0) {
      return { rating5: 0, ratingsCount: 0, rating10: 0 };
    }
    const avg = +(values.reduce((acc, val) => acc + val, 0) / count).toFixed(1);
    return { rating5: avg, ratingsCount: count, rating10: +(avg * 2).toFixed(1) };
  };

  useEffect(() => {
    const activeRaterKey = getActiveRaterKey();
    const moviesRef = collection(db, 'movies');
    const unsubscribe = onSnapshot(
      moviesRef,
      (snapshot) => {
        const loadedMovies: Movie[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as Record<string, unknown>;
          const ratingsByUser = parseRealRatingsMap(data.ratingsByUser);
          const { rating5, ratingsCount, rating10 } = computeRealRatingStats(ratingsByUser);
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
          const trailerUrl =
            (typeof data.trailerUrl === 'string' && data.trailerUrl.trim()) ||
            (typeof data.trailerURL === 'string' && data.trailerURL.trim()) ||
            (typeof data.trailer === 'string' && data.trailer.trim()) ||
            '';

          const rawVjName =
            (typeof data.vjName === 'string' && data.vjName.trim()) ||
            (typeof data.vj === 'string' && data.vj.trim()) ||
            '';
          const loadedVjTracks: VJTrack[] = Array.isArray(data.vjTracks)
            ? (data.vjTracks as VJTrack[])
            : rawVjName
              ? [
                  {
                    id: 'vj_primary',
                    name: rawVjName,
                    language: 'Luganda',
                    isDefault: true,
                    commentaryQuotes: [],
                  },
                ]
              : [];

          const realViewsCount =
            typeof data.viewsCount === 'number' && Number.isFinite(data.viewsCount) && data.viewsCount > 0
              ? Math.floor(data.viewsCount)
              : 0;

          return {
            id: docSnap.id,
            title: typeof data.title === 'string' ? data.title : 'Untitled Movie',
            genre: (typeof data.genre === 'string' ? data.genre : 'Action') as Genre,
            year: Number(data.year) || new Date().getFullYear(),
            duration: typeof data.duration === 'string' ? data.duration : '1h 45m',
            rating: rating10,
            rating5,
            ratingsCount,
            ratingsByUser,
            userRating: activeRaterKey ? ratingsByUser[activeRaterKey] : undefined,
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
            trailerUrl: trailerUrl || undefined,
            fileSizeMb: typeof data.fileSizeMb === 'number' ? data.fileSizeMb : 450,
            isTrending: Boolean(data.isTrending),
            isFeatured: Boolean(data.isFeatured),
            isUgandanExclusive: Boolean(data.isUgandanExclusive),
            vjName: rawVjName || loadedVjTracks[0]?.name || '',
            vjTracks: loadedVjTracks,
            viewsCount: realViewsCount,
            createdAt: parseTimestampMs(data.createdAt),
            createdBy: typeof data.createdBy === 'string' ? data.createdBy : undefined,
            createdByEmail: typeof data.createdByEmail === 'string' ? data.createdByEmail : undefined,
          };
        });

        loadedMovies.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setMovies(loadedMovies);
        setSelectedMovieForDetails((prev) => {
          if (!prev) return null;
          return loadedMovies.find((m) => m.id === prev.id) || prev;
        });
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
  }, [currentUser?.id, currentUser?.email]);

  // 3. Real-time Firestore listener for "tvshows" collection
  useEffect(() => {
    const activeRaterKey = getActiveRaterKey();
    const showsRef = collection(db, 'tvshows');
    const unsubscribe = onSnapshot(
      showsRef,
      (snapshot) => {
        const loadedShows: TVShow[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as Record<string, unknown>;
          const ratingsByUser = parseRealRatingsMap(data.ratingsByUser);
          const { rating5, ratingsCount, rating10 } = computeRealRatingStats(ratingsByUser);
          const trailerUrl =
            (typeof data.trailerUrl === 'string' && data.trailerUrl.trim()) ||
            (typeof data.trailerURL === 'string' && data.trailerURL.trim()) ||
            (typeof data.trailer === 'string' && data.trailer.trim()) ||
            '';
          const realViewsCount =
            typeof data.viewsCount === 'number' && Number.isFinite(data.viewsCount) && data.viewsCount > 0
              ? Math.floor(data.viewsCount)
              : 0;

          return {
            id: docSnap.id,
            title: typeof data.title === 'string' ? data.title : 'Untitled Series',
            genre: (typeof data.genre === 'string' ? data.genre : 'Drama') as Genre,
            year: Number(data.year) || new Date().getFullYear(),
            rating: rating10,
            rating5,
            ratingsCount,
            ratingsByUser,
            userRating: activeRaterKey ? ratingsByUser[activeRaterKey] : undefined,
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
            trailerUrl: trailerUrl || undefined,
            viewsCount: realViewsCount,
            createdBy: typeof data.createdBy === 'string' ? data.createdBy : undefined,
            createdByEmail: typeof data.createdByEmail === 'string' ? data.createdByEmail : undefined,
          };
        });
        setTvShows(loadedShows);
        setSelectedShowForDetails((prev) => {
          if (!prev) return null;
          return loadedShows.find((s) => s.id === prev.id) || prev;
        });
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
  }, [currentUser?.id, currentUser?.email]);

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
            createdBy: typeof data.createdBy === 'string' ? data.createdBy : undefined,
            createdByEmail: typeof data.createdByEmail === 'string' ? data.createdByEmail : undefined,
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

  // 5. Real-time Firestore listener for "users" collection (powers Admin Users page & live trial/paid sync)
  useEffect(() => {
    const targetDb = adminUser ? adminDb : db;
    const usersRef = collection(targetDb, 'users');
    const unsubscribe = onSnapshot(
      usersRef,
      (snapshot) => {
        const remoteUsers: UserAccount[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as Record<string, unknown>;
          const createdMs =
            parseTimestampMs(data.createdAt) ||
            parseTimestampMs(data.trialStartDate) ||
            (typeof data.joinedDate === 'string' && !Number.isNaN(Date.parse(data.joinedDate))
              ? Date.parse(data.joinedDate)
              : Date.now());
          const trialStartDate = parseTimestampMs(data.trialStartDate) || createdMs;
          const trialEndDate =
            parseTimestampMs(data.trialEndDate) ||
            trialStartDate + TRIAL_DURATION_DAYS * MS_PER_DAY;
          const joinedDate =
            typeof data.joinedDate === 'string' && data.joinedDate && data.joinedDate !== 'Just now'
              ? data.joinedDate
              : new Date(createdMs).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });

          return {
            id: docSnap.id,
            name: typeof data.name === 'string' && data.name ? data.name : 'MovieKart Viewer',
            username: typeof data.username === 'string' ? data.username : undefined,
            email: typeof data.email === 'string' ? data.email : '',
            phone: typeof data.phone === 'string' ? data.phone : '',
            avatar: typeof data.avatar === 'string' && data.avatar ? data.avatar : '/pwa-192x192.png',
            authProvider:
              data.authProvider === 'google' || data.authProvider === 'phone' || data.authProvider === 'email'
                ? data.authProvider
                : 'email',
            subscription:
              data.subscription === 'MovieKart VIP' ||
              data.subscription === 'Standard HD' ||
              data.subscription === 'Free Pass'
                ? data.subscription
                : 'Free Pass',
            status: data.status === 'suspended' ? 'suspended' : 'active',
            joinedDate,
            createdAt: createdMs,
            trialStartDate,
            trialEndDate,
            trialStatus:
              data.trialStatus === 'Paid' ||
              data.trialStatus === 'Expired' ||
              data.trialStatus === 'Free Trial'
                ? data.trialStatus
                : undefined,
            isPaid: Boolean(data.isPaid),
            paidAt: parseTimestampMs(data.paidAt) || undefined,
            momoProvider:
              data.momoProvider === 'Airtel Money' ? 'Airtel Money' : 'MTN Mobile Money',
            storageUsedMb: typeof data.storageUsedMb === 'number' ? data.storageUsedMb : 0,
            downloadsCount: typeof data.downloadsCount === 'number' ? data.downloadsCount : 0,
            moviesWatchedCount: typeof data.moviesWatchedCount === 'number' ? data.moviesWatchedCount : 0,
          };
        });

        setUsers((prev) => {
          const map = new Map<string, UserAccount>();
          prev.forEach((u) => map.set(u.id, u));
          remoteUsers.forEach((u) => map.set(u.id, { ...(map.get(u.id) || {}), ...u }));
          const mergedList = Array.from(map.values()).sort(
            (a, b) => (b.createdAt || b.trialStartDate || 0) - (a.createdAt || a.trialStartDate || 0)
          );
          try {
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(mergedList));
          } catch {}
          return mergedList;
        });

        // Keep logged-in currentUser synced if Admin updates their Paid/Expired/Active status
        setCurrentUser((prev) => {
          if (!prev) return prev;
          const remoteMatch = remoteUsers.find((u) => u.id === prev.id);
          if (!remoteMatch) return prev;
          const updated: UserAccount = {
            ...prev,
            isPaid: remoteMatch.isPaid,
            trialStatus: remoteMatch.trialStatus,
            trialStartDate: remoteMatch.trialStartDate,
            trialEndDate: remoteMatch.trialEndDate,
            subscription: remoteMatch.subscription,
            status: remoteMatch.status,
          };
          try {
            localStorage.setItem(`moviekart_ug_user_${updated.id}_profile`, JSON.stringify(updated));
          } catch {}
          return updated;
        });
      },
      () => {
        // Fallback silently to local users cache if Firestore users list rules restrict read
      }
    );

    return () => unsubscribe();
  }, [adminUser?.uid]);

  // 6. Real-time Firestore listener for "team_members" collection
  useEffect(() => {
    const targetDb = adminUser ? adminDb : db;
    const teamRef = collection(targetDb, 'team_members');
    const unsubscribe = onSnapshot(
      teamRef,
      (snapshot) => {
        const remoteMembers: TeamMember[] = snapshot.docs
          .map((docSnap): TeamMember => {
            const data = docSnap.data() as Record<string, unknown>;
            return {
              id: docSnap.id,
              email: typeof data.email === 'string' ? data.email.trim().toLowerCase() : '',
              role: (data.role === 'Admin' ? 'Admin' : 'Poster') as TeamRole,
              password: typeof data.password === 'string' ? data.password : undefined,
              invitedBy: typeof data.invitedBy === 'string' ? data.invitedBy : undefined,
              createdAt: parseTimestampMs(data.createdAt),
              status: (data.status === 'removed' ? 'removed' : 'active') as TeamMember['status'],
            };
          })
          .filter((m) => Boolean(m.email) && m.status !== 'removed');

        setTeamMembers((prev) => {
          const map = new Map<string, TeamMember>();
          prev.forEach((m) => map.set(m.id, m));
          remoteMembers.forEach((m) => map.set(m.id, m));
          const list = Array.from(map.values()).filter((m) => m.status !== 'removed');
          try {
            localStorage.setItem(STORAGE_KEYS.TEAM_MEMBERS, JSON.stringify(list));
          } catch {}
          return list;
        });
      },
      () => {
        // Fallback cleanly to local team_members cache
      }
    );

    return () => unsubscribe();
  }, [adminUser?.uid]);

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

  // Measure real phone/device storage via StorageManager API + exact IndexedDB video bytes
  const refreshDeviceStorage = useCallback(async () => {
    try {
      const info = await getRealDeviceStorageInfo();
      setDeviceStorage(info);
      const realMb = +(info.moviesBytes / (1024 * 1024)).toFixed(2);
      setCurrentUser((prev) => {
        if (!prev) return prev;
        if (prev.storageUsedMb === realMb && prev.downloadsCount === info.moviesCount) {
          return prev;
        }
        return {
          ...prev,
          storageUsedMb: realMb,
          downloadsCount: info.moviesCount
        };
      });
    } catch {
      // ignore
    }
  }, []);

  // Reconcile persisted download metadata with actual video Blobs stored in IndexedDB on mount / user switch
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const metaMap = await getAllOfflineVideoMeta();
      if (cancelled) return;

      setDownloads((prev) =>
        prev.map((item) => {
          const isActivelyRunning = activeDownloadControllersRef.current.has(item.movieId);
          const localMeta = metaMap[item.movieId];

          if (localMeta) {
            const realMb = +(localMeta.sizeBytes / (1024 * 1024)).toFixed(2);
            return {
              ...item,
              status: 'completed',
              progress: 100,
              speedMbps: 0,
              fileSizeBytes: localMeta.sizeBytes,
              fileSizeMb: realMb,
              downloadedBytes: localMeta.sizeBytes,
              totalBytes: localMeta.sizeBytes,
              mimeType: localMeta.mimeType,
              fileName: localMeta.fileName,
              hasLocalBlob: true,
              errorMessage: undefined
            };
          }

          if (item.status === 'downloading' && !isActivelyRunning) {
            return { ...item, status: 'paused', speedMbps: 0, hasLocalBlob: false };
          }

          if (item.status === 'completed') {
            return { ...item, hasLocalBlob: false };
          }

          return item;
        })
      );

      await refreshDeviceStorage();
    })();

    return () => {
      cancelled = true;
    };
  }, [currentUser?.id, refreshDeviceStorage]);

  // Auto-switch to Downloads tab whenever the phone loses internet connection
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleGoOffline = () => {
      setOfflineMode(true);
      if (!isAdminPath() && !isPosterPath()) {
        setActiveTabState('downloads');
      }
      showToast('Offline Mode — showing your downloaded movies');
    };

    const handleGoOnline = () => {
      setOfflineMode(false);
      showToast('Back online!');
    };

    window.addEventListener('offline', handleGoOffline);
    window.addEventListener('online', handleGoOnline);

    return () => {
      window.removeEventListener('offline', handleGoOffline);
      window.removeEventListener('online', handleGoOnline);
    };
  }, []);

  // Abort any in-flight downloads when provider unmounts
  useEffect(() => {
    return () => {
      activeDownloadControllersRef.current.forEach((ctrl) => ctrl.abort());
      activeDownloadControllersRef.current.clear();
    };
  }, []);

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
    if (existing && existing.status === 'completed' && existing.hasLocalBlob) {
      showToast(`"${item.title}" is already saved on your phone.`);
      return;
    }

    if (activeDownloadControllersRef.current.has(item.id)) {
      showToast(`"${item.title}" is already downloading.`);
      return;
    }

    if (!item.videoUrl || !item.videoUrl.trim()) {
      showToast('This title does not have a downloadable video file.');
      return;
    }

    const isEp = 'isEpisode' in item && !!item.isEpisode;
    const epTitle = 'episodeTitle' in item ? item.episodeTitle : undefined;
    const controller = new AbortController();
    activeDownloadControllersRef.current.set(item.id, controller);

    const newItem: DownloadItem = {
      movieId: item.id,
      movieTitle: item.title,
      genre: item.genre,
      posterUrl: item.posterUrl,
      videoUrl: item.videoUrl,
      quality,
      fileSizeMb: 0,
      fileSizeBytes: 0,
      downloadedBytes: 0,
      totalBytes: undefined,
      progress: 0,
      status: 'downloading',
      speedMbps: 0,
      hasLocalBlob: false,
      savedToGallery: false,
      errorMessage: undefined,
      isEpisode: isEp,
      episodeTitle: epTitle
    };

    setDownloads((prev) => [newItem, ...prev.filter((d) => d.movieId !== item.id)]);
    showToast(`Downloading "${item.title}" inside MovieKart...`);

    void requestPersistentStorage();

    (async () => {
      try {
        // Check available phone storage before downloading (< 1 GB free warning)
        const preStorage = await getRealDeviceStorageInfo();
        setDeviceStorage(preStorage);
        if (preStorage.isLowStorage) {
          showToast(
            `Low phone storage warning (${formatMegabytes(preStorage.availableBytes)} free). Delete old movies if download fails.`
          );
        }

        const result = await downloadVideoWithProgress({
          videoUrl: item.videoUrl,
          title: item.title,
          signal: controller.signal,
          onProgress: (info) => {
            if (controller.signal.aborted) return;
            setDownloads((prev) =>
              prev.map((d) => {
                if (d.movieId !== item.id) return d;
                const realBytes = info.totalBytes ?? info.downloadedBytes;
                return {
                  ...d,
                  progress: info.progress,
                  downloadedBytes: info.downloadedBytes,
                  totalBytes: info.totalBytes ?? undefined,
                  fileSizeBytes: realBytes,
                  fileSizeMb: +(realBytes / (1024 * 1024)).toFixed(2),
                  speedMbps: info.speedMbps,
                  status: 'downloading'
                };
              })
            );
          }
        });

        if (controller.signal.aborted) return;

        // Save real video Blob inside IndexedDB (key = movieId) for 100% in-website offline play
        await saveOfflineVideoBlob({
          id: item.id,
          blob: result.blob,
          sizeBytes: result.sizeBytes,
          mimeType: result.mimeType,
          fileName: result.fileName,
          savedAt: Date.now()
        });

        const realMb = +(result.sizeBytes / (1024 * 1024)).toFixed(2);
        const nowLabel = new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        });

        setDownloads((prev) =>
          prev.map((d) =>
            d.movieId === item.id
              ? {
                  ...d,
                  progress: 100,
                  status: 'completed',
                  speedMbps: 0,
                  fileSizeBytes: result.sizeBytes,
                  fileSizeMb: realMb,
                  downloadedBytes: result.sizeBytes,
                  totalBytes: result.sizeBytes,
                  mimeType: result.mimeType,
                  fileName: result.fileName,
                  hasLocalBlob: true,
                  errorMessage: undefined,
                  downloadedAt: nowLabel
                }
              : d
          )
        );

        await refreshDeviceStorage();
        showToast(
          `"${item.title}" (${formatMegabytes(result.sizeBytes)}) ready to play offline inside MovieKart!`
        );
      } catch (err) {
        if (controller.signal.aborted) return;
        const message =
          err instanceof Error ? err.message : 'Download failed. Check your connection and try again.';
        setDownloads((prev) =>
          prev.map((d) =>
            d.movieId === item.id
              ? {
                  ...d,
                  status: 'error',
                  speedMbps: 0,
                  errorMessage: message
                }
              : d
          )
        );
        showToast(`Download failed: ${message}`);
      } finally {
        activeDownloadControllersRef.current.delete(item.id);
      }
    })();
  };

  const pauseDownload = (id: string) => {
    const controller = activeDownloadControllersRef.current.get(id);
    if (controller) {
      controller.abort();
      activeDownloadControllersRef.current.delete(id);
    }
    setDownloads((prev) =>
      prev.map((d) => (d.movieId === id ? { ...d, status: 'paused', speedMbps: 0 } : d))
    );
    showToast('Download paused');
  };

  const resumeDownload = (id: string) => {
    const existing = downloads.find((d) => d.movieId === id);
    if (!existing) return;
    startDownload(
      {
        id: existing.movieId,
        title: existing.movieTitle,
        genre: existing.genre,
        posterUrl: existing.posterUrl,
        videoUrl: existing.videoUrl,
        fileSizeMb: existing.fileSizeMb,
        isEpisode: existing.isEpisode,
        episodeTitle: existing.episodeTitle
      },
      existing.quality
    );
  };

  const deleteDownload = (id: string) => {
    const controller = activeDownloadControllersRef.current.get(id);
    if (controller) {
      controller.abort();
      activeDownloadControllersRef.current.delete(id);
    }
    setDownloads((prev) => prev.filter((d) => d.movieId !== id));
    void (async () => {
      await deleteOfflineVideoBlob(id);
      await refreshDeviceStorage();
    })();
    showToast('Download deleted from phone storage');
  };

  const clearAllDownloads = () => {
    activeDownloadControllersRef.current.forEach((ctrl) => ctrl.abort());
    activeDownloadControllersRef.current.clear();
    setDownloads([]);
    void (async () => {
      await clearAllOfflineVideoBlobs();
      await refreshDeviceStorage();
    })();
    showToast('All offline downloads cleared from phone storage');
  };

  const playOfflineDownload = (item: DownloadItem) => {
    const matchedMovie = movies.find((m) => m.id === item.movieId);
    const defaultTrack =
      matchedMovie?.vjTracks?.find((t) => t.isDefault) || matchedMovie?.vjTracks?.[0] || null;

    // Always play strictly from IndexedDB inside the website <video> player (never Drive iframe or external app)
    setSelectedVJTrack(defaultTrack);
    setCurrentlyPlayingItem({
      id: item.movieId,
      movieId: item.isEpisode ? undefined : item.movieId,
      title: item.movieTitle,
      subTitle: item.episodeTitle,
      videoUrl: item.videoUrl,
      posterUrl: item.posterUrl,
      backdropUrl: matchedMovie?.backdropUrl,
      year: matchedMovie?.year,
      quality: item.quality,
      vjTracks: matchedMovie?.vjTracks,
      fileSizeMb: item.fileSizeMb,
      offlineOnly: true
    });
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

  const ensureTrialAllowsPlayback = (): boolean => {
    if ((activeTab === 'admin' || activeTab === 'poster') && isAdminAuthenticated) return true;
    if (!currentUser) {
      showToast('Please sign up or log in to watch.');
      return false;
    }
    if (currentUserTrialInfo?.isExpired) {
      showToast('Your Free Trial Has Ended. Subscribe to continue watching.');
      return false;
    }
    if (currentUser.status === 'suspended') {
      showToast('Your account is currently suspended. Contact support.');
      return false;
    }
    return true;
  };

  const incrementMediaViews = async (collectionName: 'movies' | 'tvshows', docId: string) => {
    if (!docId) return;

    if (collectionName === 'movies') {
      setMovies((prev) =>
        prev.map((m) => (m.id === docId ? { ...m, viewsCount: (m.viewsCount || 0) + 1 } : m))
      );
      setSelectedMovieForDetails((prev) =>
        prev && prev.id === docId ? { ...prev, viewsCount: (prev.viewsCount || 0) + 1 } : prev
      );
    } else {
      setTvShows((prev) =>
        prev.map((s) => (s.id === docId ? { ...s, viewsCount: (s.viewsCount || 0) + 1 } : s))
      );
      setSelectedShowForDetails((prev) =>
        prev && prev.id === docId ? { ...prev, viewsCount: (prev.viewsCount || 0) + 1 } : prev
      );
    }

    try {
      await updateDoc(doc(db, collectionName, docId), {
        viewsCount: increment(1),
      });
    } catch {
      if (adminAuth.currentUser) {
        try {
          await updateDoc(doc(adminDb, collectionName, docId), {
            viewsCount: increment(1),
          });
        } catch (err) {
          console.warn('View count Firestore update skipped:', err);
        }
      }
    }
  };

  const playMovie = (movie: Movie, vjTrackId?: string) => {
    if (!ensureTrialAllowsPlayback()) return;
    if (offlineMode) {
      const isDownloaded = downloads.some(
        (d) => d.movieId === movie.id && d.status === 'completed' && d.hasLocalBlob
      );
      if (!isDownloaded) {
        showToast(`Offline Mode active: "${movie.title}" is not downloaded to your phone yet!`);
        return;
      }
    }

    // Increment real view count in Firebase (+1 on every Play / Watch Now)
    void incrementMediaViews('movies', movie.id);

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

  const playTrailer = (item: Movie | TVShow) => {
    const trailerUrl = (item.trailerUrl || '').trim();
    if (!trailerUrl) {
      showToast('No trailer available for this title.');
      return;
    }
    const isShow = 'seasons' in item;
    const defaultTrack = item.vjTracks?.find((t) => t.isDefault) || item.vjTracks?.[0] || null;
    setSelectedVJTrack(defaultTrack);
    setCurrentlyPlayingItem({
      id: `${item.id}_trailer`,
      movieId: isShow ? undefined : item.id,
      showId: isShow ? item.id : undefined,
      title: `${item.title} (Official Trailer)`,
      subTitle: 'Official Trailer',
      videoUrl: trailerUrl,
      posterUrl: item.posterUrl,
      backdropUrl: item.backdropUrl,
      year: item.year,
      quality: item.quality || 'HD Trailer',
      isTrailer: true,
      vjTracks: item.vjTracks,
      fileSizeMb: 45
    });
    showToast(`Playing "${item.title}" Trailer`);
  };

  const playEpisode = (show: TVShow, seasonNumber: number, episode: Episode, vjTrackId?: string) => {
    if (!ensureTrialAllowsPlayback()) return;
    if (offlineMode) {
      const isDownloaded = downloads.some(
        (d) => d.movieId === episode.id && d.status === 'completed' && d.hasLocalBlob
      );
      if (!isDownloaded) {
        showToast(`Offline Mode active: "${episode.title}" is not downloaded to your phone yet!`);
        return;
      }
    }

    // Increment real view count in Firebase (+1 on every Play / Watch Now)
    void incrementMediaViews('tvshows', show.id);

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
    if (!ensureTrialAllowsPlayback()) return;
    if (offlineMode) {
      const isDownloaded = downloads.some(
        (d) => d.movieId === item.itemId && d.status === 'completed' && d.hasLocalBlob
      );
      if (!isDownloaded) {
        showToast(`Offline Mode active: "${item.title}" is not downloaded to your phone yet!`);
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

  // Real 5-Star Rating System (1 rating per logged-in user per movie/show, saved to Firebase)
  const rateMovie = async (movieId: string, rating: number) => {
    const raterKey = getActiveRaterKey();
    if (!currentUser || !raterKey) {
      showToast('Please log in to rate this movie.');
      return;
    }

    const clampedRating = Math.max(1, Math.min(5, Math.round(rating)));
    const targetMovie = movies.find((m) => m.id === movieId);
    if (!targetMovie) return;

    const hadPrevious = targetMovie.ratingsByUser?.[raterKey] !== undefined;
    const nextRatingsByUser: Record<string, number> = {
      ...(targetMovie.ratingsByUser || {}),
      [raterKey]: clampedRating,
    };
    const { rating5: newAvg, ratingsCount: newCount, rating10: newRating10 } =
      computeRealRatingStats(nextRatingsByUser);

    setUserRatings((prev) => {
      const updated = { ...prev, [movieId]: clampedRating };
      try {
        localStorage.setItem(STORAGE_KEYS.USER_RATINGS, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    const updatedMovie: Movie = {
      ...targetMovie,
      rating5: newAvg,
      rating: newRating10,
      ratingsCount: newCount,
      ratingsByUser: nextRatingsByUser,
      userRating: clampedRating,
    };

    setMovies((prev) => prev.map((m) => (m.id === movieId ? updatedMovie : m)));
    if (selectedMovieForDetails?.id === movieId) {
      setSelectedMovieForDetails(updatedMovie);
    }

    showToast(
      hadPrevious
        ? `Updated your rating to ${clampedRating}★ (Average: ${newAvg.toFixed(1)}/5)`
        : `You rated "${targetMovie.title}" ${clampedRating}★ (Average: ${newAvg.toFixed(1)}/5)`
    );

    try {
      await updateDoc(doc(db, 'movies', movieId), {
        [`ratingsByUser.${raterKey}`]: clampedRating,
        rating: newRating10,
        rating5: newAvg,
        ratingsCount: newCount,
      });
    } catch (error) {
      const info = buildFirestoreErrorInfo(error, OperationType.UPDATE, `movies/${movieId}`);
      console.warn('Rating Firestore sync skipped or denied:', JSON.stringify(info));
    }
  };

  const rateTVShow = async (showId: string, rating: number) => {
    const raterKey = getActiveRaterKey();
    if (!currentUser || !raterKey) {
      showToast('Please log in to rate this TV show.');
      return;
    }

    const clampedRating = Math.max(1, Math.min(5, Math.round(rating)));
    const targetShow = tvShows.find((s) => s.id === showId);
    if (!targetShow) return;

    const hadPrevious = targetShow.ratingsByUser?.[raterKey] !== undefined;
    const nextRatingsByUser: Record<string, number> = {
      ...(targetShow.ratingsByUser || {}),
      [raterKey]: clampedRating,
    };
    const { rating5: newAvg, ratingsCount: newCount, rating10: newRating10 } =
      computeRealRatingStats(nextRatingsByUser);

    const updatedShow: TVShow = {
      ...targetShow,
      rating5: newAvg,
      rating: newRating10,
      ratingsCount: newCount,
      ratingsByUser: nextRatingsByUser,
      userRating: clampedRating,
    };

    setTvShows((prev) => prev.map((s) => (s.id === showId ? updatedShow : s)));
    if (selectedShowForDetails?.id === showId) {
      setSelectedShowForDetails(updatedShow);
    }

    showToast(
      hadPrevious
        ? `Updated your rating to ${clampedRating}★ (Average: ${newAvg.toFixed(1)}/5)`
        : `You rated "${targetShow.title}" ${clampedRating}★ (Average: ${newAvg.toFixed(1)}/5)`
    );

    try {
      await updateDoc(doc(db, 'tvshows', showId), {
        [`ratingsByUser.${raterKey}`]: clampedRating,
        rating: newRating10,
        rating5: newAvg,
        ratingsCount: newCount,
      });
    } catch (error) {
      const info = buildFirestoreErrorInfo(error, OperationType.UPDATE, `tvshows/${showId}`);
      console.warn('TV Show rating Firestore sync skipped or denied:', JSON.stringify(info));
    }
  };

  const getUserRating = (mediaId: string) => {
    const raterKey = getActiveRaterKey();
    if (!raterKey) return undefined;
    const movieMatch = movies.find((m) => m.id === mediaId);
    if (movieMatch) return movieMatch.ratingsByUser?.[raterKey];
    const showMatch = tvShows.find((s) => s.id === mediaId);
    if (showMatch) return showMatch.ratingsByUser?.[raterKey];
    return undefined;
  };

  // Firebase Admin & Poster Authentication (Isolated adminAuth instance + invited Poster fallback)
  const loginAdminWithEmail = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const invitedPoster = teamMembers.find(
      (m) => m.status !== 'removed' && m.email.trim().toLowerCase() === cleanEmail && m.role === 'Poster'
    );

    try {
      await signInWithEmailAndPassword(adminAuth, cleanEmail, password);
      setPosterSessionEmail(null);
      try {
        localStorage.removeItem(STORAGE_KEYS.POSTER_SESSION);
        if (!invitedPoster) {
          localStorage.setItem(STORAGE_KEYS.ADMIN_EMAIL, cleanEmail);
        }
      } catch {}
      showToast(invitedPoster ? `Signed in as Poster (${cleanEmail})` : 'Admin signed in with Firebase Auth');
      return { success: true };
    } catch (error: unknown) {
      // Fallback for invited Poster accounts when Firebase Auth creation wasn't enabled or was created locally
      if (invitedPoster && invitedPoster.password && invitedPoster.password === password) {
        setPosterSessionEmail(cleanEmail);
        try {
          localStorage.setItem(STORAGE_KEYS.POSTER_SESSION, cleanEmail);
        } catch {}
        showToast(`Signed in as Poster (${cleanEmail})`);
        return { success: true };
      }

      const code = (error as { code?: string })?.code || '';
      let message = 'Failed to sign in. Check your email and password.';
      if (
        code === 'auth/invalid-credential' ||
        code === 'auth/wrong-password' ||
        code === 'auth/user-not-found'
      ) {
        message = 'Invalid email or password.';
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

  // Dedicated /poster Login: ONLY invited emails in Team Members with role === 'Poster'
  const loginPosterWithEmail = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (!password) {
      return { success: false, error: 'Please enter your password.' };
    }

    // 1. Gather latest team members from local state + Firestore team_members collection
    let matchedMember: TeamMember | undefined = teamMembers.find(
      (m) => m.status !== 'removed' && m.email.trim().toLowerCase() === cleanEmail
    );
    const knownAdminEmails = new Set<string>();
    try {
      const savedAdminEmail = localStorage.getItem(STORAGE_KEYS.ADMIN_EMAIL);
      if (savedAdminEmail) knownAdminEmails.add(savedAdminEmail.trim().toLowerCase());
    } catch {}
    if (adminUser?.email && adminRole === 'Admin') {
      knownAdminEmails.add(adminUser.email.trim().toLowerCase());
    }
    teamMembers.forEach((m) => {
      if (m.invitedBy && m.invitedBy.includes('@')) {
        knownAdminEmails.add(m.invitedBy.trim().toLowerCase());
      }
      if (m.role === 'Admin' && m.status !== 'removed') {
        knownAdminEmails.add(m.email.trim().toLowerCase());
      }
    });

    if (!matchedMember) {
      const memberId = `tm_${cleanEmail.replace(/[^a-z0-9]/g, '_')}`;
      try {
        const directSnap = await getDoc(doc(db, 'team_members', memberId));
        if (directSnap.exists()) {
          const data = directSnap.data() as Record<string, unknown>;
          if (data.status !== 'removed') {
            matchedMember = {
              id: directSnap.id,
              email: typeof data.email === 'string' ? data.email.trim().toLowerCase() : cleanEmail,
              role: (data.role === 'Admin' ? 'Admin' : 'Poster') as TeamRole,
              password: typeof data.password === 'string' ? data.password : undefined,
              invitedBy: typeof data.invitedBy === 'string' ? data.invitedBy : undefined,
              createdAt: parseTimestampMs(data.createdAt),
              status: 'active',
            };
          }
        }
      } catch {
        // Ignore if Firestore rules restrict single-doc read
      }
    }

    if (!matchedMember) {
      try {
        const snap = await getDocs(collection(db, 'team_members'));
        snap.docs.forEach((docSnap) => {
          const data = docSnap.data() as Record<string, unknown>;
          const docEmail = typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
          if (typeof data.invitedBy === 'string' && data.invitedBy.includes('@')) {
            knownAdminEmails.add(data.invitedBy.trim().toLowerCase());
          }
          if (data.status !== 'removed' && docEmail === cleanEmail) {
            matchedMember = {
              id: docSnap.id,
              email: docEmail,
              role: (data.role === 'Admin' ? 'Admin' : 'Poster') as TeamRole,
              password: typeof data.password === 'string' ? data.password : undefined,
              invitedBy: typeof data.invitedBy === 'string' ? data.invitedBy : undefined,
              createdAt: parseTimestampMs(data.createdAt),
              status: 'active',
            };
          }
        });
      } catch {
        // Ignore if Firestore rules restrict collection read
      }
    }

    // 2. Enforce strict Poster-only invitation & role checks
    if (!matchedMember) {
      if (knownAdminEmails.has(cleanEmail)) {
        return { success: false, error: 'This login is for Posters only.' };
      }
      return { success: false, error: 'You are not invited as a Poster. Contact Admin.' };
    }

    if (matchedMember.role !== 'Poster') {
      return { success: false, error: 'This login is for Posters only.' };
    }

    // Keep matched Poster synced in local teamMembers state so adminRole resolves immediately to 'Poster'
    const verifiedPoster = matchedMember;
    setTeamMembers((prev) => {
      const exists = prev.some((m) => m.id === verifiedPoster.id);
      if (exists) return prev;
      const next = [verifiedPoster, ...prev];
      try {
        localStorage.setItem(STORAGE_KEYS.TEAM_MEMBERS, JSON.stringify(next));
      } catch {}
      return next;
    });

    // 3. Authenticate Poster via Firebase Auth (with fallback to invited password)
    try {
      await signInWithEmailAndPassword(adminAuth, cleanEmail, password);
      setPosterSessionEmail(cleanEmail);
      try {
        localStorage.setItem(STORAGE_KEYS.POSTER_SESSION, cleanEmail);
      } catch {}
      showToast(`Signed in as Poster (${cleanEmail})`);
      return { success: true };
    } catch {
      if (verifiedPoster.password && verifiedPoster.password === password) {
        if (adminAuth.currentUser) {
          await signOut(adminAuth).catch(() => {});
        }
        setPosterSessionEmail(cleanEmail);
        try {
          localStorage.setItem(STORAGE_KEYS.POSTER_SESSION, cleanEmail);
        } catch {}
        showToast(`Signed in as Poster (${cleanEmail})`);
        return { success: true };
      }
      return { success: false, error: 'Invalid email or password.' };
    }
  };

  const logoutAdmin = async () => {
    try {
      if (adminAuth.currentUser) {
        await signOut(adminAuth);
      }
    } catch (error) {
      console.error('Admin sign out error:', error);
    }
    setPosterSessionEmail(null);
    try {
      localStorage.removeItem(STORAGE_KEYS.POSTER_SESSION);
    } catch {}
    showToast('Signed out of Admin Portal');
  };

  const logoutPoster = async () => {
    try {
      if (adminAuth.currentUser) {
        await signOut(adminAuth);
      }
    } catch (error) {
      console.error('Poster sign out error:', error);
    }
    setPosterSessionEmail(null);
    try {
      localStorage.removeItem(STORAGE_KEYS.POSTER_SESSION);
    } catch {}
    setActiveTab('poster');
    showToast('Logged out of Poster Portal');
  };

  // Team Members Management (Admin only)
  const inviteTeamMember = async (
    email: string,
    password: string,
    role: TeamRole = 'Poster'
  ): Promise<{ success: boolean; error?: string }> => {
    if (adminRole !== 'Admin') {
      showToast('Only Admin can invite team members.');
      return { success: false, error: 'Only Admin can invite team members.' };
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'Please enter a valid member email address.' };
    }
    if (!password || password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }
    if (cleanEmail === staffEmail) {
      return { success: false, error: 'You cannot invite your own Admin email as a Poster.' };
    }

    const existing = teamMembers.find(
      (m) => m.status !== 'removed' && m.email.toLowerCase() === cleanEmail
    );
    if (existing) {
      return { success: false, error: 'This email is already a team member.' };
    }

    // Create real Firebase Auth account on isolated inviteAuth so Admin remains signed in
    try {
      await createUserWithEmailAndPassword(inviteAuth, cleanEmail, password);
      await signOut(inviteAuth).catch(() => {});
    } catch (authErr: unknown) {
      const code = (authErr as { code?: string })?.code || '';
      if (code !== 'auth/email-already-in-use') {
        console.warn('Secondary Firebase Auth invite notice:', code);
      }
    }

    const memberId = `tm_${cleanEmail.replace(/[^a-z0-9]/g, '_')}`;
    const newMember: TeamMember = {
      id: memberId,
      email: cleanEmail,
      role,
      password,
      invitedBy: staffEmail || 'admin',
      createdAt: Date.now(),
      status: 'active',
    };

    try {
      await setDoc(doc(adminDb, 'team_members', memberId), {
        ...newMember,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('Firestore team_members sync notice (saved locally):', err);
    }

    setTeamMembers((prev) => {
      const next = [newMember, ...prev.filter((m) => m.id !== memberId)];
      try {
        localStorage.setItem(STORAGE_KEYS.TEAM_MEMBERS, JSON.stringify(next));
      } catch {}
      return next;
    });

    showToast(`Invite sent! ${cleanEmail} added as ${role}.`);
    return { success: true };
  };

  const removeTeamMember = async (memberId: string) => {
    if (adminRole !== 'Admin') {
      showToast('Only Admin can remove team members.');
      return;
    }

    try {
      await deleteDoc(doc(adminDb, 'team_members', memberId));
    } catch (err) {
      console.warn('Firestore remove team_member notice:', err);
    }

    setTeamMembers((prev) => {
      const next = prev.filter((m) => m.id !== memberId);
      try {
        localStorage.setItem(STORAGE_KEYS.TEAM_MEMBERS, JSON.stringify(next));
      } catch {}
      return next;
    });
    showToast('Team member removed');
  };

  // Firestore Movie CRUD (Admin & Poster, with ownership tracking & RBAC)
  const addMovie = async (movieData: Omit<Movie, 'id'>) => {
    if (!isAdminAuthenticated) {
      showToast('Staff sign-in required to add movies.');
      throw new Error('Staff authentication required');
    }

    const descriptionText = (movieData.description || movieData.synopsis || '').trim();
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

    const authorUid = adminAuth.currentUser?.uid || staffEmail || 'staff';
    const authorEmail = staffEmail || adminAuth.currentUser?.email?.toLowerCase() || '';

    const payload = {
      title: movieData.title.trim(),
      description: descriptionText,
      synopsis: descriptionText,
      genre: movieData.genre || 'Action',
      posterUrl: movieData.posterUrl.trim(),
      backdropUrl: (movieData.backdropUrl || movieData.posterUrl).trim(),
      videoUrl: movieData.videoUrl.trim(),
      trailerUrl: (movieData.trailerUrl || '').trim(),
      year: Number(movieData.year) || new Date().getFullYear(),
      rating: 0,
      rating5: 0,
      ratingsCount: 0,
      ratingsByUser: {},
      duration: movieData.duration || '1h 45m',
      ageRating: movieData.ageRating || '16+',
      quality: movieData.quality || '1080p FHD',
      director: movieData.director || '',
      cast: movieData.cast || [],
      fileSizeMb: Number(movieData.fileSizeMb) || 450,
      isTrending: Boolean(movieData.isTrending),
      isFeatured: Boolean(movieData.isFeatured),
      isUgandanExclusive: Boolean(movieData.isUgandanExclusive),
      vjName: vjTracks[0]?.name || '',
      vjTracks,
      viewsCount: 0,
      createdAt: serverTimestamp(),
      createdBy: authorUid,
      createdByEmail: authorEmail,
    };

    try {
      await addDoc(collection(adminAuth.currentUser ? adminDb : db, 'movies'), payload);
      showToast(`Published "${payload.title}" live to MovieKart UG!`);
    } catch (error) {
      const info = buildFirestoreErrorInfo(error, OperationType.CREATE, 'movies');
      console.error('Firestore Add Movie Error:', JSON.stringify(info));
      showToast('Failed to save movie to Firestore. Check permissions.');
      throw error;
    }
  };

  const updateMovie = async (updatedMovie: Movie) => {
    if (!isAdminAuthenticated) {
      showToast('Staff sign-in required to update movies.');
      throw new Error('Staff authentication required');
    }

    if (adminRole === 'Poster' && !isOwnedByCurrentStaff(updatedMovie)) {
      showToast('Posters can only edit movies they posted.');
      throw new Error('Permission denied');
    }

    const descriptionText = (updatedMovie.description || updatedMovie.synopsis || '').trim();

    try {
      await updateDoc(doc(adminAuth.currentUser ? adminDb : db, 'movies', updatedMovie.id), {
        title: updatedMovie.title.trim(),
        description: descriptionText,
        synopsis: descriptionText,
        genre: updatedMovie.genre,
        posterUrl: updatedMovie.posterUrl.trim(),
        backdropUrl: (updatedMovie.backdropUrl || updatedMovie.posterUrl).trim(),
        videoUrl: updatedMovie.videoUrl.trim(),
        trailerUrl: (updatedMovie.trailerUrl || '').trim(),
        year: Number(updatedMovie.year),
        duration: updatedMovie.duration,
        ageRating: updatedMovie.ageRating,
        quality: updatedMovie.quality,
        director: updatedMovie.director,
        cast: updatedMovie.cast,
        fileSizeMb: Number(updatedMovie.fileSizeMb) || 450,
        isTrending: Boolean(updatedMovie.isTrending),
        isFeatured: Boolean(updatedMovie.isFeatured),
        isUgandanExclusive: Boolean(updatedMovie.isUgandanExclusive),
        vjName: updatedMovie.vjTracks?.[0]?.name || updatedMovie.vjName || '',
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
    if (!isAdminAuthenticated) {
      showToast('Staff sign-in required to delete movies.');
      return;
    }

    const target = movies.find((m) => m.id === movieId);
    if (adminRole === 'Poster' && (!target || !isOwnedByCurrentStaff(target))) {
      showToast('Posters cannot delete Admin movies.');
      return;
    }

    try {
      await deleteDoc(doc(adminAuth.currentUser ? adminDb : db, 'movies', movieId));
      showToast('Movie deleted from Firestore');
    } catch (error) {
      const info = buildFirestoreErrorInfo(error, OperationType.DELETE, `movies/${movieId}`);
      console.error('Firestore Delete Movie Error:', JSON.stringify(info));
      showToast('Failed to delete movie from Firestore.');
    }
  };

  // Firestore TV Show CRUD (Admin & Poster with ownership checks)
  const addEpisodeToShow = async (params: {
    showTitle: string;
    posterUrl?: string;
    trailerUrl?: string;
    seasonNumber: number;
    episodeNumber: number;
    episodeTitle: string;
    videoUrl: string;
    duration?: string;
    synopsis?: string;
  }) => {
    if (!isAdminAuthenticated) {
      showToast('Staff sign-in required to add TV episodes.');
      throw new Error('Staff authentication required');
    }

    const normalizedTitle = params.showTitle.trim();
    const existingShow = tvShows.find(
      (s) => s.title.toLowerCase() === normalizedTitle.toLowerCase()
    );

    if (existingShow && adminRole === 'Poster' && !isOwnedByCurrentStaff(existingShow)) {
      showToast('Posters can only edit TV Shows they posted.');
      throw new Error('Permission denied');
    }

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

    const targetDb = adminAuth.currentUser ? adminDb : db;
    const authorUid = adminAuth.currentUser?.uid || staffEmail || 'staff';
    const authorEmail = staffEmail || adminAuth.currentUser?.email?.toLowerCase() || '';

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

        const updatePayload: Record<string, unknown> = {
          seasons: updatedSeasons,
        };
        if (params.trailerUrl !== undefined && params.trailerUrl.trim()) {
          updatePayload.trailerUrl = params.trailerUrl.trim();
        }
        await updateDoc(doc(targetDb, 'tvshows', existingShow.id), updatePayload);
        showToast(`Added Season ${params.seasonNumber} Ep ${params.episodeNumber} to "${existingShow.title}"`);
      } else {
        const newShowPayload = {
          title: normalizedTitle,
          genre: 'Drama',
          year: new Date().getFullYear(),
          rating: 0,
          rating5: 0,
          ratingsCount: 0,
          ratingsByUser: {},
          viewsCount: 0,
          trailerUrl: (params.trailerUrl || '').trim(),
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
          createdBy: authorUid,
          createdByEmail: authorEmail,
        };
        await addDoc(collection(targetDb, 'tvshows'), newShowPayload);
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
    if (!isAdminAuthenticated) {
      showToast('Staff sign-in required.');
      return;
    }
    const target = tvShows.find((s) => s.id === showId);
    if (adminRole === 'Poster' && (!target || !isOwnedByCurrentStaff(target))) {
      showToast('Posters cannot delete Admin TV Shows.');
      return;
    }
    try {
      await deleteDoc(doc(adminAuth.currentUser ? adminDb : db, 'tvshows', showId));
      showToast('TV Show deleted from Firestore');
    } catch (error) {
      const info = buildFirestoreErrorInfo(error, OperationType.DELETE, `tvshows/${showId}`);
      console.error('Firestore Delete TV Show Error:', JSON.stringify(info));
      showToast('Failed to delete TV show.');
    }
  };

  // Live TV Playback & Watching Now Counter
  const openLiveChannel = (channel: LiveTVChannel) => {
    if (!ensureTrialAllowsPlayback()) return;
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

  // Admin & Poster CRUD: Add, Update, Delete Live TV Channels
  const addLiveChannel = async (channelData: {
    name: string;
    logoUrl: string;
    youtubeLiveUrl: string;
    description?: string;
    watchingNow?: number;
    isLive?: boolean;
  }) => {
    if (!isAdminAuthenticated) {
      showToast('Staff sign-in required to add Live TV channels.');
      throw new Error('Staff authentication required');
    }

    const authorUid = adminAuth.currentUser?.uid || staffEmail || 'staff';
    const authorEmail = staffEmail || adminAuth.currentUser?.email?.toLowerCase() || '';
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
      createdBy: authorUid,
      createdByEmail: authorEmail,
    };

    try {
      await setDoc(doc(adminAuth.currentUser ? adminDb : db, 'livetv', id), {
        ...newChannel,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: authorUid,
        createdByEmail: authorEmail,
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
    if (!isAdminAuthenticated) {
      showToast('Staff sign-in required to update Live TV channels.');
      throw new Error('Staff authentication required');
    }
    if (adminRole === 'Poster' && !isOwnedByCurrentStaff(channel)) {
      showToast('Posters can only edit Live TV channels they posted.');
      throw new Error('Permission denied');
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
        doc(adminAuth.currentUser ? adminDb : db, 'livetv', channel.id),
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
    if (!isAdminAuthenticated) {
      showToast('Staff sign-in required to delete Live TV channels.');
      return;
    }

    const target = liveChannels.find((c) => c.id === channelId);
    if (adminRole === 'Poster' && (!target || !isOwnedByCurrentStaff(target))) {
      showToast('Posters cannot delete Admin Live TV channels.');
      return;
    }

    const isDefault = DEFAULT_LIVE_CHANNELS.some((d) => d.id === channelId);
    try {
      if (isDefault) {
        await setDoc(
          doc(adminAuth.currentUser ? adminDb : db, 'livetv', channelId),
          { isDeleted: true, updatedAt: serverTimestamp() },
          { merge: true }
        );
      } else {
        await deleteDoc(doc(adminAuth.currentUser ? adminDb : db, 'livetv', channelId));
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

  // User account management (Admin only, synced to Firestore + localStorage)
  const addUser = (userData: Omit<UserAccount, 'id'>) => {
    const now = Date.now();
    const { trialStartDate, trialEndDate } = createInitialTrialDates(now);
    const newUser: UserAccount = {
      ...userData,
      id: `u_${now}`,
      createdAt: now,
      trialStartDate: userData.trialStartDate || trialStartDate,
      trialEndDate: userData.trialEndDate || trialEndDate,
      trialStatus: userData.isPaid ? 'Paid' : userData.trialStatus || 'Free Trial',
      isPaid: Boolean(userData.isPaid),
    };
    setUsers((prev) => [newUser, ...prev]);
    setDoc(
      doc(adminAuth.currentUser ? adminDb : db, 'users', newUser.id),
      { ...newUser, createdAt: serverTimestamp(), updatedAt: serverTimestamp() },
      { merge: true }
    ).catch(() => {});
    showToast(`Created user account for ${newUser.name}`);
  };

  const updateUser = (updatedUser: UserAccount) => {
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    if (currentUser && currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
      try {
        localStorage.setItem(`moviekart_ug_user_${updatedUser.id}_profile`, JSON.stringify(updatedUser));
      } catch {}
    }
    setDoc(
      doc(adminAuth.currentUser ? adminDb : db, 'users', updatedUser.id),
      {
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        subscription: updatedUser.subscription,
        status: updatedUser.status,
        momoProvider: updatedUser.momoProvider,
        trialStartDate: updatedUser.trialStartDate || Date.now(),
        trialEndDate: updatedUser.trialEndDate || Date.now() + TRIAL_DURATION_DAYS * MS_PER_DAY,
        trialStatus: updatedUser.trialStatus || 'Free Trial',
        isPaid: Boolean(updatedUser.isPaid),
        paidAt: updatedUser.paidAt || null,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    ).catch(() => {});
    showToast(`Updated user: ${updatedUser.name}`);
  };

  const setUserBillingStatus = async (userId: string, status: TrialStatus) => {
    const target = users.find((u) => u.id === userId);
    if (!target) return;
    const now = Date.now();
    let updated: UserAccount;
    if (status === 'Paid') {
      updated = {
        ...target,
        isPaid: true,
        trialStatus: 'Paid',
        paidAt: now,
        subscription: target.subscription === 'Free Pass' ? 'MovieKart VIP' : target.subscription,
        status: 'active',
      };
    } else if (status === 'Expired') {
      updated = {
        ...target,
        isPaid: false,
        trialStatus: 'Expired',
        trialEndDate: now - MS_PER_DAY,
        subscription: 'Free Pass',
      };
    } else {
      const freshDates = createInitialTrialDates(now);
      updated = {
        ...target,
        isPaid: false,
        trialStatus: 'Free Trial',
        trialStartDate: freshDates.trialStartDate,
        trialEndDate: freshDates.trialEndDate,
        subscription: 'Free Pass',
        status: 'active',
      };
    }
    updateUser(updated);
  };

  const subscribeCurrentUser = async (
    plan: 'MovieKart VIP' | 'Standard HD',
    momoProvider: 'MTN Mobile Money' | 'Airtel Money',
    momoPhone?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) {
      return { success: false, error: 'Please log in first.' };
    }
    const now = Date.now();
    const upgraded: UserAccount = {
      ...currentUser,
      isPaid: true,
      trialStatus: 'Paid',
      paidAt: now,
      subscription: plan,
      momoProvider,
      phone: momoPhone?.trim() ? momoPhone.trim() : currentUser.phone,
      status: 'active',
    };

    setCurrentUser(upgraded);
    setUsers((prev) => [upgraded, ...prev.filter((u) => u.id !== upgraded.id)]);
    try {
      localStorage.setItem(`moviekart_ug_user_${upgraded.id}_profile`, JSON.stringify(upgraded));
    } catch {}

    await setDoc(
      doc(db, 'users', upgraded.id),
      {
        isPaid: true,
        trialStatus: 'Paid',
        paidAt: now,
        subscription: plan,
        momoProvider,
        phone: upgraded.phone,
        status: 'active',
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    ).catch(() => {});

    setActiveTab('home');
    showToast(`Subscribed to ${plan}! Full unlimited streaming unlocked.`);
    return { success: true };
  };

  const deleteUser = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    deleteDoc(doc(adminAuth.currentUser ? adminDb : db, 'users', userId)).catch(() => {});
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

  // Local credential store helper (fallback for phone/offline accounts)
  const readLocalPasswords = (): Record<string, string> => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER_PASSWORDS);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  };

  const saveLocalPassword = (identifier: string, password: string) => {
    try {
      const map = readLocalPasswords();
      map[identifier.trim().toLowerCase()] = password;
      localStorage.setItem(STORAGE_KEYS.USER_PASSWORDS, JSON.stringify(map));
    } catch {}
  };

  const normalizeEmailOrPhone = (rawInput: string) => {
    const trimmed = rawInput.trim();
    const isEmail = trimmed.includes('@');
    if (isEmail) {
      const cleanEmail = trimmed.toLowerCase();
      return {
        isEmail: true,
        cleanEmail,
        firebaseEmail: cleanEmail,
        phoneDigits: '',
        formattedPhone: '',
        lookupKey: cleanEmail,
      };
    }
    let digits = trimmed.replace(/\D/g, '');
    if (digits.startsWith('0') && digits.length >= 9) {
      digits = `256${digits.slice(1)}`;
    } else if (digits.length === 9 && digits.startsWith('7')) {
      digits = `256${digits}`;
    }
    const formattedPhone = digits.startsWith('256')
      ? `+256 ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`.trim()
      : `+${digits}`;
    return {
      isEmail: false,
      cleanEmail: '',
      firebaseEmail: `u${digits}@phone.moviekart.ug`,
      phoneDigits: digits,
      formattedPhone,
      lookupKey: `phone:${digits}`,
    };
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

    const rawFbEmail = fbUser.email || localProfile.email || '';
    const isSyntheticPhoneEmail = rawFbEmail.endsWith('@phone.moviekart.ug');
    const baseEmail =
      (typeof remoteData?.email === 'string' && remoteData.email) ||
      (isSyntheticPhoneEmail ? '' : rawFbEmail);

    const basePhone =
      (typeof remoteData?.phone === 'string' && remoteData.phone) ||
      localProfile.phone ||
      fbUser.phoneNumber ||
      '';

    const baseUsername =
      (typeof remoteData?.username === 'string' && remoteData.username) ||
      localProfile.username ||
      deriveUsername(baseName, baseEmail || basePhone);

    const baseAvatar =
      (typeof remoteData?.avatar === 'string' && remoteData.avatar) ||
      localProfile.avatar ||
      fbUser.photoURL ||
      '/pwa-192x192.png';

    const creationMs =
      parseTimestampMs(remoteData?.trialStartDate) ||
      parseTimestampMs(remoteData?.createdAt) ||
      localProfile.trialStartDate ||
      localProfile.createdAt ||
      (fbUser.metadata?.creationTime ? Date.parse(fbUser.metadata.creationTime) : Date.now()) ||
      Date.now();

    const defaultTrial = createInitialTrialDates(creationMs);
    const trialStartDate =
      parseTimestampMs(remoteData?.trialStartDate) ||
      localProfile.trialStartDate ||
      defaultTrial.trialStartDate;
    const trialEndDate =
      parseTimestampMs(remoteData?.trialEndDate) ||
      localProfile.trialEndDate ||
      defaultTrial.trialEndDate;

    const isPaid =
      remoteData?.isPaid === true ||
      remoteData?.trialStatus === 'Paid' ||
      localProfile.isPaid === true ||
      localProfile.trialStatus === 'Paid';

    const joinedDate =
      (typeof remoteData?.joinedDate === 'string' && remoteData.joinedDate !== 'Just now' && remoteData.joinedDate) ||
      (localProfile.joinedDate && localProfile.joinedDate !== 'Just now' ? localProfile.joinedDate : '') ||
      new Date(creationMs).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

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
      phone: basePhone,
      avatar: baseAvatar,
      authProvider:
        fbUser.providerData?.some((p) => p.providerId === 'google.com')
          ? 'google'
          : isSyntheticPhoneEmail
            ? 'phone'
            : 'email',
      subscription:
        (typeof remoteData?.subscription === 'string'
          ? (remoteData.subscription as UserAccount['subscription'])
          : localProfile.subscription) || (isPaid ? 'MovieKart VIP' : 'Free Pass'),
      status:
        remoteData?.status === 'suspended' || localProfile.status === 'suspended'
          ? 'suspended'
          : 'active',
      joinedDate,
      createdAt: creationMs,
      trialStartDate,
      trialEndDate,
      trialStatus: isPaid
        ? 'Paid'
        : Date.now() >= trialEndDate
          ? 'Expired'
          : 'Free Trial',
      isPaid,
      paidAt: parseTimestampMs(remoteData?.paidAt) || localProfile.paidAt,
      momoProvider:
        (typeof remoteData?.momoProvider === 'string'
          ? (remoteData.momoProvider as UserAccount['momoProvider'])
          : localProfile.momoProvider) || 'MTN Mobile Money',
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
    markHasSignedUp();

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

    // Ensure initial user profile + 30-day free trial record exists in Firestore
    if (!remoteData || !remoteData.trialStartDate || !remoteData.trialEndDate) {
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
          subscription: hydratedUser.subscription,
          status: hydratedUser.status,
          joinedDate: hydratedUser.joinedDate,
          createdAt: hydratedUser.createdAt,
          trialStartDate: hydratedUser.trialStartDate,
          trialEndDate: hydratedUser.trialEndDate,
          trialStatus: hydratedUser.trialStatus,
          isPaid: hydratedUser.isPaid,
          momoProvider: hydratedUser.momoProvider,
          moviesWatchedCount: hydratedUser.moviesWatchedCount || 0,
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
    markHasSignedUp();
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
    setCurrentlyPlayingItem(null);
    setActiveLiveChannelId(null);
    setWatchlist([]);
    setWatchHistory([]);
    setDownloads([]);
    setContinueWatchingList([]);
    try {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
    } catch {}
    markHasSignedUp();
    setActiveTab('home');
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

  // Unified Forced-Gate Sign Up (Full Name + Email or Phone + Password) with automatic 30-Day Free Trial
  const signUpWithEmailOrPhone = async (
    fullName: string,
    emailOrPhone: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanName = fullName.trim();
    if (!cleanName || cleanName.length < 2) {
      return { success: false, error: 'Please enter your Full Name.' };
    }
    if (!emailOrPhone.trim()) {
      return { success: false, error: 'Please enter your Email or Phone number.' };
    }
    if (!password || password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    const parsed = normalizeEmailOrPhone(emailOrPhone);
    if (!parsed.isEmail && parsed.phoneDigits.length < 8) {
      return {
        success: false,
        error: 'Enter a valid email address or phone number (e.g. +256 772 123 456).',
      };
    }

    // Prevent duplicate signup in current users list
    const duplicate = users.find((u) => {
      if (parsed.isEmail) {
        return u.email && u.email.trim().toLowerCase() === parsed.cleanEmail;
      }
      const existingDigits = (u.phone || '').replace(/\D/g, '');
      return existingDigits && existingDigits === parsed.phoneDigits;
    });
    if (duplicate) {
      return {
        success: false,
        error: 'An account with this Email/Phone already exists. Please click Login.',
      };
    }

    const now = Date.now();
    const trialDates = createInitialTrialDates(now);
    const joinedDate = formatJoinDate();

    try {
      const cred = await createUserWithEmailAndPassword(auth, parsed.firebaseEmail, password);
      await updateProfile(cred.user, { displayName: cleanName }).catch(() => {});

      const newUser: UserAccount = {
        id: cred.user.uid,
        name: cleanName,
        username: deriveUsername(cleanName, parsed.cleanEmail || parsed.formattedPhone),
        email: parsed.isEmail ? parsed.cleanEmail : '',
        phone: parsed.isEmail ? '' : parsed.formattedPhone,
        avatar: '/pwa-192x192.png',
        authProvider: parsed.isEmail ? 'email' : 'phone',
        subscription: 'Free Pass',
        status: 'active',
        joinedDate,
        createdAt: now,
        trialStartDate: trialDates.trialStartDate,
        trialEndDate: trialDates.trialEndDate,
        trialStatus: 'Free Trial',
        isPaid: false,
        momoProvider: 'MTN Mobile Money',
        storageUsedMb: 0,
        downloadsCount: 0,
        moviesWatchedCount: 0,
      };

      saveLocalPassword(parsed.lookupKey, password);
      if (parsed.isEmail) saveLocalPassword(parsed.cleanEmail, password);

      await setDoc(
        doc(db, 'users', newUser.id),
        {
          ...newUser,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      ).catch(() => {});

      activateUserSession(newUser);
      setActiveTab('home');
      showToast(`Welcome, ${newUser.name}! Your 30-day Free Trial is now active.`);
      return { success: true };
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code || '';
      if (code === 'auth/email-already-in-use') {
        return {
          success: false,
          error: 'An account with this Email/Phone already exists. Please switch to Login.',
        };
      }
      if (code === 'auth/weak-password') {
        return { success: false, error: 'Password must be at least 6 characters.' };
      }
      if (code === 'auth/invalid-email') {
        return { success: false, error: 'Please enter a valid Email or Phone number.' };
      }

      // Fallback: Save directly to Firestore + localStorage if Firebase Auth is unavailable
      const fallbackId = parsed.isEmail
        ? `user_${now}_${Math.random().toString(36).slice(2, 7)}`
        : `phone_${parsed.phoneDigits}`;
      const fallbackUser: UserAccount = {
        id: fallbackId,
        name: cleanName,
        username: deriveUsername(cleanName, parsed.cleanEmail || parsed.formattedPhone),
        email: parsed.isEmail ? parsed.cleanEmail : '',
        phone: parsed.isEmail ? '' : parsed.formattedPhone,
        avatar: '/pwa-192x192.png',
        authProvider: parsed.isEmail ? 'email' : 'phone',
        subscription: 'Free Pass',
        status: 'active',
        joinedDate,
        createdAt: now,
        trialStartDate: trialDates.trialStartDate,
        trialEndDate: trialDates.trialEndDate,
        trialStatus: 'Free Trial',
        isPaid: false,
        momoProvider: 'MTN Mobile Money',
        storageUsedMb: 0,
        downloadsCount: 0,
        moviesWatchedCount: 0,
      };

      saveLocalPassword(parsed.lookupKey, password);
      if (parsed.isEmail) saveLocalPassword(parsed.cleanEmail, password);

      await setDoc(
        doc(db, 'users', fallbackUser.id),
        {
          ...fallbackUser,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      ).catch(() => {});

      activateUserSession(fallbackUser);
      setActiveTab('home');
      showToast(`Welcome, ${fallbackUser.name}! Your 30-day Free Trial is now active.`);
      return { success: true };
    }
  };

  // Unified Forced-Gate Login (Email or Phone + Password)
  const loginWithEmailOrPhone = async (
    emailOrPhone: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!emailOrPhone.trim()) {
      return { success: false, error: 'Please enter your Email or Phone number.' };
    }
    if (!password) {
      return { success: false, error: 'Please enter your password.' };
    }

    const parsed = normalizeEmailOrPhone(emailOrPhone);
    if (!parsed.isEmail && parsed.phoneDigits.length < 8) {
      return { success: false, error: 'Please enter a valid Email or Phone number.' };
    }

    try {
      const cred = await signInWithEmailAndPassword(auth, parsed.firebaseEmail, password);
      const user = await hydrateViewerFromFirebase(cred.user);
      if (user.status === 'suspended') {
        await signOut(auth).catch(() => {});
        setCurrentUser(null);
        return {
          success: false,
          error: 'This account has been suspended. Contact MovieKart UG support on WhatsApp.',
        };
      }
      saveLocalPassword(parsed.lookupKey, password);
      setActiveTab('home');
      showToast(`Welcome back, ${user.name}!`);
      return { success: true };
    } catch (error: unknown) {
      // Fallback: check local/Firestore users list with saved local password
      const passwordMap = readLocalPasswords();
      const expectedPassword =
        passwordMap[parsed.lookupKey] ||
        (parsed.isEmail ? passwordMap[parsed.cleanEmail] : undefined);

      const matchedUser = users.find((u) => {
        if (parsed.isEmail) {
          return u.email && u.email.trim().toLowerCase() === parsed.cleanEmail;
        }
        const existingDigits = (u.phone || '').replace(/\D/g, '');
        return existingDigits && existingDigits === parsed.phoneDigits;
      });

      if (matchedUser && expectedPassword && expectedPassword === password) {
        if (matchedUser.status === 'suspended') {
          return {
            success: false,
            error: 'This account has been suspended. Contact MovieKart UG support on WhatsApp.',
          };
        }
        activateUserSession(matchedUser);
        setActiveTab('home');
        showToast(`Welcome back, ${matchedUser.name}!`);
        return { success: true };
      }

      const code = (error as { code?: string })?.code || '';
      if (
        code === 'auth/invalid-credential' ||
        code === 'auth/wrong-password' ||
        code === 'auth/user-not-found'
      ) {
        return { success: false, error: 'Invalid Email/Phone or password.' };
      }
      if (code === 'auth/too-many-requests') {
        return { success: false, error: 'Too many failed login attempts. Try again shortly.' };
      }
      return {
        success: false,
        error: 'Invalid Email/Phone or password. If you are new, click Create Account.',
      };
    }
  };

  // Real Google Sign-In via Firebase GoogleAuthProvider
  const signUpWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const user = await hydrateViewerFromFirebase(result.user);
      setActiveTab('home');
      showToast(`Welcome, ${user.name}!`);
      return { success: true };
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code || '';
      let message = 'Google Sign-In failed. Please try Email/Phone & Password.';
      if (code === 'auth/popup-closed-by-user') {
        message = 'Google sign-in popup was closed before completing.';
      } else if (code === 'auth/popup-blocked') {
        message = 'Popup blocked by browser. Allow popups or use Email/Phone & Password.';
      } else if (code === 'auth/operation-not-allowed') {
        message = 'Google Sign-In is not enabled in Firebase Auth Console yet. Please use Email/Phone & Password.';
      } else if (code === 'auth/unauthorized-domain') {
        message = 'This domain is not authorized in Firebase Auth settings yet. Use Email/Phone & Password.';
      } else if (error instanceof Error && error.message) {
        message = error.message;
      }
      return { success: false, error: message };
    }
  };

  // Phone Sign-Up / Sign-In backed by Firestore + localStorage with 30-day free trial
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
          const createdMs =
            parseTimestampMs(data.trialStartDate) ||
            parseTimestampMs(data.createdAt) ||
            Date.now();
          const trialDates = createInitialTrialDates(createdMs);
          const isPaid = data.isPaid === true || data.trialStatus === 'Paid';
          existingUser = {
            id: docId,
            name: typeof data.name === 'string' ? data.name : displayName,
            username:
              typeof data.username === 'string'
                ? data.username
                : deriveUsername(displayName, ''),
            email: typeof data.email === 'string' ? data.email : '',
            phone: formattedPhone,
            avatar: typeof data.avatar === 'string' ? data.avatar : '/pwa-192x192.png',
            authProvider: 'phone',
            subscription: isPaid ? 'MovieKart VIP' : 'Free Pass',
            status: data.status === 'suspended' ? 'suspended' : 'active',
            joinedDate:
              typeof data.joinedDate === 'string' ? data.joinedDate : formatJoinDate(),
            createdAt: createdMs,
            trialStartDate: parseTimestampMs(data.trialStartDate) || trialDates.trialStartDate,
            trialEndDate: parseTimestampMs(data.trialEndDate) || trialDates.trialEndDate,
            trialStatus: isPaid ? 'Paid' : 'Free Trial',
            isPaid,
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
      const now = Date.now();
      const trialDates = createInitialTrialDates(now);
      existingUser = {
        id: docId,
        name: displayName,
        username: deriveUsername(displayName, ''),
        email: '',
        phone: formattedPhone,
        avatar: '/pwa-192x192.png',
        authProvider: 'phone',
        subscription: 'Free Pass',
        status: 'active',
        joinedDate: formatJoinDate(),
        createdAt: now,
        trialStartDate: trialDates.trialStartDate,
        trialEndDate: trialDates.trialEndDate,
        trialStatus: 'Free Trial',
        isPaid: false,
        momoProvider,
        storageUsedMb: 0,
        downloadsCount: 0,
        moviesWatchedCount: 0,
      };
      setDoc(
        doc(db, 'users', docId),
        {
          ...existingUser,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      ).catch(() => {});
    }

    activateUserSession(existingUser);
    setActiveTab('home');
    showToast(`Welcome, ${existingUser.name}! Your 30-day Free Trial is active.`);
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
      saveLocalPassword(cleanEmail, password);
      setCurrentUser(updatedWithMomo);
      localStorage.setItem(`moviekart_ug_user_${user.id}_profile`, JSON.stringify(updatedWithMomo));
      setDoc(doc(db, 'users', user.id), { momoProvider }, { merge: true }).catch(() => {});
      setActiveTab('home');
      showToast(`Account created for ${user.name}! 30-Day Free Trial started.`);
      return { success: true };
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code || '';
      if (code === 'auth/email-already-in-use') {
        return { success: false, error: 'An account with this email already exists. Please switch to Login.' };
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
    return loginWithEmailOrPhone(email, password);
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
        currentUserTrialInfo,
        hasSignedUpBefore,
        isAuthenticated,
        watchlist,
        downloads,
        deviceStorage,
        continueWatchingList,
        watchHistory,
        offlineMode,
        activeTab,
        selectedGenre,
        selectedVJ,
        searchQuery,
        selectedMovieForDetails,
        selectedShowForDetails,
        currentlyPlayingItem,
        selectedVJTrack,
        adminUser,
        adminAuthLoading,
        isAdminAuthenticated,
        adminRole,
        staffEmail,
        teamMembers,
        toastMessage,
        setActiveTab,
        setSelectedGenre,
        setSelectedVJ,
        setSearchQuery,
        toggleWatchlist,
        isInWatchlist,
        startDownload,
        pauseDownload,
        resumeDownload,
        deleteDownload,
        clearAllDownloads,
        getDownloadStatus,
        refreshDeviceStorage,
        playOfflineDownload,
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
        rateTVShow,
        getUserRating,
        setOfflineMode,
        setCurrentUser,
        signUpWithEmailOrPhone,
        loginWithEmailOrPhone,
        signUpWithGoogle,
        signUpWithPhone,
        signUpWithEmail,
        signInWithEmail,
        updateUserProfile,
        subscribeCurrentUser,
        setUserBillingStatus,
        logoutUser,
        switchUserAccount,
        loginAdminWithEmail,
        logoutAdmin,
        loginPosterWithEmail,
        logoutPoster,
        inviteTeamMember,
        removeTeamMember,
        isOwnedByCurrentStaff,
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
