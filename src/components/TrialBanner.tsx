import React from 'react';
import { useMovieContext } from '../context/MovieContext';
import { Clock, AlertTriangle, Crown } from 'lucide-react';

interface TrialBannerProps {
  onSubscribeClick: () => void;
}

export const TrialBanner: React.FC<TrialBannerProps> = ({ onSubscribeClick }) => {
  const { currentUser, currentUserTrialInfo } = useMovieContext();

  if (!currentUser || !currentUserTrialInfo) return null;
  if (currentUserTrialInfo.isPaid || currentUserTrialInfo.status !== 'Free Trial') {
    return null;
  }

  const { daysLeft, trialEndFormatted, isExpiringSoon } = currentUserTrialInfo;
  const dayWord = daysLeft === 1 ? 'Day' : 'Days';

  return (
    <div
      className={`border-b transition-colors ${
        isExpiringSoon
          ? 'bg-amber-950/55 border-amber-500/40'
          : 'bg-[#12121a] border-white/10'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-start sm:items-center gap-2.5 min-w-0">
          {isExpiringSoon ? (
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
          ) : (
            <Clock className="w-4 h-4 text-[#E50914] shrink-0 mt-0.5 sm:mt-0" />
          )}

          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs sm:text-sm">
            <span className="font-extrabold text-white tabular-nums">
              Your Free Trial: {daysLeft} {dayWord} Left
            </span>
            <span className="text-gray-400 text-xs tabular-nums">
              Free until {trialEndFormatted}
            </span>
            {isExpiringSoon && (
              <span className="text-amber-200 font-semibold text-xs">
                Your free trial ends in {daysLeft} {daysLeft === 1 ? 'day' : 'days'}. Subscribe to
                continue watching.
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onSubscribeClick}
          className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all shrink-0 cursor-pointer ${
            isExpiringSoon
              ? 'bg-[#E50914] hover:bg-red-700 text-white shadow-md shadow-red-600/30'
              : 'bg-white/10 hover:bg-white/15 text-white border border-white/15'
          }`}
        >
          <Crown className="w-3.5 h-3.5 text-amber-400" />
          <span>Subscribe</span>
        </button>
      </div>
    </div>
  );
};
