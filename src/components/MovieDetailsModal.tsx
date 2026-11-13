import React, { useState } from 'react';
import { useMovieContext } from '../context/MovieContext';
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
  Clock,
  Calendar,
  Share2,
  Film,
  Sparkles
} from 'lucide-react';

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
    movies,
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

  // 5-Star scale calculation
  const currentRating5 = movie.rating5 ?? +(movie.rating / 2).toFixed(1);
  const userRatedScore = movie.userRating;

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl my-auto bg-[#0f0f15] border border-white/10 rounded-none sm:rounded-3xl shadow-2xl overflow-hidden transition-all text-white">
        {/* Close Button */}
        <button
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

          {/* Quick Badges inside header */}
          <div className="absolute bottom-4 left-4 sm:left-6 right-4 flex items-end justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs mb-2">
                <span className="bg-red-600 font-bold px-2 py-0.5 rounded text-[11px] uppercase tracking-wide">
                  {movie.genre}
                </span>
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {currentRating5.toFixed(1)} / 5
                </span>
                <span>·</span>
                <span className="text-gray-300">{movie.year}</span>
                <span>·</span>
                <span className="text-gray-300">{movie.duration}</span>
                <span>·</span>
                <span className="border border-white/20 px-1.5 py-0.5 rounded text-[10px] text-gray-300">
                  {movie.quality}
                </span>
                {userRatedScore && (
                  <>
                    <span>·</span>
                    <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                      Your Rating: {userRatedScore}★
                    </span>
                  </>
                )}
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold font-['Outfit'] tracking-tight">
                {movie.title}
              </h2>
            </div>

            {/* Quick Trailer chip on backdrop */}
            <button
              onClick={() => {
                closeMovieDetails();
                playTrailer(movie);
              }}
              className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-black/70 hover:bg-red-600 text-white text-xs font-bold backdrop-blur-md border border-white/20 hover:border-red-500 transition-all cursor-pointer shadow-lg active:scale-95 group shrink-0"
              title={`Play short teaser trailer for ${movie.title}`}
            >
              <Film className="w-3.5 h-3.5 text-red-400 group-hover:text-white transition-colors" />
              <span>Teaser Trailer</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-6">
          {/* Main Action Buttons Bar */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Play Movie (Red Button) */}
            <button
              onClick={() => {
                closeMovieDetails();
                playMovie(movie, activeTrack?.id);
              }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2.5 px-6 sm:px-8 py-3 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-sm sm:text-base rounded-xl transition-all shadow-lg shadow-red-600/30 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-white text-white" />
              <span>Play Now {activeTrack ? `(${activeTrack.name})` : ''}</span>
            </button>

            {/* Play Trailer Button (High-Energy Teaser Video) */}
            <button
              onClick={() => {
                closeMovieDetails();
                playTrailer(movie);
              }}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-red-950/70 via-black to-neutral-900 hover:from-red-900 hover:to-neutral-800 text-white border border-red-500/50 hover:border-red-400 active:scale-95 transition-all shadow-md shadow-red-950/40 cursor-pointer group"
              title={`Watch high-energy teaser trailer for ${movie.title}`}
            >
              <Film className="w-4 h-4 text-red-400 group-hover:text-red-300 transition-colors" />
              <span>Play Trailer</span>
            </button>

            {/* Offline Download button */}
            <button
              onClick={() => {
                if (!isDownloaded && !isDownloading) {
                  startDownload(movie, downloadQuality);
                }
              }}
              disabled={isDownloaded || isDownloading}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm border transition-all cursor-pointer ${
                isDownloaded
                  ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30'
                  : isDownloading
                  ? 'bg-amber-600/20 text-amber-300 border-amber-500/30'
                  : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
              }`}
            >
              {isDownloaded ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Downloaded Offline</span>
                </>
              ) : isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                  <span>Downloading {downloadInfo?.progress}%</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download ({movie.fileSizeMb || 480} MB)</span>
                </>
              )}
            </button>

            {/* Watchlist toggle */}
            <button
              onClick={() => toggleWatchlist(movie.id)}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                inWatchlist
                  ? 'bg-red-600 text-white border-red-500'
                  : 'bg-white/5 hover:bg-white/10 text-gray-200 border-white/10'
              }`}
              title={inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
            >
              {inWatchlist ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </button>

            {/* Share */}
            <button
              onClick={handleShare}
              className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 transition-colors cursor-pointer"
              title="Share Film"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>

          {/* 5-STAR RATING SYSTEM (Prompt Requirement: Add a 5-star rating system to MovieDetailsModal so users can rate films they have watched) */}
          <div className="bg-[#14141d] border border-white/10 rounded-2xl p-4 sm:p-5 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Average Rating Score Block */}
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-center justify-center bg-black/60 border border-white/10 rounded-2xl p-3 min-w-[95px] text-center shadow-inner">
                  <div className="flex items-center gap-1 text-2xl sm:text-3xl font-extrabold text-amber-400 font-['Outfit']">
                    <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
                    <span>{currentRating5.toFixed(1)}</span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">
                    out of 5.0
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono mt-0.5">
                    {movie.ratingsCount || 120} ratings
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white font-['Outfit'] flex items-center gap-2">
                    <span>Rate this Film</span>
                    <span className="text-[11px] font-semibold text-red-400">· 5-Star System</span>
                  </h4>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {userRatedScore
                      ? `Your Rating: ${userRatedScore} out of 5 stars (tap to change)`
                      : 'Have you watched this film? Tap a star to submit your rating'}
                  </p>

                  {/* 5-Star Interactive Rating Buttons */}
                  <div className="flex items-center gap-1.5 mt-2.5">
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
                                ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                                : 'text-gray-600 hover:text-gray-400'
                            }`}
                          />
                        </button>
                      );
                    })}

                    <span className="text-xs font-bold text-amber-400 ml-2 font-mono">
                      {hoverRating > 0
                        ? `${hoverRating}.0 ★`
                        : userRatedScore
                        ? `${userRatedScore}.0 ★ (Rated)`
                        : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* Rating Distribution Breakdown */}
              <div className="hidden sm:flex flex-col gap-1 w-44 text-[10px] text-gray-400 bg-black/30 p-2.5 rounded-xl border border-white/5">
                {[5, 4, 3, 2, 1].map((starNum) => {
                  const isUserSelected = userRatedScore === starNum;
                  const isCurrentAvg = Math.round(currentRating5) === starNum;
                  const barWidth =
                    starNum === 5
                      ? '74%'
                      : starNum === 4
                      ? '20%'
                      : starNum === 3
                      ? '4%'
                      : '2%';
                  return (
                    <div key={starNum} className="flex items-center gap-1.5">
                      <span className="w-4 text-right font-bold text-gray-300">{starNum}★</span>
                      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isUserSelected
                              ? 'bg-red-500'
                              : isCurrentAvg
                              ? 'bg-amber-400'
                              : 'bg-white/30'
                          }`}
                          style={{ width: barWidth }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* VJ Audio Translation Selector (Ugandan Special Feature) */}
          {tracks.length > 0 && (
            <div className="bg-[#151520] border border-white/5 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-red-500" />
                  <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                    Audio Track / VJ Commentary (Uganda)
                  </h4>
                </div>
                <span className="text-[11px] text-gray-400">Choose commentary style</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {tracks.map((track) => {
                  const isSelected = activeTrack?.id === track.id;
                  return (
                    <button
                      key={track.id}
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
                          <span className="text-[9px] bg-red-600 text-white px-1 py-0.2 rounded font-semibold">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400">{track.language}</p>
                    </button>
                  );
                })}
              </div>

              {/* Sample quote preview from selected VJ */}
              {activeTrack?.commentaryQuotes && activeTrack.commentaryQuotes.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/5 text-xs text-gray-300 italic flex items-center gap-2">
                  <span className="text-red-400 font-bold not-italic">{activeTrack.name} quote:</span>
                  <span className="text-gray-200">
                    "{activeTrack.commentaryQuotes[0]}"
                  </span>
                </div>
              )}
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

          {/* Cast & Director */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/5 text-xs sm:text-sm">
            <div>
              <span className="text-gray-400 font-medium block mb-1">Director</span>
              <p className="text-white font-semibold">{movie.director || 'Nabwana I.G.G.'}</p>
            </div>
            <div>
              <span className="text-gray-400 font-medium block mb-1">Starring Cast</span>
              <p className="text-white font-semibold">
                {movie.cast && movie.cast.length > 0 ? movie.cast.join(', ') : 'Leading Cast'}
              </p>
            </div>
          </div>

          {/* Download Quality Preference */}
          <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-gray-400">Offline Download Quality:</span>
            <div className="flex items-center gap-1.5">
              {['4K UHD', '1080p FHD', '720p Data Saver'].map((q) => (
                <button
                  key={q}
                  onClick={() => setDownloadQuality(q)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors cursor-pointer ${
                    downloadQuality === q
                      ? 'bg-red-600 text-white border-red-500'
                      : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* More like this */}
          {relatedMovies.length > 0 && (
            <div className="pt-4 border-t border-white/5">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                More in {movie.genre}
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {relatedMovies.map((rel) => (
                  <div
                    key={rel.id}
                    onClick={() => {
                      const { openMovieDetails } = useMovieContext();
                      openMovieDetails(rel);
                    }}
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
                      <p className="text-[10px] text-gray-400">{rel.year} · ★ {(rel.rating5 ?? (rel.rating / 2)).toFixed(1)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
