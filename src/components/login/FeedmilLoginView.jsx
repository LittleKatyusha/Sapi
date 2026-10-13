import React from 'react';
import { Eye, EyeOff, Shield, AlertTriangle, Loader2, ArrowRight, User, Lock, ArrowBigUp, Wheat, CheckCircle2 } from 'lucide-react';
import TurnstileWidget from './TurnstileWidget';

const FeedmilLoginView = ({
  tenant,
  formData,
  handleInputChange,
  emailRef,
  showPassword,
  setShowPassword,
  capsLockOn,
  detectCapsLock,
  rememberMe,
  setRememberMe,
  error,
  inputErrors,
  isBlocked,
  isLoading,
  captchaToken,
  captchaLoaded,
  handleSubmit,
  onForgotPasswordClick
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-10 bg-gradient-to-br from-amber-50/60 via-stone-100 to-amber-100/40 text-stone-800">
      {/* Outer Card Wrapper */}
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl shadow-amber-900/10 border border-amber-200/60 overflow-hidden flex flex-col md:flex-row">
        {/* Left Information Banner (Feedmill Identity) */}
        <div className="md:w-5/12 bg-gradient-to-br from-amber-700 via-amber-800 to-yellow-900 text-amber-50 p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-yellow-400/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />

          {/* Top Brand */}
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-600/60 backdrop-blur-sm border border-amber-400/30 flex items-center justify-center shadow-inner">
                <Wheat className="w-6 h-6 text-amber-200" />
              </div>
              <div>
                <span className="text-xl font-extrabold tracking-tight text-white block">
                  {tenant.companyName}
                </span>
                <span className="text-[11px] uppercase tracking-wider text-amber-200 font-medium">
                  Sistem Pakan Konsentrat
                </span>
              </div>
            </div>

            <div className="space-y-3 mt-6">
              <h2 className="text-2xl font-bold text-white leading-snug">
                Solusi Nutrisi Ternak Terintegrasi
              </h2>
              <p className="text-sm text-amber-100/90 leading-relaxed">
                {tenant.tagline}
              </p>
            </div>
          </div>

          {/* Features Checklist */}
          <div className="relative z-10 my-8 space-y-2.5">
            {[
              'Manajemen Bahan Baku & Silo',
              'Formulasi Nutrisi & Konsentrat',
              'Pencatatan Distribusi Pakan Kandang'
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-2.5 text-xs text-amber-100 font-medium">
                <CheckCircle2 className="w-4 h-4 text-amber-300 flex-shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          {/* Bottom Copyright */}
          <div className="relative z-10 text-[11px] text-amber-200/70 pt-4 border-t border-amber-700/60">
            © {new Date().getFullYear()} {tenant.fullName}. All rights reserved.
          </div>
        </div>

        {/* Right Form Area */}
        <div className="md:w-7/12 p-8 sm:p-10 flex flex-col justify-center bg-white">
          <div className="max-w-md mx-auto w-full">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-stone-900 tracking-tight">
                Masuk ke Portal
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Silakan autentikasi akun Anda untuk mengakses sistem inventaris pakan.
              </p>
            </div>

            {/* Error alert */}
            {error && (
              <div
                role="alert"
                className="mb-5 flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 transition-all duration-200"
              >
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-600" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Email / Username */}
              <div className="space-y-1.5">
                <label htmlFor="feedmil-email" className="block text-xs font-semibold text-stone-700">
                  Email atau Nama Pengguna
                </label>
                <div className="relative group">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 group-focus-within:text-amber-600 transition-colors" />
                  <input
                    ref={emailRef}
                    id="feedmil-email"
                    name="email"
                    type="text"
                    autoComplete="username"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    aria-invalid={!!inputErrors.email}
                    aria-describedby={inputErrors.email ? 'feedmil-email-error' : undefined}
                    className={`block w-full pl-10 pr-4 py-2.5 text-sm bg-stone-50 border rounded-xl text-stone-900 placeholder-stone-400 outline-none transition-all focus:ring-4 ${
                      inputErrors.email
                        ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10'
                        : 'border-stone-200 focus:border-amber-600 focus:ring-amber-500/15'
                    }`}
                    placeholder="nama@feedmil.co.id atau username"
                    disabled={isBlocked || isLoading}
                  />
                </div>
                {inputErrors.email && (
                  <p id="feedmil-email-error" className="text-xs text-red-600 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {inputErrors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="feedmil-password" className="block text-xs font-semibold text-stone-700">
                    Kata Sandi
                  </label>
                  <button
                    type="button"
                    onClick={onForgotPasswordClick}
                    className="text-xs font-medium text-amber-700 hover:text-amber-800 transition-colors"
                  >
                    Lupa sandi?
                  </button>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 group-focus-within:text-amber-600 transition-colors" />
                  <input
                    id="feedmil-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    onKeyDown={detectCapsLock}
                    onKeyUp={detectCapsLock}
                    aria-invalid={!!inputErrors.password}
                    aria-describedby={
                      inputErrors.password ? 'feedmil-password-error' : capsLockOn ? 'feedmil-capslock-warning' : undefined
                    }
                    className={`block w-full pl-10 pr-10 py-2.5 text-sm bg-stone-50 border rounded-xl text-stone-900 placeholder-stone-400 outline-none transition-all focus:ring-4 ${
                      inputErrors.password
                        ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10'
                        : 'border-stone-200 focus:border-amber-600 focus:ring-amber-500/15'
                    }`}
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {capsLockOn && !inputErrors.password && (
                  <p id="feedmil-capslock-warning" className="text-xs text-amber-700 flex items-center gap-1">
                    <ArrowBigUp className="w-3 h-3" />
                    Caps Lock sedang aktif
                  </p>
                )}
                {inputErrors.password && (
                  <p id="feedmil-password-error" className="text-xs text-red-600 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {inputErrors.password}
                  </p>
                )}
              </div>

              {/* Remember Me */}
              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer text-stone-600 hover:text-stone-800 transition-colors">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500/20"
                  />
                  <span className="text-xs">Tetap masuk di peramban ini</span>
                </label>
              </div>

              {/* Turnstile Captcha */}
              <TurnstileWidget captchaLoaded={captchaLoaded} isDark={false} />

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !captchaToken}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-amber-700 to-yellow-700 hover:from-amber-800 hover:to-yellow-800 focus:outline-none focus:ring-4 focus:ring-amber-500/20 shadow-md shadow-amber-900/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk ke Akun</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-stone-400">
              <Shield className="w-3.5 h-3.5 text-amber-600" />
              <span>Sistem Terproteksi Cloudflare Turnstile</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedmilLoginView;
