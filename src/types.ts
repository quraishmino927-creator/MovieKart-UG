export type Genre =
  | 'All'
  | 'Action'
  | 'Drama'
  | 'Sci-Fi'
  | 'Comedy'
  | 'Ugandan Hits'
  | 'Thriller'
  | 'Animation';

export const NAMED_VJS = [
  'VJ Ice P',
  'VJ Emmy',
  'VJ Junior',
  'VJ Kevo',
  'VJ Uncle T',
  'VJ Ulio',
  'VJ Soul',
  'VJ Jingo',
  'VJ Tonny',
  'VJ Neil',
  'VJ Nelly',
  'VJ HD',
  'VJ Sammy',
  'VJ Shield',
  'VJ Banks',
  'VJ IVO',
  'VJ Little T',
] as const;

export const VJ_FILTER_OPTIONS = [
  'All VJs',
  ...NAMED_VJS,
  'Other VJs',
] as const;

export type VJFilter = (typeof VJ_FILTER_OPTIONS)[number];

export type ContentMode = 'movies' | 'tvshows' | 'livetv';

export type TrialStatus = 'Free Trial' | 'Paid' | 'Expired';

export type TeamRole = 'Admin' | 'Poster';

export interface TeamMember {
  id: string;
  email: string;
  role: TeamRole;
  password?: string;
  invitedBy?: string;
  createdAt?: number;
  status?: 'active' | 'removed';
}

export interface LiveTVChannel {
  id: string;
  name: string;
  logoUrl: string;
  youtubeLiveUrl: string;
  description?: string;
  watchingNow: number;
  isLive?: boolean;
  isDeleted?: boolean;
  order?: number;
  createdAt?: number;
  updatedAt?: number;
  createdBy?: string;
  createdByEmail?: string;
}

export interface VJTrack {
  id: string;
  name: string; // e.g., 'VJ Junior', 'VJ Emmy', 'VJ Jingo', 'Original English'
  language: string; // 'Luganda', 'English', 'Swahili'
  isDefault?: boolean;
  commentaryQuotes: string[];
}

export interface Movie {
  id: string;
  title: string;
  genre: Genre;
  year: number;
  duration: string;
  rating: number; // e.g. 8.7
  ageRating: '13+' | '16+' | '18+' | 'PG';
  quality: '4K UHD' | '1080p FHD' | '720p HD';
  posterUrl: string;
  backdropUrl: string;
  description?: string;
  synopsis: string;
  director: string;
  cast: string[];
  videoUrl: string;
  trailerUrl?: string;
  fileSizeMb: number;
  isTrending?: boolean;
  isFeatured?: boolean;
  isUgandanExclusive?: boolean;
  vjName?: string;
  vjTracks: VJTrack[];
  viewsCount?: number;
  rating5?: number; // 5-star scale average rating (1.0 - 5.0)
  ratingsCount?: number; // total ratings submitted
  userRating?: number; // rating submitted by current user (1 - 5)
  createdAt?: number;
  createdBy?: string;
  createdByEmail?: string;
}

export interface Episode {
  id: string;
  episodeNumber: number;
  title: string;
  duration: string;
  thumbnailUrl: string;
  videoUrl: string;
  synopsis: string;
  fileSizeMb: number;
}

export interface Season {
  seasonNumber: number;
  title: string; // e.g. "Season 1"
  episodes: Episode[];
}

export interface TVShow {
  id: string;
  title: string;
  genre: Genre;
  year: number;
  rating: number;
  ageRating: '13+' | '16+' | '18+' | 'PG';
  quality: '4K UHD' | '1080p FHD' | '720p HD';
  posterUrl: string;
  backdropUrl: string;
  synopsis: string;
  creator: string;
  cast: string[];
  isTrending?: boolean;
  isFeatured?: boolean;
  isUgandanExclusive?: boolean;
  vjTracks: VJTrack[];
  seasonsCount?: number;
  seasons: Season[];
  viewsCount?: number;
  rating5?: number;
  ratingsCount?: number;
  userRating?: number;
  createdBy?: string;
  createdByEmail?: string;
}

export interface PlayableItem {
  id: string;
  movieId?: string;
  showId?: string;
  title: string;
  subTitle?: string; // e.g., "Season 1, Ep 2: Old Taxi Park Trap"
  showTitle?: string;
  seasonNumber?: number;
  episodeNumber?: number;
  videoUrl: string;
  posterUrl: string;
  backdropUrl?: string;
  year?: number;
  quality?: string;
  vjTracks?: VJTrack[];
  fileSizeMb?: number;
  isTrailer?: boolean;
  startTime?: number; // timestamp in seconds to resume playback from
}

export interface ContinueWatchingItem {
  id: string; // unique item id (e.g. movieId 'm3' or episodeId 'tv1_s1_e2')
  itemId: string; // underlying movie or episode id
  type: 'movie' | 'episode';
  title: string;
  showTitle?: string;
  seasonNumber?: number;
  episodeNumber?: number;
  thumbnailUrl: string;
  backdropUrl?: string;
  videoUrl: string;
  genre: string;
  durationString: string;
  currentTime: number;
  duration: number;
  progressPercentage: number; // 0 - 100
  lastWatchedAt: number;
  vjTrackName?: string;
  vjTrackId?: string;
}

export interface DownloadItem {
  movieId: string;
  movieTitle: string;
  genre: string;
  posterUrl: string;
  videoUrl: string;
  quality: string;
  fileSizeMb: number;
  progress: number; // 0 - 100
  status: 'downloading' | 'completed' | 'paused' | 'error';
  speedMbps: number;
  downloadedAt?: string;
  isEpisode?: boolean;
  episodeTitle?: string;
}

export interface WatchHistoryItem {
  id: string;
  itemId: string;
  type: 'movie' | 'episode';
  title: string;
  showTitle?: string;
  seasonNumber?: number;
  episodeNumber?: number;
  posterUrl: string;
  videoUrl: string;
  genre?: string;
  duration?: string;
  year?: number;
  watchedAt: number;
}

export interface UserAccount {
  id: string;
  name: string;
  username?: string;
  email: string;
  phone: string;
  avatar: string;
  authProvider?: 'google' | 'phone' | 'email';
  subscription: 'MovieKart VIP' | 'Standard HD' | 'Free Pass';
  status: 'active' | 'suspended';
  joinedDate: string;
  createdAt?: number;
  trialStartDate?: number;
  trialEndDate?: number;
  trialStatus?: TrialStatus;
  isPaid?: boolean;
  paidAt?: number;
  momoProvider: 'MTN Mobile Money' | 'Airtel Money';
  storageUsedMb: number;
  downloadsCount: number;
  moviesWatchedCount?: number;
}

export type ActiveTab = 'home' | 'livetv' | 'search' | 'watchlist' | 'downloads' | 'profile' | 'admin';
