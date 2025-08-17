import { API_BASE_URL } from '../config/api';

// Security constants
export const SECURITY_CONFIG = {
  
  // Token refresh interval dalam milidetik (25 menit)
  TOKEN_REFRESH_INTERVAL: 25 * 60 * 1000,
  
  // Rate limiting untuk login (5 percobaan per 15 menit)
  LOGIN_RATE_LIMIT: {
    MAX_ATTEMPTS: 5,
    WINDOW_DURATION: 15 * 60 * 1000,
  },
  
  // Password policy
  PASSWORD_POLICY: {
    MIN_LENGTH: 8,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,
    REQUIRE_SPECIAL_CHAR: true,
    BLOCK_COMMON_PASSWORDS: true,
    HISTORY_COUNT: 5, // Simpan 5 password terakhir
  },
  
  // File upload security
  UPLOAD_SECURITY: {
    MAX_FILE_SIZE: 2 * 1024 * 1024, // 2MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif'],
    ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif'],
  },
  
  // Encryption key untuk local storage
  ENCRYPTION_KEY: process.env.REACT_APP_ENCRYPTION_KEY || 'dashboard-sapi-default-key-2024',
};

// Common passwords list (sebagian kecil untuk demo)
const COMMON_PASSWORDS = [
  'password', '123456', '123456789', 'qwerty', 'abc123',
  'password123', 'admin', 'administrator', '12345678',
  'welcome', 'login', 'pass', 'root', 'user', 'test'
];

// === SECURITY UTILITIES ===

/**
 * Simple localStorage wrapper (without encryption)
 */
export const secureStorage = {
  setItem: (key, value) => {
    try {
      const jsonString = JSON.stringify(value);
      localStorage.setItem(key, jsonString);
      return true;
    } catch (error) {
      console.error('Storage error:', error);
      return false;
    }
  },
  
  getItem: (key) => {
    try {
      const data = localStorage.getItem(key);
      if (data) {
        return JSON.parse(data);
      }
      return null;
    } catch (error) {
      console.error('Storage retrieval error:', error);
      return null;
    }
  },
  
  removeItem: (key) => {
    localStorage.removeItem(key);
  },
  
  clear: () => {
    localStorage.clear();
  }
};

// === INPUT VALIDATION & SANITIZATION ===

/**
 * Sanitize HTML input untuk mencegah XSS
 */
export const sanitizeHtml = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Validate email format
 */
export const validateEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 */
export const validatePasswordStrength = (password) => {
  const errors = [];
  const policy = SECURITY_CONFIG.PASSWORD_POLICY;
  
  if (password.length < policy.MIN_LENGTH) {
    errors.push(`Password minimal ${policy.MIN_LENGTH} karakter`);
  }
  
  if (policy.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push('Password harus mengandung huruf besar');
  }
  
  if (policy.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    errors.push('Password harus mengandung huruf kecil');
  }
  
  if (policy.REQUIRE_NUMBER && !/\d/.test(password)) {
    errors.push('Password harus mengandung angka');
  }
  
  if (policy.REQUIRE_SPECIAL_CHAR && !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    errors.push('Password harus mengandung karakter khusus');
  }
  
  if (policy.BLOCK_COMMON_PASSWORDS && COMMON_PASSWORDS.includes(password.toLowerCase())) {
    errors.push('Password terlalu umum, gunakan password yang lebih unik');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    strength: calculatePasswordStrength(password)
  };
};

/**
 * Calculate password strength score (0-100)
 */
const calculatePasswordStrength = (password) => {
  let score = 0;
  
  // Length bonus
  score += Math.min(password.length * 4, 25);
  
  // Character variety bonus
  if (/[a-z]/.test(password)) score += 5;
  if (/[A-Z]/.test(password)) score += 5;
  if (/\d/.test(password)) score += 5;
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) score += 10;
  
  // Pattern penalties
  if (/(.)\1{2,}/.test(password)) score -= 10; // Repeated characters
  if (/123|abc|qwe/i.test(password)) score -= 10; // Sequential patterns
  
  return Math.max(0, Math.min(100, score));
};

