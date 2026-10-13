import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthSecure } from '../hooks/useAuthSecure';
import { useTenant } from '../hooks/useTenant';

import SecurityNotification from '../components/security/SecurityNotification';
import PuputLoginView from '../components/login/PuputLoginView';
import RphLoginView from '../components/login/RphLoginView';
import FeedmilLoginView from '../components/login/FeedmilLoginView';
import ForgotPasswordModal from '../components/login/ForgotPasswordModal';

const TENANT_VIEWS = {
  puput: PuputLoginView,
  rph: RphLoginView,
  feedmil: FeedmilLoginView
};

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
  const tenant = useTenant();

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
        const isDarkTheme = tenant.id === 'rph';
        widgetId = window.turnstile.render(container, {
          sitekey: TURNSTILE_SITEKEY,
          theme: isDarkTheme ? 'dark' : 'light',
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
      if (window.turnstile) {
        renderWidget();
        return;
      }

      const existingScript = document.querySelector('script[src*="turnstile"]');
      if (existingScript) {
        const checkTurnstile = setInterval(() => {
          if (window.turnstile) {
            clearInterval(checkTurnstile);
            renderWidget();
          }
        }, 100);

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
        setTimeout(() => {
          if (mounted && window.turnstile) {
            renderWidget();
          }
        }, 300);
      };

      script.onerror = () => {
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

    initTimeout = setTimeout(() => {
      if (mounted) {
        loadTurnstileScript();
      }
    }, 1000);

    return () => {
      mounted = false;
      if (retryTimeout) clearTimeout(retryTimeout);
      if (initTimeout) clearTimeout(initTimeout);

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
  }, [captchaRetryCount, tenant.id]);

  useEffect(() => {
    setIsBlocked(false);
  }, [formData.email]);

  const validateInput = (name, value) => {
    const errors = {};

    switch (name) {
      case 'email': {
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
      }
      case 'password': {
        if (!value) {
          errors.password = 'Masukkan password Anda';
        } else if (value.length < 6) {
          errors.password = 'Password terlalu pendek';
        }
        break;
      }
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

  // Select view component based on active tenant
  const ActiveLoginView = TENANT_VIEWS[tenant.id] || PuputLoginView;

  return (
    <>
      <ActiveLoginView
        tenant={tenant}
        formData={formData}
        handleInputChange={handleInputChange}
        emailRef={emailRef}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        capsLockOn={capsLockOn}
        detectCapsLock={detectCapsLock}
        rememberMe={rememberMe}
        setRememberMe={setRememberMe}
        error={error}
        inputErrors={inputErrors}
        isBlocked={isBlocked}
        isLoading={isLoading}
        captchaToken={captchaToken}
        captchaLoaded={captchaLoaded}
        handleSubmit={handleSubmit}
        onForgotPasswordClick={() => setShowForgotModal(true)}
      />

      <ForgotPasswordModal
        show={showForgotModal}
        onClose={() => setShowForgotModal(false)}
        tenant={tenant}
      />

      {notification && (
        <SecurityNotification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </>
  );
};

export default LoginPageSecure;
