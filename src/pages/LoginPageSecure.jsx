import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthSecure } from '../hooks/useAuthSecure';
import { Eye, EyeOff, Shield, Clock, AlertTriangle } from 'lucide-react';
import { 
  sanitizeHtml, 
  validateEmail
} from '../utils/security';
import SecurityNotification from '../components/security/SecurityNotification';

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
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimeRemaining, setBlockTimeRemaining] = useState(0);
  const [inputErrors, setInputErrors] = useState({});
  const [captchaLoaded, setCaptchaLoaded] = useState(false);
  const [captchaRetryCount, setCaptchaRetryCount] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthSecure();

  // Set security headers saat komponen mount
  useEffect(() => {
    // Check if there's a message from redirect
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
          sitekey: '0x4AAAAAABk4XOgg4RBl7dSz',
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
    // Always ensure rate limiting is disabled
    setIsBlocked(false);
    setLoginAttempts(0);
    setBlockTimeRemaining(0);
  }, [formData.email]);

  const validateInput = (name, value) => {
    const errors = {};
    
    switch (name) {
      case 'email':
        const sanitizedEmail = sanitizeHtml(value.trim());
        if (!sanitizedEmail) {
          errors.email = 'Masukkan email atau username Anda';
        } else {
          // Check if it's an email format
          const isEmail = sanitizedEmail.includes('@');
          if (isEmail && !validateEmail(sanitizedEmail)) {
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
      setError('Lengkapi email/username dan password');
      return;
    }

    if (!captchaToken) {
      setError('Selesaikan verifikasi keamanan');
      return;
    }

    // Rate limiting disabled - allow login attempts

    setIsLoading(true);
    setError('');

    try {
      const result = await login({
        login: formData.email.trim(),
        password: formData.password, 
        captcha: captchaToken
      });

      if (result.success) {
        // Redirect ke halaman tujuan atau dashboard
        const redirectTo = location.state?.from?.pathname || '/dashboard';
        navigate(redirectTo, { replace: true });
        
        setNotification({
          message: 'Login berhasil! Selamat datang kembali.',
          type: 'success'
        });
      } else {
        setError('Email/username atau password salah');
        
        if (result.attempts) {
          setLoginAttempts(result.attempts);
          const remaining = result.maxAttempts - result.attempts;
          
          if (remaining <= 2 && remaining > 0) {
            setNotification({
              message: `Pastikan email/username dan password benar`,
              type: 'warning'
            });
          }
        }
        
        if (result.blocked) {
          setIsBlocked(true);
          setBlockTimeRemaining(result.remainingTime);
        }
        
        // Reset captcha on error with enhanced handling
        setCaptchaToken('');
        setTimeout(() => {
          if (window.turnstile) {
            try {
              // Reset the specific widget instance
              const container = document.getElementById('turnstile-widget-container');
              if (container && container.children.length > 0) {
                window.turnstile.reset();
              }
            } catch (err) {
              // Force reload widget if reset fails
              setCaptchaRetryCount(prev => prev + 1);
            }
          }
        }, 500);
      }
    } catch (err) {
      setError('Koneksi bermasalah, coba lagi');
      
      // Reset captcha on error with enhanced handling
      setCaptchaToken('');
      setTimeout(() => {
        if (window.turnstile) {
          try {
            // Reset the specific widget instance
            const container = document.getElementById('turnstile-widget-container');
            if (container && container.children.length > 0) {
              window.turnstile.reset();
            }
          } catch (err) {
            // Force reload widget if reset fails
            setCaptchaRetryCount(prev => prev + 1);
          }
        }
      }, 500);
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
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-700">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-emerald-500 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute top-60 right-32 w-24 h-24 bg-emerald-400 rounded-full opacity-30 animate-bounce"></div>
        <div className="absolute bottom-40 left-40 w-20 h-20 bg-emerald-300 rounded-full opacity-25 animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-16 h-16 bg-emerald-500 rounded-full opacity-20 animate-bounce"></div>
        
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
              <div className="mx-auto w-20 h-20 bg-gradient-to-r from-white to-emerald-100 rounded-3xl flex items-center justify-center mb-6 shadow-xl">
                <Shield className="w-10 h-10 text-emerald-600" />
              </div>
              <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">TernaSys</h1>
              <p className="text-emerald-100 text-lg">Sistem Manajemen CV Puput Bersaudara</p>
              <div className="w-24 h-1 bg-gradient-to-r from-emerald-400 to-emerald-300 mx-auto mt-4 rounded-full"></div>
            </div>

            {/* Security Status - Rate limiting disabled */}

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
                  Email atau Username
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-emerald-300 group-focus-within:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="text"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`block w-full pl-12 pr-4 py-4 bg-white/10 border rounded-xl focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white/40 transition-all duration-200 text-white placeholder-emerald-200 backdrop-blur-sm ${
                      inputErrors.email ? 'border-red-400' : 'border-white/20'
                    }`}
                    placeholder="email@example.com atau username"
                    disabled={isBlocked}
                  />
                </div>
                {inputErrors.email && (
                  <p className="text-emerald-200 text-xs flex items-center">
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
                    <svg className="h-5 w-5 text-emerald-300 group-focus-within:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    className={`block w-full pl-12 pr-12 py-4 bg-white/10 border rounded-xl focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white/40 transition-all duration-200 text-white placeholder-emerald-200 backdrop-blur-sm ${
                      inputErrors.password ? 'border-red-400' : 'border-white/20'
                    }`}
                    placeholder="••••••••"
                    disabled={false}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-emerald-300 hover:text-white transition-colors"
                    disabled={false}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {inputErrors.password && (
                  <p className="text-emerald-200 text-xs flex items-center">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    {inputErrors.password}
                  </p>
                )}
              </div>

              {/* Cloudflare Turnstile Captcha with Loading State */}
              <div className="flex justify-center py-2">
                <div className="relative">
                  <div id="turnstile-widget-container"></div>
                  {!captchaLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/10 rounded-lg min-h-[65px]">
                      <div className="flex items-center space-x-2 text-white/70">
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-sm">Memuat verifikasi keamanan...</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !captchaToken}
                className="w-full flex justify-center py-4 px-6 border border-transparent rounded-xl shadow-lg text-lg font-semibold text-emerald-700 bg-gradient-to-r from-white to-emerald-50 hover:from-emerald-50 hover:to-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Memverifikasi...
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
              <p className="text-xs text-emerald-200 flex items-center justify-center">
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