/**
 * Validate file upload security
 */
export const validateFileUpload = (file) => {
  const errors = [];
  const config = SECURITY_CONFIG.UPLOAD_SECURITY;
  
  if (!file) {
    errors.push('File tidak ditemukan');
    return { isValid: false, errors };
  }
  
  // Check file size
  if (file.size > config.MAX_FILE_SIZE) {
    errors.push(`Ukuran file terlalu besar. Maksimal ${config.MAX_FILE_SIZE / (1024 * 1024)}MB`);
  }
  
  // Check file type
  if (!config.ALLOWED_TYPES.includes(file.type)) {
    errors.push('Tipe file tidak diizinkan. Gunakan JPG, PNG, atau GIF');
  }
  
  // Check file extension
  const fileName = file.name.toLowerCase();
  const hasValidExtension = config.ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext));
  if (!hasValidExtension) {
    errors.push('Ekstensi file tidak valid');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// === RATE LIMITING ===

/**
 * Rate limiting untuk login attempts
 */
export const loginRateLimit = {
  getAttempts: (identifier) => {
    const key = `login_attempts_${identifier}`;
    const data = localStorage.getItem(key);
    
    if (!data) return { count: 0, firstAttempt: Date.now() };
    
    try {
      return JSON.parse(data);
    } catch {
      return { count: 0, firstAttempt: Date.now() };
    }
  },
  
  recordAttempt: (identifier) => {
    const key = `login_attempts_${identifier}`;
    const current = loginRateLimit.getAttempts(identifier);
    const now = Date.now();
    
    // Reset if window expired
    if (now - current.firstAttempt > SECURITY_CONFIG.LOGIN_RATE_LIMIT.WINDOW_DURATION) {
      const newData = { count: 1, firstAttempt: now };
      localStorage.setItem(key, JSON.stringify(newData));
      return newData;
    }
    
    // Increment count
    const newData = { ...current, count: current.count + 1 };
    localStorage.setItem(key, JSON.stringify(newData));
    return newData;
  },
  
  isBlocked: (identifier) => {
    const attempts = loginRateLimit.getAttempts(identifier);
    const now = Date.now();
    
    // Check if window expired
    if (now - attempts.firstAttempt > SECURITY_CONFIG.LOGIN_RATE_LIMIT.WINDOW_DURATION) {
      return false;
    }
    
    return attempts.count >= SECURITY_CONFIG.LOGIN_RATE_LIMIT.MAX_ATTEMPTS;
  },
  
  getRemainingTime: (identifier) => {
    const attempts = loginRateLimit.getAttempts(identifier);
    const elapsed = Date.now() - attempts.firstAttempt;
    const remaining = SECURITY_CONFIG.LOGIN_RATE_LIMIT.WINDOW_DURATION - elapsed;
    return Math.max(0, remaining);
  },
  
  reset: (identifier) => {
    const key = `login_attempts_${identifier}`;
    localStorage.removeItem(key);
  }
};


// === TOKEN SECURITY ===

/**
 * JWT token utilities
 */
export const tokenSecurity = {
  isExpired: (token) => {
    if (!token) return true;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return Date.now() >= payload.exp * 1000;
    } catch {
      return true;
    }
  },
  
  getExpiryTime: (token) => {
    if (!token) return null;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000;
    } catch {
      return null;
    }
  },
  
  shouldRefresh: (token) => {
    if (!token) return false;
    
    const expiryTime = tokenSecurity.getExpiryTime(token);
    if (!expiryTime) return false;
    
    const now = Date.now();
    const timeUntilExpiry = expiryTime - now;
    
    // Refresh if token expires in less than 5 minutes
    return timeUntilExpiry < (5 * 60 * 1000) && timeUntilExpiry > 0;
  }
};

// === DEVICE FINGERPRINTING ===

/**
 * Generate device fingerprint untuk security
 */
