import React, { useState, useEffect } from 'react';
import { useMovieContext } from '../context/MovieContext';
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Film,
  ArrowRight,
  Loader2,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  MessageCircle,
} from 'lucide-react';

interface AuthScreenProps {
  isForcedGate?: boolean;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ isForcedGate = false }) => {
  const {
    hasSignedUpBefore,
    signUpWithEmailOrPhone,
    loginWithEmailOrPhone,
    signUpWithGoogle,
    setActiveTab,
  } = useMovieContext();

  // First visit -> Sign Up first. Already signed up before -> Login first.
  const [authMode, setAuthMode] = useState<'signup' | 'signin'>(
    hasSignedUpBefore ? 'signin' : 'signup'
  );

  useEffect(() => {
    setAuthMode(hasSignedUpBefore ? 'signin' : 'signup');
  }, [hasSignedUpBefore]);

  const [fullName, setFullName] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      if (authMode === 'signup') {
        const res = await signUpWithEmailOrPhone(fullName, emailOrPhone, password);
        if (!res.success && res.error) {
          setErrorMsg(res.error);
        }
      } else {
        const res = await loginWithEmailOrPhone(emailOrPhone, password);
        if (!res.success && res.error) {
          setErrorMsg(res.error);
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleAuth = async () => {
    setErrorMsg('');
    setGoogleLoading(true);
    try {
      const res = await signUpWithGoogle();
      if (!res.success && res.error) {
        setErrorMsg(res.error);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const switchMode = (nextMode: 'signup' | 'signin') => {
    setAuthMode(nextMode);
    setErrorMsg('');
  };

  return (
    <div
      className={
        isForcedGate
          ? 'min-h-screen bg-[#070709] text-gray-100 flex flex-col justify-between font-["Plus_Jakarta_Sans"] px-4 py-8 sm:py-12 relative overflow-hidden'
          : 'max-w-lg mx-auto px-4 py-8 sm:py-12 space-y-6'
      }
    >
      {isForcedGate && (
        <div
          className="pointer-events-none fixed inset-0 opacity-30"
          style={{
            background:
              'radial-gradient(circle at 50% 0%, rgba(229, 9, 20, 0.25), transparent 55%)',
          }}
        />
      )}

      <div className="relative z-10 w-full max-w-md mx-auto my-auto space-y-6">
        {/* MovieKart UG Brand Lockup */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center gap-2.5">
            <span className="w-10 h-10 rounded-xl bg-[#E50914] flex items-center justify-center shadow-lg shadow-red-600/30">
              <Film className="w-5 h-5 text-white" />
            </span>
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-white font-['Outfit']">
              Movie<span className="text-[#E50914]">Kart</span>{' '}
              <span className="text-xs font-extrabold text-gray-400 align-top">UG</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-400">
            Movies, TV Shows, VJ Luganda Translations & Ugandan Live TV
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-[#111116] border border-white/10 rounded-2xl p-6 sm:p-7 shadow-2xl shadow-black/80 space-y-5">
          {/* Card Heading */}
          <div className="space-y-1.5">
            <h1 className="text-xl sm:text-2xl font-extrabold text-white font-['Outfit'] tracking-tight">
              {authMode === 'signup' ? 'Create Your Account' : 'Welcome Back — Login'}
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
              {authMode === 'signup'
                ? 'Sign up to start watching immediately with your 30 Days Free Trial.'
                : 'Log in with your email or phone number to continue watching.'}
            </p>
          </div>

          {/* 30-Day Free Trial Callout on Sign Up */}
          {authMode === 'signup' && (
            <div className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-200">
              <Sparkles className="w-4 h-4 text-[#25D366] shrink-0 mt-0.5" />
              <span>
                <strong className="text-white">30 Days Free Trial</strong> starts automatically when
                you create your account. No card needed today.
              </span>
            </div>
          )}

          {/* Main Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {authMode === 'signup' && (
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Kato Joseph"
                    autoComplete="name"
                    className="w-full bg-[#181822] border border-white/15 rounded-xl pl-10 pr-3.5 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#E50914] transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">
                Email / Phone
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  required
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  placeholder="you@example.com or +256 772 123 456"
                  autoComplete="username"
                  className="w-full bg-[#181822] border border-white/15 rounded-xl pl-10 pr-3.5 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#E50914] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={authMode === 'signup' ? 'Create a password (min 6 chars)' : 'Enter your password'}
                  autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
                  className="w-full bg-[#181822] border border-white/15 rounded-xl pl-10 pr-11 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#E50914] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="flex items-start gap-2 text-xs text-red-300 bg-red-500/10 border border-red-500/30 p-3 rounded-xl">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-4 rounded-xl bg-[#E50914] hover:bg-red-700 disabled:opacity-60 text-white font-extrabold text-sm tracking-wide transition-all shadow-lg shadow-red-600/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{authMode === 'signup' ? 'Creating Account...' : 'Logging In...'}</span>
                </>
              ) : (
                <>
                  <span>{authMode === 'signup' ? 'Create Account' : 'Login'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Toggle between Sign Up and Login */}
          <div className="text-center text-xs sm:text-sm text-gray-400 pt-1">
            {authMode === 'signup' ? (
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Already have account?{' '}
                <span className="text-[#E50914] font-bold underline underline-offset-4">
                  Login
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Don&apos;t have an account yet?{' '}
                <span className="text-[#E50914] font-bold underline underline-offset-4">
                  Create Account
                </span>
              </button>
            )}
          </div>

          {/* Divider + Optional Google Auth */}
          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-[11px]">
              <span className="bg-[#111116] px-3 text-gray-500 uppercase tracking-wider font-semibold">
                or
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={googleLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 disabled:opacity-60 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer"
          >
            {googleLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Connecting Google...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {/* Only show Back to Browse if NOT forced gate */}
          {!isForcedGate && (
            <div className="pt-2 border-t border-white/5 flex items-center justify-end text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('home')}
                className="text-gray-400 hover:text-white font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>Back to Home</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Concise Member Benefits */}
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-gray-400">
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#25D366]" />
            <span>30 Days Free Trial</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#25D366]" />
            <span>VJ Translated Movies</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#25D366]" />
            <span>Ugandan Live TV</span>
          </span>
        </div>
      </div>

      {/* Footer Support */}
      {isForcedGate && (
        <div className="relative z-10 text-center pt-6">
          <a
            href="https://wa.me/256741094332"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-[#25D366] transition-colors"
          >
            <MessageCircle className="w-4 h-4 text-[#25D366]" />
            <span>Need help? WhatsApp Support: +256 741 094 332</span>
          </a>
        </div>
      )}
    </div>
  );
};
