import React, { useState } from 'react';
import { useMovieContext } from '../context/MovieContext';
import {
  Smartphone,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Film,
  Tv,
  ArrowRight,
  ChevronRight,
  KeyRound,
  DownloadCloud,
  Play
} from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const {
    signUpWithGoogle,
    signUpWithPhone,
    signUpWithEmail,
    signInWithEmail,
    continueAsGuest,
    users,
    switchUserAccount
  } = useMovieContext();

  // Active method tabs: 'google' | 'phone' | 'email'
  const [activeMethod, setActiveMethod] = useState<'google' | 'phone' | 'email'>('google');
  const [authMode, setAuthMode] = useState<'signup' | 'signin'>('signup');

  // Phone sign up state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneName, setPhoneName] = useState('');
  const [momoProvider, setMomoProvider] = useState<'MTN Mobile Money' | 'Airtel Money'>('MTN Mobile Money');
  const [phoneStep, setPhoneStep] = useState<'input' | 'otp'>('input');
  const [otpCode, setOtpCode] = useState('');
  const [phoneError, setPhoneError] = useState('');

  // Email state
  const [emailName, setEmailName] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailMomo, setEmailMomo] = useState<'MTN Mobile Money' | 'Airtel Money'>('MTN Mobile Money');

  // Handle Google Sign In / Sign Up
  const handleGoogleAuth = () => {
    signUpWithGoogle({
      name: 'Quraish Mino',
      email: 'quraishmino927@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'
    });
  };

  // Handle Phone Step 1: Send OTP
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

  // Handle Phone Step 2: Verify OTP
  const handlePhoneVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError('');
    if (!otpCode.trim()) {
      setPhoneError('Please enter the 4-digit verification code.');
      return;
    }
    signUpWithPhone(phoneNumber, phoneName, momoProvider);
  };

  // Handle Email Submit
  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');

    if (authMode === 'signup') {
      const result = signUpWithEmail(emailAddress, emailPassword, emailName, emailMomo);
      if (!result.success && result.error) {
        setEmailError(result.error);
      }
    } else {
      const result = signInWithEmail(emailAddress, emailPassword);
      if (!result.success && result.error) {
        setEmailError(result.error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#070709] text-gray-100 flex flex-col justify-between font-['Plus_Jakarta_Sans'] relative overflow-hidden">
      {/* Dynamic Background Visuals */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-red-600/15 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-red-500/10 rounded-full blur-[140px]" />
        <div className="absolute -bottom-20 left-1/3 w-80 h-80 bg-red-700/10 rounded-full blur-[120px]" />
        <div
          className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)]"
          style={{ backgroundSize: '24px 24px' }}
        />
      </div>

      {/* Top Bar with Logo & Guest Link */}
      <header className="relative z-10 max-w-6xl w-full mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative w-11 h-11 rounded-2xl overflow-hidden bg-black border border-red-500/40 shadow-lg shadow-red-600/30">
            <img
              src="/assets/aistudio/mino2_5d86aea4.jpg"
              alt="MovieKart UG Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl tracking-tight text-white font-['Outfit']">
                Movie<span className="text-red-600">Kart</span>
              </span>
              <span className="bg-red-600/20 text-red-400 border border-red-500/30 text-[10px] font-bold px-1.5 py-0.5 rounded tracking-wider">
                UG
              </span>
            </div>
            <p className="text-[10px] text-gray-400">Uganda's Cinema & VJ Streaming</p>
          </div>
        </div>

        <button
          onClick={continueAsGuest}
          className="text-xs font-semibold text-gray-400 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer"
        >
          <span>Explore as Guest</span>
          <ArrowRight className="w-3.5 h-3.5 text-red-500" />
        </button>
      </header>

      {/* Main Container */}
      <main className="relative z-10 max-w-md w-full mx-auto px-4 py-6 sm:py-10">
        <div className="bg-[#0e0e14]/90 border border-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 space-y-6">
          {/* Header Title */}
          <div className="text-center space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/15 border border-red-500/30 text-red-400 text-xs font-bold mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Unlimited Movies & TV Shows</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit'] tracking-tight">
              {authMode === 'signup' ? 'Create Your Account' : 'Welcome Back'}
            </h1>
            <p className="text-xs text-gray-400 max-w-xs mx-auto">
              Save your watchlist, download offline hits, and resume streaming across all devices in Uganda.
            </p>
          </div>

          {/* Auth Method Navigation (3 Options) */}
          <div className="grid grid-cols-3 gap-1.5 bg-[#14141e] p-1.5 rounded-2xl border border-white/5">
            <button
              onClick={() => {
                setActiveMethod('google');
                setPhoneError('');
                setEmailError('');
              }}
              className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 ${
                activeMethod === 'google'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
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
              <span>Google 1-Click</span>
            </button>

            <button
              onClick={() => {
                setActiveMethod('phone');
                setPhoneError('');
                setEmailError('');
              }}
              className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 ${
                activeMethod === 'phone'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Phone / MoMo</span>
            </button>

            <button
              onClick={() => {
                setActiveMethod('email');
                setPhoneError('');
                setEmailError('');
              }}
              className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 ${
                activeMethod === 'email'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>Email & Pass</span>
            </button>
          </div>

          {/* METHOD 1: GOOGLE 1-CLICK */}
          {activeMethod === 'google' && (
            <div className="space-y-4 pt-1 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-[#14141d] border border-white/5 space-y-3 text-center">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-white flex items-center justify-center shadow-lg shadow-black/50">
                  <svg className="w-7 h-7" viewBox="0 0 24 24">
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
                <div>
                  <h3 className="text-sm font-bold text-white">Instant 1-Click Sign In</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Connect instantly using your Google profile. No password needed.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleAuth}
                className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-gray-100 text-gray-900 font-extrabold text-sm flex items-center justify-center gap-3 transition-all shadow-lg shadow-white/10 hover:shadow-white/20 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
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
              </button>

              <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-xs text-gray-400">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Secure Google OAuth Session
                </span>
                <span className="text-[11px] text-red-400 font-semibold">1-Click</span>
              </div>
            </div>
          )}

          {/* METHOD 2: PHONE NUMBER (UGANDA) */}
          {activeMethod === 'phone' && (
            <div className="space-y-4 pt-1 animate-fadeIn">
              {phoneStep === 'input' ? (
                <form onSubmit={handlePhoneRequestOtp} className="space-y-3.5">
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
                        className="w-full bg-[#14141d] border border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1.5">
                      Ugandan Mobile Number
                    </label>
                    <div className="flex rounded-xl overflow-hidden border border-white/10 bg-[#14141d] focus-within:border-red-500 transition-colors">
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
                        className="flex-1 bg-transparent px-3 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none"
                      />
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">
                      Works with MTN, Airtel, and Uganda Telecom networks.
                    </p>
                  </div>

                  {/* MoMo Provider Selection */}
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
                            : 'bg-[#14141d] border-white/10 text-gray-400 hover:border-white/20'
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
                            : 'bg-[#14141d] border-white/10 text-gray-400 hover:border-white/20'
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
                    className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-red-600/30 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Send Verification Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                /* Step 2: OTP verification */
                <form onSubmit={handlePhoneVerifyOtp} className="space-y-4">
                  <div className="text-center p-3 rounded-2xl bg-[#14141d] border border-white/5 space-y-1">
                    <p className="text-xs text-gray-300">
                      Code sent to <span className="font-bold text-white">+256 {phoneNumber}</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => setPhoneStep('input')}
                      className="text-[11px] text-red-400 underline hover:text-red-300"
                    >
                      Change phone number
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1.5 text-center">
                      Enter 4-Digit SMS Code
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="••••"
                      autoFocus
                      className="w-36 mx-auto block text-center text-2xl tracking-[0.6em] font-mono py-2 rounded-xl bg-black border border-white/20 text-white focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setOtpCode('4829')}
                    className="block mx-auto text-[11px] text-gray-400 hover:text-red-400 underline transition-colors cursor-pointer"
                  >
                    Auto-fill test SMS code (4829)
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
                      className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/30 cursor-pointer"
                    >
                      Verify & Sign In
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* METHOD 3: EMAIL AND PASSWORD */}
          {activeMethod === 'email' && (
            <div className="space-y-4 pt-1 animate-fadeIn">
              {/* Toggle Sign Up vs Sign In */}
              <div className="flex border-b border-white/10 pb-2 mb-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setEmailError('');
                  }}
                  className={`text-xs font-bold pb-1 transition-all cursor-pointer ${
                    authMode === 'signup'
                      ? 'text-red-500 border-b-2 border-red-500'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  Create Account
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signin');
                    setEmailError('');
                  }}
                  className={`text-xs font-bold pb-1 transition-all cursor-pointer ${
                    authMode === 'signin'
                      ? 'text-red-500 border-b-2 border-red-500'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  Existing User Sign In
                </button>
              </div>

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
                        className="w-full bg-[#14141d] border border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
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
                      placeholder="name@example.ug"
                      required
                      className="w-full bg-[#14141d] border border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
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
                      className="w-full bg-[#14141d] border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
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
                      Billing / MoMo Preference
                    </label>
                    <select
                      value={emailMomo}
                      onChange={(e) => setEmailMomo(e.target.value as any)}
                      className="w-full bg-[#14141d] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                    >
                      <option value="MTN Mobile Money">MTN Mobile Money (Uganda)</option>
                      <option value="Airtel Money">Airtel Money (Uganda)</option>
                    </select>
                  </div>
                )}

                {emailError && (
                  <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 p-2.5 rounded-xl">
                    {emailError}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-red-600/30 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{authMode === 'signup' ? 'Create Free Account' : 'Sign In'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      </main>

      {/* Footer Feature Badges */}
      <footer className="relative z-10 max-w-4xl mx-auto px-4 py-4 w-full">
        <div className="grid grid-cols-3 gap-2 text-center text-[10px] sm:text-xs text-gray-400">
          <div className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-white/[0.02]">
            <Film className="w-3.5 h-3.5 text-red-500" />
            <span>Luganda VJ Tracks</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-white/[0.02]">
            <DownloadCloud className="w-3.5 h-3.5 text-red-500" />
            <span>Offline Downloads</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-white/[0.02]">
            <Sparkles className="w-3.5 h-3.5 text-red-500" />
            <span>Per-User Watchlists</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
