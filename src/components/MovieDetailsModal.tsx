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
  Volume2,
  Share2,
  Film,
  Eye,
  LogIn
} from 'lucide-react';

function formatViewCount(views?: number): string {
  const n = Math.max(0, Math.floor(views || 0));
  return `${n.toLocaleString()} ${n === 1 ? 'view' : 'views'}`;
}

export const MovieDetailsModal: React.FC = () => {
  const {
    selectedMovieForDetails,
    closeMovieDetails,
    playMovie,
    playTrailer,
    toggleWatchlist,
    isInWatchlist,
    startDownload,
    getDownloadStatus,
    rateMovie,
    openMovieDetails,
    movies,
    currentUser,
    setActiveTab,
    showToast
  } = useMovieContext();

  const [selectedVJId, setSelectedVJId] = useState<string | undefined>(undefined);
  const [downloadQuality, setDownloadQuality] = useState<string>('1080p FHD');
  const [hoverRating, setHoverRating] = useState<number>(0);

  if (!selectedMovieForDetails) return null;

  const movie = selectedMovieForDetails;
  const inWatchlist = isInWatchlist(movie.id);
  const downloadInfo = getDownloadStatus(movie.id);
  const isDownloaded = downloadInfo?.status === 'completed';
  const isDownloading = downloadInfo?.status === 'downloading';

  // Strict real ratings (start from 0 — no fake fallback)
  const ratingsCount = movie.ratingsCount || 0;
  const hasRatings = ratingsCount > 0 && (movie.rating5 || 0) > 0;
  const currentRating5 = hasRatings ? (movie.rating5 as number) : 0;
  const userRatedScore = movie.userRating;
  const ratingsValues = Object.values(movie.ratingsByUser || {});
  const hasTrailer = Boolean(movie.trailerUrl && movie.trailerUrl.trim());
  const viewsCount = Math.max(0, Math.floor(movie.viewsCount || 0));

  // Available VJ tracks
  const tracks = movie.vjTracks || [];
  const activeTrack = selectedVJId
    ? tracks.find((t) => t.id === selectedVJId)
    : tracks.find((t) => t.isDefault) || tracks[0];

  // Related movies from same genre
  const relatedMovies = movies
    .filter((m) => m.genre === movie.genre && m.id !== movie.id)
    .slice(0, 4);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `MovieKart UG: ${movie.title}`,
        text: `Watch ${movie.title} with VJ commentary on MovieKart UG!`,
        url: window.location.href
      }).catch(() => {});
    } else {
      showToast('Movie link copied to clipboard!');
    }
  };

  const handleRequireLogin = () => {
    closeMovieDetails();
    setActiveTab('profile');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl my-auto bg-[#0f0f15] border border-white/10 rounded-none sm:rounded-3xl shadow-2xl overflow-hidden transition-all text-white">
        {/* Close Button */}
        <button
          type="button"
          onClick={closeMovieDetails}
          aria-label="Close modal"
          className="absolute top-4 right-4 z-30 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition-all hover:scale-105 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Backdrop Header */}
        <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-black">
          <img
            src={movie.backdropUrl || movie.posterUrl}
            alt={movie.title}
            className="w-full h-full object-cover filter brightness-[0.65]"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f15] via-[#0f0f15]/50 to-transparent" />

          {/* Title, Views & Metadata inside header */}
          <div className="absolute bottom-4 left-4 sm:left-6 right-4 flex items-end justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs mb-1.5">
                <span className="bg-[#E50914] font-bold px-2 py-0.5 rounded text-[11px] uppercase tracking-wide">
                  {movie.genre}
                </span>
                <span className="text-amber-400 font-bold flex items-center gap-1 tabular-nums">
                  <Star className={`w-3.5 h-3.5 ${hasRatings ? 'fill-amber-400 text-amber-400' : 'text-amber-400/70'}`} />
                  {hasRatings ? `${currentRating5.toFixed(1)} / 5 (${ratingsCount})` : 'No ratings yet'}
                </span>
                <span className="text-gray-500">·</span>
                <span className="text-gray-300 tabular-nums">{movie.year}</span>
                <span className="text-gray-500">·</span>
                <span className="text-gray-300">{movie.duration}</span>
                <span className="text-gray-500">·</span>
                <span className="border border-white/20 px-1.5 py-0.5 rounded text-[10px] text-gray-300">
                  {movie.quality}
                </span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-extrabold font-['Outfit'] tracking-tight leading-tight">
                {movie.title}
              </h2>

              {/* Real View Count under Movie Title (Visible to everyone, starts at 0) */}
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
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-6">
          {/* Main Action Buttons Bar: Play Now + ▶ Trailer (hidden if no trailer link) + Download + Watchlist + Share */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {/* Play / Watch Now (Red Button — adds +1 view in Firebase) */}
            <button
              type="button"
              onClick={() => {
                closeMovieDetails();
                playMovie(movie, activeTrack?.id);
              }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 sm:px-7 py-3 bg-[#E50914] hover:bg-red-700 active:scale-95 text-white font-bold text-sm sm:text-base rounded-xl transition-all shadow-lg shadow-red-600/30 cursor-pointer whitespace-nowrap"
            >
              <Play className="w-5 h-5 fill-white text-white shrink-0" />
              <span>Watch Now</span>
            </button>

            {/* ▶ Trailer Button (Shown ONLY if movie has a trailer link) */}
            {hasTrailer && (
              <button
                type="button"
                onClick={() => {
                  closeMovieDetails();
                  playTrailer(movie);
                }}
                className="flex items-center justify-center gap-2 px-4 sm:px-5 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-red-950/75 via-[#181822] to-[#14141c] hover:from-red-900 hover:to-[#1f1f2b] text-white border border-red-500/50 hover:border-red-400 active:scale-95 transition-all shadow-md cursor-pointer whitespace-nowrap"
                title={`Play Trailer for ${movie.title}`}
              >
                <Play className="w-4 h-4 fill-red-400 text-red-400 shrink-0" />
                <span>Trailer</span>
              </button>
            )}

            {/* Offline Download button */}
            <button
              type="button"
              onClick={() => {
                if (!isDownloaded && !isDownloading) {
                  startDownload(movie, downloadQuality);
                }
              }}
              disabled={isDownloaded || isDownloading}
              className={`flex items-center justify-center gap-2 px-3.5 sm:px-4 py-3 rounded-xl font-medium text-xs sm:text-sm border transition-all cursor-pointer whitespace-nowrap ${
                isDownloaded
                  ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30'
                  : isDownloading
                  ? 'bg-amber-600/20 text-amber-300 border-amber-500/30'
                  : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
              }`}
            >
              {isDownloaded ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Downloaded</span>
                </>
              ) : isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-300 shrink-0" />
                  <span>{downloadInfo?.progress}%</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 shrink-0" />
                  <span>Download</span>
                </>
              )}
            </button>

            {/* Watchlist toggle */}
            <button
              type="button"
              onClick={() => toggleWatchlist(movie.id)}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                inWatchlist
                  ? 'bg-[#E50914] text-white border-red-500'
                  : 'bg-white/5 hover:bg-white/10 text-gray-200 border-white/10'
              }`}
              title={inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
            >
              {inWatchlist ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </button>

            {/* Share */}
            <button
              type="button"
              onClick={handleShare}
              className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 transition-colors cursor-pointer"
              title="Share Film"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>

          {/* REAL 5-STAR RATING SYSTEM (Starts at 0 / "No ratings yet", 1 rating per user, saved in Firebase) */}
          <div className="bg-[#14141d] border border-white/10 rounded-2xl p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Real Average Rating Block */}
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-center justify-center bg-black/50 border border-white/10 rounded-2xl p-3 min-w-[104px] text-center">
                  {hasRatings ? (
                    <>
                      <div className="flex items-center gap-1 text-2xl sm:text-3xl font-extrabold text-amber-400 font-['Outfit'] tabular-nums">
                        <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                        <span>{currentRating5.toFixed(1)}</span>
                      </div>
                      <span className="text-[10px] text-gray-400 font-semibold mt-0.5 tabular-nums">
                        {ratingsCount} {ratingsCount === 1 ? 'rating' : 'ratings'}
                      </span>
                    </>
                  ) : (
                    <>
                      <Star className="w-6 h-6 text-gray-500 mb-1" />
                      <span className="text-[11px] font-bold text-gray-300 leading-tight">
                        No ratings yet
                      </span>
                    </>
                  )}
                </div>

                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-white font-['Outfit']">
                    Rate this Movie
                  </h4>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {!currentUser
                      ? 'Log in to tap stars (1–5) and submit your rating'
                      : userRatedScore
                        ? `Your rating: ${userRatedScore} of 5 stars · Tap any star to update`
                        : 'Tap a star (1–5) to be the first to rate this movie'}
                  </p>

                  {currentUser ? (
                    <div className="flex items-center gap-1 mt-2">
                      {[1, 2, 3, 4, 5].map((starValue) => {
                        const isHighlighted = (hoverRating || userRatedScore || 0) >= starValue;
                        return (
                          <button
                            key={starValue}
                            type="button"
                            onMouseEnter={() => setHoverRating(starValue)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => rateMovie(movie.id, starValue)}
                            className="p-1 rounded-lg hover:scale-125 active:scale-95 transition-all cursor-pointer focus:outline-none"
                            title={`Rate ${starValue} star${starValue > 1 ? 's' : ''}`}
                            aria-label={`Rate ${starValue} star${starValue > 1 ? 's' : ''}`}
                          >
                            <Star
                              className={`w-6 h-6 sm:w-7 sm:h-7 transition-colors ${
                                isHighlighted
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-gray-600 hover:text-gray-400'
                              }`}
                            />
                          </button>
                        );
                      })}
                      {(hoverRating > 0 || userRatedScore) && (
                        <span className="text-xs font-bold text-amber-400 ml-2 font-mono tabular-nums">
                          {hoverRating > 0 ? `${hoverRating}/5` : `${userRatedScore}/5`}
                        </span>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleRequireLogin}
                      className="mt-2.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-bold text-white cursor-pointer transition-colors"
                    >
                      <LogIn className="w-3.5 h-3.5 text-[#E50914]" />
                      <span>Login to Rate</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Real Rating Distribution Breakdown (0% when unrated, real % from ratingsByUser) */}
              <div className="hidden sm:flex flex-col gap-1 w-44 text-[10px] text-gray-400 bg-black/30 p-2.5 rounded-xl border border-white/5 tabular-nums">
                {[5, 4, 3, 2, 1].map((starNum) => {
                  const starHits = ratingsValues.filter((v) => v === starNum).length;
                  const pct = ratingsCount > 0 ? Math.round((starHits / ratingsCount) * 100) : 0;
                  const isUserSelected = userRatedScore === starNum;
                  return (
                    <div key={starNum} className="flex items-center gap-1.5">
                      <span className="w-4 text-right font-bold text-gray-300">{starNum}★</span>
                      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isUserSelected ? 'bg-[#E50914]' : 'bg-amber-400'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-5 text-right text-gray-500">{starHits}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* VJ Audio Translation Selector */}
          {tracks.length > 0 && (
            <div className="bg-[#151520] border border-white/5 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-red-500" />
                  <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                    Audio Track / VJ Commentary (Uganda)
                  </h4>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {tracks.map((track) => {
                  const isSelected = activeTrack?.id === track.id;
                  return (
                    <button
                      key={track.id}
                      type="button"
                      onClick={() => setSelectedVJId(track.id)}
                      className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-red-950/40 border-red-500 text-white shadow-sm'
                          : 'bg-black/30 border-white/5 hover:border-white/10 text-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-white">{track.name}</span>
                        {track.isDefault && (
                          <span className="text-[9px] bg-red-600 text-white px-1 py-0.5 rounded font-semibold">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400">{track.language}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Synopsis */}
          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Synopsis
            </h4>
            <p className="text-sm sm:text-base text-gray-200 leading-relaxed">
              {movie.synopsis}
            </p>
          </div>

          {(movie.director || (movie.cast && movie.cast.length > 0)) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/5 text-xs sm:text-sm">
              {movie.director && (
                <div>
                  <span className="text-gray-400 font-medium block mb-1">Director</span>
                  <p className="text-white font-semibold">{movie.director}</p>
                </div>
              )}
              {movie.cast && movie.cast.length > 0 && (
                <div>
                  <span className="text-gray-400 font-medium block mb-1">Starring Cast</span>
                  <p className="text-white font-semibold">{movie.cast.join(', ')}</p>
                </div>
              )}
            </div>
          )}

          {/* Download Quality Preference */}
          <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-gray-400">Offline Download Quality:</span>
            <div className="flex items-center gap-1.5">
              {['4K UHD', '1080p FHD', '720p Data Saver'].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setDownloadQuality(q)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors cursor-pointer ${
                    downloadQuality === q
                      ? 'bg-[#E50914] text-white border-red-500'
                      : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* REAL FIREBASE COMMENTS SECTION */}
          <CommentsSection
            mediaId={movie.id}
            mediaType="movie"
            ownerMeta={{ createdBy: movie.createdBy, createdByEmail: movie.createdByEmail }}
            onRequireLogin={handleRequireLogin}
          />

          {/* More like this */}
          {relatedMovies.length > 0 && (
            <div className="pt-4 border-t border-white/5">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                More in {movie.genre}
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {relatedMovies.map((rel) => {
                  const relHasRatings = (rel.ratingsCount || 0) > 0 && (rel.rating5 || 0) > 0;
                  return (
                    <div
                      key={rel.id}
                      onClick={() => openMovieDetails(rel)}
                      className="group cursor-pointer rounded-xl bg-[#14141c] overflow-hidden border border-white/5 hover:border-red-500/50 transition-all"
                    >
                      <div className="aspect-[2/3] w-full overflow-hidden bg-black/40">
                        <img
                          src={rel.posterUrl}
                          alt={rel.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="p-2">
                        <p className="text-xs font-bold text-white truncate">{rel.title}</p>
                        <p className="text-[10px] text-gray-400 tabular-nums">
                          {rel.year} · {relHasRatings ? `★ ${rel.rating5!.toFixed(1)}` : 'No ratings yet'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Movie Help / Request via WhatsApp */}
          <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p className="text-xs text-gray-400">
              Trouble playing <span className="text-gray-200 font-semibold">{movie.title}</span>? Message WhatsApp Support:{' '}
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