export const generateDeviceFingerprint = () => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = 'top';
  ctx.font = '14px Arial';
  ctx.fillText('Device fingerprint', 2, 2);
  
  const fingerprint = {
    screen: `${window.screen.width}x${window.screen.height}`, // eslint-disable-line no-restricted-globals
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    platform: navigator.platform,
    userAgent: navigator.userAgent.slice(0, 100), // Truncate for storage
    canvas: canvas.toDataURL().slice(0, 50), // Truncate canvas hash
    timestamp: Date.now()
  };
  
  return btoa(JSON.stringify(fingerprint));
};

// === SECURITY HEADERS ===

/**
 * Generate security headers untuk API requests - CORS-friendly version
 */
export const getSecurityHeaders = () => {
  // TEMPORARY: Remove custom headers that cause CORS preflight issues
  // Keep only standard headers that don't trigger preflight
  return {
    'X-Requested-With': 'XMLHttpRequest'
    // Commented out headers that cause CORS issues:
    // 'X-Device-Fingerprint': deviceFingerprint,
    // 'X-Timestamp': timestamp.toString(),
    // 'X-Nonce': nonce,
    // 'X-Frame-Options': 'DENY',              // These need to be set by server
    // 'X-Content-Type-Options': 'nosniff',    // These need to be set by server
    // 'X-XSS-Protection': '1; mode=block'     // These need to be set by server
  };
};

// Keep the original function available for when CORS is fixed
export const getFullSecurityHeaders = () => {
  const deviceFingerprint = generateDeviceFingerprint();
  const timestamp = Date.now();
  const nonce = Math.random().toString(36).substring(2, 15);
  
  return {
    'X-Device-Fingerprint': deviceFingerprint,
    'X-Timestamp': timestamp.toString(),
    'X-Nonce': nonce,
    'X-Requested-With': 'XMLHttpRequest',
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block'
  };
};



// === SECURITY HEADERS ===

/**
 * Set basic security headers (CSP removed - now handled by backend)
 */
