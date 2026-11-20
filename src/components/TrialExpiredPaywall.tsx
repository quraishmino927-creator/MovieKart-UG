import React, { useState } from 'react';
import { useMovieContext } from '../context/MovieContext';
import { SubscriptionLockedModal } from './SubscriptionLockedModal';
import {
  Lock,
  Crown,
  CheckCircle2,
  LogOut,
  MessageCircle,
  ArrowLeft,
  Film,
} from 'lucide-react';

interface TrialExpiredPaywallProps {
  allowClose?: boolean;
  onClose?: () => void;
}

export const TrialExpiredPaywall: React.FC<TrialExpiredPaywallProps> = ({
  allowClose = false,
  onClose,
}) => {
  const {
    currentUser,
    currentUserTrialInfo,
    logoutUser,
  } = useMovieContext();

  const [selectedPlan, setSelectedPlan] = useState<'Standard HD' | 'MovieKart VIP'>('MovieKart VIP');
  const [showLockedPopup, setShowLockedPopup] = useState(false);

  const isExpired = Boolean(currentUserTrialInfo?.isExpired);

  const handleLockedSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    setShowLockedPopup(true);
  };

  return (
    <div className="min-h-screen bg-[#070709] text-gray-100 flex flex-col justify-between px-4 py-8 sm:py-12 font-['Plus_Jakarta_Sans']">
      <div className="max-w-2xl w-full mx-auto space-y-6 my-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-[#E50914] flex items-center justify-center shadow-lg shadow-red-600/30">
              <Film className="w-5 h-5 text-white" />
            </span>
            <span className="text-xl font-black text-white font-['Outfit']">
              Movie<span className="text-[#E50914]">Kart</span> UG
            </span>
          </div>

          <div className="flex items-center gap-2">
            {allowClose && !isExpired && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-gray-300 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}
            <button
              type="button"
              onClick={logoutUser}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-gray-300 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {/* Main Paywall Card */}
        <div className="bg-[#111116] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2.5">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#E50914]/15 border border-[#E50914]/40 flex items-center justify-center text-[#E50914]">
              {isExpired ? <Lock className="w-7 h-7" /> : <Crown className="w-7 h-7" />}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit'] tracking-tight">
              {isExpired
                ? 'Your Free Trial Has Ended. Subscribe to continue watching.'
                : 'Upgrade to Full MovieKart UG Access'}
            </h1>

            <p className="text-xs sm:text-sm text-gray-400 max-w-lg mx-auto">
              {isExpired
                ? `Hi ${currentUser?.name || 'Member'}, your 30-day free trial ended on ${
                    currentUserTrialInfo?.trialEndFormatted || ''
                  }. Choose a plan below with MTN MoMo or Airtel Money to unlock all Movies, TV Shows & Live TV.`
                : `You have ${currentUserTrialInfo?.daysLeft ?? 0} days left in your free trial (until ${
                    currentUserTrialInfo?.trialEndFormatted || ''
                  }). Subscribe now for uninterrupted streaming.`}
            </p>
          </div>

          {/* Plan Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <button
              type="button"
              onClick={() => setSelectedPlan('Standard HD')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-2 ${
                selectedPlan === 'Standard HD'
                  ? 'bg-[#E50914]/15 border-[#E50914] shadow-lg shadow-red-600/15'
                  : 'bg-[#181822] border-white/10 hover:border-white/25'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-extrabold text-white">Standard HD</span>
                <span className="text-xs font-bold text-gray-300 tabular-nums">UGX 15,000/mo</span>
              </div>
              <ul className="space-y-1 text-xs text-gray-400">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#25D366] shrink-0" />
                  <span>Unlimited Movies & TV Shows</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#25D366] shrink-0" />
                  <span>All Ugandan Live TV Channels</span>
                </li>
              </ul>
            </button>

            <button
              type="button"
              onClick={() => setSelectedPlan('MovieKart VIP')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-2 relative ${
                selectedPlan === 'MovieKart VIP'
                  ? 'bg-[#E50914]/15 border-[#E50914] shadow-lg shadow-red-600/15'
                  : 'bg-[#181822] border-white/10 hover:border-white/25'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-extrabold text-white flex items-center gap-1.5">
                  <Crown className="w-4 h-4 text-amber-400" />
                  MovieKart VIP
                </span>
                <span className="text-xs font-bold text-amber-300 tabular-nums">UGX 25,000/mo</span>
              </div>
              <ul className="space-y-1 text-xs text-gray-400">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#25D366] shrink-0" />
                  <span>4K UHD + All VJ Translated Films</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#25D366] shrink-0" />
                  <span>Offline Downloads & Live TV HD</span>
                </li>
              </ul>
            </button>
          </div>

          {/* Locked Subscription Action (does not open payment) */}
          <form onSubmit={handleLockedSubscribe} className="space-y-4">
            <button
              type="submit"
              className="w-full py-3.5 px-5 rounded-xl bg-[#E50914] hover:bg-red-700 text-white font-extrabold text-sm shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Crown className="w-4 h-4 text-amber-300" />
              <span>
                Subscribe ({selectedPlan === 'MovieKart VIP' ? 'UGX 25,000' : 'UGX 15,000'})
              </span>
              <Lock className="w-4 h-4 text-amber-200" aria-hidden="true" />
            </button>
          </form>

          {/* Direct WhatsApp Activation Option */}
          <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
            <span>Subscriptions are Locked for Now - Coming Soon. Contact Admin on WhatsApp for Access.</span>
            <a
              href="https://wa.me/256741094332"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] text-black font-extrabold text-xs transition-all shrink-0"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp: +256 741 094 332</span>
            </a>
          </div>
        </div>
      </div>

      <SubscriptionLockedModal
        isOpen={showLockedPopup}
        onClose={() => setShowLockedPopup(false)}
      />
    </div>
  );
};
