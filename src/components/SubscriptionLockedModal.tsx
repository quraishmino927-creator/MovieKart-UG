import React, { useEffect } from 'react';
import { Lock, X, MessageCircle, ExternalLink } from 'lucide-react';

interface SubscriptionLockedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WHATSAPP_URL =
  'https://wa.me/256741094332?text=' +
  encodeURIComponent('Hello MovieKart UG Admin, I would like to request Subscription access.');

export const SubscriptionLockedModal: React.FC<SubscriptionLockedModalProps> = ({
  isOpen,
  onClose,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="subscription-locked-title"
      onClick={onClose}
      className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-['Plus_Jakarta_Sans']"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-3xl bg-[#111116] border border-white/10 shadow-2xl p-6 sm:p-7 space-y-5 text-center"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close popup"
          className="absolute top-4 right-4 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-14 h-14 mx-auto rounded-2xl bg-[#E50914]/15 border border-[#E50914]/40 flex items-center justify-center text-[#E50914] shadow-lg shadow-red-600/20">
          <Lock className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h2
            id="subscription-locked-title"
            className="text-xl sm:text-2xl font-extrabold text-white font-['Outfit'] tracking-tight"
          >
            Subscriptions Locked
          </h2>
          <p className="text-sm sm:text-base text-gray-200 leading-relaxed font-medium">
            Subscriptions are Locked for Now - Coming Soon. Contact Admin on WhatsApp for Access.
          </p>
        </div>

        <div className="flex flex-col gap-2.5 pt-1">
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] text-black font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/20 transition-all active:scale-95"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Contact Admin on WhatsApp (+256 741 094 332)</span>
            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          </a>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white font-bold text-xs sm:text-sm transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
