import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthSecure } from '../hooks/useAuthSecure';
import { Eye, EyeOff, Shield, Clock, AlertTriangle } from 'lucide-react';
import { 
  sanitizeHtml, 
  validateEmail, 
  loginRateLimit,
  securityAudit,
  setSecurityHeaders
} from '../utils/security';
import SecurityNotification from '../components/security/SecurityNotification';

const LoginPageSecure = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [notification, setNotification] = useState(null);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimeRemaining, setBlockTimeRemaining] = useState(0);
  const [inputErrors, setInputErrors] = useState({});

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthSecure();

  // Set security headers saat komponen mount
  useEffect(() => {
    setSecurityHeaders();
    securityAudit.log('LOGIN_PAGE_ACCESSED', {
      referrer: document.referrer,
      userAgent: navigator.userAgent.slice(0, 100)
    });

    // Check if there's a message from redirect
    if (location.state?.message) {
      setNotification({
        message: location.state.message,
        type: location.state.type || 'info'
      });
    }
  }, [location.state]);

  // Load Cloudflare Turnstile script dan handle callbacks
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      securityAudit.log('CAPTCHA_LOADED');
    };
    script.onerror = () => {
      securityAudit.log('CAPTCHA_LOAD_ERROR');
      setError('Refresh halaman untuk melanjutkan');
    };
    document.head.appendChild(script);

    // Define callback functions
    window.handleCaptchaSuccess = (token) => {
      setCaptchaToken(token);
      securityAudit.log('CAPTCHA_SUCCESS');
    };

    window.handleCaptchaError = () => {
      setCaptchaToken('');
      setError('Verifikasi gagal, coba lagi');
      securityAudit.log('CAPTCHA_ERROR');
    };

    window.handleCaptchaExpired = () => {
      setCaptchaToken('');
      setError('Verifikasi kedaluwarsa, ulangi lagi');
      securityAudit.log('CAPTCHA_EXPIRED');
    };

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
      // Clean up global functions
      delete window.handleCaptchaSuccess;
      delete window.handleCaptchaError;
      delete window.handleCaptchaExpired;
    };
  }, []);

  // Check rate limiting status
  useEffect(() => {
    const checkRateLimit = () => {
      if (formData.email) {
        const blocked = loginRateLimit.isBlocked(formData.email);
        const attempts = loginRateLimit.getAttempts(formData.email);
        
        setIsBlocked(blocked);
        setLoginAttempts(attempts.count);
        
        if (blocked) {
          const remaining = loginRateLimit.getRemainingTime(formData.email);
          setBlockTimeRemaining(remaining);
          
          // Update remaining time every second
          const interval = setInterval(() => {
            const newRemaining = loginRateLimit.getRemainingTime(formData.email);
            setBlockTimeRemaining(newRemaining);
            
            if (newRemaining <= 0) {
              setIsBlocked(false);
              clearInterval(interval);
            }
          }, 1000);
          
          return () => clearInterval(interval);
        }
      }
    };

    checkRateLimit();
  }, [formData.email]);

  const validateInput = (name, value) => {
    const errors = {};
    
    switch (name) {
      case 'email':
        const sanitizedEmail = sanitizeHtml(value.trim());
        if (!sanitizedEmail) {
          errors.email = 'Masukkan email Anda';
        } else if (!validateEmail(sanitizedEmail)) {
          errors.email = 'Email tidak valid';
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
    
    // Sanitize input
    const sanitizedValue = type === 'text' || type === 'email' 
      ? sanitizeHtml(newValue) 
      : newValue;
    
    setFormData(prev => ({
      ...prev,
      [name]: sanitizedValue
    }));
    
    // Clear errors
    setError('');
    if (inputErrors[name]) {
      setInputErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Real-time validation
    if (name === 'email' || name === 'password') {
      const validationErrors = validateInput(name, sanitizedValue);
      setInputErrors(prev => ({ ...prev, ...validationErrors }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate semua input
    const emailErrors = validateInput('email', formData.email);
    const passwordErrors = validateInput('password', formData.password);
    const allErrors = { ...emailErrors, ...passwordErrors };
    
    if (Object.keys(allErrors).length > 0) {
      setInputErrors(allErrors);
      setError('Lengkapi email dan password');
      return;
    }

    if (!captchaToken) {
      setError('Selesaikan verifikasi keamanan');
      securityAudit.log('LOGIN_ATTEMPT_NO_CAPTCHA', { email: formData.email });
      return;
    }

    // Check rate limiting
    if (isBlocked) {
      const minutes = Math.ceil(blockTimeRemaining / (1000 * 60));
      setError(`Tunggu ${minutes} menit untuk coba lagi`);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('🔵 DEBUG: Attempting login with data:', {
        email: formData.email.trim(),
        hasPassword: !!formData.password,
        hasCaptcha: !!captchaToken,
        rememberMe: formData.rememberMe
      });

      const result = await login({
        email: formData.email.trim(),
        password: formData.password,
        captcha: captchaToken,
        rememberMe: formData.rememberMe
      });

      console.log('🔵 DEBUG: Login result:', {
        success: result.success,
        hasToken: !!result.token,
        hasUser: !!result.user,
        message: result.message,
        attempts: result.attempts,
        blocked: result.blocked
      });

      if (result.success) {
        console.log('✅ DEBUG: Login successful, redirecting...');
        securityAudit.log('LOGIN_SUCCESS_REDIRECT');
        
        // Redirect ke halaman tujuan atau dashboard
        const redirectTo = location.state?.from?.pathname || '/dashboard';
        console.log('🔄 DEBUG: Redirecting to:', redirectTo);
        navigate(redirectTo, { replace: true });
        
        setNotification({
          message: 'Login berhasil! Selamat datang kembali.',
          type: 'success'
        });
      } else {
        setError('Email atau password salah');
        
        if (result.attempts) {
          setLoginAttempts(result.attempts);
          const remaining = result.maxAttempts - result.attempts;
          
          if (remaining <= 2 && remaining > 0) {
            setNotification({
              message: `Pastikan email dan password benar`,
              type: 'warning'
            });
          }
        }
        
        if (result.blocked) {
          setIsBlocked(true);
          setBlockTimeRemaining(result.remainingTime);
        }
        
        // Reset captcha on error
        setCaptchaToken('');
        if (window.turnstile) {
          window.turnstile.reset();
        }
      }
    } catch (err) {
      setError('Koneksi bermasalah, coba lagi');
      securityAudit.log('LOGIN_NETWORK_ERROR', { error: err.message });
      
      // Reset captcha on error
      setCaptchaToken('');
      if (window.turnstile) {
        window.turnstile.reset();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatBlockTime = (timeMs) => {
    const minutes = Math.ceil(timeMs / (1000 * 60));
    return `${minutes} menit`;
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-900 via-red-700 to-rose-800">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-red-500 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute top-60 right-32 w-24 h-24 bg-rose-400 rounded-full opacity-30 animate-bounce"></div>
        <div className="absolute bottom-40 left-40 w-20 h-20 bg-red-300 rounded-full opacity-25 animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-16 h-16 bg-rose-500 rounded-full opacity-20 animate-bounce"></div>
        
        {/* Geometric Patterns */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-32 left-16 w-64 h-64 border-2 border-white rotate-45 rounded-3xl"></div>
          <div className="absolute bottom-32 right-16 w-48 h-48 border-2 border-white rotate-12 rounded-2xl"></div>
          <div className="absolute top-1/2 left-1/4 w-32 h-32 border border-white rotate-90 rounded-xl"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-lg">
          {/* Glass Card */}
          <div className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-8 md:p-10">
            {/* Logo/Brand Section */}
            <div className="text-center mb-8">
              <div className="mx-auto w-20 h-20 bg-gradient-to-r from-white to-red-100 rounded-3xl flex items-center justify-center mb-6 shadow-xl">
                <Shield className="w-10 h-10 text-red-600" />
              </div>
              <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">TernaSys</h1>
              <p className="text-red-100 text-lg">Sistem Manajemen CV Puput Bersaudara</p>
              <div className="w-24 h-1 bg-gradient-to-r from-red-400 to-rose-400 mx-auto mt-4 rounded-full"></div>
            </div>

            {/* Security Status */}
            {(loginAttempts > 0 || isBlocked) && (
              <div className={`mb-6 p-4 rounded-xl border backdrop-blur-sm ${
                isBlocked 
                  ? 'bg-red-500/20 border-red-400/30 text-red-100' 
                  : 'bg-yellow-500/20 border-yellow-400/30 text-yellow-100'
              }`}>
                <div className="flex items-center">
                  {isBlocked ? (
                    <>
                      <Clock className="w-5 h-5 mr-2" />
                      <div>
                        <p className="font-medium">Tunggu Sebentar</p>
                        <p className="text-sm">Coba lagi dalam {formatBlockTime(blockTimeRemaining)}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-5 h-5 mr-2" />
                      <div>
                        <p className="font-medium">Perhatian</p>
                        <p className="text-sm">
                          Pastikan data login Anda benar
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-400/30 text-red-100 rounded-xl text-sm backdrop-blur-sm">
                <div className="flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
                  {error}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-semibold text-white">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-red-300 group-focus-within:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`block w-full pl-12 pr-4 py-4 bg-white/10 border rounded-xl focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white/40 transition-all duration-200 text-white placeholder-red-200 backdrop-blur-sm ${
                      inputErrors.email ? 'border-red-400' : 'border-white/20'
                    }`}
                    placeholder="admin@example.com"
                    disabled={isBlocked}
                  />
                </div>
                {inputErrors.email && (
                  <p className="text-red-200 text-xs flex items-center">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    {inputErrors.email}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-semibold text-white">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-red-300 group-focus-within:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`block w-full pl-12 pr-12 py-4 bg-white/10 border rounded-xl focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white/40 transition-all duration-200 text-white placeholder-red-200 backdrop-blur-sm ${
                      inputErrors.password ? 'border-red-400' : 'border-white/20'
                    }`}
                    placeholder="••••••••"
                    disabled={isBlocked}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-red-300 hover:text-white transition-colors"
                    disabled={isBlocked}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {inputErrors.password && (
                  <p className="text-red-200 text-xs flex items-center">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    {inputErrors.password}
                  </p>
                )}
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between">
                <label className="flex items-center group cursor-pointer">
                  <input
                    name="rememberMe"
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={handleInputChange}
                    className="h-5 w-5 text-red-500 bg-white/10 border-white/30 rounded focus:ring-white/40 focus:ring-2"
                    disabled={isBlocked}
                  />
                  <span className="ml-3 text-sm text-red-100 group-hover:text-white transition-colors">
                    Ingat saya
                  </span>
                </label>
              </div>

              {/* Cloudflare Turnstile Captcha */}
              <div className="flex justify-center py-2">
                <div 
                  className="cf-turnstile" 
                  data-sitekey="0x4AAAAAABk4XOgg4RBl7dSz"
                  data-callback="handleCaptchaSuccess"
                  data-error-callback="handleCaptchaError"
                  data-expired-callback="handleCaptchaExpired"
                ></div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || isBlocked || !captchaToken}
                className="w-full flex justify-center py-4 px-6 border border-transparent rounded-xl shadow-lg text-lg font-semibold text-red-700 bg-gradient-to-r from-white to-red-50 hover:from-red-50 hover:to-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Memverifikasi...
                  </>
                ) : isBlocked ? (
                  <>
                    <Clock className="w-5 h-5 mr-2" />
                    Tunggu - {formatBlockTime(blockTimeRemaining)}
                  </>
                ) : (
                  <>
                    <span>Masuk ke Dashboard</span>
                    <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* Security Info */}
            <div className="mt-6 text-center">
              <p className="text-xs text-red-200 flex items-center justify-center">
                <Shield className="w-3 h-3 mr-1" />
                Login Anda dilindungi dengan enkripsi end-to-end
              </p>
            </div>
          </div>
        </div>
      </div>

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