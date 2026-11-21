import React, { useState } from 'react';
import { useMovieContext } from '../context/MovieContext';
import { CommentsSection } from './CommentsSection';
import {
  X,
  Play,
  Plus,
  Check,
  Star,
  Download,
  CheckCircle2,
  Loader2,
  Layers,
  ChevronDown,
  Eye,
  LogIn
} from 'lucide-react';
import { Episode } from '../types';

function formatViewCount(views?: number): string {
  const n = Math.max(0, Math.floor(views || 0));
  return `${n.toLocaleString()} ${n === 1 ? 'view' : 'views'}`;
}

export const TVShowDetailsModal: React.FC = () => {
  const {
    selectedShowForDetails,
    closeShowDetails,
    playEpisode,
    playTrailer,
    toggleWatchlist,
    isInWatchlist,
    startDownload,
    getDownloadStatus,
    rateTVShow,
    currentUser,
    setActiveTab
  } = useMovieContext();

  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number>(1);
  const [selectedVJId, setSelectedVJId] = useState<string | undefined>(undefined);
  const [hoverRating, setHoverRating] = useState<number>(0);

  if (!selectedShowForDetails) return null;

  const show = selectedShowForDetails;
  const inWatchlist = isInWatchlist(show.id);
  const seasons = show.seasons || [];
  const hasTrailer = Boolean(show.trailerUrl && show.trailerUrl.trim());
  const viewsCount = Math.max(0, Math.floor(show.viewsCount || 0));
  const ratingsCount = show.ratingsCount || 0;
  const hasRatings = ratingsCount > 0 && (show.rating5 || 0) > 0;
  const currentRating5 = hasRatings ? (show.rating5 as number) : 0;
  const userRatedScore = show.userRating;

  const currentSeason =
    seasons.find((s) => s.seasonNumber === selectedSeasonNumber) || seasons[0] || {
      seasonNumber: 1,
      title: 'Season 1',
      episodes: []
    };

  const tracks = show.vjTracks || [];
  const activeTrack = selectedVJId
    ? tracks.find((t) => t.id === selectedVJId)
    : tracks.find((t) => t.isDefault) || tracks[0];

  const handlePlayEp = (episode: Episode) => {
    closeShowDetails();
    playEpisode(show, currentSeason.seasonNumber, episode, activeTrack?.id);
  };

  const handleDownloadEpisode = (episode: Episode) => {
    startDownload({
      id: episode.id,
      title: `${show.title} - S${currentSeason.seasonNumber}:E${episode.episodeNumber}`,
      genre: show.genre,
      posterUrl: episode.thumbnailUrl || show.posterUrl,
      videoUrl: episode.videoUrl,
      fileSizeMb: episode.fileSizeMb || 240,
      isEpisode: true,
      episodeTitle: episode.title
    });
  };

  const handleRequireLogin = () => {
    closeShowDetails();
    setActiveTab('profile');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl my-auto bg-[#0f0f16] border border-white/10 rounded-none sm:rounded-3xl shadow-2xl overflow-hidden transition-all text-white">
        {/* Close Button */}
        <button
          type="button"
          onClick={closeShowDetails}
          aria-label="Close modal"
          className="absolute top-4 right-4 z-30 p-2 rounded-full bg-black/70 hover:bg-black/90 text-white border border-white/20 transition-all hover:scale-105 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Backdrop Header */}
        <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-black">
          <img
            src={show.backdropUrl || show.posterUrl}
            alt={show.title}
            className="w-full h-full object-cover filter brightness-[0.6]"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f16] via-[#0f0f16]/60 to-transparent" />

          {/* Header metadata */}
          <div className="absolute bottom-4 left-4 sm:left-6 right-4">
            <div className="flex flex-wrap items-center gap-2 text-xs mb-1.5">
              <span className="bg-[#E50914] font-bold px-2 py-0.5 rounded text-[11px] uppercase tracking-wide">
                TV Series · {show.genre}
              </span>
              <span className="text-amber-400 font-bold flex items-center gap-1 tabular-nums">
                <Star className={`w-3.5 h-3.5 ${hasRatings ? 'fill-amber-400 text-amber-400' : 'text-amber-400/70'}`} />
                {hasRatings ? `${currentRating5.toFixed(1)} / 5 (${ratingsCount})` : 'No ratings yet'}
              </span>
              <span className="text-gray-500">·</span>
              <span className="text-gray-300 tabular-nums">{show.year}</span>
              <span className="text-gray-500">·</span>
              <span className="text-gray-300 tabular-nums">
                {seasons.length} {seasons.length === 1 ? 'Season' : 'Seasons'}
              </span>
              <span className="text-gray-500">·</span>
              <span className="border border-white/20 px-1.5 py-0.5 rounded text-[10px] text-gray-300">
                {show.quality}
              </span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold font-['Outfit'] tracking-tight leading-tight">
              {show.title}
            </h2>

            {/* Real View Count under TV Show Title */}
            <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs sm:text-sm text-gray-300 font-semibold tabular-nums">
              <span className="inline-flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-red-400" />
                <span>{formatViewCount(viewsCount)}</span>
              </span>
              {userRatedScore && (
                <>
                  <span className="text-gray-500">·</span>
                  <span className="text-amber-300 text-xs">Your rating: {userRatedScore}★</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-6">
          {/* Action Row: Play + ▶ Trailer (hidden if no trailer link) + Watchlist */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/5">
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              {currentSeason.episodes.length > 0 && (
                <button
                  type="button"
                  onClick={() => handlePlayEp(currentSeason.episodes[0])}
                  className="flex items-center gap-2 px-5 sm:px-6 py-2.5 bg-[#E50914] hover:bg-red-700 active:scale-95 text-white font-bold text-sm rounded-xl shadow-lg shadow-red-600/30 transition-all cursor-pointer whitespace-nowrap"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Watch S{currentSeason.seasonNumber} E1</span>
                </button>
              )}

              {/* ▶ Trailer Button (Shown ONLY if TV show has a trailer link) */}
              {hasTrailer && (
                <button
                  type="button"
                  onClick={() => {
                    closeShowDetails();
                    playTrailer(show);
                  }}
                  className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-red-950/75 via-[#181822] to-[#14141c] hover:from-red-900 hover:to-[#1f1f2b] text-white border border-red-500/50 hover:border-red-400 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                >
                  <Play className="w-4 h-4 fill-red-400 text-red-400" />
                  <span>Trailer</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => toggleWatchlist(show.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                  inWatchlist
                    ? 'bg-[#E50914] text-white border-red-500'
                    : 'bg-white/5 hover:bg-white/10 text-gray-200 border-white/10'
                }`}
              >
                {inWatchlist ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                <span>{inWatchlist ? 'In Watchlist' : 'Watchlist'}</span>
              </button>
            </div>

            {/* VJ Audio selection */}
            {tracks.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Audio:</span>
                <select
                  value={activeTrack?.id || ''}
                  onChange={(e) => setSelectedVJId(e.target.value)}
                  className="bg-[#181824] text-xs font-bold text-red-400 border border-white/10 rounded-xl px-2.5 py-1.5 focus:outline-none cursor-pointer"
                >
                  {tracks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.language})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Real 5-Star Rating Bar for TV Show */}
          <div className="bg-[#14141d] border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="flex flex-col items-center justify-center bg-black/50 border border-white/10 rounded-xl px-3 py-2 min-w-[96px] text-center">
                {hasRatings ? (
                  <>
                    <div className="flex items-center gap-1 text-xl font-extrabold text-amber-400 font-['Outfit'] tabular-nums">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span>{currentRating5.toFixed(1)}</span>
                    </div>
                    <span className="text-[10px] text-gray-400 tabular-nums">
                      {ratingsCount} {ratingsCount === 1 ? 'rating' : 'ratings'}
                    </span>
                  </>
                ) : (
                  <span className="text-[11px] font-bold text-gray-300">No ratings yet</span>
                )}
              </div>

              <div>
                <h4 className="text-sm font-bold text-white font-['Outfit']">Rate this Series</h4>
                <p className="text-xs text-gray-400">
                  {!currentUser
                    ? 'Log in to tap stars (1–5) and rate'
                    : userRatedScore
                      ? `Your rating: ${userRatedScore}★ · Tap to update`
                      : 'Tap stars (1–5) to rate this TV show'}
                </p>
              </div>
            </div>

            {currentUser ? (
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((starValue) => {
                  const isHighlighted = (hoverRating || userRatedScore || 0) >= starValue;
                  return (
                    <button
                      key={starValue}
                      type="button"
                      onMouseEnter={() => setHoverRating(starValue)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => rateTVShow(show.id, starValue)}
                      className="p-1 rounded-lg hover:scale-125 active:scale-95 transition-all cursor-pointer"
                      aria-label={`Rate ${starValue} star${starValue > 1 ? 's' : ''}`}
                    >
                      <Star
                        className={`w-6 h-6 transition-colors ${
                          isHighlighted ? 'fill-amber-400 text-amber-400' : 'text-gray-600 hover:text-gray-400'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            ) : (
              <button
                type="button"
                onClick={handleRequireLogin}
                className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-bold text-white cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 text-[#E50914]" />
                <span>Login to Rate</span>
              </button>
            )}
          </div>

          {/* Synopsis & Creator */}
          <div>
            <p className="text-sm sm:text-base text-gray-200 leading-relaxed">
              {show.synopsis}
            </p>
            <p className="text-xs text-gray-400 mt-2">
              <strong className="text-gray-300">Creator / Director:</strong> {show.creator}
              {show.cast.length > 0 && (
                <>
                  {' '}· <strong className="text-gray-300">Cast:</strong> {show.cast.join(', ')}
                </>
              )}
            </p>
          </div>

          {/* SEASONS & EPISODES */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-red-500" />
                <h3 className="text-base sm:text-lg font-bold text-white font-['Outfit']">
                  Episodes & Seasons
                </h3>
              </div>

              <div className="relative">
                <select
                  value={selectedSeasonNumber}
                  onChange={(e) => setSelectedSeasonNumber(Number(e.target.value))}
                  aria-label="Select Season"
                  className="bg-[#181824] text-sm font-bold text-white border border-red-500/40 rounded-xl px-4 py-2 pr-8 appearance-none focus:outline-none focus:ring-1 focus:ring-red-500 cursor-pointer shadow-md"
                >
                  {seasons.map((s) => (
                    <option key={s.seasonNumber} value={s.seasonNumber}>
                      Season {s.seasonNumber} ({s.episodes.length} Episodes)
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-3">
              {currentSeason.episodes.map((ep) => {
                const epDownload = getDownloadStatus(ep.id);
                const isDownloaded = epDownload?.status === 'completed';
                const isDownloading = epDownload?.status === 'downloading';

                return (
                  <div
                    key={ep.id}
                    onClick={() => handlePlayEp(ep)}
                    className="group flex flex-col sm:flex-row items-start sm:items-center gap-3.5 p-3 rounded-2xl bg-[#14141c] hover:bg-[#1a1a24] border border-white/5 hover:border-red-500/40 transition-all cursor-pointer shadow-sm hover:shadow-md"
                  >
                    <div className="hidden sm:flex w-8 items-center justify-center font-extrabold text-base text-gray-400 group-hover:text-red-500 font-mono">
                      {ep.episodeNumber}
                    </div>

                    <div className="relative aspect-video w-full sm:w-44 shrink-0 rounded-xl overflow-hidden bg-black/40">
                      <img
                        src={ep.thumbnailUrl}
                        alt={ep.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                        <div className="w-9 h-9 rounded-full bg-[#E50914] group-hover:bg-red-500 text-white flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                          <Play className="w-4 h-4 fill-white translate-x-0.5" />
                        </div>
                      </div>
                      <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded text-gray-200">
                        {ep.duration}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-bold text-sm text-white group-hover:text-red-400 transition-colors truncate font-['Outfit']">
                          {ep.title}
                        </h4>
                        <span className="sm:hidden text-xs text-gray-400 font-mono">{ep.duration}</span>
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-2 mt-1 leading-relaxed">
                        {ep.synopsis}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadEpisode(ep);
                        }}
                        disabled={isDownloaded || isDownloading}
                        title={
                          isDownloaded
                            ? 'Downloaded'
                            : isDownloading
                            ? `Downloading ${epDownload?.progress}%`
                            : 'Download Episode'
                        }
                        className={`p-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                          isDownloaded
                            ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30'
                            : isDownloading
                            ? 'bg-amber-600/20 text-amber-300 border-amber-500/30'
                            : 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/10'
                        }`}
                      >
                        {isDownloaded ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : isDownloading ? (
                          <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayEp(ep);
                        }}
                        className="px-3.5 py-2 bg-[#E50914] hover:bg-red-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm shadow-red-600/30 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>Play</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* REAL FIREBASE COMMENTS SECTION */}
          <CommentsSection
            mediaId={show.id}
            mediaType="tvshow"
            ownerMeta={{ createdBy: show.createdBy, createdByEmail: show.createdByEmail }}
            onRequireLogin={handleRequireLogin}
          />

          {/* Series Help / Request via WhatsApp */}
          <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p className="text-xs text-gray-400">
              Need help with <span className="text-gray-200 font-semibold">{show.title}</span>? Contact WhatsApp Support:{' '}
              <span className="text-[#25D366] font-bold">+256 741 094 332</span>
            </p>
            <a
              href="https://wa.me/256741094332"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] text-black text-xs font-extrabold transition-all shadow-md active:scale-95 shrink-0"
            >
              <span>WhatsApp +256 741 094 332</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
