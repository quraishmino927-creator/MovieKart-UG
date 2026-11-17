import React, { useState } from 'react';
import { useMovieContext } from '../context/MovieContext';
import {
  Smartphone,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  Film,
  ArrowRight,
  DownloadCloud,
  Sparkles,
  Loader2,
  LogIn,
  UserPlus,
  AlertCircle
} from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const {
    signUpWithGoogle,
    signUpWithPhone,
    signUpWithEmail,
    signInWithEmail,
    setActiveTab
  } = useMovieContext();

  // Top-level Login vs Sign Up toggle
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  // Active auth method: 'google' | 'phone' | 'email'
  const [activeMethod, setActiveMethod] = useState<'google' | 'phone' | 'email'>('email');

  // Loading & Error states
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState('');

  // Phone sign up / sign in state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneName, setPhoneName] = useState('');
  const [momoProvider, setMomoProvider] = useState<'MTN Mobile Money' | 'Airtel Money'>('MTN Mobile Money');
  const [phoneStep, setPhoneStep] = useState<'input' | 'otp'>('input');
  const [otpCode, setOtpCode] = useState('');
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  // Email state
  const [emailName, setEmailName] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailMomo, setEmailMomo] = useState<'MTN Mobile Money' | 'Airtel Money'>('MTN Mobile Money');

  // Real Google Sign In / Sign Up via Firebase
  const handleGoogleAuth = async () => {
    setGoogleError('');
    setGoogleLoading(true);
    try {
      const result = await signUpWithGoogle();
      if (!result.success && result.error) {
        setGoogleError(result.error);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  // Phone Step 1: Request OTP
  const handlePhoneRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError('');
    const cleanDigits = phoneNumber.replace(/\D/g, '');
    if (cleanDigits.length < 8) {
      setPhoneError('Please enter a valid Ugandan phone number (e.g. 0772 123 456).');
      return;
    }
    setPhoneStep('otp');
    setOtpCode('');
  };

  // Phone Step 2: Verify OTP & Save Profile
  const handlePhoneVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError('');
    if (!otpCode.trim()) {
      setPhoneError('Please enter the 4-digit verification code.');
      return;
    }
    setPhoneLoading(true);
    try {
      const result = await signUpWithPhone(phoneNumber, phoneName, momoProvider);
      if (!result.success && result.error) {
        setPhoneError(result.error);
      }
    } finally {
      setPhoneLoading(false);
    }
  };

  // Email & Password Submit
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    setEmailLoading(true);

    try {
      if (authMode === 'signup') {
        const result = await signUpWithEmail(emailAddress, emailPassword, emailName, emailMomo);
        if (!result.success && result.error) {
          setEmailError(result.error);
        }
      } else {
        const result = await signInWithEmail(emailAddress, emailPassword);
        if (!result.success && result.error) {
          setEmailError(result.error);
        }
      }
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8 sm:py-12 space-y-6">
      {/* Logged-Out Welcome Card */}
      <div className="bg-[#0e1114] border border-[#25D366]/20 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/70 space-y-6 relative overflow-hidden">
        {/* Subtle green ambient glow */}
        <div className="absolute -top-24 -right-24 w-56 h-56 bg-[#25D366]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center space-y-2 relative">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#25D366]/15 border-2 border-[#25D366]/50 flex items-center justify-center shadow-lg shadow-[#25D366]/15">
            <User className="w-8 h-8 text-[#25D366]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit'] tracking-tight">
            {authMode === 'signin' ? 'Log In to MovieKart UG' : 'Create MovieKart Account'}
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 max-w-sm mx-auto">
            Sign in or create your free profile to save your photo, My List, and Watch History across devices.
          </p>
        </div>

        {/* Prominent Login / Sign Up Buttons */}
        <div className="grid grid-cols-2 gap-2 bg-[#14191f] p-1.5 rounded-2xl border border-white/10">
          <button
            type="button"
            onClick={() => {
              setAuthMode('signin');
              setEmailError('');
              setPhoneError('');
              setGoogleError('');
            }}
            className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              authMode === 'signin'
                ? 'bg-[#25D366] text-black shadow-md shadow-[#25D366]/25'
                : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Log In</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthMode('signup');
              setEmailError('');
              setPhoneError('');
              setGoogleError('');
            }}
            className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              authMode === 'signup'
                ? 'bg-[#25D366] text-black shadow-md shadow-[#25D366]/25'
                : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Sign Up</span>
          </button>
        </div>

        {/* Method Tabs: Email | Google | Phone */}
        <div className="grid grid-cols-3 gap-1.5 bg-[#14191f] p-1.5 rounded-2xl border border-white/5">
          <button
            type="button"
            onClick={() => {
              setActiveMethod('email');
              setPhoneError('');
              setEmailError('');
              setGoogleError('');
            }}
            className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 ${
              activeMethod === 'email'
                ? 'bg-emerald-500/20 text-[#25D366] border border-[#25D366]/40'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Email</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveMethod('google');
              setPhoneError('');
              setEmailError('');
              setGoogleError('');
            }}
            className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 ${
              activeMethod === 'google'
                ? 'bg-emerald-500/20 text-[#25D366] border border-[#25D366]/40'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Google</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveMethod('phone');
              setPhoneError('');
              setEmailError('');
              setGoogleError('');
            }}
            className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 ${
              activeMethod === 'phone'
                ? 'bg-emerald-500/20 text-[#25D366] border border-[#25D366]/40'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Phone</span>
          </button>
        </div>

        {/* METHOD 1: EMAIL & PASSWORD (Firebase Auth) */}
        {activeMethod === 'email' && (
          <form onSubmit={handleEmailSubmit} className="space-y-3.5">
            {authMode === 'signup' && (
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">
                  Your Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={emailName}
                    onChange={(e) => setEmailName(e.target.value)}
                    placeholder="e.g. Kato Joseph"
                    required
                    className="w-full bg-[#14191f] border border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#25D366] transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full bg-[#14191f] border border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#25D366] transition-colors"
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
                  value={emailPassword}
                  onChange={(e) => setEmailPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  className="w-full bg-[#14191f] border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#25D366] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {authMode === 'signup' && (
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">
                  Mobile Money Preference (Optional)
                </label>
                <select
                  value={emailMomo}
                  onChange={(e) => setEmailMomo(e.target.value as 'MTN Mobile Money' | 'Airtel Money')}
                  className="w-full bg-[#14191f] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#25D366]"
                >
                  <option value="MTN Mobile Money">MTN Mobile Money (Uganda)</option>
                  <option value="Airtel Money">Airtel Money (Uganda)</option>
                </select>
              </div>
            )}

            {emailError && (
              <div className="flex items-start gap-2 text-xs text-red-300 bg-red-500/10 border border-red-500/30 p-3 rounded-xl">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{emailError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={emailLoading}
              className="w-full py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] disabled:opacity-60 text-black font-extrabold text-xs sm:text-sm uppercase tracking-wider transition-all shadow-lg shadow-[#25D366]/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              {emailLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{authMode === 'signup' ? 'Creating Account...' : 'Signing In...'}</span>
                </>
              ) : (
                <>
                  <span>{authMode === 'signup' ? 'Create Free Account' : 'Log In'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* METHOD 2: GOOGLE SIGN-IN (Firebase GoogleAuthProvider) */}
        {activeMethod === 'google' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#14191f] border border-white/5 space-y-2 text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-white flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
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
              </div>
              <h3 className="text-sm font-bold text-white">Continue with Google</h3>
              <p className="text-xs text-gray-400">
                Sign in securely using your real Google account and sync your profile to Firebase.
              </p>
            </div>

            {googleError && (
              <div className="flex items-start gap-2 text-xs text-red-300 bg-red-500/10 border border-red-500/30 p-3 rounded-xl">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{googleError}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={googleLoading}
              className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-gray-100 disabled:opacity-60 text-gray-900 font-extrabold text-sm flex items-center justify-center gap-3 transition-all shadow-lg cursor-pointer"
            >
              {googleLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-gray-700" />
                  <span>Connecting Google...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
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

            <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-xs text-gray-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#25D366]" />
                Firebase Google Authentication
              </span>
              <span className="text-[11px] text-[#25D366] font-semibold">1-Click</span>
            </div>
          </div>
        )}

        {/* METHOD 3: UGANDA PHONE NUMBER */}
        {activeMethod === 'phone' && (
          <div className="space-y-4">
            {phoneStep === 'input' ? (
              <form onSubmit={handlePhoneRequestOtp} className="space-y-3.5">
                {authMode === 'signup' && (
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1.5">
                      Your Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={phoneName}
                        onChange={(e) => setPhoneName(e.target.value)}
                        placeholder="e.g. Sula Kabali"
                        required
                        className="w-full bg-[#14191f] border border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#25D366] transition-colors"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">
                    Ugandan Mobile Number
                  </label>
                  <div className="flex rounded-xl overflow-hidden border border-white/10 bg-[#14191f] focus-within:border-[#25D366] transition-colors">
                    <div className="px-3 py-2.5 bg-black/40 border-r border-white/10 text-xs font-bold text-gray-300 flex items-center gap-1.5 shrink-0">
                      <span>🇺🇬</span>
                      <span>+256</span>
                    </div>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="772 123 456"
                      required
                      className="flex-1 bg-transparent px-3 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">
                    Preferred Mobile Money
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setMomoProvider('MTN Mobile Money')}
                      className={`p-2.5 rounded-xl border text-left text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                        momoProvider === 'MTN Mobile Money'
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-[#14191f] border-white/10 text-gray-400 hover:border-white/20'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                      <span>MTN MoMo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMomoProvider('Airtel Money')}
                      className={`p-2.5 rounded-xl border text-left text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                        momoProvider === 'Airtel Money'
                          ? 'bg-red-500/20 border-red-500 text-red-300'
                          : 'bg-[#14191f] border-white/10 text-gray-400 hover:border-white/20'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
                      <span>Airtel Money</span>
                    </button>
                  </div>
                </div>

                {phoneError && (
                  <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 p-2.5 rounded-xl">
                    {phoneError}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] text-black font-extrabold text-xs sm:text-sm uppercase tracking-wider transition-all shadow-md shadow-[#25D366]/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Continue with Phone</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handlePhoneVerifyOtp} className="space-y-4">
                <div className="text-center p-3 rounded-2xl bg-[#14191f] border border-white/5 space-y-1">
                  <p className="text-xs text-gray-300">
                    Enter confirmation PIN for <span className="font-bold text-white">+256 {phoneNumber}</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => setPhoneStep('input')}
                    className="text-[11px] text-[#25D366] underline hover:text-emerald-300 cursor-pointer"
                  >
                    Change phone number
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5 text-center">
                    4-Digit Verification PIN
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="••••"
                    autoFocus
                    className="w-36 mx-auto block text-center text-2xl tracking-[0.6em] font-mono py-2 rounded-xl bg-black border border-white/20 text-white focus:outline-none focus:border-[#25D366]"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setOtpCode('4829')}
                  className="block mx-auto text-[11px] text-gray-400 hover:text-[#25D366] underline transition-colors cursor-pointer"
                >
                  Use quick code (4829)
                </button>

                {phoneError && (
                  <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 p-2.5 rounded-xl text-center">
                    {phoneError}
                  </p>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPhoneStep('input')}
                    className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-300 cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={phoneLoading}
                    className="flex-1 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] disabled:opacity-60 text-black text-xs font-extrabold shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {phoneLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span>Verify & Continue</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Back to Browse */}
        <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
          <span className="text-gray-500">Not signed in yet</span>
          <button
            type="button"
            onClick={() => setActiveTab('home')}
            className="text-[#25D366] hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>Browse Movies</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="grid grid-cols-3 gap-2 text-center text-[10px] sm:text-xs text-gray-400">
        <div className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-[#0e1114] border border-white/5">
          <Film className="w-3.5 h-3.5 text-[#25D366]" />
          <span>Save Watchlist</span>
        </div>
        <div className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-[#0e1114] border border-white/5">
          <DownloadCloud className="w-3.5 h-3.5 text-[#25D366]" />
          <span>Watch History</span>
        </div>
        <div className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-[#0e1114] border border-white/5">
          <Sparkles className="w-3.5 h-3.5 text-[#25D366]" />
          <span>Firebase Sync</span>
        </div>
      </div>
    </div>
  );
};
