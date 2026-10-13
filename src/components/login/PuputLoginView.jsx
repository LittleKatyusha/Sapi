import React from 'react';
import { Eye, EyeOff, Shield, AlertTriangle, Loader2, ArrowRight, User, Lock, ArrowBigUp } from 'lucide-react';
import TurnstileWidget from './TurnstileWidget';

const PuputLoginView = ({
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
    <div className="min-h-screen flex bg-slate-50">
      {/* === Left Brand Panel (desktop only) === */}
      <div className={`hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br ${tenant.loginGradient}`}>
        {/* Subtle dot pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }}
        />
        {/* Glow blobs */}
        <div className={`absolute -top-24 -right-24 w-96 h-96 ${tenant.loginGlow1} rounded-full blur-3xl`} />
        <div className={`absolute -bottom-32 -left-32 w-96 h-96 ${tenant.loginGlow2} rounded-full blur-3xl`} />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 text-white w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
              <Shield className={`w-6 h-6 ${tenant.loginAccentText}`} />
            </div>
            <span className="text-xl font-bold tracking-tight">TernaSys</span>
          </div>

          {/* Hero text */}
          <div className="space-y-6 max-w-md">
            <h1 className="text-4xl xl:text-5xl font-bold tracking-tight leading-tight">
              Sistem Manajemen
              <br />
              <span className={tenant.loginAccentText}>{tenant.fullName}</span>
            </h1>
            <p className="text-white/80 text-lg leading-relaxed">
              {tenant.tagline}
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              {['Real-time Stock', 'Multi-RPH', 'Secure Auth', 'Audit Trail'].map((f) => (
                <span
                  key={f}
                  className="px-3 py-1.5 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full text-xs font-medium text-white/90"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="text-xs text-white/60">
            © {new Date().getFullYear()} {tenant.fullName}. All rights reserved.
          </div>
        </div>
      </div>

      {/* === Right Form Panel === */}
      <div className="flex-1 flex flex-col lg:w-1/2">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-center gap-2.5 pt-10 pb-6">
          <div className={`w-10 h-10 bg-gradient-to-br ${tenant.mobileIconGradient} rounded-xl flex items-center justify-center shadow-lg`}>
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-800">TernaSys</span>
        </div>

        {/* Form container */}
        <div className="flex-1 flex items-center justify-center px-5 sm:px-8 pb-10">
          <div className="w-full max-w-sm">
            {/* Heading */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Selamat datang</h2>
              <p className="text-sm text-slate-500 mt-1.5">Masuk ke akun Anda untuk melanjutkan</p>
            </div>

            {/* Error alert */}
            {error && (
              <div
                role="alert"
                className="mb-5 flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 transition-all duration-200"
              >
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {/* Email / Username */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                  Email atau Username
                </label>
                <div className="relative group">
                  <User className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400 ${tenant.iconFocusClass} transition-colors`} />
                  <input
                    ref={emailRef}
                    id="email"
                    name="email"
                    type="text"
                    autoComplete="username"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    aria-invalid={!!inputErrors.email}
                    aria-describedby={inputErrors.email ? 'email-error' : undefined}
                    className={`block w-full pl-11 pr-4 py-3 text-sm bg-slate-50 border rounded-xl text-slate-900 placeholder-slate-400 transition-all duration-150 outline-none focus:ring-4 ${
                      inputErrors.email
                        ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10'
                        : `border-slate-200 ${tenant.inputFocusClass}`
                    }`}
                    placeholder="email@example.com atau username"
                    disabled={isBlocked || isLoading}
                  />
                </div>
                {inputErrors.email && (
                  <p id="email-error" className="text-xs text-red-600 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {inputErrors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={onForgotPasswordClick}
                    className={`text-xs font-medium ${tenant.linkClass} transition-colors`}
                  >
                    Lupa password?
                  </button>
                </div>
                <div className="relative group">
                  <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400 ${tenant.iconFocusClass} transition-colors`} />
                  <input
                    id="password"
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
                      inputErrors.password ? 'password-error' : capsLockOn ? 'capslock-warning' : undefined
                    }
                    className={`block w-full pl-11 pr-11 py-3 text-sm bg-slate-50 border rounded-xl text-slate-900 placeholder-slate-400 transition-all duration-150 outline-none focus:ring-4 ${
                      inputErrors.password
                        ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10'
                        : `border-slate-200 ${tenant.inputFocusClass}`
                    }`}
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                  </button>
                </div>
                {/* Caps lock warning */}
                {capsLockOn && !inputErrors.password && (
                  <p id="capslock-warning" className="text-xs text-amber-600 flex items-center gap-1">
                    <ArrowBigUp className="w-3 h-3" />
                    Caps Lock sedang aktif
                  </p>
                )}
                {inputErrors.password && (
                  <p id="password-error" className="text-xs text-red-600 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {inputErrors.password}
                  </p>
                )}
              </div>

              {/* Remember me */}
              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className={`w-4 h-4 rounded border-slate-300 ${tenant.checkboxClass} cursor-pointer transition-colors`}
                  />
                  <span className="text-sm text-slate-600 group-hover:text-slate-700 transition-colors">
                    Ingat saya
                  </span>
                </label>
              </div>

              {/* Cloudflare Turnstile Captcha */}
              <TurnstileWidget captchaLoaded={captchaLoaded} isDark={false} />

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !captchaToken}
                className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white ${tenant.loginBtnClass} focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98]`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memverifikasi...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Security footer */}
            <div className="mt-8 flex items-center justify-center gap-1.5 text-xs text-slate-400">
              <Shield className="w-3.5 h-3.5" />
              <span>Dilindungi enkripsi end-to-end & verifikasi keamanan</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PuputLoginView;