export const setSecurityHeaders = () => {
    // CSP completely removed - now handled by backend
    
    // Set basic security headers yang bisa diset via meta tags
    const securityHeaders = [
        { name: 'X-Content-Type-Options', content: 'nosniff' },
        { name: 'X-XSS-Protection', content: '1; mode=block' },
        { name: 'Referrer-Policy', content: 'strict-origin-when-cross-origin' }
    ];
    
    securityHeaders.forEach(header => {
        const existing = document.querySelector(`meta[http-equiv="${header.name}"]`);
        if (!existing) {
            const meta = document.createElement('meta');
            meta.httpEquiv = header.name;
            meta.content = header.content;
            document.head.appendChild(meta);
        }
    });

    // Set Permissions Policy untuk security tambahan
    const permissionsPolicyMeta = document.createElement('meta');
    permissionsPolicyMeta.httpEquiv = 'Permissions-Policy';
    permissionsPolicyMeta.content = [
        'geolocation=()',
        'microphone=()',
        'camera=()',
        'payment=()',
        'usb=()',
        'magnetometer=()',
        'gyroscope=()',
        'speaker=()',
        'vibrate=()',
        'fullscreen=(self)'
    ].join(', ');
    
    if (!document.querySelector('meta[http-equiv="Permissions-Policy"]')) {
        document.head.appendChild(permissionsPolicyMeta);
    }

    // Right-click enabled by default
    if (process.env.REACT_APP_FORCE_DISABLE_RIGHT_CLICK === 'true') {
        document.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    // Text selection enabled by default
    if (process.env.REACT_APP_FORCE_DISABLE_TEXT_SELECTION === 'true') {
        document.body.style.userSelect = 'none';
        document.body.style.webkitUserSelect = 'none';
        document.body.style.mozUserSelect = 'none';
        document.body.style.msUserSelect = 'none';
    }


};

/**
 * Fungsi untuk memverifikasi apakah Google Fonts dapat dimuat
 */
export const verifyFontsLoading = () => {
  return new Promise((resolve) => {
    // Test loading Google Fonts
    const testFont = new FontFace('Roboto-Test', 'url(https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.woff2)');
    
    testFont.load().then(() => {
      resolve(true);
    }).catch((error) => {
      // Fallback ke font lokal
      document.documentElement.style.setProperty('--font-roboto-stack', 'var(--font-system-stack)');
      resolve(false);
    });
    
    // Timeout setelah 5 detik
    setTimeout(() => {
      resolve(false);
    }, 5000);
  });
};

/**
 * Fungsi untuk memverifikasi Cloudflare Turnstile
 */
export const verifyTurnstileLoading = () => {
  return new Promise((resolve) => {
    // Check jika Turnstile sudah dimuat
    if (window.turnstile) {
      resolve(true);
      return;
    }

    // Test loading Turnstile script
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;

    const timeout = setTimeout(() => {
      resolve(false);
    }, 10000);

    script.onload = () => {
      clearTimeout(timeout);
      resolve(true);
    };

    script.onerror = () => {
      clearTimeout(timeout);
      resolve(false);
    };

    document.head.appendChild(script);
  });
};

// === SECURITY AUDIT ===

/**
 * Security audit logging system
 */
export const securityAudit = {
  log: (event, data = {}) => {
    try {
      const timestamp = new Date().toISOString();
      const logEntry = {
        timestamp,
        event,
        data: {
          ...data,
          url: window.location.href,
          userAgent: navigator.userAgent.slice(0, 100),
          sessionId: sessionStorage.getItem('sessionId') || 'unknown'
        }
      };

      // Console logging disabled to reduce noise
      // if (process.env.NODE_ENV === 'development') {
      //   console.log(`🔒 Security Audit [${event}]:`, logEntry);
      // }

      // Store in localStorage for client-side audit trail (limited to last 100 entries)
      const auditKey = 'security_audit_log';
      const existingLogs = JSON.parse(localStorage.getItem(auditKey) || '[]');
      existingLogs.push(logEntry);
      
      // Keep only the last 100 entries to prevent storage overflow
      if (existingLogs.length > 100) {
        existingLogs.splice(0, existingLogs.length - 100);
      }
      
      localStorage.setItem(auditKey, JSON.stringify(existingLogs));

      // In production, you might want to send this to your backend audit endpoint
      if (process.env.NODE_ENV === 'production' && process.env.REACT_APP_AUDIT_ENDPOINT) {
        fetch(process.env.REACT_APP_AUDIT_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getSecurityHeaders()
          },
          body: JSON.stringify(logEntry)
        }).catch(error => {
          console.warn('Failed to send audit log to server:', error);
        });
      }

    } catch (error) {
      console.error('Security audit logging failed:', error);
    }
  },

  // Get recent audit logs for debugging
  getLogs: (limit = 50) => {
    try {
      const auditKey = 'security_audit_log';
      const logs = JSON.parse(localStorage.getItem(auditKey) || '[]');
      return logs.slice(-limit);
    } catch (error) {
      console.error('Failed to retrieve audit logs:', error);
      return [];
    }
  },

  // Clear audit logs
  clearLogs: () => {
    try {
      localStorage.removeItem('security_audit_log');
      console.log('🔒 Security audit logs cleared');
    } catch (error) {
      console.error('Failed to clear audit logs:', error);
    }
  },

  // Get audit statistics
  getStats: () => {
    try {
      const logs = securityAudit.getLogs(100);
      const stats = {
        totalLogs: logs.length,
        eventTypes: {},
        recentActivity: logs.slice(-10).map(log => ({
          timestamp: log.timestamp,
          event: log.event
        }))
      };

      logs.forEach(log => {
        stats.eventTypes[log.event] = (stats.eventTypes[log.event] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Failed to generate audit stats:', error);
      return { totalLogs: 0, eventTypes: {}, recentActivity: [] };
    }
  }
};

const securityUtils = {
  SECURITY_CONFIG,
  secureStorage,
  sanitizeHtml,
  validateEmail,
  validatePasswordStrength,
  validateFileUpload,
  loginRateLimit,
  tokenSecurity,
  generateDeviceFingerprint,
  getSecurityHeaders,
  getFullSecurityHeaders,
  setSecurityHeaders,
  securityAudit
};

export default securityUtils;
