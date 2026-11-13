import React, { useState } from 'react';
import { Download, Smartphone, Share, PlusSquare, WifiOff, X } from 'lucide-react';
import { usePWAInstall, useOnlineStatus } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'header' | 'card';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'header' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // Hide install UI when already running in standalone mode
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    if (variant === 'card') {
      return (
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-red-950/40 via-[#181216] to-[#121217] border border-red-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl overflow-hidden border border-red-500/40 shrink-0 bg-black">
              <img src="/pwa-192x192.png" alt="MovieKart UG App" className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white font-['Outfit']">
                Install MovieKart UG App
              </h3>
              <p className="text-xs text-gray-300 mt-0.5">
                Add MovieKart to your home screen for instant launch, full-screen cinema view, and offline access.
              </p>
            </div>
          </div>

          <button
            onClick={install}
            className="w-full sm:w-auto px-5 py-2.5 bg-[#E50914] hover:bg-red-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Install App</span>
          </button>
        </div>
      );
    }

    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#E50914] hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/30 transition-all cursor-pointer active:scale-95 shrink-0"
        title="Install MovieKart UG App"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Install App</span>
      </button>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not supported by WebKit)
  if (isIOS) {
    return (
      <>
        {variant === 'card' ? (
          <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-red-950/40 via-[#181216] to-[#121217] border border-red-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl overflow-hidden border border-red-500/40 shrink-0 bg-black">
                <img src="/apple-touch-icon.png" alt="MovieKart UG App" className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white font-['Outfit']">
                  Install on iPhone / iPad
                </h3>
                <p className="text-xs text-gray-300 mt-0.5">
                  Add MovieKart UG to your iOS Home Screen for app-like streaming.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(true)}
              className="w-full sm:w-auto px-5 py-2.5 bg-[#E50914] hover:bg-red-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <Smartphone className="w-4 h-4" />
              <span>Install on iOS</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowIOSGuide(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-semibold transition-all cursor-pointer shrink-0"
            title="Install MovieKart UG on iOS"
          >
            <Smartphone className="w-3.5 h-3.5 text-[#E50914]" />
            <span className="hidden sm:inline">Install App</span>
          </button>
        )}

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-3xl bg-[#121218] border border-white/10 p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white font-['Outfit']">Install MovieKart UG</h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-gray-300">
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5">
                  <Share className="w-5 h-5 text-[#E50914] shrink-0" />
                  <p>
                    1. Tap the <strong className="text-white">Share</strong> button in the Safari toolbar.
                  </p>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5">
                  <PlusSquare className="w-5 h-5 text-[#E50914] shrink-0" />
                  <p>
                    2. Scroll down and tap <strong className="text-white">Add to Home Screen</strong>.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full rounded-xl bg-[#E50914] hover:bg-red-700 py-2.5 text-xs font-bold text-white transition-colors cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-500/95 backdrop-blur-md px-3.5 py-2 text-xs font-bold text-black shadow-xl border border-amber-300/50">
      <WifiOff className="w-3.5 h-3.5 shrink-0" />
      <span>You are offline — Cached content & downloads ready</span>
    </div>
  );
};
