import React from 'react';
import { Eye, EyeOff, Shield, AlertTriangle, Loader2, ArrowRight, User, Lock, ArrowBigUp, Beef, Activity } from 'lucide-react';
import TurnstileWidget from './TurnstileWidget';

const RphLoginView = ({
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
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 bg-slate-950 overflow-hidden text-slate-100">
      {/* Background glow effects */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-red-700/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-rose-700/15 rounded-full blur-[120px] pointer-events-none" />
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 50%, #ef4444 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />

      {/* Centered Floating Card */}
      <div className="w-full max-w-md relative z-10">
        <div className="bg-slate-900/90 backdrop-blur-xl border border-red-900/40 rounded-3xl p-7 sm:p-9 shadow-2xl shadow-red-950/50">
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-7">
            <div className="relative mb-4">
              <div className="w-14 h-14 bg-gradient-to-tr from-red-950 to-red-800 border border-red-500/30 rounded-2xl flex items-center justify-center shadow-lg shadow-red-900/40">
                <Beef className="w-7 h-7 text-red-300" />
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-950/80 text-red-300 border border-red-800/50 mb-2">
              <Activity className="w-3 h-3 text-red-400" />
              <span>TERMINAL OPERASIONAL RPH</span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-white">
              {tenant.fullName}
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Portal Logistik Pemotongan, Karkas, dan Distribusi Daging Sapi
            </p>
          </div>

          {/* Error alert */}
          {error && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-2.5 p-3.5 bg-red-950/60 border border-red-800/60 rounded-xl text-sm text-red-200 transition-all duration-200"
            >
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Email / Username */}
            <div className="space-y-1.5">
              <label htmlFor="rph-email" className="block text-xs font-medium uppercase tracking-wider text-slate-300">
                ID Petugas / Email
              </label>
              <div className="relative group">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-red-400 transition-colors" />
                <input
                  ref={emailRef}
                  id="rph-email"
                  name="email"
                  type="text"
                  autoComplete="username"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  aria-invalid={!!inputErrors.email}
                  aria-describedby={inputErrors.email ? 'rph-email-error' : undefined}
                  className={`block w-full pl-10 pr-4 py-2.5 text-sm bg-slate-950/70 border rounded-xl text-slate-100 placeholder-slate-500 outline-none transition-all focus:ring-4 ${
                    inputErrors.email
                      ? 'border-red-500 focus:border-red-400 focus:ring-red-500/20'
                      : 'border-slate-800 focus:border-red-500/80 focus:ring-red-500/20'
                  }`}
                  placeholder="ID Petugas atau email"
                  disabled={isBlocked || isLoading}
                />
              </div>
              {inputErrors.email && (
                <p id="rph-email-error" className="text-xs text-red-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {inputErrors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="rph-password" className="block text-xs font-medium uppercase tracking-wider text-slate-300">
                  Kunci Akses (Password)
                </label>
                <button
                  type="button"
                  onClick={onForgotPasswordClick}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  Bantuan Akses?
                </button>
              </div>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-red-400 transition-colors" />
                <input
                  id="rph-password"
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
                    inputErrors.password ? 'rph-password-error' : capsLockOn ? 'rph-capslock-warning' : undefined
                  }
                  className={`block w-full pl-10 pr-10 py-2.5 text-sm bg-slate-950/70 border rounded-xl text-slate-100 placeholder-slate-500 outline-none transition-all focus:ring-4 ${
                    inputErrors.password
                      ? 'border-red-500 focus:border-red-400 focus:ring-red-500/20'
                      : 'border-slate-800 focus:border-red-500/80 focus:ring-red-500/20'
                  }`}
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {capsLockOn && !inputErrors.password && (
                <p id="rph-capslock-warning" className="text-xs text-amber-400 flex items-center gap-1">
                  <ArrowBigUp className="w-3 h-3" />
                  Caps Lock aktif
                </p>
              )}
              {inputErrors.password && (
                <p id="rph-password-error" className="text-xs text-red-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {inputErrors.password}
                </p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-200 transition-colors">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-red-600 focus:ring-red-500/20"
                />
                <span className="text-xs">Ingat perangkat ini</span>
              </label>
            </div>

            {/* Turnstile Captcha (Dark Mode) */}
            <TurnstileWidget captchaLoaded={captchaLoaded} isDark={true} />

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || !captchaToken}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-red-700 via-rose-700 to-red-800 hover:from-red-600 hover:to-rose-600 focus:outline-none focus:ring-4 focus:ring-red-500/20 shadow-lg shadow-red-950/60 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mengautentikasi...</span>
                </>
              ) : (
                <>
                  <span>Masuk Terminal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3 text-red-400" />
              Sesi Terenkripsi
            </span>
            <span>© {new Date().getFullYear()} PT RPH</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RphLoginView;
