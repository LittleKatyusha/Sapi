import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthSecure } from '../hooks/useAuthSecure';
import { Eye, EyeOff, Shield, AlertTriangle, Loader2, ArrowRight, User, Lock, X, Mail, ArrowBigUp } from 'lucide-react';

import SecurityNotification from '../components/security/SecurityNotification';

// Use Cloudflare's official Turnstile test sitekey on localhost to avoid
// domain-restriction/network issues during local development. This test key
// always passes verification. Production keeps the real sitekey.
const isLocalDev = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const TURNSTILE_SITEKEY = isLocalDev
  ? '1x00000000000000000000AA'
  : '0x4AAAAAABk4XOgg4RBl7dSz';

const LoginPageSecure = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [inputErrors, setInputErrors] = useState({});
  const [captchaLoaded, setCaptchaLoaded] = useState(false);
  const [captchaRetryCount, setCaptchaRetryCount] = useState(0);
  const [rememberMe, setRememberMe] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const emailRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthSecure();

  // Restore remembered email & autofocus email input on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('remembered_email');
    if (savedEmail) {
      setFormData(prev => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
    const focusTimer = setTimeout(() => emailRef.current?.focus(), 120);
    return () => clearTimeout(focusTimer);
  }, []);

  // Redirect message notification (e.g. session expired)
  useEffect(() => {
    if (location.state?.message) {
      setNotification({
        message: location.state.message,
        type: location.state.type || 'info'
      });
    }
  }, [location.state]);

  // Simplified and more reliable Cloudflare Turnstile loading
  useEffect(() => {
    let mounted = true;
    let retryTimeout;
    let widgetId = null;
    let initTimeout;
    const TURNSTILE_CONTAINER_ID = 'turnstile-widget-container';
    const MAX_RETRIES = 3;
    const LOAD_TIMEOUT = 10000; // 10 seconds

    const renderWidget = () => {
      if (!window.turnstile || !mounted) {
        return;
      }

      const container = document.getElementById(TURNSTILE_CONTAINER_ID);
      if (!container) {
        return;
      }

      // Clear existing widget
      if (widgetId !== null) {
        try {
          window.turnstile.remove(widgetId);
          widgetId = null;
        } catch (err) {
          // Silent cleanup
        }
      }

      // Clear container
      container.innerHTML = '';

      try {
        
        widgetId = window.turnstile.render(container, {
          sitekey: TURNSTILE_SITEKEY,
          theme: 'dark',
          size: 'normal',
          callback: (token) => {
            if (mounted) {
              setCaptchaToken(token);
              setError('');
            }
          },
          'error-callback': (errorCode) => {
            if (mounted) {
              setCaptchaToken('');
              
              const errorMessages = {
                '110100': 'Sitekey tidak valid',
                '110110': 'Domain tidak diizinkan',
                '110200': 'Request tidak valid',
                '110420': 'Terlalu banyak request',
                '110500': 'Server error',
                '300010': 'Widget expired',
                '300020': 'Timeout',
                '300030': 'Widget error'
              };
              
              const errorMsg = errorMessages[errorCode] || `Error code: ${errorCode}`;
              setError(`Verifikasi error: ${errorMsg}`);
              
              // Retry for certain errors
              if (['300010', '300020', '300030'].includes(errorCode) && captchaRetryCount < MAX_RETRIES) {
                setCaptchaRetryCount(prev => prev + 1);
                retryTimeout = setTimeout(() => {
                  if (mounted) renderWidget();
                }, 3000);
              }
            }
          },
          'expired-callback': () => {
            if (mounted) {
              setCaptchaToken('');
              setError('Verifikasi expired, silakan ulangi');
            }
          },
          'timeout-callback': () => {
            if (mounted) {
              setCaptchaToken('');
              setError('Verifikasi timeout, silakan ulangi');
            }
          }
        });

        if (widgetId !== null) {
          setCaptchaLoaded(true);
        }
      } catch (err) {
        
        if (captchaRetryCount < MAX_RETRIES && mounted) {
          setCaptchaRetryCount(prev => prev + 1);
          setError(`Gagal render widget (${captchaRetryCount + 1}/${MAX_RETRIES}). Mencoba lagi...`);
          retryTimeout = setTimeout(() => {
            if (mounted) renderWidget();
          }, 3000);
        } else {
          setError('Gagal memuat verifikasi. Refresh halaman.');
        }
      }
    };

    const loadTurnstileScript = () => {
      // Check if already loaded
      if (window.turnstile) {
        renderWidget();
        return;
      }

      // Check if script already exists
      const existingScript = document.querySelector('script[src*="turnstile"]');
      if (existingScript) {
        const checkTurnstile = setInterval(() => {
          if (window.turnstile) {
            clearInterval(checkTurnstile);
            renderWidget();
          }
        }, 100);
        
        // Stop checking after timeout
        setTimeout(() => {
          clearInterval(checkTurnstile);
          if (!window.turnstile) {
            setError('Gagal memuat verifikasi. Refresh halaman.');
          }
        }, LOAD_TIMEOUT);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.id = 'turnstile-script';
      
      script.onload = () => {
        // Wait a bit for Turnstile to initialize
        setTimeout(() => {
          if (mounted && window.turnstile) {
            renderWidget();
          }
        }, 300);
      };
      
      script.onerror = (error) => {
        
        if (captchaRetryCount < MAX_RETRIES) {
          setCaptchaRetryCount(prev => prev + 1);
          setError(`Gagal load script (${captchaRetryCount + 1}/${MAX_RETRIES}). Mencoba lagi...`);
          retryTimeout = setTimeout(loadTurnstileScript, 3000);
        } else {
          setError('Gagal memuat script verifikasi. Periksa koneksi internet.');
        }
      };
      
      document.head.appendChild(script);
    };

    // Start loading after component mounts
    initTimeout = setTimeout(() => {
      if (mounted) {
        loadTurnstileScript();
      }
    }, 1000); // Wait 1 second for DOM to be ready

    return () => {
      mounted = false;
      
      // Clear timeouts
      if (retryTimeout) clearTimeout(retryTimeout);
      if (initTimeout) clearTimeout(initTimeout);
      
      // Remove widget
      if (widgetId !== null && window.turnstile) {
        try {
          window.turnstile.remove(widgetId);
        } catch (err) {
          // Silent cleanup
        }
      }
      
      setCaptchaLoaded(false);
      setCaptchaRetryCount(0);
    };
  }, [captchaRetryCount]);

  // Rate limiting disabled for development
  useEffect(() => {
    setIsBlocked(false);
  }, [formData.email]);

  const validateInput = (name, value) => {
    const errors = {};

    switch (name) {
      case 'email':
        const sanitizedEmail = value.trim();
        if (!sanitizedEmail) {
          errors.email = 'Masukkan email atau username Anda';
        } else {
          const isEmail = sanitizedEmail.includes('@');
          if (isEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizedEmail)) {
            errors.email = 'Format email tidak valid';
          } else if (!isEmail && sanitizedEmail.length < 3) {
            errors.email = 'Username minimal 3 karakter';
          }
        }
        break;

      case 'password':
        if (!value) {
          errors.password = 'Masukkan password Anda';
        } else if (value.length < 6) {
          errors.password = 'Password terlalu pendek';
        }
        break;

      default:
        break;
    }

    return errors;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));

    setError('');
    if (inputErrors[name]) {
      setInputErrors(prev => ({ ...prev, [name]: '' }));
    }

    if (name === 'email' || name === 'password') {
      const validationErrors = validateInput(name, newValue);
      setInputErrors(prev => ({ ...prev, ...validationErrors }));
    }
  };

  // Caps Lock detection via modifier state
  const detectCapsLock = (e) => {
    if (e.getModifierState) {
      setCapsLockOn(e.getModifierState('CapsLock'));
    }
  };

  const resetCaptcha = () => {
    setCaptchaToken('');
    setTimeout(() => {
      if (window.turnstile) {
        try {
          const container = document.getElementById('turnstile-widget-container');
          if (container && container.children.length > 0) {
            window.turnstile.reset();
          }
        } catch (err) {
          setCaptchaRetryCount(prev => prev + 1);
        }
      }
    }, 500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const emailErrors = validateInput('email', formData.email);
    const passwordErrors = validateInput('password', formData.password);
    const allErrors = { ...emailErrors, ...passwordErrors };

    if (Object.keys(allErrors).length > 0) {
      setInputErrors(allErrors);
      setError('Lengkapi email/username dan password');
      return;
    }

    if (!captchaToken) {
      setError('Selesaikan verifikasi keamanan');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await login({
        login: formData.email.trim(),
        password: formData.password,
        captcha: captchaToken
      });

      if (result.success) {
        // Remember me: persist or clear email
        if (rememberMe) {
          localStorage.setItem('remembered_email', formData.email.trim());
        } else {
          localStorage.removeItem('remembered_email');
        }

        const redirectTo = location.state?.from?.pathname || '/dashboard';
        navigate(redirectTo, { replace: true });

        setNotification({
          message: 'Login berhasil! Selamat datang kembali.',
          type: 'success'
        });
      } else {
        // Mask error: generic message to prevent user enumeration
        setError('Email/username atau password salah');

        if (result.attempts) {
          const remaining = result.maxAttempts - result.attempts;
          if (remaining <= 2 && remaining > 0) {
            setNotification({
              message: 'Pastikan email/username dan password benar',
              type: 'warning'
            });
          }
        }

        if (result.blocked) {
          setIsBlocked(true);
        }

        resetCaptcha();
      }
    } catch (err) {
      setError('Koneksi bermasalah, coba lagi');
      resetCaptcha();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* === Left Brand Panel (desktop only) === */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900">
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
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-teal-400/20 rounded-full blur-3xl" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 text-white w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
              <Shield className="w-6 h-6 text-emerald-300" />
            </div>
            <span className="text-xl font-bold tracking-tight">TernaSys</span>
          </div>

          {/* Hero text */}
          <div className="space-y-6 max-w-md">
            <h1 className="text-4xl xl:text-5xl font-bold tracking-tight leading-tight">
              Sistem Manajemen
              <br />
              <span className="text-emerald-300">CV Puput Bersaudara</span>
            </h1>
            <p className="text-emerald-100/80 text-lg leading-relaxed">
              Platform terintegrasi untuk pengelolaan ternak, persediaan, dan distribusi sapi yang efisien dan aman.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              {['Real-time Stock', 'Multi-RPH', 'Secure Auth', 'Audit Trail'].map((f) => (
                <span
                  key={f}
                  className="px-3 py-1.5 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full text-xs font-medium text-emerald-100"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="text-xs text-emerald-200/60">
            © {new Date().getFullYear()} CV Puput Bersaudara. All rights reserved.
          </div>
        </div>
      </div>

      {/* === Right Form Panel === */}
      <div className="flex-1 flex flex-col lg:w-1/2">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-center gap-2.5 pt-10 pb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
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
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
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
                    className={`block w-full pl-11 pr-4 py-3 text-sm bg-slate-50 border rounded-xl text-slate-900 placeholder-slate-400 transition-all duration-150 outline-none focus:ring-4 focus:ring-emerald-500/10 ${
                      inputErrors.email
                        ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10'
                        : 'border-slate-200 focus:border-emerald-500'
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
                    onClick={() => setShowForgotModal(true)}
                    className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                  >
                    Lupa password?
                  </button>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
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
                    className={`block w-full pl-11 pr-11 py-3 text-sm bg-slate-50 border rounded-xl text-slate-900 placeholder-slate-400 transition-all duration-150 outline-none focus:ring-4 focus:ring-emerald-500/10 ${
                      inputErrors.password
                        ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10'
                        : 'border-slate-200 focus:border-emerald-500'
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
                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-2 focus:ring-emerald-500/20 cursor-pointer transition-colors"
                  />
                  <span className="text-sm text-slate-600 group-hover:text-slate-700 transition-colors">
                    Ingat saya
                  </span>
                </label>
              </div>

              {/* Cloudflare Turnstile Captcha */}
              <div className="flex justify-center py-1">
                <div className="relative">
                  <div id="turnstile-widget-container"></div>
                  {!captchaLoaded && (
                    <div className="flex items-center justify-center bg-slate-50 border border-slate-200 rounded-lg min-h-[65px] min-w-[300px] px-4">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-xs">Memuat verifikasi keamanan...</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !captchaToken}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 active:scale-[0.98]"
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

      {/* === Forgot Password Modal === */}
      {showForgotModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          onClick={() => setShowForgotModal(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <Mail className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Lupa Password</h3>
                  <p className="text-xs text-slate-500">Hubungi administrator</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                aria-label="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-sm text-slate-600">
              <p>Untuk reset password, silakan hubungi administrator sistem melalui:</p>
              <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="font-medium text-slate-700">admin@puputbersaudara.com</span>
                </div>
                <div className="text-xs text-slate-500">Atau hubungi IT Support di ext. 123</div>
              </div>
              <p className="text-xs text-slate-400">
                Demi keamanan, proses reset password memerlukan verifikasi identitas.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="mt-5 w-full py-2.5 px-4 rounded-xl text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Security Notification */}
      {notification && (
        <SecurityNotification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default LoginPageSecure;
